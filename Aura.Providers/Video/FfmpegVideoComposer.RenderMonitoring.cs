using System;
using System.Diagnostics;
using System.IO;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Aura.Core.Models;
using Aura.Core.Models.Export;
using Microsoft.Extensions.Logging;

namespace Aura.Providers.Video;

public partial class FfmpegVideoComposer
{
    /// <summary>
    /// Execute FFmpeg with stuck detection and forced termination
    /// </summary>
    private async Task<string> ExecuteFfmpegWithMonitoringAsync(
        string ffmpegPath,
        string ffmpegCommand,
        string outputFilePath,
        TimeSpan totalDuration,
        IProgress<RenderProgress> progress,
        string jobId,
        DateTime startTime,
        CancellationToken ct)
    {
        Process? process = null;
        var monitorCts = new CancellationTokenSource();
        var lastProgressTime = DateTime.Now;
        var lastProgress = 0f;
        
        try
        {
            var startInfo = new ProcessStartInfo
            {
                FileName = ffmpegPath,
                Arguments = ffmpegCommand,
                UseShellExecute = false,
                CreateNoWindow = true,
                RedirectStandardError = true,
                RedirectStandardOutput = true,
                RedirectStandardInput = true,
                WorkingDirectory = Path.GetDirectoryName(outputFilePath)
            };

            process = Process.Start(startInfo);
            if (process == null)
                throw new InvalidOperationException("Failed to start FFmpeg process");

            // Start stuck detection monitor
            var monitorTask = MonitorStuckProcessAsync(
                process, outputFilePath, jobId, 
                () => lastProgress, () => lastProgressTime,
                monitorCts.Token);

            // Read stderr for progress
            var stderrTask = Task.Run(async () =>
            {
                while (!process.StandardError.EndOfStream)
                {
                    var line = await process.StandardError.ReadLineAsync(ct).ConfigureAwait(false);
                    if (string.IsNullOrEmpty(line)) continue;

                    if (line.Contains("time="))
                    {
                        var match = Regex.Match(line, @"time=(\d{2}:\d{2}:\d{2}\.\d{2})");
                        if (match.Success && TimeSpan.TryParse(match.Groups[1].Value, out var time))
                        {
                            lastProgressTime = DateTime.Now;
                            lastProgress = Math.Clamp(
                                (float)(time.TotalSeconds / totalDuration.TotalSeconds * 100),
                                0, 99.5f);
                            
                            var elapsed = DateTime.Now - startTime;
                            progress.Report(new RenderProgress(
                                lastProgress,
                                elapsed,
                                TimeSpan.Zero,
                                "Rendering video"));
                        }
                    }
                }
            }, ct);

            await process.WaitForExitAsync(ct).ConfigureAwait(false);
            await stderrTask.ConfigureAwait(false);
            monitorCts.Cancel();

            if (process.ExitCode != 0)
            {
                throw new InvalidOperationException(
                    $"FFmpeg failed with exit code {process.ExitCode}");
            }

            // Verify and finalize output
            return await FinalizeOutputFileAsync(
                outputFilePath, jobId, startTime, progress, ct).ConfigureAwait(false);
        }
        finally
        {
            monitorCts?.Cancel();
            monitorCts?.Dispose();
            
            if (process?.HasExited == false)
            {
                _logger.LogWarning("[{JobId}] Force killing FFmpeg process", jobId);
                try { process.Kill(entireProcessTree: true); } catch { }
            }
            process?.Dispose();
        }
    }

    private async Task MonitorStuckProcessAsync(
        Process process,
        string outputFilePath,
        string jobId,
        Func<float> getProgress,
        Func<DateTime> getLastProgressTime,
        CancellationToken ct)
    {
        try
        {
            while (!ct.IsCancellationRequested && !process.HasExited)
            {
                await Task.Delay(5000, ct).ConfigureAwait(false);
                
                var progress = getProgress();
                var stuckDuration = (DateTime.Now - getLastProgressTime()).TotalSeconds;
                
                if (stuckDuration > 45 && progress > 90)
                {
                    _logger.LogWarning(
                        "[{JobId}] FFmpeg appears stuck at {Progress}% for {Duration}s",
                        jobId, progress, stuckDuration);
                    
                    if (File.Exists(outputFilePath))
                    {
                        var fileInfo = new FileInfo(outputFilePath);
                        if (fileInfo.Length > 100 * 1024)
                        {
                            _logger.LogWarning(
                                "[{JobId}] Output file exists ({SizeKB} KB), sending quit command",
                                jobId, fileInfo.Length / 1024);
                            
                            try
                            {
                                await process.StandardInput.WriteLineAsync("q").ConfigureAwait(false);
                                await Task.Delay(5000, ct).ConfigureAwait(false);
                                
                                if (!process.HasExited)
                                {
                                    _logger.LogError("[{JobId}] Force killing FFmpeg", jobId);
                                    process.Kill(entireProcessTree: true);
                                }
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, "[{JobId}] Failed to terminate FFmpeg", jobId);
                            }
                            
                            return;
                        }
                    }
                }
            }
        }
        catch (OperationCanceledException)
        {
            // Normal cancellation
        }
    }

    private async Task<string> FinalizeOutputFileAsync(
        string outputFilePath,
        string jobId,
        DateTime startTime,
        IProgress<RenderProgress> progress,
        CancellationToken ct)
    {
        // Allow filesystem to flush
        await Task.Delay(500, ct).ConfigureAwait(false);
        
        // Check for .tmp file
        if (!File.Exists(outputFilePath))
        {
            var tmpPath = outputFilePath + ".tmp";
            if (File.Exists(tmpPath))
            {
                _logger.LogInformation("[{JobId}] Moving temp file to final location", jobId);
                File.Move(tmpPath, outputFilePath, overwrite: true);
            }
            else
            {
                throw new FileNotFoundException($"Output file not found: {outputFilePath}");
            }
        }

        var fileInfo = new FileInfo(outputFilePath);
        
        if (fileInfo.Length < 100 * 1024)
        {
            throw new InvalidOperationException(
                $"Output file too small: {fileInfo.Length} bytes");
        }

        // Verify file is readable
        using (var fs = File.OpenRead(outputFilePath))
        {
            if (fs.Length == 0)
                throw new InvalidOperationException("Output file is empty");
        }

        // Report 100% completion
        progress.Report(new RenderProgress(
            100f,
            DateTime.Now - startTime,
            TimeSpan.Zero,
            $"Render complete ({fileInfo.Length / 1024.0 / 1024.0:F2} MB)"));

        _logger.LogInformation(
            "[{JobId}] ✅ Render verified: {Path} ({SizeMB:F2} MB)",
            jobId, outputFilePath, fileInfo.Length / 1024.0 / 1024.0);

        return outputFilePath;
    }
}
