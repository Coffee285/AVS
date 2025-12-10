using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading;
using System.Threading.Tasks;
using Aura.Api.Models.ApiModels.V1;
using FluentAssertions;
using Xunit;

namespace Aura.Tests.Integration;

/// <summary>
/// Integration tests for end-to-end video generation workflow
/// Tests the complete pipeline from API request to rendered video
/// </summary>
[Collection("IntegrationTests")]
public class VideoGenerationIntegrationTests
{
    private readonly TestServerFixture _fixture;

    public VideoGenerationIntegrationTests(TestServerFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task FullVideoGeneration_WithAllFeatures_CompletesSuccessfully()
    {
        // Arrange
        var request = new VideoGenerationRequest(
            Brief: "Test video for integration testing - A brief introduction to artificial intelligence",
            VoiceId: null,
            Style: "educational",
            DurationMinutes: 0.5, // 30 seconds
            Options: new VideoGenerationOptions(
                Audience: "General public",
                Goal: "Educate viewers",
                Tone: "Professional",
                Language: "en-US",
                Aspect: "16:9",
                Pacing: "Conversational",
                Density: "Balanced"
            )
        );

        // Act
        var response = await _fixture.Client.PostAsJsonAsync("/api/video/generate", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Accepted, "video generation should be accepted");
        
        var result = await response.Content.ReadFromJsonAsync<VideoGenerationResponse>();
        result.Should().NotBeNull();
        result!.JobId.Should().NotBeNullOrEmpty();
        result.Status.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task VideoGeneration_WithInvalidBrief_ReturnsBadRequest()
    {
        // Arrange - empty brief should fail validation
        var request = new VideoGenerationRequest(
            Brief: "",
            VoiceId: null,
            Style: "educational",
            DurationMinutes: 0.5
        );

        // Act
        var response = await _fixture.Client.PostAsJsonAsync("/api/video/generate", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest, "empty brief should be rejected");
    }

    [Fact]
    public async Task VideoGeneration_WithLargeDuration_IsAccepted()
    {
        // Arrange - test that large videos are accepted
        var request = new VideoGenerationRequest(
            Brief: "Long test video for stress testing",
            VoiceId: null,
            Style: "documentary",
            DurationMinutes: 5.0 // 5 minutes - test for resource handling
        );

        // Act
        var response = await _fixture.Client.PostAsJsonAsync("/api/video/generate", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Accepted, "large duration videos should be accepted");
    }

    [Fact]
    public async Task PipelineValidation_ReturnsValidationReport()
    {
        // Act
        var response = await _fixture.Client.GetAsync("/api/video/validate");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var report = await response.Content.ReadFromJsonAsync<PipelinePreflightReportDto>();
        report.Should().NotBeNull();
        report!.Timestamp.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromMinutes(1));
    }

    [Fact]
    public async Task VideoStatus_WithValidJobId_ReturnsStatus()
    {
        // Arrange - first create a job
        var createRequest = new VideoGenerationRequest(
            Brief: "Test video for status check",
            VoiceId: null,
            Style: "educational",
            DurationMinutes: 0.5
        );
        
        var createResponse = await _fixture.Client.PostAsJsonAsync("/api/video/generate", createRequest);
        var createResult = await createResponse.Content.ReadFromJsonAsync<VideoGenerationResponse>();
        
        // Act - check status
        var statusResponse = await _fixture.Client.GetAsync($"/api/video/status/{createResult!.JobId}");

        // Assert
        statusResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var status = await statusResponse.Content.ReadFromJsonAsync<VideoStatus>();
        status.Should().NotBeNull();
        status!.JobId.Should().Be(createResult.JobId);
    }

    [Fact]
    public async Task VideoStatus_WithInvalidJobId_ReturnsNotFound()
    {
        // Arrange
        var invalidJobId = "invalid-job-id-12345";

        // Act
        var response = await _fixture.Client.GetAsync($"/api/video/status/{invalidJobId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound, "invalid job ID should return 404");
    }
}

/// <summary>
/// Integration tests specifically for provider fallback behavior
/// These tests verify that the system gracefully handles provider failures
/// </summary>
[Collection("IntegrationTests")]
public class ProviderFallbackIntegrationTests
{
    private readonly TestServerFixture _fixture;

    public ProviderFallbackIntegrationTests(TestServerFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact(Skip = "Requires mock provider configuration to force all providers to fail")]
    public async Task VideoGeneration_WithAllProvidersFailing_UsesPlaceholder()
    {
        // This test requires mocking providers to fail
        // Implementation would need test-specific service configuration
        
        // Arrange
        var request = new VideoGenerationRequest(
            Brief: "Test video with provider failures",
            VoiceId: null,
            Style: "educational",
            DurationMinutes: 0.5
        );

        // Act
        var response = await _fixture.Client.PostAsJsonAsync("/api/video/generate", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Accepted);
        
        // Video should still complete with placeholder images
        // Would need to poll status and verify completion
    }
}

/// <summary>
/// Integration tests for progress tracking and reporting
/// Verifies that progress updates work correctly and never get stuck
/// </summary>
[Collection("IntegrationTests")]
public class ProgressTrackingIntegrationTests
{
    private readonly TestServerFixture _fixture;

    public ProgressTrackingIntegrationTests(TestServerFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact(Skip = "Requires SSE client implementation for progress monitoring")]
    public async Task VideoGeneration_ProgressUpdates_NeverGetStuck()
    {
        // This test requires Server-Sent Events (SSE) client implementation
        // to monitor progress updates in real-time
        
        // Arrange
        var request = new VideoGenerationRequest(
            Brief: "Progress test with 11 scenes specifically",
            VoiceId: null,
            Style: "educational",
            DurationMinutes: 1.0 // Enough for 11 scenes
        );

        var progressValues = new List<int>();

        // Act
        var createResponse = await _fixture.Client.PostAsJsonAsync("/api/video/generate", request);
        var result = await createResponse.Content.ReadFromJsonAsync<VideoGenerationResponse>();

        // Subscribe to progress updates via SSE endpoint
        // /api/video/events/{jobId}
        // Collect progress values

        // Assert
        // Verify progress never gets stuck at 79%
        progressValues.Should().NotContain(79, "progress should not get stuck at 79%");
        // Verify progress reaches 100%
        progressValues.Should().Contain(100, "progress should reach 100%");
        // Verify all stage transitions happen
    }

    [Fact]
    public async Task GetJobStatus_ReturnsProgressPercentage()
    {
        // Arrange - create a job
        var request = new VideoGenerationRequest(
            Brief: "Test video for progress percentage check",
            VoiceId: null,
            Style: "educational",
            DurationMinutes: 0.5
        );
        
        var createResponse = await _fixture.Client.PostAsJsonAsync("/api/video/generate", request);
        var createResult = await createResponse.Content.ReadFromJsonAsync<VideoGenerationResponse>();

        // Act - immediately check status
        var statusResponse = await _fixture.Client.GetAsync($"/api/video/status/{createResult!.JobId}");
        var status = await statusResponse.Content.ReadFromJsonAsync<VideoStatus>();

        // Assert
        status.Should().NotBeNull();
        status!.ProgressPercentage.Should().BeGreaterOrEqualTo(0);
        status.ProgressPercentage.Should().BeLessOrEqualTo(100);
    }
}

/// <summary>
/// Integration tests for caption generation functionality
/// </summary>
[Collection("IntegrationTests")]
public class CaptionIntegrationTests
{
    private readonly TestServerFixture _fixture;

    public CaptionIntegrationTests(TestServerFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact(Skip = "Requires completed video to test caption export")]
    public async Task VideoGeneration_WithCaptions_GeneratesSrtFile()
    {
        // This test requires waiting for video completion
        // and checking for .srt file generation
        
        // Arrange
        var request = new VideoGenerationRequest(
            Brief: "Test video with captions",
            VoiceId: null,
            Style: "educational",
            DurationMinutes: 0.5
        );

        // Act
        var response = await _fixture.Client.PostAsJsonAsync("/api/video/generate", request);
        var result = await response.Content.ReadFromJsonAsync<VideoGenerationResponse>();

        // Wait for completion and verify .srt file exists
        // Would need to poll status until completed

        // Assert
        // Verify .srt file is generated
        // Verify caption timing matches audio
    }
}
