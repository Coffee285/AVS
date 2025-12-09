using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading.Tasks;

namespace Aura.Tests.TestUtilities;

internal static class FfmpegTestHelper
{
    internal static string GetRuntimeRidSegment()
    {
        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        {
            return "win-x64";
        }

        if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
        {
            return RuntimeInformation.ProcessArchitecture == Architecture.Arm64 ? "osx-arm64" : "osx-x64";
        }

        return "linux-x64";
    }

    internal static async Task CreateMockFfmpegBinary(string path)
    {
        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        {
            // On Windows, create a .cmd file instead of .exe for testing
            // The locator will accept both .exe and .cmd files
            var cmdPath = path.EndsWith(".exe") ? path.Replace(".exe", ".cmd") : path + ".cmd";
            var batchContent = @"@echo off
if ""%1""==""-version"" (
    echo ffmpeg version 6.0-test Copyright (c) 2000-present the FFmpeg developers
    echo built with gcc 12.2.0
    exit /b 0
)
exit /b 1";
            await File.WriteAllTextAsync(cmdPath, batchContent);
            
            // Also create the .exe path as a copy for tests that specifically check .exe
            if (path.EndsWith(".exe"))
            {
                await File.WriteAllTextAsync(path, batchContent);
            }
            return;
        }

        var shellContent = @"#!/bin/bash
if [ ""$1"" = ""-version"" ]; then
    echo ""ffmpeg version 6.0-test Copyright (c) 2000-present the FFmpeg developers""
    echo ""built with gcc 12.2.0""
    exit 0
fi
exit 1";
        await File.WriteAllTextAsync(path, shellContent);

        try
        {
            var process = System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
            {
                FileName = "chmod",
                Arguments = $"+x \"{path}\"",
                UseShellExecute = false,
                CreateNoWindow = true,
                RedirectStandardError = true,
                RedirectStandardOutput = true
            });
            if (process != null)
            {
                await process.WaitForExitAsync();
                // If chmod failed, the file won't be executable and tests should skip
            }
        }
        catch
        {
            // Ignore chmod failures in test helper - tests will skip if file not executable
        }
    }
}
