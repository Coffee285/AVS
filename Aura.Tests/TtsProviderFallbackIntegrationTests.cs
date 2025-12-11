using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Aura.Core.Audio;
using Aura.Core.Models;
using Aura.Core.Orchestrator.Stages;
using Aura.Core.Providers;
using Aura.Core.Services;
using Aura.Core.Services.Orchestration;
using Aura.Core.Validation;
using Aura.Providers.Tts;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Aura.Tests;

/// <summary>
/// Integration tests for TTS provider fallback chain.
/// Verifies that video generation can complete with silent audio when TTS providers fail.
/// </summary>
public class TtsProviderFallbackIntegrationTests
{
    [Fact]
    public async Task NullTtsProvider_ShouldGenerateSilentAudio_WhenCalled()
    {
        // Arrange
        var logger = NullLogger<NullTtsProvider>.Instance;
        var silentWavGenerator = new SilentWavGenerator(NullLogger<SilentWavGenerator>.Instance);
        var provider = new NullTtsProvider(logger, silentWavGenerator);
        
        var lines = new List<ScriptLine>
        {
            new ScriptLine(0, "Test line 1", TimeSpan.Zero, TimeSpan.FromSeconds(3)),
            new ScriptLine(1, "Test line 2", TimeSpan.FromSeconds(3), TimeSpan.FromSeconds(3))
        };
        
        var voiceSpec = new VoiceSpec(
            VoiceName: "default",
            Rate: 1.0,
            Pitch: 0,
            Volume: 1.0,
            Pause: PauseStyle.Natural);

        // Act
        var audioPath = await provider.SynthesizeAsync(lines, voiceSpec, CancellationToken.None);

        // Assert
        Assert.NotNull(audioPath);
        Assert.True(File.Exists(audioPath), "Silent audio file should exist");
        
        var fileInfo = new FileInfo(audioPath);
        Assert.True(fileInfo.Length > 100, "Silent audio file should have content (WAV header + data)");
        
        // Cleanup
        try
        {
            File.Delete(audioPath);
        }
        catch
        {
            // Ignore cleanup errors
        }
    }

    [Fact]
    public async Task VoiceStage_ShouldFallbackToSilentAudio_WhenTtsProviderFails()
    {
        // Arrange - Create a mock TTS provider that always fails
        var failingProvider = new FailingTtsProvider();
        var logger = NullLogger<VoiceStage>.Instance;
        var validator = new TtsOutputValidator(NullLogger<TtsOutputValidator>.Instance);
        var retryWrapper = new ProviderRetryWrapper(NullLogger<ProviderRetryWrapper>.Instance);
        var cleanupManager = new ResourceCleanupManager(NullLogger<ResourceCleanupManager>.Instance);
        
        var voiceStage = new VoiceStage(
            logger,
            failingProvider,
            validator,
            retryWrapper,
            cleanupManager);

        var context = new PipelineContext
        {
            CorrelationId = Guid.NewGuid().ToString(),
            GeneratedScript = "## Scene 1\nThis is test content.",
            PlanSpec = new PlanSpec(
                Topic: "Test",
                Audience: "Test",
                Goal: "Test",
                Tone: "Test",
                TargetDuration: TimeSpan.FromSeconds(10)),
            VoiceSpec = new VoiceSpec(
                VoiceName: "default",
                Rate: 1.0,
                Pitch: 0,
                Volume: 1.0,
                Pause: PauseStyle.Natural)
        };

        // Act - The stage should not throw even though TTS fails
        // It should fall back to silent audio
        await voiceStage.ExecuteAsync(context, null, CancellationToken.None);

        // Assert
        Assert.NotNull(context.NarrationPath);
        Assert.True(File.Exists(context.NarrationPath), "Narration file should exist (silent fallback)");
        
        var fileInfo = new FileInfo(context.NarrationPath);
        Assert.True(fileInfo.Length > 100, "Narration file should have content");
        
        // Cleanup
        try
        {
            if (context.NarrationPath != null)
            {
                File.Delete(context.NarrationPath);
            }
        }
        catch
        {
            // Ignore cleanup errors
        }
    }

    [Fact]
    public async Task SilentWavGenerator_ShouldGenerateValidWavFile_WithCorrectDuration()
    {
        // Arrange
        var generator = new SilentWavGenerator(NullLogger<SilentWavGenerator>.Instance);
        var outputPath = Path.Combine(Path.GetTempPath(), $"test-silent-{Guid.NewGuid()}.wav");
        var duration = TimeSpan.FromSeconds(5);

        // Act
        await generator.GenerateAsync(outputPath, duration, ct: CancellationToken.None);

        // Assert
        Assert.True(File.Exists(outputPath), "WAV file should be created");
        
        var fileInfo = new FileInfo(outputPath);
        // WAV header is 44 bytes, then (5 seconds * 44100 Hz * 1 channel * 2 bytes/sample) = 441044 bytes total
        var expectedSize = 44 + (5 * 44100 * 1 * 2);
        Assert.Equal(expectedSize, fileInfo.Length);
        
        // Verify WAV header
        using (var fs = File.OpenRead(outputPath))
        using (var reader = new BinaryReader(fs))
        {
            // Check RIFF header
            var riff = new string(reader.ReadChars(4));
            Assert.Equal("RIFF", riff);
            
            // Skip file size
            reader.ReadInt32();
            
            // Check WAVE format
            var wave = new string(reader.ReadChars(4));
            Assert.Equal("WAVE", wave);
        }
        
        // Cleanup
        try
        {
            File.Delete(outputPath);
        }
        catch
        {
            // Ignore cleanup errors
        }
    }

    /// <summary>
    /// Mock TTS provider that always fails - used for testing fallback behavior
    /// </summary>
    private class FailingTtsProvider : ITtsProvider
    {
        public Task<IReadOnlyList<string>> GetAvailableVoicesAsync()
        {
            return Task.FromResult<IReadOnlyList<string>>(new List<string>());
        }

        public Task<string> SynthesizeAsync(IEnumerable<ScriptLine> lines, VoiceSpec spec, CancellationToken ct)
        {
            throw new InvalidOperationException("Simulated TTS failure for testing");
        }
    }
}
