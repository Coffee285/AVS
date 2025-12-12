using System;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using Aura.Core.Artifacts;
using Aura.Core.Hardware;
using Aura.Core.Models;
using Aura.Core.Models.Export;
using Aura.Core.Orchestrator;
using Aura.Core.Services.Export;
using Aura.Core.Telemetry;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Aura.Tests;

/// <summary>
/// Verification tests for the Video Export 95% fix.
/// These tests ensure all required fixes from the problem statement are present and functional.
/// </summary>
public class VideoExport95FixVerificationTests
{
    private readonly Mock<ILogger<JobRunner>> _jobRunnerLoggerMock;
    private readonly Mock<ILogger<ExportJobService>> _exportJobLoggerMock;
    private readonly Mock<ArtifactManager> _artifactManagerMock;
    private readonly Mock<VideoOrchestrator> _orchestratorMock;
    private readonly Mock<IHardwareDetector> _hardwareDetectorMock;
    private readonly Mock<RunTelemetryCollector> _telemetryCollectorMock;
    private readonly ExportJobService _exportJobService;

    public VideoExport95FixVerificationTests()
    {
        _jobRunnerLoggerMock = new Mock<ILogger<JobRunner>>();
        _exportJobLoggerMock = new Mock<ILogger<ExportJobService>>();
        _artifactManagerMock = new Mock<ArtifactManager>();
        _orchestratorMock = new Mock<VideoOrchestrator>();
        _hardwareDetectorMock = new Mock<IHardwareDetector>();
        _telemetryCollectorMock = new Mock<RunTelemetryCollector>();
        
        _exportJobService = new ExportJobService(_exportJobLoggerMock.Object);
    }

    /// <summary>
    /// Verify Fix #1: JobRunner constructor accepts IExportJobService parameter
    /// </summary>
    [Fact]
    public void JobRunner_Constructor_AcceptsExportJobServiceParameter()
    {
        // Arrange & Act
        var jobRunner = new JobRunner(
            _jobRunnerLoggerMock.Object,
            _artifactManagerMock.Object,
            _orchestratorMock.Object,
            _hardwareDetectorMock.Object,
            _telemetryCollectorMock.Object,
            checkpointManager: null,
            cleanupService: null,
            jobQueueService: null,
            progressEstimator: null,
            memoryMonitor: null,
            progressAggregator: null,
            cancellationOrchestrator: null,
            exportJobService: _exportJobService);  // This parameter must exist

        // Assert
        Assert.NotNull(jobRunner);
    }

    /// <summary>
    /// Verify Fix #1: JobRunner has _exportJobService private field
    /// </summary>
    [Fact]
    public void JobRunner_HasExportJobServiceField()
    {
        // Arrange
        var jobRunnerType = typeof(JobRunner);
        
        // Act
        var field = jobRunnerType.GetField("_exportJobService", BindingFlags.NonPublic | BindingFlags.Instance);
        
        // Assert
        Assert.NotNull(field);
        Assert.Equal(typeof(IExportJobService), field.FieldType);
    }

    /// <summary>
    /// Verify Fix #5: ExportJobService implements IExportJobService interface
    /// </summary>
    [Fact]
    public void ExportJobService_ImplementsIExportJobServiceInterface()
    {
        // Assert
        Assert.IsAssignableFrom<IExportJobService>(_exportJobService);
    }

    /// <summary>
    /// Verify ExportJobService has UpdateJobStatusAsync method (for terminal state sync)
    /// </summary>
    [Fact]
    public void ExportJobService_HasUpdateJobStatusAsyncMethod()
    {
        // Arrange
        var method = typeof(IExportJobService).GetMethod("UpdateJobStatusAsync");
        
        // Assert
        Assert.NotNull(method);
        Assert.Equal(typeof(Task), method.ReturnType);
        
        var parameters = method.GetParameters();
        Assert.Equal(5, parameters.Length);
        Assert.Equal("jobId", parameters[0].Name);
        Assert.Equal("status", parameters[1].Name);
        Assert.Equal("progress", parameters[2].Name);
        Assert.Equal("outputPath", parameters[3].Name);
        Assert.Equal("errorMessage", parameters[4].Name);
    }

    /// <summary>
    /// Verify ExportJobService has UpdateJobProgressAsync method (for non-terminal state sync)
    /// </summary>
    [Fact]
    public void ExportJobService_HasUpdateJobProgressAsyncMethod()
    {
        // Arrange
        var method = typeof(IExportJobService).GetMethod("UpdateJobProgressAsync");
        
        // Assert
        Assert.NotNull(method);
        Assert.Equal(typeof(Task), method.ReturnType);
        
        var parameters = method.GetParameters();
        Assert.Equal(3, parameters.Length);
        Assert.Equal("jobId", parameters[0].Name);
        Assert.Equal("progress", parameters[1].Name);
        Assert.Equal("stage", parameters[2].Name);
    }

    /// <summary>
    /// Verify Fix #5: ExportJobService properly updates job status
    /// </summary>
    [Fact]
    public async Task ExportJobService_UpdateJobStatusAsync_UpdatesJobWithOutputPath()
    {
        // Arrange
        var jobId = "test-job-complete";
        var job = new VideoJob
        {
            Id = jobId,
            Status = "queued",
            Progress = 0,
            Stage = "Initializing"
        };
        await _exportJobService.CreateJobAsync(job);

        // Act
        await _exportJobService.UpdateJobStatusAsync(
            jobId,
            "completed",
            100,
            "/output/video.mp4",
            null);

        var result = await _exportJobService.GetJobAsync(jobId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("completed", result.Status);
        Assert.Equal(100, result.Progress);
        Assert.Equal("/output/video.mp4", result.OutputPath);
    }

    /// <summary>
    /// Verify Fix #5: ExportJobService properly updates job progress
    /// </summary>
    [Fact]
    public async Task ExportJobService_UpdateJobProgressAsync_UpdatesProgressAndStage()
    {
        // Arrange
        var jobId = "test-job-progress";
        var job = new VideoJob
        {
            Id = jobId,
            Status = "queued",
            Progress = 0,
            Stage = "Initializing"
        };
        await _exportJobService.CreateJobAsync(job);

        // Act
        await _exportJobService.UpdateJobProgressAsync(jobId, 50, "Rendering video");
        var result = await _exportJobService.GetJobAsync(jobId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(50, result.Progress);
        Assert.Equal("Rendering video", result.Stage);
        Assert.Equal("running", result.Status);
    }

    /// <summary>
    /// Verify JobRunner has IsTerminalStatus helper method
    /// </summary>
    [Fact]
    public void JobRunner_HasIsTerminalStatusMethod()
    {
        // Arrange
        var jobRunnerType = typeof(JobRunner);
        
        // Act
        var method = jobRunnerType.GetMethod("IsTerminalStatus", BindingFlags.NonPublic | BindingFlags.Static);
        
        // Assert
        Assert.NotNull(method);
        Assert.Equal(typeof(bool), method.ReturnType);
        Assert.True(method.IsStatic);
        Assert.True(method.IsPrivate);
    }

    /// <summary>
    /// Verify JobRunner has MapJobStatusToExportStatus helper method
    /// </summary>
    [Fact]
    public void JobRunner_HasMapJobStatusToExportStatusMethod()
    {
        // Arrange
        var jobRunnerType = typeof(JobRunner);
        
        // Act
        var method = jobRunnerType.GetMethod("MapJobStatusToExportStatus", BindingFlags.NonPublic | BindingFlags.Static);
        
        // Assert
        Assert.NotNull(method);
        Assert.Equal(typeof(string), method.ReturnType);
        Assert.True(method.IsStatic);
        Assert.True(method.IsPrivate);
    }

    /// <summary>
    /// Verify that terminal states can be properly synchronized
    /// </summary>
    [Fact]
    public async Task ExportJobService_HandleTerminalState_SetsOutputPath()
    {
        // Arrange
        var jobId = "terminal-state-job";
        var job = new VideoJob
        {
            Id = jobId,
            Status = "running",
            Progress = 95,
            Stage = "Rendering"
        };
        await _exportJobService.CreateJobAsync(job);

        // Act - Simulate terminal state update (job completion)
        await _exportJobService.UpdateJobStatusAsync(
            jobId,
            "completed",
            100,
            "/path/to/completed-video.mp4",
            null);

        var result = await _exportJobService.GetJobAsync(jobId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("completed", result.Status);
        Assert.Equal(100, result.Progress);
        Assert.NotNull(result.OutputPath);
        Assert.Equal("/path/to/completed-video.mp4", result.OutputPath);
    }

    /// <summary>
    /// Verify that failed states can include error messages
    /// </summary>
    [Fact]
    public async Task ExportJobService_HandleFailedState_SetsErrorMessage()
    {
        // Arrange
        var jobId = "failed-state-job";
        var job = new VideoJob
        {
            Id = jobId,
            Status = "running",
            Progress = 50,
            Stage = "Rendering"
        };
        await _exportJobService.CreateJobAsync(job);

        // Act - Simulate failed state
        await _exportJobService.UpdateJobStatusAsync(
            jobId,
            "failed",
            50,
            null,
            "Render timeout after 300s");

        var result = await _exportJobService.GetJobAsync(jobId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("failed", result.Status);
        Assert.Equal(50, result.Progress);
        Assert.Null(result.OutputPath);
        Assert.NotNull(result.ErrorMessage);
        Assert.Equal("Render timeout after 300s", result.ErrorMessage);
    }
}
