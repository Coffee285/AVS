using System;
using System.Net.Http;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Xunit;

namespace Aura.Tests.Integration;

/// <summary>
/// Test server fixture for integration tests using WebApplicationFactory
/// Provides a shared test server instance for integration test collections
/// </summary>
public class TestServerFixture : IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    
    public HttpClient Client { get; }
    public IServiceProvider Services => _factory.Services;

    public TestServerFixture()
    {
        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    ConfigureTestServices(services);
                });
            });

        Client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
            BaseAddress = new Uri("http://localhost")
        });
    }

    /// <summary>
    /// Configure test-specific services
    /// Override this method in derived fixtures to customize service configuration
    /// </summary>
    protected virtual void ConfigureTestServices(IServiceCollection services)
    {
        // Test services can be configured here
        // For example: replace real providers with mocks for specific test scenarios
    }

    /// <summary>
    /// Get a service from the test server's DI container
    /// </summary>
    public T GetService<T>() where T : notnull
    {
        return Services.GetRequiredService<T>();
    }

    /// <summary>
    /// Get an optional service from the test server's DI container
    /// </summary>
    public T? GetOptionalService<T>()
    {
        return Services.GetService<T>();
    }

    public void Dispose()
    {
        Client?.Dispose();
        _factory?.Dispose();
        GC.SuppressFinalize(this);
    }
}

/// <summary>
/// Collection definition for integration tests that share the TestServerFixture
/// This allows multiple test classes to share the same test server instance
/// </summary>
[CollectionDefinition("IntegrationTests")]
public class IntegrationTestCollection : ICollectionFixture<TestServerFixture>
{
    // This class has no code, and is never created. Its purpose is simply
    // to be the place to apply [CollectionDefinition] and all the
    // ICollectionFixture<> interfaces.
}
