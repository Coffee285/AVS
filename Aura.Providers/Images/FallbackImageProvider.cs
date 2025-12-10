using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Aura.Core.Models;
using Aura.Core.Providers;
using Aura.Providers.Visuals;
using Microsoft.Extensions.Logging;

namespace Aura.Providers.Images;

/// <summary>
/// A composite IImageProvider that tries primary providers in order,
/// then falls back to PlaceholderProvider as a guaranteed fallback.
/// This ensures video generation can always complete with placeholder images.
/// </summary>
public class FallbackImageProvider : IImageProvider
{
    private const int MaxQueryLength = 100;
    
    private readonly ILogger<FallbackImageProvider> _logger;
    private readonly IReadOnlyList<IStockProvider> _primaryProviders;
    private readonly PlaceholderImageProvider _placeholderProvider;

    /// <summary>
    /// Creates a FallbackImageProvider with a list of primary providers and a placeholder fallback.
    /// </summary>
    /// <param name="logger">Logger instance</param>
    /// <param name="primaryProviders">List of primary stock providers to try first (can be empty)</param>
    /// <param name="placeholderProvider">The placeholder provider used as guaranteed fallback</param>
    public FallbackImageProvider(
        ILogger<FallbackImageProvider> logger,
        IEnumerable<IStockProvider> primaryProviders,
        PlaceholderImageProvider placeholderProvider)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _primaryProviders = primaryProviders?.ToList() ?? new List<IStockProvider>();
        _placeholderProvider = placeholderProvider ?? throw new ArgumentNullException(nameof(placeholderProvider));
        
        _logger.LogInformation(
            "FallbackImageProvider initialized with {PrimaryCount} primary providers and PlaceholderImageProvider fallback",
            _primaryProviders.Count);
    }

    /// <summary>
    /// Fetches or generates images for a scene.
    /// Tries each primary provider in order, falls back to PlaceholderProvider if all fail.
    /// </summary>
    public async Task<IReadOnlyList<Asset>> FetchOrGenerateAsync(
        Scene scene,
        VisualSpec spec,
        CancellationToken ct = default)
    {
        var query = !string.IsNullOrEmpty(scene.Heading) ? scene.Heading : scene.Script;
        var truncatedQuery = query?.Length > MaxQueryLength ? query[..MaxQueryLength] : query ?? "scene";
        
        _logger.LogDebug("FetchOrGenerateAsync for scene {SceneIndex}: {Query}", scene.Index, truncatedQuery);

        Exception? lastPrimaryException = null;

        // Try primary providers first with per-provider timeout
        foreach (var provider in _primaryProviders)
        {
            try
            {
                _logger.LogDebug("Trying primary provider {ProviderType}", provider.GetType().Name);
                
                using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
                using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(ct, timeoutCts.Token);
                
                var results = await provider.SearchAsync(query ?? "scene", 1, linkedCts.Token).ConfigureAwait(false);
                
                if (results != null && results.Count > 0)
                {
                    _logger.LogInformation(
                        "Primary provider {ProviderType} returned {Count} assets for scene {SceneIndex}",
                        provider.GetType().Name, results.Count, scene.Index);
                    return results;
                }
                
                _logger.LogDebug("Primary provider {ProviderType} returned no results, trying next", provider.GetType().Name);
            }
            catch (OperationCanceledException) when (!ct.IsCancellationRequested)
            {
                _logger.LogWarning("Primary provider {ProviderType} timed out for scene {SceneIndex}", 
                    provider.GetType().Name, scene.Index);
            }
            catch (Exception ex)
            {
                lastPrimaryException = ex;
                _logger.LogWarning(ex, "Primary provider {ProviderType} failed for scene {SceneIndex}", 
                    provider.GetType().Name, scene.Index);
            }
        }

        // All primary providers failed, use placeholder fallback
        _logger.LogInformation(
            "All {Count} primary providers failed for scene {SceneIndex}, using PlaceholderImageProvider",
            _primaryProviders.Count, scene.Index);

        try
        {
            var placeholderResults = await _placeholderProvider.SearchAsync(
                query ?? "placeholder", 1, ct).ConfigureAwait(false);

            if (placeholderResults != null && placeholderResults.Count > 0)
            {
                _logger.LogInformation(
                    "PlaceholderImageProvider generated {Count} fallback assets for scene {SceneIndex}",
                    placeholderResults.Count, scene.Index);
                return placeholderResults;
            }
            
            // Placeholder returned empty - this should not happen but handle it
            throw new InvalidOperationException(
                "PlaceholderImageProvider returned empty results for scene " + scene.Index);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "PlaceholderImageProvider failed for scene {SceneIndex}", scene.Index);
            
            // CRITICAL FIX: Throw instead of returning empty array
            // This ensures the pipeline fails fast with a clear error
            throw new InvalidOperationException(
                "All image providers including PlaceholderImageProvider failed for scene " + scene.Index + 
                ". The video cannot be rendered without visual assets. " +
                "Check disk space and SkiaSharp installation.",
                ex);
        }
    }
}
