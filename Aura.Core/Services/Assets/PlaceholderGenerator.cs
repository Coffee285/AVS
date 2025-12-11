using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.PixelFormats;

namespace Aura.Core.Services.Assets;

/// <summary>
/// Generates placeholder images when actual assets are missing or corrupted
/// </summary>
public class PlaceholderGenerator
{
    private readonly ILogger<PlaceholderGenerator> _logger;

    public PlaceholderGenerator(ILogger<PlaceholderGenerator> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Generates a placeholder image with text overlay
    /// </summary>
    public async Task<string> GeneratePlaceholderImageAsync(
        int width,
        int height,
        string sceneTitle,
        CancellationToken ct = default)
    {
        var outputDir = Path.Combine(
            Path.GetTempPath(),
            "AuraVideoStudio",
            "Placeholders");
        
        Directory.CreateDirectory(outputDir);

        var outputPath = Path.GetFullPath(
            Path.Combine(
                outputDir,
                $"placeholder_{Guid.NewGuid()}.png"));

        await Task.Run(() =>
        {
            GeneratePlaceholderImageInternal(width, height, sceneTitle, outputPath);
        }, ct).ConfigureAwait(false);

        _logger.LogInformation(
            "Generated placeholder image: {Path} ({Width}x{Height}) - \"{Title}\"",
            outputPath,
            width,
            height,
            sceneTitle);

        return outputPath;
    }

    /// <summary>
    /// Generates a simple gray placeholder image using ImageSharp
    /// Note: Text rendering requires SixLabors.ImageSharp.Drawing package
    /// For now, we generate a solid gray placeholder
    /// </summary>
    private void GeneratePlaceholderImageInternal(
        int width,
        int height,
        string sceneTitle,
        string outputPath)
    {
        using var image = new Image<Rgb24>(width, height);
        
        // Fill with dark gray background
        image.Mutate(ctx => ctx.BackgroundColor(Color.FromRgb(64, 64, 64)));

        // Add a lighter gray gradient for visual interest
        image.Mutate(ctx =>
        {
            // Create a simple gradient effect by modifying pixels
            for (int y = 0; y < height; y++)
            {
                var factor = (float)y / height;
                var grayValue = (byte)(64 + (32 * factor));
                var rowColor = Color.FromRgb(grayValue, grayValue, grayValue);
                
                for (int x = 0; x < width; x++)
                {
                    image[x, y] = new Rgb24(grayValue, grayValue, grayValue);
                }
            }
        });

        // Save to file
        image.SaveAsPng(outputPath);
        
        _logger.LogDebug(
            "Generated placeholder for scene: \"{Title}\" at {Path}",
            sceneTitle,
            outputPath);
    }

    /// <summary>
    /// Generates a solid color placeholder (fastest option)
    /// </summary>
    public async Task<string> GenerateSolidColorPlaceholderAsync(
        int width,
        int height,
        byte r = 64,
        byte g = 64,
        byte b = 64,
        CancellationToken ct = default)
    {
        var outputDir = Path.Combine(
            Path.GetTempPath(),
            "AuraVideoStudio",
            "Placeholders");
        
        Directory.CreateDirectory(outputDir);

        var outputPath = Path.GetFullPath(
            Path.Combine(
                outputDir,
                $"solid_color_{Guid.NewGuid()}.png"));

        await Task.Run(() =>
        {
            using var image = new Image<Rgb24>(width, height);
            image.Mutate(ctx => ctx.BackgroundColor(Color.FromRgb(r, g, b)));
            image.SaveAsPng(outputPath);
        }, ct).ConfigureAwait(false);

        _logger.LogDebug(
            "Generated solid color placeholder: {Path} ({Width}x{Height})",
            outputPath,
            width,
            height);

        return outputPath;
    }
}
