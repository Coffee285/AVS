using System;
using System.IO;
using Aura.Core.Services.Assets;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Aura.Tests.Services.Assets;

public class AssetValidatorTests
{
    private readonly AssetValidator _validator;
    private readonly Mock<ILogger<AssetValidator>> _loggerMock;

    public AssetValidatorTests()
    {
        _loggerMock = new Mock<ILogger<AssetValidator>>();
        _validator = new AssetValidator(_loggerMock.Object);
    }

    [Fact]
    public void ValidateAsset_WithNonExistentFile_ShouldReturnInvalid()
    {
        // Arrange
        var nonExistentPath = "/path/to/nonexistent/file.jpg";

        // Act
        var result = _validator.ValidateAsset(nonExistentPath);

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains("File not found", result.Errors[0]);
        Assert.Equal(nonExistentPath, result.AssetPath);
    }

    [Fact]
    public void ValidateAsset_WithEmptyFile_ShouldReturnInvalid()
    {
        // Arrange
        var tempFile = Path.GetTempFileName();
        try
        {
            // Create an empty file
            File.WriteAllBytes(tempFile, Array.Empty<byte>());

            // Act
            var result = _validator.ValidateAsset(tempFile);

            // Assert
            Assert.False(result.IsValid);
            Assert.Contains("File is empty", result.Errors[0]);
        }
        finally
        {
            if (File.Exists(tempFile))
                File.Delete(tempFile);
        }
    }

    [Fact]
    public void ValidateAsset_WithInvalidExtension_ShouldReturnInvalid()
    {
        // Arrange
        var tempFile = Path.Combine(Path.GetTempPath(), $"test_{Guid.NewGuid()}.txt");
        try
        {
            File.WriteAllText(tempFile, "test content");

            // Act
            var result = _validator.ValidateAsset(tempFile);

            // Assert
            Assert.False(result.IsValid);
            Assert.Contains("Invalid file type", result.Errors[0]);
        }
        finally
        {
            if (File.Exists(tempFile))
                File.Delete(tempFile);
        }
    }

    [Fact]
    public void ValidateAsset_WithValidJpeg_ShouldReturnValid()
    {
        // Arrange
        var tempFile = Path.Combine(Path.GetTempPath(), $"test_{Guid.NewGuid()}.jpg");
        try
        {
            // Create a minimal valid JPEG file (JPEG magic bytes FF D8 FF)
            var jpegHeader = new byte[] { 0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46 };
            File.WriteAllBytes(tempFile, jpegHeader);

            // Act
            var result = _validator.ValidateAsset(tempFile);

            // Assert
            Assert.True(result.IsValid);
            Assert.Equal(AssetFileType.Image, result.AssetFileType);
            Assert.Equal(jpegHeader.Length, result.FileSize);
            Assert.Empty(result.Errors);
        }
        finally
        {
            if (File.Exists(tempFile))
                File.Delete(tempFile);
        }
    }

    [Fact]
    public void ValidateAsset_WithValidPng_ShouldReturnValid()
    {
        // Arrange
        var tempFile = Path.Combine(Path.GetTempPath(), $"test_{Guid.NewGuid()}.png");
        try
        {
            // Create a minimal valid PNG file (PNG magic bytes 89 50 4E 47)
            var pngHeader = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };
            File.WriteAllBytes(tempFile, pngHeader);

            // Act
            var result = _validator.ValidateAsset(tempFile);

            // Assert
            Assert.True(result.IsValid);
            Assert.Equal(AssetFileType.Image, result.AssetFileType);
            Assert.Equal(pngHeader.Length, result.FileSize);
            Assert.Empty(result.Errors);
        }
        finally
        {
            if (File.Exists(tempFile))
                File.Delete(tempFile);
        }
    }

    [Fact]
    public void ValidateAsset_WithCorruptedJpeg_ShouldReturnInvalid()
    {
        // Arrange
        var tempFile = Path.Combine(Path.GetTempPath(), $"test_{Guid.NewGuid()}.jpg");
        try
        {
            // Create a file with wrong magic bytes
            var invalidHeader = new byte[] { 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 };
            File.WriteAllBytes(tempFile, invalidHeader);

            // Act
            var result = _validator.ValidateAsset(tempFile);

            // Assert
            Assert.False(result.IsValid);
            Assert.Contains("Corrupted image file", result.Errors[0]);
        }
        finally
        {
            if (File.Exists(tempFile))
                File.Delete(tempFile);
        }
    }

    [Fact]
    public void ValidateAssets_WithMultipleFiles_ShouldReturnBatchResult()
    {
        // Arrange
        var validFile = Path.Combine(Path.GetTempPath(), $"test_{Guid.NewGuid()}.jpg");
        var invalidFile = "/path/to/nonexistent/file.jpg";
        
        try
        {
            // Create valid JPEG
            var jpegHeader = new byte[] { 0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10 };
            File.WriteAllBytes(validFile, jpegHeader);

            var files = new[] { validFile, invalidFile };

            // Act
            var result = _validator.ValidateAssets(files);

            // Assert
            Assert.False(result.IsValid); // Overall invalid due to one failure
            Assert.Equal(2, result.TotalAssets);
            Assert.Equal(1, result.ValidAssets);
            Assert.Equal(1, result.InvalidAssets);
            Assert.Equal(2, result.Results.Count);
        }
        finally
        {
            if (File.Exists(validFile))
                File.Delete(validFile);
        }
    }

    [Theory]
    [InlineData(".mp4", AssetFileType.Video)]
    [InlineData(".mov", AssetFileType.Video)]
    [InlineData(".avi", AssetFileType.Video)]
    [InlineData(".jpg", AssetFileType.Image)]
    [InlineData(".png", AssetFileType.Image)]
    [InlineData(".gif", AssetFileType.Image)]
    public void ValidateAsset_WithDifferentExtensions_ShouldIdentifyCorrectType(
        string extension, AssetFileType expectedType)
    {
        // Arrange
        var tempFile = Path.Combine(Path.GetTempPath(), $"test_{Guid.NewGuid()}{extension}");
        try
        {
            // Create file with appropriate header
            byte[] header;
            if (extension == ".jpg")
            {
                header = new byte[] { 0xFF, 0xD8, 0xFF, 0xE0 };
            }
            else if (extension == ".png")
            {
                header = new byte[] { 0x89, 0x50, 0x4E, 0x47 };
            }
            else if (extension == ".gif")
            {
                header = new byte[] { 0x47, 0x49, 0x46, 0x38 };
            }
            else
            {
                // Video files - just need content
                header = new byte[] { 0x00, 0x00, 0x00, 0x20 };
            }
            
            File.WriteAllBytes(tempFile, header);

            // Act
            var result = _validator.ValidateAsset(tempFile);

            // Assert
            if (expectedType == AssetFileType.Image && extension != ".gif")
            {
                Assert.True(result.IsValid);
            }
            Assert.Equal(expectedType, result.AssetFileType);
        }
        finally
        {
            if (File.Exists(tempFile))
                File.Delete(tempFile);
        }
    }
}
