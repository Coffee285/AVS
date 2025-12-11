using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Aura.Core.Audio;
using Aura.Core.Models;
using Aura.Core.Providers;
using Microsoft.Extensions.Logging;

namespace Aura.Providers.Tts;

/// <summary>
/// Null TTS provider that returns silence - used as final fallback when no other TTS is available.
/// Uses SilentWavGenerator for reliable silent audio generation.
/// </summary>
public class NullTtsProvider : ITtsProvider
{
    private readonly ILogger<NullTtsProvider> _logger;
    private readonly SilentWavGenerator _silentWavGenerator;
    private readonly string _outputDir;

    public NullTtsProvider(ILogger<NullTtsProvider> logger, SilentWavGenerator silentWavGenerator)
    {
        _logger = logger;
        _silentWavGenerator = silentWavGenerator;
        _outputDir = Path.Combine(Path.GetTempPath(), "aura-null-tts");
        Directory.CreateDirectory(_outputDir);
    }

    public Task<IReadOnlyList<string>> GetAvailableVoicesAsync()
    {
        // Return a single "silent" voice
        var voices = new List<string> { "Null (Silent)" };
        return Task.FromResult<IReadOnlyList<string>>(voices);
    }

    public async Task<string> SynthesizeAsync(
        IEnumerable<ScriptLine> lines,
        VoiceSpec spec,
        CancellationToken ct = default)
    {
        _logger.LogWarning(
            "NullTtsProvider: Generating silent audio as fallback. " +
            "No TTS providers are configured or available. " +
            "To add voice narration, configure a TTS provider (ElevenLabs, PlayHT, Azure, Piper, or Windows TTS) in Settings.");
        
        // Calculate total duration
        var totalDuration = TimeSpan.Zero;
        foreach (var line in lines)
        {
            totalDuration += line.Duration;
        }

        var outputPath = Path.Combine(_outputDir, $"silent-{Guid.NewGuid()}.wav");

        try
        {
            // Use SilentWavGenerator for reliable, validated silent audio
            await _silentWavGenerator.GenerateAsync(outputPath, totalDuration, ct: ct).ConfigureAwait(false);

            _logger.LogInformation(
                "Generated silent audio placeholder: {Path}, Duration: {Duration}s. " +
                "Video will have no narration. Configure a TTS provider to add voice.",
                outputPath, totalDuration.TotalSeconds);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate silent audio fallback - this should never fail");
            throw new InvalidOperationException(
                "NullTtsProvider failed to generate silent audio. This indicates a critical system error.", ex);
        }
        
        return outputPath;
    }
}
