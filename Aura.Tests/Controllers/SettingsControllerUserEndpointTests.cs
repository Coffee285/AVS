using System.Threading;
using System.Threading.Tasks;
using Aura.Api.Controllers;
using Aura.Core.Models;
using Aura.Core.Services.Settings;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Aura.Tests.Controllers;

/// <summary>
/// Tests for SettingsController /api/settings/user endpoint alias
/// Verifies the backwards compatibility endpoint works correctly
/// </summary>
public class SettingsControllerUserEndpointTests
{
    private readonly Mock<ILogger<SettingsController>> _mockLogger;
    private readonly Mock<ISettingsService> _mockSettingsService;
    private readonly SettingsController _controller;

    public SettingsControllerUserEndpointTests()
    {
        _mockLogger = new Mock<ILogger<SettingsController>>();
        _mockSettingsService = new Mock<ISettingsService>();
        
        _controller = new SettingsController(
            _mockLogger.Object,
            _mockSettingsService.Object);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
    }

    [Fact]
    public async Task GetUserSettings_ShouldReturnSettings_WhenServiceSucceeds()
    {
        // Arrange
        var expectedSettings = new UserSettings
        {
            General = new GeneralSettings
            {
                DefaultProjectSaveLocation = "C:\\Users\\Test\\Videos"
            }
        };
        
        _mockSettingsService
            .Setup(x => x.GetSettingsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedSettings);

        // Act
        var result = await _controller.GetUserSettings(CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var settings = Assert.IsType<UserSettings>(okResult.Value);
        Assert.NotNull(settings.General);
        Assert.Equal("C:\\Users\\Test\\Videos", settings.General.DefaultProjectSaveLocation);
    }

    [Fact]
    public async Task GetUserSettings_ShouldReturn500_WhenServiceThrows()
    {
        // Arrange
        _mockSettingsService
            .Setup(x => x.GetSettingsAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new System.Exception("Database error"));

        // Act
        var result = await _controller.GetUserSettings(CancellationToken.None);

        // Assert
        var statusResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(500, statusResult.StatusCode);
    }

    [Fact]
    public async Task GetUserSettings_ShouldCallGetSettings_WithSameCancellationToken()
    {
        // Arrange
        var cts = new CancellationTokenSource();
        var expectedSettings = new UserSettings();
        
        _mockSettingsService
            .Setup(x => x.GetSettingsAsync(cts.Token))
            .ReturnsAsync(expectedSettings);

        // Act
        await _controller.GetUserSettings(cts.Token);

        // Assert
        _mockSettingsService.Verify(
            x => x.GetSettingsAsync(cts.Token),
            Times.Once);
    }

    [Fact]
    public async Task GetSettings_And_GetUserSettings_ShouldReturnSameData()
    {
        // Arrange
        var expectedSettings = new UserSettings
        {
            General = new GeneralSettings
            {
                DefaultProjectSaveLocation = "C:\\Users\\Test\\Videos"
            }
        };
        
        _mockSettingsService
            .Setup(x => x.GetSettingsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedSettings);

        // Act
        var result1 = await _controller.GetSettings(CancellationToken.None);
        var result2 = await _controller.GetUserSettings(CancellationToken.None);

        // Assert
        var okResult1 = Assert.IsType<OkObjectResult>(result1);
        var okResult2 = Assert.IsType<OkObjectResult>(result2);
        
        var settings1 = Assert.IsType<UserSettings>(okResult1.Value);
        var settings2 = Assert.IsType<UserSettings>(okResult2.Value);
        
        Assert.Equal(settings1.General?.DefaultProjectSaveLocation, 
                     settings2.General?.DefaultProjectSaveLocation);
    }
}
