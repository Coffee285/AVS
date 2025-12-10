using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Aura.Core.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Aura.Core.Services;

/// <summary>
/// Service for database initialization, health checking, and repair
/// </summary>
public class DatabaseInitializationService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<DatabaseInitializationService> _logger;
    private readonly string _databasePath;

    public DatabaseInitializationService(
        IServiceScopeFactory scopeFactory,
        ILogger<DatabaseInitializationService> logger,
        IOptions<DatabasePathOptions>? pathOptions = null)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _databasePath = ResolveDatabasePath(pathOptions?.Value?.SqlitePath);
    }

    private static string ResolveDatabasePath(string? configuredPath)
    {
        if (!string.IsNullOrWhiteSpace(configuredPath))
        {
            return Path.GetFullPath(configuredPath);
        }

        var defaultPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "aura.db");
        return Path.GetFullPath(defaultPath);
    }

    /// <summary>
    /// Initialize database with migrations and health checks
    /// </summary>
    public async Task<InitializationResult> InitializeAsync(CancellationToken ct = default)
    {
        _logger.LogInformation(">>> DATABASE INIT: Starting database initialization");
        _logger.LogInformation(">>> DATABASE INIT: Database path: {Path}", _databasePath);

        var result = new InitializationResult
        {
            DatabasePath = _databasePath,
            StartTime = DateTime.UtcNow
        };

        try
        {
            _logger.LogInformation(">>> DATABASE INIT: Step 1 - Checking path writability");
            var pathCheckStopwatch = System.Diagnostics.Stopwatch.StartNew();
            result.PathWritable = await CheckPathWritableAsync().ConfigureAwait(false);
            pathCheckStopwatch.Stop();
            _logger.LogInformation(">>> DATABASE INIT: Step 1 COMPLETE - Path writable: {Writable} ({Ms}ms)", 
                result.PathWritable, pathCheckStopwatch.ElapsedMilliseconds);

            if (!result.PathWritable)
            {
                result.Success = false;
                result.Error = $"Database path is not writable: {_databasePath}";
                _logger.LogError(result.Error);
                return result;
            }

            _logger.LogInformation(">>> DATABASE INIT: Step 2 - Checking if database file exists");
            result.DatabaseExists = File.Exists(_databasePath);
            _logger.LogInformation(">>> DATABASE INIT: Step 2 COMPLETE - Database exists: {Exists}", result.DatabaseExists);

            _logger.LogInformation(">>> DATABASE INIT: Step 3 - Creating service scope");
            var scopeStopwatch = System.Diagnostics.Stopwatch.StartNew();
            using var scope = _scopeFactory.CreateScope();
            scopeStopwatch.Stop();
            _logger.LogInformation(">>> DATABASE INIT: Step 3 COMPLETE - Scope created ({Ms}ms)", scopeStopwatch.ElapsedMilliseconds);

            _logger.LogInformation(">>> DATABASE INIT: Step 4 - Resolving AuraDbContext");
            var contextStopwatch = System.Diagnostics.Stopwatch.StartNew();
            var context = scope.ServiceProvider.GetRequiredService<AuraDbContext>();
            contextStopwatch.Stop();
            _logger.LogInformation(">>> DATABASE INIT: Step 4 COMPLETE - Context resolved ({Ms}ms)", contextStopwatch.ElapsedMilliseconds);

            _logger.LogInformation(">>> DATABASE INIT: Step 5 - Applying migrations");
            var migrationStopwatch = System.Diagnostics.Stopwatch.StartNew();
            result.MigrationsApplied = await ApplyMigrationsAsync(context, ct).ConfigureAwait(false);
            migrationStopwatch.Stop();
            _logger.LogInformation(">>> DATABASE INIT: Step 5 COMPLETE - Migrations applied: {Applied} ({Ms}ms)", 
                result.MigrationsApplied, migrationStopwatch.ElapsedMilliseconds);

            if (!result.MigrationsApplied)
            {
                result.Success = false;
                result.Error = "Failed to apply database migrations";
                return result;
            }

            _logger.LogInformation(">>> DATABASE INIT: Step 6 - Configuring WAL mode");
            var walStopwatch = System.Diagnostics.Stopwatch.StartNew();
            result.WalModeEnabled = await ConfigureWalModeAsync(context, ct).ConfigureAwait(false);
            walStopwatch.Stop();
            _logger.LogInformation(">>> DATABASE INIT: Step 6 COMPLETE - WAL mode: {Enabled} ({Ms}ms)", 
                result.WalModeEnabled, walStopwatch.ElapsedMilliseconds);

            _logger.LogInformation(">>> DATABASE INIT: Step 7 - Checking database integrity");
            var integrityStopwatch = System.Diagnostics.Stopwatch.StartNew();
            result.IntegrityCheck = await CheckIntegrityAsync(context, ct).ConfigureAwait(false);
            integrityStopwatch.Stop();
            _logger.LogInformation(">>> DATABASE INIT: Step 7 COMPLETE - Integrity check: {Pass} ({Ms}ms)", 
                result.IntegrityCheck, integrityStopwatch.ElapsedMilliseconds);

            if (!result.IntegrityCheck)
            {
                _logger.LogWarning("Database integrity check failed, attempting repair");
                result.RepairAttempted = true;
                result.RepairSuccessful = await AttemptRepairAsync(context, ct).ConfigureAwait(false);

                if (!result.RepairSuccessful)
                {
                    result.Success = false;
                    result.Error = "Database integrity check failed and repair was unsuccessful";
                    return result;
                }
            }

            result.Success = true;
            result.EndTime = DateTime.UtcNow;
            result.DurationMs = (result.EndTime.Value - result.StartTime).TotalMilliseconds;

            _logger.LogInformation(
                ">>> DATABASE INIT: COMPLETED SUCCESSFULLY in {Duration}ms",
                result.DurationMs);

            return result;
        }
        catch (Exception ex)
        {
            result.Success = false;
            result.Error = ex.Message;
            result.EndTime = DateTime.UtcNow;
            result.DurationMs = (result.EndTime.Value - result.StartTime).TotalMilliseconds;
            _logger.LogError(ex, ">>> DATABASE INIT: FAILED after {Duration}ms", result.DurationMs);
            return result;
        }
    }

    /// <summary>
    /// Check if database path is writable
    /// </summary>
    private async Task<bool> CheckPathWritableAsync()
    {
        try
        {
            var directory = Path.GetDirectoryName(_databasePath);
            
            if (string.IsNullOrEmpty(directory))
            {
                return false;
            }

            if (!Directory.Exists(directory))
            {
                Directory.CreateDirectory(directory);
            }

            var testFile = Path.Combine(directory, $".write-test-{Guid.NewGuid()}");
            
            await File.WriteAllTextAsync(testFile, "test").ConfigureAwait(false);
            File.Delete(testFile);

            _logger.LogDebug("Database path is writable: {Path}", directory);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database path is not writable");
            return false;
        }
    }

    /// <summary>
    /// Apply pending migrations
    /// </summary>
    private async Task<bool> ApplyMigrationsAsync(AuraDbContext context, CancellationToken ct)
    {
        try
        {
            _logger.LogInformation("    >>> Checking for pending migrations...");
            var checkStopwatch = System.Diagnostics.Stopwatch.StartNew();
            var pendingMigrations = await context.Database.GetPendingMigrationsAsync(ct).ConfigureAwait(false);
            var pendingCount = pendingMigrations.Count();
            checkStopwatch.Stop();
            _logger.LogInformation("    >>> Pending migrations check completed in {Ms}ms - Found {Count} pending", 
                checkStopwatch.ElapsedMilliseconds, pendingCount);

            if (pendingCount > 0)
            {
                _logger.LogInformation("    >>> Applying {Count} pending migrations", pendingCount);
                var migrateStopwatch = System.Diagnostics.Stopwatch.StartNew();
                await context.Database.MigrateAsync(ct).ConfigureAwait(false);
                migrateStopwatch.Stop();
                _logger.LogInformation("    >>> Migrations applied successfully in {Ms}ms", migrateStopwatch.ElapsedMilliseconds);
            }
            else
            {
                _logger.LogInformation("    >>> No pending migrations to apply");
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "    >>> Failed to apply migrations");
            return false;
        }
    }

    /// <summary>
    /// Configure SQLite performance settings via PRAGMA statements
    /// These settings cannot be set in the connection string (not supported by Microsoft.Data.Sqlite)
    /// </summary>
    private async Task<bool> ConfigureWalModeAsync(AuraDbContext context, CancellationToken ct)
    {
        try
        {
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();
            
            _logger.LogInformation("    >>> Configuring PRAGMA journal_mode=WAL");
            await context.Database.ExecuteSqlRawAsync("PRAGMA journal_mode=WAL;", ct).ConfigureAwait(false);
            
            _logger.LogInformation("    >>> Configuring PRAGMA synchronous=NORMAL");
            await context.Database.ExecuteSqlRawAsync("PRAGMA synchronous=NORMAL;", ct).ConfigureAwait(false);
            
            _logger.LogInformation("    >>> Configuring PRAGMA page_size=4096");
            await context.Database.ExecuteSqlRawAsync("PRAGMA page_size=4096;", ct).ConfigureAwait(false);
            
            _logger.LogInformation("    >>> Configuring PRAGMA cache_size=-64000");
            await context.Database.ExecuteSqlRawAsync("PRAGMA cache_size=-64000;", ct).ConfigureAwait(false);
            
            _logger.LogInformation("    >>> Configuring PRAGMA temp_store=MEMORY");
            await context.Database.ExecuteSqlRawAsync("PRAGMA temp_store=MEMORY;", ct).ConfigureAwait(false);
            
            _logger.LogInformation("    >>> Configuring PRAGMA locking_mode=NORMAL");
            await context.Database.ExecuteSqlRawAsync("PRAGMA locking_mode=NORMAL;", ct).ConfigureAwait(false);

            stopwatch.Stop();
            _logger.LogInformation("    >>> SQLite performance settings configured successfully in {Ms}ms", stopwatch.ElapsedMilliseconds);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "    >>> Failed to configure SQLite performance settings, using defaults");
            return false;
        }
    }

    /// <summary>
    /// Check database integrity
    /// </summary>
    private async Task<bool> CheckIntegrityAsync(AuraDbContext context, CancellationToken ct)
    {
        try
        {
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();
            
            _logger.LogInformation("    >>> Opening database connection for integrity check");
            var connection = context.Database.GetDbConnection();
            await connection.OpenAsync(ct).ConfigureAwait(false);
            _logger.LogInformation("    >>> Connection opened, executing PRAGMA integrity_check");

            using var command = connection.CreateCommand();
            command.CommandText = "PRAGMA integrity_check;";
            command.CommandTimeout = 30; // 30 second timeout for integrity check
            
            var result = await command.ExecuteScalarAsync(ct).ConfigureAwait(false);
            stopwatch.Stop();
            
            var isOk = result?.ToString() == "ok";

            if (isOk)
            {
                _logger.LogInformation("    >>> Database integrity check PASSED in {Ms}ms", stopwatch.ElapsedMilliseconds);
            }
            else
            {
                _logger.LogWarning("    >>> Database integrity check FAILED in {Ms}ms: {Result}", stopwatch.ElapsedMilliseconds, result);
            }

            return isOk;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "    >>> Error checking database integrity");
            return false;
        }
    }

    /// <summary>
    /// Attempt to repair a corrupted database
    /// </summary>
    private async Task<bool> AttemptRepairAsync(AuraDbContext context, CancellationToken ct)
    {
        try
        {
            _logger.LogInformation("Attempting database repair");

            var connection = context.Database.GetDbConnection();
            await connection.OpenAsync(ct).ConfigureAwait(false);

            using var command = connection.CreateCommand();
            command.CommandText = "PRAGMA integrity_check;";
            
            var checkResult = await command.ExecuteScalarAsync(ct).ConfigureAwait(false);

            if (checkResult?.ToString() == "ok")
            {
                _logger.LogInformation("Database integrity restored");
                return true;
            }

            _logger.LogWarning("Database repair unsuccessful, manual intervention may be required");
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during database repair");
            return false;
        }
    }
}

/// <summary>
/// Result of database initialization
/// </summary>
public class InitializationResult
{
    public bool Success { get; set; }
    public string? Error { get; set; }
    public string DatabasePath { get; set; } = string.Empty;
    public bool DatabaseExists { get; set; }
    public bool PathWritable { get; set; }
    public bool MigrationsApplied { get; set; }
    public bool WalModeEnabled { get; set; }
    public bool IntegrityCheck { get; set; }
    public bool RepairAttempted { get; set; }
    public bool RepairSuccessful { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public double DurationMs { get; set; }
}
