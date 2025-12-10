using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Aura.Core.Providers;

/// <summary>
/// Settings for Ollama direct client configuration.
/// </summary>
public class OllamaSettings
{
    /// <summary>Base URL for Ollama API (default: http://127.0.0.1:11434)</summary>
    public string BaseUrl { get; set; } = "http://127.0.0.1:11434";

    /// <summary>Default model to use if not specified</summary>
    public string? DefaultModel { get; set; }

    /// <summary>Timeout for requests (default: 15 minutes to match Script Generation - allows for slow models and model loading)</summary>
    public TimeSpan Timeout { get; set; } = TimeSpan.FromMinutes(15);

    /// <summary>Maximum retry attempts (default: 3)</summary>
    public int MaxRetries { get; set; } = 3;

    /// <summary>Enable GPU acceleration (default: true)</summary>
    public bool GpuEnabled { get; set; } = true;

    /// <summary>Number of GPUs to use (-1 = all, 0 = CPU only)</summary>
    public int NumGpu { get; set; } = -1;

    /// <summary>Context window size (default: 4096)</summary>
    public int NumCtx { get; set; } = 4096;

    /// <summary>Heartbeat logging interval in seconds (default: 30s - matches Script Generation)</summary>
    public int HeartbeatIntervalSeconds { get; set; } = 30;

    /// <summary>Availability cache duration in seconds (default: 30s - matches Script Generation)</summary>
    public int AvailabilityCacheSeconds { get; set; } = 30;
}

/// <summary>
/// Direct HTTP client for Ollama API with proper dependency injection.
///
/// ARCHITECTURAL FIX: This replaces reflection-based access to OllamaLlmProvider.
/// Uses IHttpClientFactory for proper lifetime management and configuration.
/// Implements retry logic with Polly-style exponential backoff.
/// Matches OllamaScriptProvider robustness: 15-minute timeout, heartbeat logging, availability caching.
/// </summary>
public class OllamaDirectClient : IOllamaDirectClient
{
    private readonly ILogger<OllamaDirectClient> _logger;
    private readonly HttpClient _httpClient;
    private readonly OllamaSettings _settings;
    
    // Availability caching (matches Script Generation)
    private DateTime _lastAvailabilityCheck = DateTime.MinValue;
    private bool _cachedAvailabilityResult = false;

    public OllamaDirectClient(
        ILogger<OllamaDirectClient> logger,
        HttpClient httpClient,
        IOptions<OllamaSettings> settings)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        _settings = settings?.Value ?? throw new ArgumentNullException(nameof(settings));

        // Configure HttpClient from settings
        _httpClient.BaseAddress = new Uri(_settings.BaseUrl);
        
        // CRITICAL: Ensure HttpClient timeout is properly synchronized with operation timeout
        // Add buffer for network latency (matches OllamaHttpClientHelper.TimeoutBufferSeconds = 300)
        const int TimeoutBufferSeconds = 300; // 5 minutes
        var requiredTimeout = TimeSpan.FromSeconds(_settings.Timeout.TotalSeconds + TimeoutBufferSeconds);
        
        // If HttpClient has infinite timeout, it's already configured for long-running requests
        if (_httpClient.Timeout != Timeout.InfiniteTimeSpan && _httpClient.Timeout < requiredTimeout)
        {
            try
            {
                _httpClient.Timeout = requiredTimeout;
                _logger.LogInformation(
                    "Configured HttpClient timeout to {Timeout}s for Ollama operations",
                    requiredTimeout.TotalSeconds);
            }
            catch (InvalidOperationException)
            {
                // HttpClient already in use - log warning but continue
                _logger.LogWarning(
                    "HttpClient already in use, cannot modify timeout. Using existing timeout: {Timeout}s",
                    _httpClient.Timeout.TotalSeconds);
            }
        }
        
        _logger.LogInformation(
            "OllamaDirectClient configured: BaseUrl={BaseUrl}, Timeout={Timeout}s, MaxRetries={MaxRetries}",
            _settings.BaseUrl, _settings.Timeout.TotalSeconds, _settings.MaxRetries);
    }

    /// <inheritdoc />
    public async Task<string> GenerateAsync(
        string model,
        string prompt,
        string? systemPrompt = null,
        OllamaGenerationOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(model);
        ArgumentNullException.ThrowIfNull(prompt);

        // Check for user cancellation before starting
        if (cancellationToken.IsCancellationRequested)
        {
            throw new OperationCanceledException("Operation was cancelled by user", cancellationToken);
        }

        var requestBody = new OllamaGenerateRequest
        {
            Model = model,
            Prompt = prompt,
            System = systemPrompt,
            Stream = false, // Non-streaming for simplicity
            Options = options != null ? new OllamaRequestOptions
            {
                Temperature = options.Temperature,
                TopP = options.TopP,
                TopK = options.TopK,
                NumPredict = options.MaxTokens,
                RepeatPenalty = options.RepeatPenalty,
                Stop = options.Stop,
                NumGpu = options.NumGpu ?? _settings.NumGpu,
                NumCtx = options.NumCtx ?? _settings.NumCtx
            } : null
        };

        _logger.LogInformation(
            "Calling Ollama API: model={Model}, promptLength={PromptLength}, timeout={Timeout}s",
            model, prompt.Length, _settings.Timeout.TotalSeconds);

        // Retry with exponential backoff (matching Script Generation pattern)
        var maxAttempts = _settings.MaxRetries;
        Exception? lastException = null;

        for (int attempt = 0; attempt < maxAttempts; attempt++)
        {
            var requestStartTime = DateTime.UtcNow; // Declare here so it's available in catch blocks
            
            try
            {
                if (attempt > 0)
                {
                    var backoffDelay = TimeSpan.FromSeconds(Math.Pow(2, attempt));
                    _logger.LogInformation(
                        "Retrying Ollama request (attempt {Attempt}/{MaxAttempts}) after {Delay}s delay",
                        attempt + 1, maxAttempts, backoffDelay.TotalSeconds);
                    await Task.Delay(backoffDelay, cancellationToken).ConfigureAwait(false);
                }

                // CRITICAL FIX: Use independent timeout - don't link to parent token for timeout management
                // This prevents upstream components from cancelling our long-running operation
                using var timeoutCts = new CancellationTokenSource();
                timeoutCts.CancelAfter(_settings.Timeout);

                // Still respect explicit user cancellation by checking the parent token
                if (cancellationToken.IsCancellationRequested)
                {
                    throw new OperationCanceledException("Operation was cancelled by user", cancellationToken);
                }

                requestStartTime = DateTime.UtcNow; // Reset timing for this attempt

                // CRITICAL FIX: Start periodic heartbeat logging to show the system is still working
                using var heartbeatCts = CancellationTokenSource.CreateLinkedTokenSource(timeoutCts.Token);
                var heartbeatTask = Task.Run(async () =>
                {
                    try
                    {
                        while (!heartbeatCts.Token.IsCancellationRequested)
                        {
                            await Task.Delay(
                                TimeSpan.FromSeconds(_settings.HeartbeatIntervalSeconds), 
                                heartbeatCts.Token).ConfigureAwait(false);
                            
                            var elapsed = DateTime.UtcNow - requestStartTime;
                            var remaining = _settings.Timeout.TotalSeconds - elapsed.TotalSeconds;
                            
                            if (remaining > 0)
                            {
                                _logger.LogInformation(
                                    "Still awaiting Ollama response... ({Elapsed:F0}s elapsed, {Remaining:F0}s remaining before timeout)",
                                    elapsed.TotalSeconds,
                                    remaining);
                            }
                        }
                    }
                    catch (OperationCanceledException)
                    {
                        // Expected when generation completes or fails
                    }
                }, heartbeatCts.Token);

                HttpResponseMessage response;
                try
                {
                    response = await _httpClient.PostAsJsonAsync(
                        "/api/generate",
                        requestBody,
                        timeoutCts.Token).ConfigureAwait(false);
                }
                finally
                {
                    // Stop heartbeat logging regardless of success/failure
                    heartbeatCts.Cancel();
                    try
                    {
                        await heartbeatTask.ConfigureAwait(false);
                    }
                    catch (OperationCanceledException)
                    {
                        // Expected
                    }
                }

                // Check for user cancellation after long operation
                if (cancellationToken.IsCancellationRequested)
                {
                    throw new OperationCanceledException("Operation was cancelled by user", cancellationToken);
                }

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync(CancellationToken.None).ConfigureAwait(false);
                    
                    // Check for model not found error (non-retryable)
                    if (errorContent.Contains("model") && errorContent.Contains("not found"))
                    {
                        throw new InvalidOperationException(
                            $"Model '{model}' not found. Please pull the model first using: ollama pull {model}");
                    }
                    
                    response.EnsureSuccessStatusCode();
                }

                var result = await response.Content.ReadFromJsonAsync<OllamaGenerateResponse>(
                    cancellationToken: CancellationToken.None).ConfigureAwait(false);

                if (result == null || string.IsNullOrEmpty(result.Response))
                {
                    throw new InvalidOperationException("Ollama returned empty response");
                }

                var duration = DateTime.UtcNow - requestStartTime;
                _logger.LogInformation(
                    "Ollama generation completed successfully: model={Model}, duration={Duration:F1}s, responseLength={Length} chars (attempt {Attempt})",
                    model, duration.TotalSeconds, result.Response.Length, attempt + 1);

                return result.Response;
            }
            catch (TaskCanceledException ex) when (ex.CancellationToken.IsCancellationRequested)
            {
                lastException = ex;
                var elapsed = DateTime.UtcNow.Subtract(requestStartTime);
                _logger.LogWarning(ex,
                    "Ollama request timed out after {Elapsed:F1}s (attempt {Attempt}/{MaxAttempts}, timeout: {Timeout}s). " +
                    "This may be normal for slow models or when Ollama is loading the model. Will retry if attempts remain.",
                    elapsed.TotalSeconds, attempt + 1, maxAttempts, _settings.Timeout.TotalSeconds);

                if (attempt >= maxAttempts - 1)
                {
                    throw new InvalidOperationException(
                        $"Ollama request timed out after {_settings.Timeout.TotalSeconds}s ({_settings.Timeout.TotalMinutes:F1} minutes). " +
                        $"This can happen with large models or slow systems. The model '{model}' may be:\n" +
                        $"  - Still loading into memory (first request after Ollama start can take 2-5 minutes)\n" +
                        $"  - Generating on a slow CPU (some systems need 10-15 minutes)\n" +
                        $"  - A very large model (70B+ models can be extremely slow)\n" +
                        $"Suggestions:\n" +
                        $"  - Wait for Ollama to fully load the model (check 'ollama ps' in terminal)\n" +
                        $"  - Use a smaller/faster model (e.g., llama3.2:3b instead of llama3.1:8b)\n" +
                        $"  - Ensure Ollama has sufficient RAM (model size + 2GB minimum)\n" +
                        $"  - Check Ollama logs for errors", ex);
                }
            }
            catch (InvalidOperationException ex)
            {
                // Non-retryable errors: model not found, invalid response format, etc.
                var isNonRetryable = ex.Message.Contains("not found") ||
                                      ex.Message.Contains("empty response") ||
                                      ex.Message.Contains("Invalid response");

                if (isNonRetryable)
                {
                    _logger.LogError(ex,
                        "Non-retryable error from Ollama (attempt {Attempt}): {Message}",
                        attempt + 1, ex.Message);
                    throw; // Fail immediately, don't retry
                }

                // For other InvalidOperationException, treat as retryable
                lastException = ex;
                _logger.LogWarning(ex,
                    "InvalidOperationException from Ollama (attempt {Attempt}/{MaxAttempts}): {Message}",
                    attempt + 1, maxAttempts, ex.Message);

                if (attempt >= maxAttempts - 1)
                {
                    throw;
                }
            }
            catch (HttpRequestException ex)
            {
                lastException = ex;
                _logger.LogWarning(ex,
                    "Failed to connect to Ollama at {BaseUrl} (attempt {Attempt}/{MaxAttempts})",
                    _settings.BaseUrl, attempt + 1, maxAttempts);

                if (attempt >= maxAttempts - 1)
                {
                    throw new InvalidOperationException(
                        $"Cannot connect to Ollama at {_settings.BaseUrl}. Please ensure Ollama is running: 'ollama serve'", ex);
                }
            }
            catch (Exception ex) when (attempt < maxAttempts - 1)
            {
                lastException = ex;
                _logger.LogWarning(ex,
                    "Error calling Ollama (attempt {Attempt}/{MaxAttempts}): {Message}",
                    attempt + 1, maxAttempts, ex.Message);
            }
        }

        // Should not reach here, but handle gracefully
        throw new InvalidOperationException(
            $"Failed to generate with Ollama after {maxAttempts} attempts. " +
            $"Last error: {lastException?.Message ?? "Unknown error"}. " +
            $"Please verify Ollama is running and model '{model}' is available.", lastException);
    }

    /// <inheritdoc />
    public async Task<bool> IsAvailableAsync(CancellationToken cancellationToken = default)
    {
        // CRITICAL FIX: Cache availability check for 30 seconds (matches Script Generation)
        // This avoids repeated slow checks during rapid successive calls
        var now = DateTime.UtcNow;
        var cacheAge = now - _lastAvailabilityCheck;
        
        if (cacheAge.TotalSeconds < _settings.AvailabilityCacheSeconds)
        {
            _logger.LogDebug(
                "Using cached Ollama availability result: {Result} (cache age: {Age:F1}s)",
                _cachedAvailabilityResult, cacheAge.TotalSeconds);
            return _cachedAvailabilityResult;
        }

        try
        {
            var response = await _httpClient.GetAsync("/api/version", cancellationToken).ConfigureAwait(false);
            var isAvailable = response.IsSuccessStatusCode;
            
            // Update cache
            _lastAvailabilityCheck = now;
            _cachedAvailabilityResult = isAvailable;
            
            _logger.LogInformation("Ollama availability check: {Result}", isAvailable);
            return isAvailable;
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Ollama availability check failed");
            
            // Cache negative result
            _lastAvailabilityCheck = now;
            _cachedAvailabilityResult = false;
            
            return false;
        }
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<string>> ListModelsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _httpClient.GetAsync("/api/tags", cancellationToken).ConfigureAwait(false);
            response.EnsureSuccessStatusCode();

            var result = await response.Content.ReadFromJsonAsync<OllamaModelsResponse>(
                cancellationToken: cancellationToken).ConfigureAwait(false);

            return result?.Models?.Select(m => m.Name).ToList() ?? new List<string>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to list Ollama models");
            return new List<string>();
        }
    }

    #region DTOs for Ollama API

    private class OllamaGenerateRequest
    {
        [JsonPropertyName("model")]
        public string Model { get; set; } = string.Empty;

        [JsonPropertyName("prompt")]
        public string Prompt { get; set; } = string.Empty;

        [JsonPropertyName("system")]
        public string? System { get; set; }

        [JsonPropertyName("stream")]
        public bool Stream { get; set; } = false;

        [JsonPropertyName("options")]
        public OllamaRequestOptions? Options { get; set; }
    }

    private class OllamaRequestOptions
    {
        [JsonPropertyName("temperature")]
        public double? Temperature { get; set; }

        [JsonPropertyName("top_p")]
        public double? TopP { get; set; }

        [JsonPropertyName("top_k")]
        public int? TopK { get; set; }

        [JsonPropertyName("num_predict")]
        public int? NumPredict { get; set; }

        [JsonPropertyName("repeat_penalty")]
        public int? RepeatPenalty { get; set; }

        [JsonPropertyName("stop")]
        public List<string>? Stop { get; set; }

        [JsonPropertyName("num_gpu")]
        public int? NumGpu { get; set; }

        [JsonPropertyName("num_ctx")]
        public int? NumCtx { get; set; }
    }

    private class OllamaGenerateResponse
    {
        [JsonPropertyName("response")]
        public string Response { get; set; } = string.Empty;

        [JsonPropertyName("model")]
        public string? Model { get; set; }

        [JsonPropertyName("done")]
        public bool Done { get; set; }
    }

    private class OllamaModelsResponse
    {
        [JsonPropertyName("models")]
        public List<OllamaModelInfo>? Models { get; set; }
    }

    private class OllamaModelInfo
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;
    }

    #endregion
}
