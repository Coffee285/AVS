using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.Extensions.Logging;

namespace Aura.Core.Services.Assets;

/// <summary>
/// Validates asset files for correctness, integrity, and usability
/// </summary>
public class AssetValidator
{
    private readonly ILogger<AssetValidator> _logger;

    private static readonly string[] ValidImageExtensions =
        { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp" };
    
    private static readonly string[] ValidVideoExtensions =
        { ".mp4", ".mov", ".avi", ".mkv", ".webm" };

    public AssetValidator(ILogger<AssetValidator> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Validates a single asset file
    /// </summary>
    public AssetValidationResult ValidateAsset(string assetPath)
    {
        var result = new AssetValidationResult { IsValid = true, AssetPath = assetPath };

        // Check file exists
        if (!File.Exists(assetPath))
        {
            result.IsValid = false;
            result.Errors.Add($"File not found: {assetPath}");
            return result;
        }

        // Check file size
        var fileInfo = new FileInfo(assetPath);
        if (fileInfo.Length == 0)
        {
            result.IsValid = false;
            result.Errors.Add($"File is empty: {assetPath}");
            return result;
        }

        result.FileSize = fileInfo.Length;

        // Check extension
        var ext = Path.GetExtension(assetPath).ToLowerInvariant();
        if (!ValidImageExtensions.Contains(ext) && !ValidVideoExtensions.Contains(ext))
        {
            result.IsValid = false;
            result.Errors.Add($"Invalid file type: {ext}. Expected image or video file.");
            return result;
        }

        // Determine asset type
        if (ValidImageExtensions.Contains(ext))
        {
            result.AssetFileType = AssetFileType.Image;
            
            // Validate image header for common formats
            if (!ValidateImageHeader(assetPath, ext))
            {
                result.IsValid = false;
                result.Errors.Add($"Corrupted image file: {assetPath}");
                return result;
            }
        }
        else if (ValidVideoExtensions.Contains(ext))
        {
            result.AssetFileType = AssetFileType.Video;
        }

        _logger.LogDebug(
            "Asset validated: {Path} - {Type}, {Size} bytes",
            assetPath,
            result.AssetFileType,
            result.FileSize);

        return result;
    }

    /// <summary>
    /// Validates multiple assets in batch
    /// </summary>
    public BatchAssetValidationResult ValidateAssets(IEnumerable<string> assetPaths)
    {
        var results = new List<AssetValidationResult>();
        var batchResult = new BatchAssetValidationResult
        {
            TotalAssets = 0,
            ValidAssets = 0,
            InvalidAssets = 0
        };

        foreach (var assetPath in assetPaths)
        {
            batchResult.TotalAssets++;
            var result = ValidateAsset(assetPath);
            results.Add(result);

            if (result.IsValid)
            {
                batchResult.ValidAssets++;
            }
            else
            {
                batchResult.InvalidAssets++;
                _logger.LogWarning(
                    "Asset validation failed: {Path} - {Errors}",
                    assetPath,
                    string.Join(", ", result.Errors));
            }
        }

        batchResult.Results = results;
        batchResult.IsValid = batchResult.InvalidAssets == 0;

        return batchResult;
    }

    /// <summary>
    /// Validates image file by checking magic bytes (file header signature)
    /// </summary>
    private bool ValidateImageHeader(string imagePath, string extension)
    {
        try
        {
            using var fs = File.OpenRead(imagePath);
            var header = new byte[8];
            var bytesRead = fs.Read(header, 0, 8);
            
            if (bytesRead < 2)
            {
                return false;
            }

            // Check for JPEG magic bytes (FF D8)
            if (extension == ".jpg" || extension == ".jpeg")
            {
                return header[0] == 0xFF && header[1] == 0xD8;
            }

            // Check for PNG magic bytes (89 50 4E 47)
            if (extension == ".png")
            {
                return bytesRead >= 4 &&
                       header[0] == 0x89 && 
                       header[1] == 0x50 &&
                       header[2] == 0x4E && 
                       header[3] == 0x47;
            }

            // Check for GIF magic bytes (47 49 46)
            if (extension == ".gif")
            {
                return bytesRead >= 3 &&
                       header[0] == 0x47 && 
                       header[1] == 0x49 && 
                       header[2] == 0x46;
            }

            // Check for BMP magic bytes (42 4D)
            if (extension == ".bmp")
            {
                return header[0] == 0x42 && header[1] == 0x4D;
            }

            // WebP validation would require more complex checks
            // For now, just verify file exists and has content
            if (extension == ".webp")
            {
                return bytesRead >= 4;
            }

            // Unknown extension that passed initial validation
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to validate image header for: {Path}", imagePath);
            return false;
        }
    }
}

/// <summary>
/// Asset file type classification for validation
/// </summary>
public enum AssetFileType
{
    Unknown,
    Image,
    Video,
    Audio
}

/// <summary>
/// Result of validating a single asset
/// </summary>
public class AssetValidationResult
{
    public bool IsValid { get; set; }
    public string AssetPath { get; set; } = string.Empty;
    public AssetFileType AssetFileType { get; set; }
    public long FileSize { get; set; }
    public List<string> Errors { get; set; } = new();
}

/// <summary>
/// Result of validating multiple assets
/// </summary>
public class BatchAssetValidationResult
{
    public bool IsValid { get; set; }
    public int TotalAssets { get; set; }
    public int ValidAssets { get; set; }
    public int InvalidAssets { get; set; }
    public List<AssetValidationResult> Results { get; set; } = new();
}
