using System.Diagnostics;

namespace Aura.Api.HostedServices;

public class StartupDiagnosticsService : IHostedService
{
    private const int FfmpegCheckTimeoutMs = 1000; // 1 second timeout for FFmpeg version check
    
    private readonly ILogger<StartupDiagnosticsService> _logger;
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _environment;

    public StartupDiagnosticsService(
        ILogger<StartupDiagnosticsService> logger,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        _logger = logger;
        _configuration = configuration;
        _environment = environment;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        var startupStopwatch = System.Diagnostics.Stopwatch.StartNew();
        
        _logger.LogInformation("=== STARTUP DIAGNOSTICS SERVICE: StartAsync ENTRY ===");
        _logger.LogInformation(">>> DIAGNOSTICS: Environment: {Environment}", _environment.EnvironmentName);
        _logger.LogInformation(">>> DIAGNOSTICS: Content Root: {ContentRoot}", _environment.ContentRootPath);
        _logger.LogInformation(">>> DIAGNOSTICS: Web Root: {WebRoot}", _environment.WebRootPath);
        _logger.LogInformation(">>> DIAGNOSTICS: URLs: {Urls}", _configuration["ASPNETCORE_URLS"] ?? "Not configured");
        _logger.LogInformation(">>> DIAGNOSTICS: .NET Version: {Version}", Environment.Version);
        _logger.LogInformation(">>> DIAGNOSTICS: OS: {OS}", Environment.OSVersion);
        _logger.LogInformation(">>> DIAGNOSTICS: Machine: {Machine}", Environment.MachineName);
        _logger.LogInformation(">>> DIAGNOSTICS: Processors: {Processors}", Environment.ProcessorCount);
        _logger.LogInformation(">>> DIAGNOSTICS: Working Set: {WorkingSet:N0} bytes", Environment.WorkingSet);
        _logger.LogInformation(">>> DIAGNOSTICS: Thread ID: {ThreadId}, Process ID: {ProcessId}", 
            Environment.CurrentManagedThreadId, Environment.ProcessId);
        
        // Check for critical dependencies
        _logger.LogInformation(">>> DIAGNOSTICS: Checking FFmpeg availability");
        var ffmpegPath = _configuration["FFmpeg:BinaryPath"] ?? "ffmpeg";
        try
        {
            var ffmpegStopwatch = System.Diagnostics.Stopwatch.StartNew();
            using var process = Process.Start(new ProcessStartInfo
            {
                FileName = ffmpegPath,
                Arguments = "-version",
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true
            });
            
            if (process != null)
            {
                process.WaitForExit(FfmpegCheckTimeoutMs);
                ffmpegStopwatch.Stop();
                
                if (process.ExitCode == 0)
                {
                    _logger.LogInformation(">>> DIAGNOSTICS: FFmpeg available at {Path} (checked in {Ms}ms)", 
                        ffmpegPath, ffmpegStopwatch.ElapsedMilliseconds);
                }
                else
                {
                    _logger.LogWarning(">>> DIAGNOSTICS: FFmpeg found but returned non-zero exit code (checked in {Ms}ms)", 
                        ffmpegStopwatch.ElapsedMilliseconds);
                }
            }
            else
            {
                _logger.LogWarning(">>> DIAGNOSTICS: Failed to start FFmpeg process");
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, ">>> DIAGNOSTICS: FFmpeg not found or not accessible at {Path}", ffmpegPath);
        }
        
        startupStopwatch.Stop();
        _logger.LogInformation("=== STARTUP DIAGNOSTICS SERVICE: StartAsync EXIT - Total time: {Ms}ms ===", 
            startupStopwatch.ElapsedMilliseconds);
        
        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("=== Aura API Stopping ===");
        return Task.CompletedTask;
    }
}
