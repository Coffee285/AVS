using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Aura.Core.Data;
using Aura.Core.Services.Queue;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Aura.Api.HostedServices;

/// <summary>
/// Background service that continuously processes jobs from the queue
/// Runs independently from HTTP requests, enabling true background processing
/// </summary>
public class BackgroundJobProcessorService : BackgroundService
{
    private readonly ILogger<BackgroundJobProcessorService> _logger;
    private readonly IServiceProvider _serviceProvider;
    private readonly IServiceScopeFactory _serviceScopeFactory;
    private readonly TimeSpan _pollingInterval = TimeSpan.FromSeconds(5);

    public BackgroundJobProcessorService(
        ILogger<BackgroundJobProcessorService> logger,
        IServiceProvider serviceProvider,
        IServiceScopeFactory serviceScopeFactory)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _serviceProvider = serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));
        _serviceScopeFactory = serviceScopeFactory ?? throw new ArgumentNullException(nameof(serviceScopeFactory));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("BackgroundJobProcessorService starting");

        // Wait for application startup to complete
        await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken).ConfigureAwait(false);

        // Check database schema before starting processing
        var healthCheck = await CheckDatabaseSchemaAsync(stoppingToken).ConfigureAwait(false);
        if (!healthCheck.IsHealthy)
        {
            _logger.LogError(
                "BackgroundJobProcessorService cannot start: {Message}",
                healthCheck.Message);
            _logger.LogError("SOLUTION: Run database migrations or delete the database to recreate with correct schema");
            _logger.LogInformation("BackgroundJobProcessorService exiting gracefully due to missing database schema");
            return;
        }

        _logger.LogInformation("Database schema validated successfully, starting job processing");

        // Track when we last checked for stuck jobs
        var lastStuckJobCheck = DateTime.UtcNow;
        var stuckJobCheckInterval = TimeSpan.FromMinutes(1); // Check every minute

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessNextJobsAsync(stoppingToken).ConfigureAwait(false);
                
                // CRITICAL FIX: Periodically check for stuck jobs (every minute)
                if (DateTime.UtcNow - lastStuckJobCheck >= stuckJobCheckInterval)
                {
                    await CheckForStuckJobsAsync(stoppingToken).ConfigureAwait(false);
                    lastStuckJobCheck = DateTime.UtcNow;
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                // Normal shutdown, exit gracefully
                _logger.LogInformation("BackgroundJobProcessorService stopping due to cancellation");
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in background job processor, will retry");
                await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken).ConfigureAwait(false);
            }

            // Wait before next polling cycle
            await Task.Delay(_pollingInterval, stoppingToken).ConfigureAwait(false);
        }

        _logger.LogInformation("BackgroundJobProcessorService stopped");
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("BackgroundJobProcessorService StopAsync called - initiating graceful shutdown");
        await base.StopAsync(cancellationToken).ConfigureAwait(false);
        _logger.LogInformation("BackgroundJobProcessorService StopAsync completed");
    }

    private async Task ProcessNextJobsAsync(CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var queueManager = scope.ServiceProvider.GetRequiredService<BackgroundJobQueueManager>();

        // Check configuration to see how many jobs we can process
        var config = await queueManager.GetConfigurationAsync(stoppingToken).ConfigureAwait(false);
        if (!config.IsEnabled)
        {
            _logger.LogDebug("Queue processing is disabled");
            return;
        }

        // Get current statistics
        var stats = await queueManager.GetStatisticsAsync(stoppingToken).ConfigureAwait(false);
        
        // Calculate how many new jobs we can start
        var availableSlots = Math.Max(0, config.MaxConcurrentJobs - stats.ActiveWorkers);
        
        if (availableSlots == 0)
        {
            _logger.LogDebug(
                "No available slots for new jobs (Active: {Active}, Max: {Max})",
                stats.ActiveWorkers, config.MaxConcurrentJobs);
            return;
        }

        _logger.LogDebug(
            "Processing jobs: {Pending} pending, {Processing} processing, {Available} slots available",
            stats.PendingJobs, stats.ProcessingJobs, availableSlots);

        // Start new jobs up to available slots
        for (int i = 0; i < availableSlots; i++)
        {
            if (stoppingToken.IsCancellationRequested) break;

            var nextJob = await queueManager.DequeueNextJobAsync(stoppingToken).ConfigureAwait(false);
            if (nextJob == null)
            {
                _logger.LogDebug("No more jobs available in queue");
                break;
            }

            // Start job processing in background task
            _ = Task.Run(async () =>
            {
                try
                {
                    _logger.LogInformation(
                        "Starting background processing of job {JobId} (Priority: {Priority})",
                        nextJob.JobId, nextJob.Priority);

                    // Create a new scope for this job
                    using var jobScope = _serviceProvider.CreateScope();
                    var jobQueueManager = jobScope.ServiceProvider.GetRequiredService<BackgroundJobQueueManager>();
                    
                    await jobQueueManager.ProcessJobAsync(nextJob, stoppingToken).ConfigureAwait(false);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing job {JobId}", nextJob.JobId);
                }
            }, stoppingToken);

            // Small delay between starting jobs
            await Task.Delay(TimeSpan.FromMilliseconds(500), stoppingToken).ConfigureAwait(false);
        }
    }

    /// <summary>
    /// Checks if the database schema is valid and creates default configuration if needed
    /// </summary>
    private async Task<Aura.Core.Services.ServiceHealthCheckResult> CheckDatabaseSchemaAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = _serviceScopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AuraDbContext>();

            // Check if QueueConfiguration table exists and has data
            var configExists = await dbContext.QueueConfiguration.AnyAsync(cancellationToken).ConfigureAwait(false);

            if (!configExists)
            {
                _logger.LogWarning("QueueConfiguration table has no data, creating default configuration");

                // Create default configuration
                var defaultConfig = new QueueConfigurationEntity
                {
                    Id = "default",
                    IsEnabled = true,
                    MaxConcurrentJobs = 2,
                    PollingIntervalSeconds = 5,
                    RetryBaseDelaySeconds = 60,
                    RetryMaxDelaySeconds = 3600,
                    EnableNotifications = true,
                    PauseOnBattery = false,
                    CpuThrottleThreshold = 90,
                    MemoryThrottleThreshold = 90,
                    JobHistoryRetentionDays = 30,
                    FailedJobRetentionDays = 90,
                    UpdatedAt = DateTime.UtcNow
                };

                dbContext.QueueConfiguration.Add(defaultConfig);
                await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

                _logger.LogInformation("Created default QueueConfiguration");
            }

            return new Aura.Core.Services.ServiceHealthCheckResult(true, "Database schema is valid");
        }
        catch (SqliteException ex) when (ex.SqliteErrorCode == 1)
        {
            // SQLITE_ERROR - table doesn't exist
            var message = $"QueueConfiguration table does not exist. Error: {ex.Message}";
            _logger.LogError(ex, message);
            return new Aura.Core.Services.ServiceHealthCheckResult(false, message, ex);
        }
        catch (Exception ex)
        {
            var message = $"Failed to check database schema: {ex.Message}";
            _logger.LogError(ex, message);
            return new Aura.Core.Services.ServiceHealthCheckResult(false, message, ex);
        }
    }

    /// <summary>
    /// Checks for jobs that have been stuck in "Processing" status for too long and marks them as failed.
    /// CRITICAL FIX: Prevents jobs from hanging indefinitely at 95% or any other stage.
    /// Uses different thresholds based on stage:
    /// - Rendering stage at 90%+: 5 minutes (FFmpeg should complete or fail quickly once started)
    /// - Other stages: 10 minutes
    /// </summary>
    private async Task CheckForStuckJobsAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = _serviceScopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AuraDbContext>();

            // Find jobs that have been processing without progress
            // Use 5-minute threshold for rendering stage at 90%+, 10 minutes for others
            var now = DateTime.UtcNow;
            var shortThreshold = now.AddMinutes(-5);  // For rendering at 90%+
            var longThreshold = now.AddMinutes(-10);  // For other stages
            
            var stuckJobs = await dbContext.JobQueue
                .Where(j => j.Status == "Processing" && (
                    // Rendering at 90%+ stuck for 5+ minutes
                    (j.CurrentStage == "Rendering" && j.ProgressPercent >= 90 && j.UpdatedAt < shortThreshold) ||
                    // Other cases stuck for 10+ minutes
                    j.UpdatedAt < longThreshold
                ))
                .ToListAsync(cancellationToken).ConfigureAwait(false);

            if (stuckJobs.Count == 0)
            {
                return; // No stuck jobs found
            }

            _logger.LogWarning("[STUCK-JOB-DETECTION] Found {Count} stuck jobs", stuckJobs.Count);

            foreach (var job in stuckJobs)
            {
                var stuckDuration = now - job.UpdatedAt;
                var isRenderingStuck = job.CurrentStage == "Rendering" && job.ProgressPercent >= 90;
                
                _logger.LogWarning(
                    "[STUCK-JOB-DETECTION] Job {JobId} stuck at {Stage} ({Progress}%) for {Duration} minutes. " +
                    "RenderingStuck: {IsRenderingStuck}",
                    job.JobId, 
                    job.CurrentStage ?? "Unknown", 
                    job.ProgressPercent,
                    Math.Round(stuckDuration.TotalMinutes, 1),
                    isRenderingStuck);

                // Mark job as failed with specific error message
                job.Status = "Failed";
                job.LastError = isRenderingStuck
                    ? $"Job timed out at {job.ProgressPercent}% during rendering - no progress for {Math.Round(stuckDuration.TotalMinutes, 1)} minutes. " +
                      "FFmpeg may have failed to start or stalled. " +
                      "Possible causes: missing audio/images, FFmpeg not found, or insufficient disk space."
                    : $"Job timed out - no progress for {Math.Round(stuckDuration.TotalMinutes, 1)} minutes. " +
                      $"Last stage: {job.CurrentStage ?? "Unknown"}, Last progress: {job.ProgressPercent}%. " +
                      "This may indicate an issue with FFmpeg, provider timeouts, or system resources.";
                job.CompletedAt = now;
                job.UpdatedAt = now;
                
                _logger.LogError(
                    "[STUCK-JOB-DETECTION] Marked job {JobId} as failed due to timeout. Error: {Error}",
                    job.JobId,
                    job.LastError);
            }

            // Save all changes
            var savedCount = await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            _logger.LogInformation("[STUCK-JOB-DETECTION] Updated {Count} stuck jobs to failed status", savedCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[STUCK-JOB-DETECTION] Error checking for stuck jobs");
            // Don't rethrow - this is a background check and shouldn't crash the service
        }
    }
}
