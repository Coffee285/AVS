using System;
using System.Threading;
using System.Threading.Tasks;
using Aura.Core.Services.PromptManagement;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Aura.Api.HostedServices;

/// <summary>
/// Hosted service that initializes system prompt templates on application startup
/// </summary>
public class SystemPromptInitializer : IHostedService
{
    private readonly ILogger<SystemPromptInitializer> _logger;
    private readonly IPromptRepository _repository;

    public SystemPromptInitializer(
        ILogger<SystemPromptInitializer> logger,
        IPromptRepository repository)
    {
        _logger = logger;
        _repository = repository;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("=== SYSTEM PROMPT INITIALIZER: StartAsync ENTRY ===");
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        try
        {
            _logger.LogInformation(">>> PROMPT INIT: Creating system templates");
            var systemTemplates = SystemPromptTemplateFactory.CreateSystemTemplates();
            _logger.LogInformation(">>> PROMPT INIT: Created {Count} system templates", systemTemplates.Count);

            foreach (var template in systemTemplates)
            {
                _logger.LogInformation(">>> PROMPT INIT: Checking for existing template: {Name}", template.Name);
                var checkStopwatch = System.Diagnostics.Stopwatch.StartNew();
                var existing = await _repository.GetByIdAsync(template.Id, cancellationToken).ConfigureAwait(false);
                checkStopwatch.Stop();
                
                if (existing == null)
                {
                    _logger.LogInformation(">>> PROMPT INIT: Creating template: {Name} (check took {Ms}ms)", 
                        template.Name, checkStopwatch.ElapsedMilliseconds);
                    var createStopwatch = System.Diagnostics.Stopwatch.StartNew();
                    await _repository.CreateAsync(template, cancellationToken).ConfigureAwait(false);
                    createStopwatch.Stop();
                    _logger.LogInformation(">>> PROMPT INIT: Created template: {Name} (took {Ms}ms)", 
                        template.Name, createStopwatch.ElapsedMilliseconds);
                }
                else
                {
                    _logger.LogInformation(">>> PROMPT INIT: Template already exists: {Name} (check took {Ms}ms)", 
                        template.Name, checkStopwatch.ElapsedMilliseconds);
                }
            }

            stopwatch.Stop();
            _logger.LogInformation("=== SYSTEM PROMPT INITIALIZER: COMPLETE - Total time: {Ms}ms, Templates: {Count} ===",
                stopwatch.ElapsedMilliseconds, systemTemplates.Count);
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex, "=== SYSTEM PROMPT INITIALIZER: FAILED after {Ms}ms ===", stopwatch.ElapsedMilliseconds);
        }
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}
