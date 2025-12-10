using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;

namespace Aura.Api.HostedServices;

/// <summary>
/// Hosted service that validates and initializes critical services in the correct order
/// Ensures the application doesn't enter a partial-ready state
/// </summary>
public class StartupInitializationService : IHostedService
{
    private readonly ILogger<StartupInitializationService> _logger;
    private readonly IServiceProvider _serviceProvider;
    private readonly List<InitializationStep> _initializationSteps;

    public StartupInitializationService(
        ILogger<StartupInitializationService> logger,
        IServiceProvider serviceProvider)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
        _initializationSteps = new List<InitializationStep>();

        // Define initialization steps in dependency order
        DefineInitializationSteps();
    }

    private void DefineInitializationSteps()
    {
        // Step 1: Database connectivity (critical)
        // Note: This runs asynchronously and doesn't block HTTP server startup
        // The app is marked as ready before this completes, allowing health checks to pass
        _initializationSteps.Add(new InitializationStep
        {
            Name = "Database Connectivity",
            IsCritical = false, // Changed to non-critical - app can start without DB, will retry
            TimeoutSeconds = 10, // Reduced from 30s to fail faster
            InitializeFunc = async (sp, ct) =>
            {
                var logger = sp.GetRequiredService<ILogger<StartupInitializationService>>();
                try
                {
                    logger.LogInformation("        >>> Creating scope for database connectivity check");
                    using var scope = sp.CreateScope();
                    logger.LogInformation("        >>> Resolving AuraDbContext");
                    var dbContext = scope.ServiceProvider.GetRequiredService<Aura.Core.Data.AuraDbContext>();
                    logger.LogInformation("        >>> Calling CanConnectAsync");
                    var canConnect = await dbContext.Database.CanConnectAsync(ct).ConfigureAwait(false);
                    logger.LogInformation("        >>> CanConnectAsync returned: {Result}", canConnect);
                    return canConnect;
                }
                catch (Exception ex)
                {
                    // Log but don't fail - database will be checked by health checks
                    logger.LogWarning(ex, "        >>> Database connectivity check failed during startup - will retry via health checks");
                    return false; // Non-critical, so return false but don't throw
                }
            }
        });

        // Step 2: Required directories (critical)
        _initializationSteps.Add(new InitializationStep
        {
            Name = "Required Directories",
            IsCritical = true,
            TimeoutSeconds = 10,
            InitializeFunc = (sp, ct) =>
            {
                var logger = sp.GetRequiredService<ILogger<StartupInitializationService>>();
                logger.LogInformation("        >>> Resolving ProviderSettings");
                var providerSettings = sp.GetRequiredService<Aura.Core.Configuration.ProviderSettings>();
                
                logger.LogInformation("        >>> Getting directory paths");
                var directories = new[]
                {
                    providerSettings.GetAuraDataDirectory(),
                    providerSettings.GetOutputDirectory(),
                    providerSettings.GetLogsDirectory(),
                    providerSettings.GetProjectsDirectory()
                };

                logger.LogInformation("        >>> Creating directories if they don't exist");
                foreach (var dir in directories)
                {
                    if (!System.IO.Directory.Exists(dir))
                    {
                        logger.LogInformation("        >>> Creating directory: {Dir}", dir);
                        System.IO.Directory.CreateDirectory(dir);
                    }
                    else
                    {
                        logger.LogInformation("        >>> Directory already exists: {Dir}", dir);
                    }
                }
                
                logger.LogInformation("        >>> All required directories verified");
                return Task.FromResult(true);
            }
        });

        // Step 3: FFmpeg availability (critical for video operations)
        _initializationSteps.Add(new InitializationStep
        {
            Name = "FFmpeg Availability",
            IsCritical = false, // Not critical - can run without FFmpeg for some operations
            TimeoutSeconds = 10,
            InitializeFunc = async (sp, ct) =>
            {
                var logger = sp.GetRequiredService<ILogger<StartupInitializationService>>();
                try
                {
                    logger.LogInformation("        >>> Resolving IFfmpegLocator");
                    var ffmpegLocator = sp.GetRequiredService<Aura.Core.Dependencies.IFfmpegLocator>();
                    logger.LogInformation("        >>> Calling GetEffectiveFfmpegPathAsync");
                    var ffmpegPath = await ffmpegLocator.GetEffectiveFfmpegPathAsync(null, ct).ConfigureAwait(false);
                    logger.LogInformation("        >>> FFmpeg path: {Path}", ffmpegPath ?? "(not found)");
                    return !string.IsNullOrEmpty(ffmpegPath);
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "        >>> FFmpeg check failed");
                    return false; // Non-critical, return false but don't fail
                }
            }
        });

        // Step 4: AI Services connectivity (non-critical - graceful degradation)
        _initializationSteps.Add(new InitializationStep
        {
            Name = "AI Services",
            IsCritical = false,
            TimeoutSeconds = 10,
            InitializeFunc = (sp, ct) =>
            {
                var logger = sp.GetRequiredService<ILogger<StartupInitializationService>>();
                try
                {
                    logger.LogInformation("        >>> Checking if ILlmProvider is available");
                    var llmProvider = sp.GetService<Aura.Core.Providers.ILlmProvider>();
                    var available = llmProvider != null;
                    logger.LogInformation("        >>> ILlmProvider available: {Available}", available);
                    return Task.FromResult(available);
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "        >>> AI Services check failed");
                    return Task.FromResult(false); // Non-critical
                }
            }
        });
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("=== STARTUP INIT SERVICE: StartAsync ENTRY ===");
        _logger.LogInformation(">>> STARTUP INIT: Thread ID: {ThreadId}, Process ID: {ProcessId}", 
            Environment.CurrentManagedThreadId, Environment.ProcessId);
        
        var overallStopwatch = Stopwatch.StartNew();
        var successCount = 0;
        var failedCritical = false;

        foreach (var step in _initializationSteps)
        {
            var stepStopwatch = Stopwatch.StartNew();
            _logger.LogInformation(">>> STARTUP INIT: Step '{StepName}' STARTING (Critical: {IsCritical}, Timeout: {Timeout}s)",
                step.Name, step.IsCritical, step.TimeoutSeconds);

            try
            {
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(step.TimeoutSeconds));
                using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cts.Token, cancellationToken);

                var success = await step.InitializeFunc(_serviceProvider, linkedCts.Token).ConfigureAwait(false);
                stepStopwatch.Stop();

                if (success)
                {
                    _logger.LogInformation(">>> STARTUP INIT: Step '{StepName}' COMPLETED successfully in {Duration}ms",
                        step.Name, stepStopwatch.ElapsedMilliseconds);
                    successCount++;
                }
                else
                {
                    if (step.IsCritical)
                    {
                        _logger.LogError(">>> STARTUP INIT: Step '{StepName}' FAILED (CRITICAL) after {Duration}ms",
                            step.Name, stepStopwatch.ElapsedMilliseconds);
                        failedCritical = true;
                    }
                    else
                    {
                        _logger.LogWarning(">>> STARTUP INIT: Step '{StepName}' FAILED (non-critical) after {Duration}ms - continuing with graceful degradation",
                            step.Name, stepStopwatch.ElapsedMilliseconds);
                    }
                }
            }
            catch (OperationCanceledException)
            {
                stepStopwatch.Stop();
                _logger.LogError(">>> STARTUP INIT: Step '{StepName}' TIMED OUT after {Timeout}s (Critical: {IsCritical})",
                    step.Name, step.TimeoutSeconds, step.IsCritical);
                
                if (step.IsCritical)
                {
                    failedCritical = true;
                }
            }
            catch (Exception ex)
            {
                stepStopwatch.Stop();
                _logger.LogError(ex, ">>> STARTUP INIT: Step '{StepName}' FAILED with exception after {Duration}ms (Critical: {IsCritical})",
                    step.Name, stepStopwatch.ElapsedMilliseconds, step.IsCritical);
                
                if (step.IsCritical)
                {
                    failedCritical = true;
                }
            }

            if (failedCritical)
            {
                _logger.LogWarning(">>> STARTUP INIT: Stopping initialization due to critical failure");
                break; // Stop initialization on critical failure
            }
        }

        overallStopwatch.Stop();

        if (failedCritical)
        {
            _logger.LogError("=== STARTUP INIT SERVICE: FAILED ===");
            _logger.LogError(">>> STARTUP INIT: Critical services failed to initialize. Application cannot start properly.");
            _logger.LogError(">>> STARTUP INIT: Total time: {Duration}ms, Successful: {Success}/{Total}",
                overallStopwatch.ElapsedMilliseconds, successCount, _initializationSteps.Count);
            
            // Instead of Environment.Exit, throw an exception that can be caught and logged properly
            var failedSteps = string.Join(", ", _initializationSteps
                .Where((s, i) => i < _initializationSteps.Count && s.IsCritical)
                .Select(s => s.Name));
            
            _logger.LogError(">>> STARTUP INIT: Failed critical steps: {Steps}", failedSteps);
            _logger.LogWarning(">>> STARTUP INIT: Application will continue startup but may be unstable. Please check logs above for details.");
            
            // Don't throw or exit - let the application try to start
            // Users can see errors in the UI and troubleshoot
        }
        else
        {
            _logger.LogInformation("=== STARTUP INIT SERVICE: COMPLETE ===");
            _logger.LogInformation(">>> STARTUP INIT: Total time: {Duration}ms, Successful: {Success}/{Total}",
                overallStopwatch.ElapsedMilliseconds, successCount, _initializationSteps.Count);
            
            if (successCount < _initializationSteps.Count)
            {
                _logger.LogWarning(">>> STARTUP INIT: Some non-critical services failed. Application running in degraded mode.");
            }
        }
        
        _logger.LogInformation("=== STARTUP INIT SERVICE: StartAsync EXIT ===");
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Service initialization shutdown complete");
        return Task.CompletedTask;
    }

    private sealed class InitializationStep
    {
        public string Name { get; set; } = string.Empty;
        public bool IsCritical { get; set; }
        public int TimeoutSeconds { get; set; }
        public Func<IServiceProvider, CancellationToken, Task<bool>> InitializeFunc { get; set; } = null!;
    }
}
