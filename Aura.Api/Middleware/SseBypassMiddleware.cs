using Microsoft.AspNetCore.Http.Features;

namespace Aura.Api.Middleware;

/// <summary>
/// Middleware to bypass response compression and buffering for Server-Sent Events (SSE) endpoints.
/// CRITICAL: Must be registered BEFORE UseResponseCompression() in the middleware pipeline.
/// This ensures SSE events are streamed in real-time without buffering delays.
/// </summary>
public class SseBypassMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<SseBypassMiddleware> _logger;

    public SseBypassMiddleware(RequestDelegate next, ILogger<SseBypassMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? string.Empty;

        // Check if this is an SSE endpoint
        // Matches: /api/jobs/{jobId}/events and /api/jobs/{jobId}/progress/stream
        if (path.Contains("/events", StringComparison.OrdinalIgnoreCase) ||
            path.Contains("/progress/stream", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogDebug("[{CorrelationId}] SSE endpoint detected: {Path} - disabling buffering and compression",
                context.TraceIdentifier, path);

            // CRITICAL FIX: Disable buffering BEFORE response compression middleware can intercept
            // This ensures the DisableBuffering() call in JobsController takes effect
            var bufferingFeature = context.Features.Get<IHttpResponseBodyFeature>();
            if (bufferingFeature != null)
            {
                bufferingFeature.DisableBuffering();
                _logger.LogDebug("[{CorrelationId}] Response buffering disabled for SSE endpoint",
                    context.TraceIdentifier);
            }

            // Set Cache-Control and Connection headers early to signal SSE streaming
            // This provides additional hints to prevent response compression and buffering
            context.Response.OnStarting(() =>
            {
                // Only set headers if not already set by the controller
                if (!context.Response.Headers.ContainsKey("Cache-Control"))
                {
                    context.Response.Headers.CacheControl = "no-cache, no-store, must-revalidate";
                }
                if (!context.Response.Headers.ContainsKey("Connection"))
                {
                    context.Response.Headers.Connection = "keep-alive";
                }
                return Task.CompletedTask;
            });
        }

        await _next(context);
    }
}
