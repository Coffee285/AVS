using System;
using System.Diagnostics;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Aura.Core.Models.Ideation;
using FluentAssertions;
using Xunit;

namespace Aura.Tests.Integration;

/// <summary>
/// Integration tests for ideation and brainstorming functionality
/// Tests AI-powered concept generation with performance constraints
/// </summary>
[Collection("IntegrationTests")]
public class IdeationIntegrationTests
{
    private readonly TestServerFixture _fixture;

    public IdeationIntegrationTests(TestServerFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task Ideation_WithValidProvider_CompletesWithin30Seconds()
    {
        // Arrange
        var request = new BrainstormRequest(
            Topic: "Quick test topic for integration testing",
            ConceptCount: 3,
            RagConfiguration: null,
            LlmParameters: null
        );

        // Act
        var stopwatch = Stopwatch.StartNew();
        var response = await _fixture.Client.PostAsJsonAsync("/api/ideation/brainstorm", request);
        stopwatch.Stop();

        // Assert
        response.StatusCode.Should().Match(code => 
            code == HttpStatusCode.OK || code == HttpStatusCode.ServiceUnavailable,
            "should either succeed or return service unavailable");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            stopwatch.ElapsedMilliseconds.Should().BeLessThan(30000,
                "ideation should complete within 30 seconds when provider is available");

            var result = await response.Content.ReadAsStringAsync();
            result.Should().Contain("concepts", "response should contain generated concepts");
        }
    }

    [Fact]
    public async Task Ideation_WithNoProvider_FailsFastWithClearError()
    {
        // This test verifies fast failure when providers are unavailable
        // The actual provider availability depends on test environment
        
        // Arrange
        var request = new BrainstormRequest(
            Topic: "Test topic for provider check",
            ConceptCount: 3,
            RagConfiguration: null,
            LlmParameters: null
        );

        // Act
        var stopwatch = Stopwatch.StartNew();
        var response = await _fixture.Client.PostAsJsonAsync("/api/ideation/brainstorm", request);
        stopwatch.Stop();

        // Assert - if no provider available, should fail fast
        if (response.StatusCode == HttpStatusCode.ServiceUnavailable)
        {
            stopwatch.ElapsedMilliseconds.Should().BeLessThan(15000,
                "should fail fast within 15 seconds when no provider available");

            var errorContent = await response.Content.ReadAsStringAsync();
            errorContent.Should().Contain("provider", "error message should mention provider");
            errorContent.Should().ContainAny("suggestions", "Start Ollama", "configure",
                "error should include helpful suggestions");
        }
    }

    [Fact]
    public async Task Ideation_WithEmptyTopic_ReturnsBadRequest()
    {
        // Arrange - empty topic should fail validation
        var request = new BrainstormRequest(
            Topic: "",
            ConceptCount: 3,
            RagConfiguration: null,
            LlmParameters: null
        );

        // Act
        var response = await _fixture.Client.PostAsJsonAsync("/api/ideation/brainstorm", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest,
            "empty topic should be rejected with 400 Bad Request");

        var errorContent = await response.Content.ReadAsStringAsync();
        errorContent.Should().Contain("topic", "error should mention topic is required");
    }

    [Fact]
    public async Task Ideation_WithValidTopic_ReturnsExpectedStructure()
    {
        // Arrange
        var request = new BrainstormRequest(
            Topic: "Artificial Intelligence in Healthcare",
            ConceptCount: 5,
            RagConfiguration: null,
            LlmParameters: null
        );

        // Act
        var response = await _fixture.Client.PostAsJsonAsync("/api/ideation/brainstorm", request);

        // Assert - if successful, verify structure
        if (response.StatusCode == HttpStatusCode.OK)
        {
            var content = await response.Content.ReadAsStringAsync();
            content.Should().Contain("concepts", "response should contain concepts array");
            content.Should().Contain("originalTopic", "response should contain original topic");
            content.Should().Contain("generatedAt", "response should contain generation timestamp");
            content.Should().Contain("count", "response should contain concept count");
        }
        else
        {
            // If provider not available, that's acceptable for integration tests
            response.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable,
                "if not successful, should return 503 for provider unavailability");
        }
    }

    [Fact]
    public async Task Ideation_MultipleRequests_HandleConcurrency()
    {
        // Arrange
        var request1 = new BrainstormRequest(
            Topic: "Machine Learning Basics",
            ConceptCount: 3,
            RagConfiguration: null,
            LlmParameters: null
        );

        var request2 = new BrainstormRequest(
            Topic: "Cloud Computing Essentials",
            ConceptCount: 3,
            RagConfiguration: null,
            LlmParameters: null
        );

        // Act - send concurrent requests
        var task1 = _fixture.Client.PostAsJsonAsync("/api/ideation/brainstorm", request1);
        var task2 = _fixture.Client.PostAsJsonAsync("/api/ideation/brainstorm", request2);

        var responses = await Task.WhenAll(task1, task2);

        // Assert - both should complete without errors
        responses[0].Should().NotBeNull();
        responses[1].Should().NotBeNull();
        
        // Both should either succeed or fail gracefully
        foreach (var response in responses)
        {
            response.StatusCode.Should().Match(code => 
                code == HttpStatusCode.OK || 
                code == HttpStatusCode.ServiceUnavailable || 
                code == HttpStatusCode.TooManyRequests,
                "concurrent requests should handle gracefully");
        }
    }

    [Fact]
    public async Task Ideation_WithRAGConfiguration_AcceptsConfiguration()
    {
        // Arrange
        var ragConfig = new Aura.Core.Models.RagConfiguration(
            Enabled: true,
            TopK: 5,
            MinimumScore: 0.6f,
            MaxContextTokens: 2000,
            IncludeCitations: true,
            TightenClaims: false
        );

        var request = new BrainstormRequest(
            Topic: "Software Testing Best Practices",
            ConceptCount: 3,
            RagConfiguration: ragConfig,
            LlmParameters: null
        );

        // Act
        var response = await _fixture.Client.PostAsJsonAsync("/api/ideation/brainstorm", request);

        // Assert - should accept RAG configuration without errors
        response.StatusCode.Should().Match(code => 
            code == HttpStatusCode.OK || code == HttpStatusCode.ServiceUnavailable,
            "should accept RAG configuration");
    }
}
