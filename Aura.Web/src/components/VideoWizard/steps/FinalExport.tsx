import {
  Badge,
  Button,
  Card,
  Checkbox,
  Dropdown,
  Field,
  makeStyles,
  Option,
  ProgressBar,
  Radio,
  RadioGroup,
  Spinner,
  Text,
  Title2,
  Title3,
  tokens,
  Tooltip,
} from '@fluentui/react-components';
import {
  ArrowClockwise24Regular,
  CheckmarkCircle24Regular,
  Dismiss24Regular,
  DocumentMultiple24Regular,
  ErrorCircle24Regular,
  Folder24Regular,
  Info24Regular,
  Open24Regular,
} from '@fluentui/react-icons';
import type { FC } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiUrl } from '../../../config/api';
import { startFinalRendering } from '../../../services/wizardService';
import { openFile, openFolder } from '../../../utils/fileSystemUtils';
import { getDefaultSaveLocation, pickFolder, resolvePathOnBackend } from '../../../utils/pathUtils';
import type { ExportData, StepValidation, WizardData } from '../types';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXL,
  },
  header: {
    marginBottom: tokens.spacingVerticalM,
  },
  settingsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: tokens.spacingHorizontalL,
  },
  settingsCard: {
    padding: tokens.spacingVerticalXL,
  },
  batchExportSection: {
    padding: tokens.spacingVerticalL,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
  },
  formatCheckboxes: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    marginTop: tokens.spacingVerticalM,
  },
  estimateCard: {
    padding: tokens.spacingVerticalL,
    backgroundColor: tokens.colorBrandBackground2,
    borderRadius: tokens.borderRadiusMedium,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  estimateRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exportProgress: {
    padding: tokens.spacingVerticalXL,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalL,
    textAlign: 'center',
  },
  exportActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalL,
  },
  completedSection: {
    padding: tokens.spacingVerticalXXL,
    backgroundColor: tokens.colorBrandBackground2,
    borderRadius: tokens.borderRadiusMedium,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalL,
    textAlign: 'center',
  },
  downloadList: {
    width: '100%',
    maxWidth: '500px',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  downloadItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalL,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  downloadItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalM,
  },
  downloadItemInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    flex: 1,
  },
  downloadItemActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexShrink: 0,
  },
  filePath: {
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    wordBreak: 'break-all',
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusSmall,
    marginTop: tokens.spacingVerticalXS,
  },
});

interface FinalExportProps {
  data: ExportData;
  wizardData: WizardData;
  advancedMode: boolean;
  onChange: (data: ExportData) => void;
  onValidationChange: (validation: StepValidation) => void;
}

type ExportStatus = 'idle' | 'exporting' | 'completed' | 'error';

interface ExportResult {
  format: string;
  resolution: string;
  filePath: string;
  fileSize: number;
  fullPath?: string;
}

interface JobOutputFile {
  path?: string;
  filePath?: string;
  type?: string;
  sizeBytes?: number;
}

// Job data structure returned from the backend API
interface JobStatusData {
  /** Progress percentage (0-100) - backend may return as 'percent', 'Percent', or 'progress' */
  percent?: number;
  Percent?: number;
  progress?: number;
  /** Current execution stage (e.g., "Script", "Voice", "Rendering") */
  stage?: string;
  Stage?: string;
  /** Detailed progress message from polling endpoint */
  progressMessage?: string;
  /** Short progress message from SSE progress events (similar purpose to progressMessage) */
  message?: string;
  /** Normalized job status: queued, running, completed, failed, cancelled */
  status?: string;
  Status?: string;
  /** Error message if job failed */
  errorMessage?: string;
  ErrorMessage?: string;
  /** Legacy error field (for compatibility) */
  error?: string;
  /** Detailed failure information */
  failureDetails?: {
    message?: string;
    suggestedActions?: string[];
  };
  /** Structured output payload returned by the backend */
  output?: {
    videoPath?: string;
    subtitlePath?: string;
    path?: string;
    filePath?: string;
    files?: JobOutputFile[];
  };
  /** Path to the output file for completed jobs */
  outputPath?: string;
  OutputPath?: string;
  /** Artifacts produced by the job (video, subtitles, etc.) */
  artifacts?: Array<{
    path?: string;
    filePath?: string;
    type?: string;
    sizeBytes?: number;
  }>;
  /** Correlation ID for request tracing */
  correlationId?: string;
  /** When the job was created */
  createdAt?: string;
  /** When the job started running */
  startedAt?: string;
  /** When the job completed */
  completedAt?: string;
}

/**
 * SSE connection acknowledgment event data structure
 */
interface ConnectedEventData {
  jobId: string;
  message: string;
  timestamp: string;
  correlationId: string;
}

/**
 * Normalize a file path by trimming and returning undefined for empty values.
 */
function normalizePath(path?: string | null): string | undefined {
  const trimmed = (path ?? '').trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Returns true if the provided path looks like a video file.
 */
function hasVideoExtension(path: string): boolean {
  const lower = path.toLowerCase();
  return ['.mp4', '.webm', '.mov', '.mkv', '.avi', '.m4v', '.gif'].some((ext) =>
    lower.endsWith(ext)
  );
}

/**
 * Extract the most likely video path from a list of files or artifacts.
 */
function selectVideoFilePath(
  files?: Array<{ path?: string; filePath?: string; type?: string }>
): string | undefined {
  if (!files || !Array.isArray(files)) return undefined;

  const videoFile = files.find((file) => {
    const candidate = normalizePath(file.path ?? file.filePath);
    if (!candidate) return false;
    const type = (file.type ?? '').toLowerCase();
    return type.includes('video') || hasVideoExtension(candidate);
  });

  if (videoFile) {
    return normalizePath(videoFile.path ?? videoFile.filePath);
  }

  const firstFile = files.find((file) => normalizePath(file.path ?? file.filePath));
  return firstFile ? normalizePath(firstFile.path ?? firstFile.filePath) : undefined;
}

/**
 * Normalizes job data to handle both lowercase and capitalized field names from backend.
 * Backend may return fields as lowercase (modern) or capitalized (legacy C# naming).
 */
function normalizeJobData(jobData?: JobStatusData | null): JobStatusData | undefined {
  if (!jobData) return undefined;

  return {
    // Normalize status (lowercase or capitalized)
    status: (jobData.status ?? jobData.Status ?? '').toLowerCase(),

    // Normalize progress (percent, Percent, or progress)
    percent: jobData.progress ?? jobData.percent ?? jobData.Percent ?? 0,

    // Normalize stage
    stage: jobData.stage ?? jobData.Stage,

    // Normalize outputPath
    outputPath: jobData.outputPath ?? jobData.OutputPath,

    // Normalize error message
    errorMessage: jobData.errorMessage ?? jobData.ErrorMessage ?? jobData.error,

    // Pass through other fields as-is
    progressMessage: jobData.progressMessage,
    message: jobData.message,
    failureDetails: jobData.failureDetails,
    output: jobData.output,
    artifacts: jobData.artifacts,
    correlationId: jobData.correlationId,
    createdAt: jobData.createdAt,
    startedAt: jobData.startedAt,
    completedAt: jobData.completedAt,
  };
}

/**
 * Extracts a usable output path from job data, handling multiple backend shapes.
 */
function extractOutputPath(jobData?: JobStatusData | null): string | undefined {
  if (!jobData) return undefined;

  // Normalize data first to handle field name variations
  const normalized = normalizeJobData(jobData);
  if (!normalized) return undefined;

  // 1) Direct outputPath field (most common)
  const direct = normalizePath(normalized.outputPath);
  if (direct) return direct;

  // 2) Nested output object (used by newer backends)
  const output = normalized.output;
  const fromOutput =
    normalizePath(output?.videoPath) ??
    normalizePath(output?.path) ??
    normalizePath(output?.filePath);
  if (fromOutput) return fromOutput;

  const fromOutputFiles = selectVideoFilePath(output?.files);
  if (fromOutputFiles) return fromOutputFiles;

  // 3) Artifacts array (legacy/alternative shape)
  const fromArtifacts = selectVideoFilePath(normalized.artifacts);
  if (fromArtifacts) return fromArtifacts;

  return undefined;
}

/**
 * Formats the stage and detail message for display.
 * Reduces duplication between SSE and polling code paths.
 * Handles validation sub-messages to show specific validation steps.
 */
function formatStageMessage(stage: string, detail?: string | null, percent?: number): string {
  // Handle validation sub-messages from the Initialization/BriefValidation stage
  if ((stage === 'Initialization' || stage === 'BriefValidation') && detail) {
    // Extract and format sub-step from detail message
    if (detail.includes('FFmpeg')) return 'Validating FFmpeg installation...';
    if (detail.includes('disk space')) return 'Checking available disk space...';
    if (detail.includes('brief content')) return 'Validating brief content...';
    if (detail.includes('hardware') || detail.includes('Detecting'))
      return 'Detecting system hardware...';
    if (detail.includes('provider') || detail.includes('Provider'))
      return 'Validating provider configuration...';
    if (detail.includes('complete') || detail.includes('Complete')) return 'Validation complete';
    if (detail.includes('Starting')) return 'Starting system validation...';
  }

  if (detail) {
    return `${stage}: ${detail}`;
  }
  if (percent !== undefined) {
    return `${stage} (${Math.round(percent)}%)`;
  }
  return stage;
}

/**
 * Returns initialization message based on poll attempt count.
 * Used during initial 404 handling to show progressive status.
 */
function getInitializationMessage(pollAttempts: number): string {
  if (pollAttempts <= 5) return 'Initializing job...';
  if (pollAttempts <= 10) return 'Starting pipeline...';
  return 'Initializing rendering pipeline...';
}

/**
 * Checks if a status string represents a completed state.
 * Handles multiple status format variations.
 */
function isCompletedStatus(status?: string): boolean {
  if (!status) return false;
  const normalized = status.toLowerCase().trim();
  return normalized === 'completed' || normalized === 'done' || normalized === 'succeeded';
}

/**
 * Checks job status and throws if job failed or was cancelled.
 * Returns true if job completed successfully WITH a valid outputPath.
 *
 * ARCHITECTURAL FIX: No longer accepts "completed" status without outputPath.
 * This prevents the bug where jobs at 72% appear complete but have no output file.
 */
function checkJobCompletion(jobData: JobStatusData): boolean {
  // Normalize the job data first to handle field name variations
  const normalized = normalizeJobData(jobData);
  if (!normalized) return false;

  const status = normalized.status || '';

  // Check for failure states first
  if (status === 'failed') {
    throw new Error(normalized.errorMessage || 'Video generation failed');
  }
  if (status === 'cancelled' || status === 'canceled') {
    throw new Error('Video generation was cancelled');
  }

  // CRITICAL FIX: Only consider job completed if BOTH conditions are met:
  // 1. Status is "completed" (or variants like "done", "succeeded")
  // 2. We have a valid outputPath or artifacts
  if (isCompletedStatus(status)) {
    const hasOutput = Boolean(extractOutputPath(jobData));

    if (!hasOutput) {
      // Job says it's completed but no output - this is a backend bug
      // Don't treat as completed, let polling continue or timeout
      console.error(
        '[FinalExport] Job status is "completed" but outputPath is missing. This indicates a backend bug. Continuing to poll...'
      );
      return false; // NOT completed - missing output
    }

    return true; // Truly completed with output
  }

  // For any other status (queued, running, rendering, etc.), not yet completed
  return false;
}

// SSE connection timing constants
// CRITICAL FIX: Reduced connection timeout from 60s to 5s for faster fallback to polling
// SSE acknowledgment must be received within 5 seconds or connection is considered failed
const SSE_CONNECTION_TIMEOUT_MS = 5000; // Timeout for SSE connection establishment (5 seconds)
const JOB_TIMEOUT_MS = 10 * 60 * 1000; // Overall job timeout (10 minutes)

/**
 * Adaptive polling interval based on elapsed time and progress.
 * Reduces polling frequency as time passes to prevent resource exhaustion.
 */
const getPollingInterval = (elapsedSeconds: number, currentPercent: number): number => {
  if (currentPercent >= 95) return 1000; // Poll every second near completion
  if (elapsedSeconds < 60) return 2000; // 2 seconds for first minute
  if (elapsedSeconds < 180) return 4000; // 4 seconds for first 3 minutes
  return 8000; // 8 seconds after 3 minutes
};

const QUALITY_OPTIONS = [
  { label: 'Draft (480p)', value: 'low', bitrate: 1500 },
  { label: 'Standard (720p)', value: 'medium', bitrate: 2500 },
  { label: 'High (1080p)', value: 'high', bitrate: 5000 },
  { label: 'Ultra (4K)', value: 'ultra', bitrate: 15000 },
];

const RESOLUTION_OPTIONS = [
  { label: '480p (854x480)', value: '480p', width: 854, height: 480 },
  { label: '720p (1280x720)', value: '720p', width: 1280, height: 720 },
  { label: '1080p (1920x1080)', value: '1080p', width: 1920, height: 1080 },
  { label: '4K (3840x2160)', value: '4k', width: 3840, height: 2160 },
];

const FORMAT_OPTIONS = [
  { label: 'MP4 (H.264)', value: 'mp4', extension: '.mp4', description: 'Best compatibility' },
  { label: 'WebM (VP9)', value: 'webm', extension: '.webm', description: 'Web optimized' },
  { label: 'MOV (ProRes)', value: 'mov', extension: '.mov', description: 'Professional editing' },
];

export const FinalExport: FC<FinalExportProps> = ({
  data,
  wizardData,
  advancedMode,
  onChange,
  onValidationChange,
}) => {
  const styles = useStyles();
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle');
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStage, setExportStage] = useState('');
  const [batchExport, setBatchExport] = useState(false);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([data.format]);
  const [exportResults, setExportResults] = useState<ExportResult[]>([]);
  const [resolvedPaths, setResolvedPaths] = useState<Record<string, string>>({});
  const [saveLocation, setSaveLocation] = useState<string>('');
  const [isLoadingSaveLocation, setIsLoadingSaveLocation] = useState(true);

  // Stuck job recovery state
  const [isJobStuck, setIsJobStuck] = useState(false);
  const [stuckJobId, setStuckJobId] = useState<string | null>(null);
  const [stuckProgress, setStuckProgress] = useState<number>(0);
  const [stuckStage, setStuckStage] = useState<string>('');

  // Ref to track EventSource for SSE connection cleanup
  const eventSourceRef = useRef<EventSource | null>(null);

  // Load default save location from backend on mount
  useEffect(() => {
    const loadDefaultSaveLocation = async () => {
      setIsLoadingSaveLocation(true);
      try {
        // Try to get from portable settings first (for portable mode)
        try {
          const portableResponse = await fetch(apiUrl('/api/system/portable-status'));
          if (portableResponse.ok) {
            const portableData = await portableResponse.json();
            // If in portable mode, use dataDirectory for downloads
            if (portableData.isPortableMode && portableData.dataDirectory) {
              const downloadsPath = `${portableData.dataDirectory}/Downloads`;
              const resolved = await resolvePathOnBackend(downloadsPath);
              setSaveLocation(resolved);
              setIsLoadingSaveLocation(false);
              return;
            }
          }
        } catch {
          // Fall through to next method
        }

        // Try to get from provider paths
        try {
          const pathsResponse = await fetch(apiUrl('/api/providers/paths/load'));
          if (pathsResponse.ok) {
            const pathsData = await pathsResponse.json();
            if (pathsData.outputDirectory && pathsData.outputDirectory.trim()) {
              const resolved = await resolvePathOnBackend(pathsData.outputDirectory);
              setSaveLocation(resolved);
              setIsLoadingSaveLocation(false);
              return;
            }
          }
        } catch {
          // Fall through to default
        }

        // Fall back to frontend default and resolve it
        const defaultPath = getDefaultSaveLocation();
        const resolved = await resolvePathOnBackend(defaultPath);
        setSaveLocation(resolved);
      } catch (error) {
        console.error('Failed to load default save location:', error);
        // Use frontend default as last resort
        setSaveLocation(getDefaultSaveLocation());
      } finally {
        setIsLoadingSaveLocation(false);
      }
    };

    void loadDefaultSaveLocation();
  }, []);

  useEffect(() => {
    onValidationChange({ isValid: true, errors: [] });
  }, [onValidationChange]);

  // Cleanup SSE connection on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        console.info('[FinalExport] Cleaning up SSE connection on unmount');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  const estimatedFileSize = useMemo(() => {
    const duration = wizardData.brief.duration;
    const quality = QUALITY_OPTIONS.find((q) => q.value === data.quality);
    const bitrate = quality?.bitrate || 2500;

    const sizeKB = (bitrate * duration) / 8;
    return sizeKB / 1024;
  }, [data.quality, wizardData.brief.duration]);

  const estimatedDiskSpace = useMemo(() => {
    const formats = batchExport ? selectedFormats : [data.format];
    const baseSize = estimatedFileSize;

    return formats.reduce((total, format) => {
      const multiplier = format === 'mov' ? 3 : format === 'webm' ? 0.7 : 1;
      return total + baseSize * multiplier;
    }, 0);
  }, [batchExport, selectedFormats, data.format, estimatedFileSize]);

  const handleQualityChange = useCallback(
    (quality: string) => {
      const resolution =
        quality === 'low'
          ? '480p'
          : quality === 'medium'
            ? '720p'
            : quality === 'high'
              ? '1080p'
              : '4k';
      onChange({ ...data, quality: quality as ExportData['quality'], resolution });
    },
    [data, onChange]
  );

  const handleFormatToggle = useCallback((format: string, checked: boolean) => {
    if (checked) {
      setSelectedFormats((prev) => [...prev, format]);
    } else {
      setSelectedFormats((prev) => prev.filter((f) => f !== format));
    }
  }, []);

  // Handler to cancel a stuck job
  const handleCancelStuckJob = useCallback(async () => {
    if (!stuckJobId) return;

    try {
      console.info('[FinalExport] Cancelling stuck job:', stuckJobId);
      await fetch(apiUrl(`/api/jobs/${stuckJobId}/cancel`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      // Reset states
      setIsJobStuck(false);
      setStuckJobId(null);
      setExportStatus('error');
      setExportStage('Export cancelled due to stuck job');
    } catch (error) {
      console.error('[FinalExport] Failed to cancel stuck job:', error);
      // Still reset UI even if cancel fails
      setIsJobStuck(false);
      setStuckJobId(null);
      setExportStatus('error');
      setExportStage('Failed to cancel job. Please refresh and try again.');
    }
  }, [stuckJobId]);

  // Handler to retry from beginning
  const handleRetryExport = useCallback(() => {
    // Reset all state and restart
    setIsJobStuck(false);
    setStuckJobId(null);
    setExportStatus('idle');
    setExportProgress(0);
    setExportStage('');
    console.info('[FinalExport] Retrying export from beginning');
  }, []);

  // Handler to force complete a stuck job by checking output endpoint
  const handleForceComplete = useCallback(async () => {
    if (!stuckJobId) return;

    try {
      console.info('[FinalExport] Force completing stuck job:', stuckJobId);
      setExportStage('Checking for output file...');

      // Check if output file exists
      const outputResponse = await fetch(apiUrl(`/api/jobs/${stuckJobId}/output`), {
        headers: { Accept: 'application/json' },
      });

      if (!outputResponse.ok) {
        throw new Error('Failed to check output file');
      }

      const outputData = await outputResponse.json();

      if (!outputData.exists || !outputData.path || outputData.sizeBytes === 0) {
        setExportStage(
          'Output file not found or empty. Job may still be processing. Please wait or try canceling.'
        );
        console.warn('[FinalExport] Force complete failed: no valid output file found');
        return;
      }

      // Output exists! Complete the export
      console.info(
        '[FinalExport] Output file verified:',
        outputData.path,
        `(${outputData.sizeBytes} bytes)`
      );

      // Reset stuck state and mark as complete
      setIsJobStuck(false);
      setStuckJobId(null);
      setExportStatus('completed');
      setExportProgress(100);
      setExportStage('Video export complete!');

      // Update results with the verified output
      const resolvedPath = await resolvePathOnBackend(outputData.path);
      const lastSeparatorIndex = Math.max(
        resolvedPath.lastIndexOf('/'),
        resolvedPath.lastIndexOf('\\')
      );
      const resolvedFolder =
        lastSeparatorIndex >= 0 ? resolvedPath.substring(0, lastSeparatorIndex) : resolvedPath;
      const fileName =
        lastSeparatorIndex >= 0 ? resolvedPath.substring(lastSeparatorIndex + 1) : outputData.path;

      setExportResults([
        {
          format: data.format,
          filePath: resolvedPath,
          fileName: fileName,
          fileSize: outputData.sizeBytes,
        },
      ]);
      setResolvedPaths({ [data.format]: resolvedFolder });

      console.info('[FinalExport] Force complete successful, job marked as completed');
    } catch (error) {
      console.error('[FinalExport] Failed to force complete:', error);
      setExportStage('Failed to verify output file. Please try canceling and retrying.');
    }
  }, [stuckJobId, data.format]);

  // eslint-disable-next-line sonarjs/cognitive-complexity
  const startExport = useCallback(async () => {
    // Reset stuck state when starting new export
    setIsJobStuck(false);
    setStuckJobId(null);

    setExportStatus('exporting');
    setExportProgress(0);
    setExportResults([]);
    setResolvedPaths({});

    // Signal to ResourceMonitor that export is active (for polling throttling)
    sessionStorage.setItem('active-export-job', 'true');

    try {
      const formatsToExport = batchExport ? selectedFormats : [data.format];
      const newExportResults: ExportResult[] = [];

      for (let i = 0; i < formatsToExport.length; i++) {
        const format = formatsToExport[i];
        console.info('[FinalExport] Starting export for format:', format);
        setExportStage(`Preparing export for ${format.toUpperCase()} format...`);

        // Map quality to video bitrate
        const qualityBitrateMap: Record<string, number> = {
          low: 1500,
          medium: 2500,
          high: 5000,
          ultra: 15000,
        };

        // Map resolution string to backend format
        const resolutionMap: Record<string, string> = {
          '480p': '480p',
          '720p': '720p',
          '1080p': '1080p',
          '4k': '4K',
        };

        // Map format to container
        const formatContainerMap: Record<string, string> = {
          mp4: 'mp4',
          webm: 'webm',
          mov: 'mov',
        };

        // Map quality to codec
        const qualityCodecMap: Record<string, string> = {
          low: 'h264',
          medium: 'h264',
          high: 'h264',
          ultra: 'h265',
        };

        try {
          // ✅ REAL API CALL - Start video generation
          const { jobId } = await startFinalRendering(
            {
              topic: wizardData.brief.topic,
              audience: wizardData.brief.targetAudience || 'General',
              goal: wizardData.brief.keyMessage || 'Inform',
              tone: wizardData.style.tone || 'Professional',
              language: 'English', // Default, could be extracted from wizardData if available
              duration: wizardData.brief.duration,
              videoType: wizardData.brief.videoType || 'educational',
            },
            {
              voiceProvider: wizardData.style.voiceProvider || 'Windows',
              voiceName: wizardData.style.voiceName || 'default',
              visualStyle: wizardData.style.visualStyle || 'modern',
              musicGenre: wizardData.style.musicGenre || 'none',
              musicEnabled: wizardData.style.musicEnabled || false,
            },
            {
              generatedScript: wizardData.script.content || '',
              scenes: wizardData.script.scenes || [],
              totalDuration: wizardData.brief.duration,
            },
            {
              resolution: resolutionMap[data.resolution] || '1080p',
              fps: 30, // Default FPS
              codec: qualityCodecMap[data.quality] || 'h264',
              quality: qualityBitrateMap[data.quality] || 5000,
              includeSubs: data.includeCaptions,
              outputFormat: formatContainerMap[format] || 'mp4',
            }
          );

          // Provide initial feedback
          console.info('[FinalExport] Job submitted, connecting to SSE for real-time updates...');
          console.info('[FinalExport] Job ID received:', jobId);
          setExportStage('Starting video generation...');
          setExportProgress(1); // Show some progress so user knows something is happening

          // ARCHITECTURAL FIX: Connect to SSE immediately (removed 2-second delay)
          // The backend SSE endpoint now handles jobs that haven't started yet
          console.info('[FinalExport] Connecting to SSE immediately (no registration delay)');
          setExportStage('Connecting to job progress stream...');

          // Use SSE for real-time progress updates with polling fallback
          let jobData: JobStatusData | null = null;

          const ssePromise = new Promise<JobStatusData>((resolve, reject) => {
            // CRITICAL FIX: Use /events endpoint for consistency with backend SSE implementation
            const sseUrl = apiUrl(`/api/jobs/${jobId}/events`);
            console.info('[FinalExport] Connecting to SSE:', sseUrl);

            const eventSource = new EventSource(sseUrl);
            eventSourceRef.current = eventSource;

            // Track current format index for overall progress calculation
            const formatIndex = i;
            const totalFormats = formatsToExport.length;

            // Track whether we've received any progress updates (connection established)
            let connectionEstablished = false;

            // Connection establishment timeout - verify SSE acknowledgment within 5 seconds
            const connectionTimeoutId = setTimeout(() => {
              if (!connectionEstablished && eventSource.readyState !== EventSource.CLOSED) {
                console.warn(
                  `[FinalExport] SSE acknowledgment not received within ${SSE_CONNECTION_TIMEOUT_MS / 1000}s, falling back to polling`
                );
                eventSource.close();
                eventSourceRef.current = null;
                // Fall back to polling instead of rejecting
                fallbackToPolling(jobId, formatIndex, totalFormats).then(resolve).catch(reject);
              }
            }, SSE_CONNECTION_TIMEOUT_MS);

            // Overall job timeout
            const jobTimeoutId = setTimeout(() => {
              if (eventSource.readyState !== EventSource.CLOSED) {
                console.warn(
                  `[FinalExport] SSE connection timed out after ${JOB_TIMEOUT_MS / 60000} minutes`
                );
                eventSource.close();
                eventSourceRef.current = null;
                reject(
                  new Error(`Video generation timed out after ${JOB_TIMEOUT_MS / 60000} minutes`)
                );
              }
            }, JOB_TIMEOUT_MS);

            // Handle immediate connection acknowledgment from backend
            eventSource.addEventListener('connected', (event) => {
              try {
                if (!connectionEstablished) {
                  connectionEstablished = true;
                  clearTimeout(connectionTimeoutId);
                  const data = JSON.parse(event.data) as ConnectedEventData;
                  console.info(
                    '[FinalExport] SSE connection acknowledged by backend:',
                    data.message || 'Connected'
                  );
                }
              } catch (err) {
                console.warn(
                  '[FinalExport] Failed to parse connected event. Raw data:',
                  event.data,
                  'Error:',
                  err
                );
              }
            });

            eventSource.addEventListener('job-progress', (event) => {
              try {
                // Mark connection as established once we receive progress (fallback if connected event missed)
                if (!connectionEstablished) {
                  connectionEstablished = true;
                  clearTimeout(connectionTimeoutId);
                  console.info('[SSE] Connection established - receiving progress updates');
                }

                const data = JSON.parse(event.data) as JobStatusData;
                const jobProgress = data.percent || 0;
                const overallProgress = (formatIndex * 100 + jobProgress) / totalFormats;

                console.log(`[DIAGNOSTIC] [${new Date().toISOString()}] SSE progress event received:`, {
                  status: data.status,
                  percent: jobProgress,
                  stage: data.stage,
                  outputPath: data.outputPath
                });

                setExportProgress(overallProgress);
                setExportStage(
                  formatStageMessage(data.stage || 'Processing...', data.message, jobProgress)
                );

                console.info('[SSE] Progress update:', jobProgress, '%', data.stage);

                // Check if job appears completed even if status isn't "completed"
                // This handles edge cases where job finished but status wasn't updated
                const status = (data.status || '').toLowerCase();
                const hasOutput = Boolean(extractOutputPath(data));

                if ((jobProgress >= 100 || hasOutput) && status === 'running') {
                  console.warn(
                    '[SSE] Job appears completed (has output or 100%) but status is still "running", checking completion...'
                  );
                  // Don't auto-resolve here, wait for job-completed event or let polling handle it
                }
              } catch (err) {
                console.warn('[SSE] Failed to parse progress event:', err);
              }
            });

            eventSource.addEventListener('job-completed', (event) => {
              clearTimeout(connectionTimeoutId);
              clearTimeout(jobTimeoutId);
              try {
                const data = JSON.parse(event.data) as JobStatusData;
                
                console.log(`[DIAGNOSTIC] [${new Date().toISOString()}] SSE job-completed event received:`, {
                  status: data.status,
                  percent: data.percent,
                  stage: data.stage,
                  outputPath: data.outputPath
                });
                
                console.info('[SSE] Job completed:', data);
                eventSource.close();
                eventSourceRef.current = null;

                // Check for failure status
                const status = data.status?.toLowerCase() || '';
                if (status === 'failed') {
                  const errorMsg = data.errorMessage || 'Video generation failed';
                  reject(new Error(errorMsg));
                } else if (status === 'cancelled' || status === 'canceled') {
                  reject(new Error('Video generation was cancelled'));
                } else {
                  // Even if status isn't "completed", check if we have output
                  const hasOutput = Boolean(extractOutputPath(data));
                  if (!hasOutput && status !== 'completed') {
                    console.warn(
                      '[SSE] Job completion event received but no output path and status is not completed'
                    );
                  }
                  resolve(data);
                }
              } catch (err) {
                eventSource.close();
                eventSourceRef.current = null;
                reject(err instanceof Error ? err : new Error(String(err)));
              }
            });

            // Handle job-failed SSE event (emitted when job stalls or fails)
            eventSource.addEventListener('job-failed', (event) => {
              clearTimeout(connectionTimeoutId);
              clearTimeout(jobTimeoutId);
              try {
                const data = JSON.parse(event.data) as JobStatusData;
                console.error('[SSE] Job failed:', data);
                eventSource.close();
                eventSourceRef.current = null;

                const errorMsg =
                  data.errorMessage || data.failureDetails?.message || 'Video generation failed';
                setExportStatus('error');
                setExportStage(errorMsg);
                reject(new Error(errorMsg));
              } catch (err) {
                eventSource.close();
                eventSourceRef.current = null;
                reject(err instanceof Error ? err : new Error(String(err)));
              }
            });

            // Handle warning SSE event (emitted when job appears stalled)
            eventSource.addEventListener('warning', (event) => {
              try {
                const data = JSON.parse(event.data);
                console.warn('[SSE] Job warning:', data.message || 'Job progress stalled');
                // Update UI to show warning but don't reject the promise
                setExportStage(
                  `Warning: ${data.message || 'Job progress appears stalled. Consider cancelling if this persists.'}`
                );
              } catch (err) {
                console.warn('[SSE] Failed to parse warning event:', err);
              }
            });

            // Handle backend error event (when job not found initially)
            eventSource.addEventListener('error', (event: Event) => {
              // This is the EventSource built-in error (connection issues)
              // Check if this is just the connection closing normally
              if (eventSource.readyState === EventSource.CLOSED) {
                console.info('[SSE] Connection closed, checking if job completed...');

                // If connection closed, check if job might have completed
                // by doing a quick status check before falling back to polling
                fetch(apiUrl(`/api/jobs/${jobId}`), {
                  headers: { Accept: 'application/json' },
                })
                  .then(async (response) => {
                    if (response.ok) {
                      const jobData = (await response.json()) as JobStatusData;

                      // Check job completion - this may throw if job failed/cancelled
                      // We need to catch those errors separately from network errors
                      try {
                        if (checkJobCompletion(jobData)) {
                          console.info('[SSE] Job completed while connection was closing');
                          clearTimeout(connectionTimeoutId);
                          clearTimeout(jobTimeoutId);
                          eventSource.close();
                          eventSourceRef.current = null;
                          resolve(jobData);
                          return;
                        }
                      } catch (completionError) {
                        // Job failed or was cancelled - reject immediately with the actual error
                        // Don't fall back to polling for job failures
                        console.error('[SSE] Job failed or cancelled:', completionError);
                        clearTimeout(connectionTimeoutId);
                        clearTimeout(jobTimeoutId);
                        eventSource.close();
                        eventSourceRef.current = null;
                        reject(completionError);
                        return;
                      }
                    }
                    // If not completed and not failed, fall back to polling
                    console.error(
                      '[SSE] Connection closed but job not completed, falling back to polling'
                    );
                    clearTimeout(connectionTimeoutId);
                    clearTimeout(jobTimeoutId);
                    eventSource.close();
                    eventSourceRef.current = null;
                    fallbackToPolling(jobId, formatIndex, totalFormats).then(resolve).catch(reject);
                  })
                  .catch((networkError) => {
                    // Only fall back to polling for actual network/connection errors
                    // Not for job failures (those are handled above)
                    console.error('[SSE] Network error, falling back to polling:', networkError);
                    clearTimeout(connectionTimeoutId);
                    clearTimeout(jobTimeoutId);
                    eventSource.close();
                    eventSourceRef.current = null;
                    fallbackToPolling(jobId, formatIndex, totalFormats).then(resolve).catch(reject);
                  });
                return;
              }

              console.error('[SSE] Connection error, falling back to polling:', event);
              clearTimeout(connectionTimeoutId);
              clearTimeout(jobTimeoutId);
              eventSource.close();
              eventSourceRef.current = null;

              // Fall back to polling if SSE fails
              fallbackToPolling(jobId, formatIndex, totalFormats).then(resolve).catch(reject);
            });

            eventSource.onopen = () => {
              console.info('[SSE] Connection opened for job:', jobId);
              if (!connectionEstablished) {
                connectionEstablished = true;
                clearTimeout(connectionTimeoutId);
                console.info('[SSE] Connection acknowledged (onopen) - cleared connection timeout');
              }
              setExportStage('Connected - waiting for progress updates...');
            };
          });

          // Fallback polling function for when SSE fails
          // ARCHITECTURAL FIX: Implemented exponential backoff for more efficient polling
          const fallbackToPolling = async (
            pollJobId: string,
            formatIdx: number,
            totalFmts: number
            // eslint-disable-next-line sonarjs/cognitive-complexity
          ): Promise<JobStatusData> => {
            console.info('[FinalExport] Falling back to polling for job:', pollJobId);
            setExportStage('Polling for progress updates...');

            let jobCompleted = false;
            let lastJobData: JobStatusData | null = null;
            const maxPollAttempts = 600; // 10 minutes max
            let pollAttempts = 0;
            let consecutiveErrors = 0;
            let total404Errors = 0;
            const maxConsecutiveErrors = 5;

            // Exponential backoff configuration
            let pollDelay = 500; // Start with 500ms
            const maxPollDelay = 5000; // Cap at 5 seconds
            const backoffMultiplier = 1.5;

            // Stuck job detection: track if progress/stage hasn't changed
            let lastProgress = -1;
            let lastStage = '';
            let stuckStartTime: number | null = null;
            const STUCK_CHECK_INTERVAL = 5; // Check every 5 polls

            // Stage-aware stuck detection thresholds (in milliseconds)
            // Progressive thresholds based on progress percentage to prevent false positives
            // during FFmpeg finalization which can take significant time at high percentages
            const getStuckThreshold = (progress: number): number => {
              if (progress < 50) return 180 * 1000; // 3 minutes for early stages (0-50%)
              if (progress < 70) return 240 * 1000; // 4 minutes for mid stages (50-70%)
              if (progress < 90) return 300 * 1000; // 5 minutes for encoding (70-90%)
              return 600 * 1000; // 10 minutes for finalization (90-100%) - muxing and flushing can be slow
            };

            while (!jobCompleted && pollAttempts < maxPollAttempts) {
              // EXPONENTIAL BACKOFF: Increase delay between polls
              await new Promise((res) => setTimeout(res, pollDelay));
              pollAttempts++;

              try {
                console.log(`[DIAGNOSTIC] [${new Date().toISOString()}] Polling job status:`, pollJobId);
                
                const statusResponse = await fetch(apiUrl(`/api/jobs/${pollJobId}`), {
                  headers: { Accept: 'application/json' },
                });

                if (!statusResponse.ok) {
                  consecutiveErrors++;

                  // Handle 404 specifically - job may not be created yet
                  if (statusResponse.status === 404) {
                    total404Errors++;
                    // Only fail after sustained 404s and enough time has passed
                    if (pollAttempts > 15 && total404Errors > 10) {
                      throw new Error(
                        'Video generation job not found. The job may not have been created correctly.'
                      );
                    }
                    setExportStage(getInitializationMessage(pollAttempts));
                    continue;
                  }

                  // Other HTTP errors
                  if (consecutiveErrors >= maxConsecutiveErrors) {
                    throw new Error(`Failed to fetch job status: ${statusResponse.statusText}`);
                  }
                  continue;
                }

                // Success - reset consecutive error counter
                consecutiveErrors = 0;

                const typedJobData = (await statusResponse.json()) as JobStatusData;
                lastJobData = typedJobData;
                
                console.log(`[DIAGNOSTIC] [${new Date().toISOString()}] Polling response:`, {
                  status: typedJobData.status,
                  percent: typedJobData.percent,
                  stage: typedJobData.stage,
                  outputPath: typedJobData.outputPath
                });

                // Normalize data to handle field name variations (lowercase vs capitalized)
                const normalized = normalizeJobData(typedJobData);
                if (!normalized) continue;

                const normalizedStatus = normalized.status || '';
                if (normalizedStatus === 'failed') {
                  throw new Error(
                    normalized.errorMessage ||
                      normalized.failureDetails?.message ||
                      'Video generation failed'
                  );
                }
                if (normalizedStatus === 'cancelled' || normalizedStatus === 'canceled') {
                  throw new Error('Video generation was cancelled');
                }

                // Extract progress with proper fallbacks and update UI
                const jobProgress = Math.max(0, Math.min(100, normalized.percent ?? 0));
                const currentStage = normalized.stage || 'Processing';

                // EXPONENTIAL BACKOFF: Adjust poll delay based on job activity
                if (jobProgress === lastProgress && currentStage === lastStage) {
                  // No progress - increase delay (backoff)
                  pollDelay = Math.min(pollDelay * backoffMultiplier, maxPollDelay);
                } else {
                  // Progress detected - reset to faster polling
                  pollDelay = 500;
                }

                // Check for stuck job (same progress/stage for too long) with stage-aware thresholds
                if (pollAttempts % STUCK_CHECK_INTERVAL === 0) {
                  if (
                    jobProgress === lastProgress &&
                    currentStage === lastStage &&
                    lastProgress >= 0
                  ) {
                    if (stuckStartTime === null) {
                      stuckStartTime = Date.now();
                    } else {
                      const stuckDuration = Date.now() - stuckStartTime;
                      const stuckThreshold = getStuckThreshold(jobProgress);

                      if (stuckDuration >= stuckThreshold) {
                        const stuckReason =
                          jobProgress < 50
                            ? 'Initialization taking longer than expected'
                            : jobProgress < 90
                              ? 'Encoding appears to have stalled'
                              : 'Finalizing output - this may take a moment';

                        console.warn(
                          `[FinalExport] Job appears stuck: ${currentStage} at ${jobProgress}% for ${Math.round(stuckDuration / 1000)}s (threshold: ${stuckThreshold / 1000}s)`
                        );

                        const hasOutput = Boolean(extractOutputPath(typedJobData));

                        if (hasOutput) {
                          console.info(
                            '[FinalExport] Job produced output while progress appears stuck, treating as completed'
                          );
                          jobCompleted = true;
                          break;
                        }

                        // FALLBACK COMPLETION DETECTION: Check /output endpoint to see if file exists
                        // This handles the case where the job completes on backend but progress stops updating
                        if (jobProgress >= 95) {
                          try {
                            console.info(
                              '[FinalExport] Job stuck at >=95%, checking output endpoint for completion'
                            );
                            const outputCheckResponse = await fetch(
                              apiUrl(`/api/jobs/${pollJobId}/output`),
                              { headers: { Accept: 'application/json' } }
                            );
                            
                            if (outputCheckResponse.ok) {
                              const outputData = await outputCheckResponse.json();
                              if (outputData.exists && outputData.path && outputData.sizeBytes > 0) {
                                console.info(
                                  '[FinalExport] Output file verified via /output endpoint:',
                                  outputData.path,
                                  `(${outputData.sizeBytes} bytes) - treating as completed`
                                );
                                
                                // Update lastJobData with the verified output path
                                lastJobData = {
                                  ...typedJobData,
                                  status: 'completed',
                                  percent: 100,
                                  outputPath: outputData.path,
                                  stage: 'Complete',
                                };
                                
                                jobCompleted = true;
                                break;
                              }
                            }
                          } catch (outputCheckError) {
                            console.warn(
                              '[FinalExport] Failed to check output endpoint:',
                              outputCheckError
                            );
                            // Continue with normal stuck detection flow
                          }
                        }

                        // Near-complete jobs can linger while the renderer writes the file.
                        // Instead of failing early, give more time but signal stuck state to UI
                        if (jobProgress >= 70) {
                          console.info(
                            '[FinalExport] Job is past 70% but no output yet; flagging as stuck and continuing to poll'
                          );
                          setExportStage(stuckReason);

                          // Set stuck state so UI can show recovery options
                          setIsJobStuck(true);
                          setStuckJobId(pollJobId);
                          setStuckProgress(jobProgress);
                          setStuckStage(currentStage);

                          stuckStartTime = Date.now(); // Give additional time before re-checking
                          pollDelay = Math.min(pollDelay * backoffMultiplier, maxPollDelay);
                          continue;
                        }

                        throw new Error(
                          `${stuckReason}. Job at ${currentStage} stage (${jobProgress}% complete for over ${Math.round(stuckThreshold / 1000)} seconds). ` +
                            'The job may have encountered an issue. Please try again or check the logs.'
                        );
                      }
                    }
                  } else {
                    stuckStartTime = null; // Reset if progress changed
                    // Clear stuck state if progress resumed
                    if (isJobStuck) {
                      setIsJobStuck(false);
                      setStuckJobId(null);
                    }
                  }
                }

                lastProgress = jobProgress;
                lastStage = currentStage;

                setExportProgress((formatIdx * 100 + jobProgress) / totalFmts);
                setExportStage(
                  formatStageMessage(currentStage, typedJobData.progressMessage, jobProgress)
                );

                // Check completion status using helper
                if (checkJobCompletion(typedJobData)) {
                  jobCompleted = true;
                  console.info('[FinalExport] Job completed successfully');
                }
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);

                // Fast-fail on terminal job errors (failed/cancelled/stuck)
                if (
                  errorMessage.toLowerCase().includes('failed') ||
                  errorMessage.toLowerCase().includes('cancel') ||
                  errorMessage.toLowerCase().includes('stuck')
                ) {
                  throw error;
                }

                consecutiveErrors++;
                if (consecutiveErrors >= maxConsecutiveErrors) {
                  throw error;
                }
              }
            }

            if (!jobCompleted || !lastJobData) {
              throw new Error('Video generation timed out after 10 minutes');
            }

            return lastJobData;
          };

          jobData = await ssePromise;

          // Get typed job data for output extraction (reuse JobStatusData interface)
          const finalJobData = jobData as JobStatusData;

          // Get file path from job artifacts or output path
          const outputPath = extractOutputPath(finalJobData);

          // If still no output path, surface a clear error
          if (!outputPath) {
            console.error('[FinalExport] Job data:', JSON.stringify(finalJobData, null, 2));
            throw new Error(
              'Video generation completed but output path not returned. ' +
                'Check backend logs for the actual file location. ' +
                'Job ID: ' +
                jobId
            );
          }

          console.info('[FinalExport] Video generation completed, output path:', outputPath);

          // Resolve path for display
          const resolvedPath = await resolvePathOnBackend(outputPath);
          const lastSeparatorIndex = Math.max(
            resolvedPath.lastIndexOf('/'),
            resolvedPath.lastIndexOf('\\')
          );
          const resolvedFolder =
            lastSeparatorIndex >= 0 ? resolvedPath.substring(0, lastSeparatorIndex) : resolvedPath;
          const fileName =
            lastSeparatorIndex >= 0 ? resolvedPath.substring(lastSeparatorIndex + 1) : outputPath;

          // ✅ REAL FILE SIZE - Get from file system
          let actualFileSize = 0;
          try {
            const fileStatResponse = await fetch(
              apiUrl(`/api/files/stat?path=${encodeURIComponent(resolvedPath)}`)
            );
            if (fileStatResponse.ok) {
              const statData = await fileStatResponse.json();
              actualFileSize = statData.size || 0;
            }
          } catch (error) {
            console.warn('[FinalExport] Could not get file size:', error);
            // Fallback to estimate
            actualFileSize = Math.round(estimatedFileSize * 1024 * 1024);
          }

          // If we still don't have a file size, use estimate
          if (actualFileSize === 0) {
            const formatMultiplier = format === 'mov' ? 3 : format === 'webm' ? 0.7 : 1;
            actualFileSize = Math.round(estimatedFileSize * 1024 * 1024 * formatMultiplier);
          }

          const result: ExportResult = {
            format: format.toUpperCase(),
            resolution: data.resolution,
            filePath: fileName,
            fullPath: resolvedPath,
            fileSize: actualFileSize,
          };

          newExportResults.push(result);
          setResolvedPaths((prev) => ({
            ...prev,
            [resolvedPath]: resolvedFolder,
          }));
        } catch (error) {
          console.error(`[FinalExport] Export failed for format ${format}:`, error);
          throw error; // Re-throw to be caught by outer try-catch
        }
      }

      setExportResults(newExportResults);
      setExportProgress(100);
      setExportStatus('completed');
      setExportStage('Export completed successfully!');
    } catch (error) {
      console.error('[FinalExport] Export failed:', error);
      setExportStatus('error');
      setExportStage(error instanceof Error ? error.message : 'Export failed. Please try again.');
    } finally {
      // Clear export flag to allow ResourceMonitor to resume normal polling
      sessionStorage.removeItem('active-export-job');
    }
  }, [batchExport, selectedFormats, data, wizardData, estimatedFileSize]);

  const cancelExport = useCallback(() => {
    // Close SSE connection if active
    if (eventSourceRef.current) {
      console.info('[FinalExport] Closing SSE connection on cancel');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Clear export flag to allow ResourceMonitor to resume normal polling
    sessionStorage.removeItem('active-export-job');

    setExportStatus('idle');
    setExportProgress(0);
    setExportStage('');
  }, []);

  const handleBrowseSaveLocation = useCallback(async () => {
    try {
      const selectedPath = await pickFolder();
      if (selectedPath) {
        setSaveLocation(selectedPath);
      }
    } catch (error) {
      console.error('Failed to pick folder:', error);
    }
  }, []);

  const handleOpenFile = useCallback(
    async (filePath: string, fullPath?: string) => {
      try {
        let pathToOpen = fullPath || filePath;
        if (!pathToOpen) {
          console.warn('No file path provided');
          return;
        }

        // If path contains environment variables, resolve it
        if (pathToOpen.includes('%') || pathToOpen.includes('~')) {
          pathToOpen = await resolvePathOnBackend(pathToOpen);
        }

        const success = await openFile(pathToOpen);
        if (!success) {
          console.warn('Failed to open file, trying folder instead');
          // Try to open the folder containing the file
          const folderPath =
            resolvedPaths[pathToOpen] ||
            pathToOpen.substring(
              0,
              Math.max(pathToOpen.lastIndexOf('/'), pathToOpen.lastIndexOf('\\'))
            );
          if (folderPath) {
            await openFolder(folderPath);
          }
        }
      } catch (error) {
        console.error('Failed to open file:', error);
      }
    },
    [resolvedPaths]
  );

  const handleOpenFolder = useCallback(
    async (filePath: string, fullPath?: string) => {
      try {
        let pathToOpen = fullPath || filePath;
        if (!pathToOpen) {
          console.warn('No file path provided');
          return;
        }

        // If path contains environment variables, resolve it
        if (pathToOpen.includes('%') || pathToOpen.includes('~')) {
          pathToOpen = await resolvePathOnBackend(pathToOpen);
        }

        // Get the folder path - either from resolved paths or extract from file path
        let folderPath = resolvedPaths[pathToOpen];
        if (!folderPath) {
          // Extract directory from file path
          const lastSlash = Math.max(pathToOpen.lastIndexOf('/'), pathToOpen.lastIndexOf('\\'));
          if (lastSlash >= 0) {
            folderPath = pathToOpen.substring(0, lastSlash);
          } else {
            folderPath = pathToOpen; // Assume it's already a folder
          }
        }

        if (folderPath) {
          // Resolve folder path if it contains environment variables
          if (folderPath.includes('%') || folderPath.includes('~')) {
            folderPath = await resolvePathOnBackend(folderPath);
          }
          await openFolder(folderPath);
        } else {
          console.warn('Could not determine folder path');
        }
      } catch (error) {
        console.error('Failed to open folder:', error);
      }
    },
    [resolvedPaths]
  );

  const renderSettingsView = () => (
    <div className={styles.container}>
      <div className={styles.settingsGrid}>
        <Card className={styles.settingsCard}>
          <Field label="Quality Preset">
            <RadioGroup
              value={data.quality}
              onChange={(_, { value }) => handleQualityChange(value)}
            >
              {QUALITY_OPTIONS.map((option) => (
                <Radio
                  key={option.value}
                  value={option.value}
                  label={
                    <div>
                      <Text weight="semibold">{option.label}</Text>
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                        ~{option.bitrate} kbps
                      </Text>
                    </div>
                  }
                />
              ))}
            </RadioGroup>
          </Field>
        </Card>

        <Card className={styles.settingsCard}>
          <Field label="Resolution">
            <Dropdown
              value={data.resolution}
              selectedOptions={[data.resolution]}
              onOptionSelect={(_, { optionValue }) => {
                if (optionValue) {
                  onChange({ ...data, resolution: optionValue as ExportData['resolution'] });
                }
              }}
            >
              {RESOLUTION_OPTIONS.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Dropdown>
          </Field>

          <Field label="Output Format" style={{ marginTop: tokens.spacingVerticalL }}>
            <Dropdown
              value={data.format}
              selectedOptions={[data.format]}
              onOptionSelect={(_, { optionValue }) => {
                if (optionValue) {
                  onChange({ ...data, format: optionValue as ExportData['format'] });
                  setSelectedFormats([optionValue]);
                }
              }}
              disabled={batchExport}
            >
              {FORMAT_OPTIONS.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Dropdown>
          </Field>
        </Card>
      </div>

      <Card className={styles.settingsCard}>
        <Checkbox
          label="Include captions/subtitles"
          checked={data.includeCaptions}
          onChange={(_, { checked }) => onChange({ ...data, includeCaptions: !!checked })}
        />
      </Card>

      <Card className={styles.settingsCard}>
        <Field label="Save Location">
          {isLoadingSaveLocation ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
              <Spinner size="small" />
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                Loading default save location...
              </Text>
            </div>
          ) : (
            <>
              <div
                style={{ display: 'flex', gap: tokens.spacingHorizontalS, alignItems: 'center' }}
              >
                <Text
                  style={{
                    flex: 1,
                    padding: tokens.spacingVerticalS,
                    backgroundColor: tokens.colorNeutralBackground2,
                    borderRadius: tokens.borderRadiusSmall,
                    fontFamily: 'monospace',
                    fontSize: tokens.fontSizeBase200,
                    wordBreak: 'break-all',
                  }}
                >
                  {saveLocation || 'Default location will be used'}
                </Text>
                <Button
                  appearance="secondary"
                  icon={<Folder24Regular />}
                  onClick={handleBrowseSaveLocation}
                >
                  Browse
                </Button>
              </div>
              <Text
                size={200}
                style={{
                  marginTop: tokens.spacingVerticalXS,
                  color: tokens.colorNeutralForeground3,
                }}
              >
                Choose where to save your exported video file
              </Text>
            </>
          )}
        </Field>
      </Card>

      {advancedMode && (
        <Card style={{ padding: tokens.spacingVerticalL, marginTop: tokens.spacingVerticalL }}>
          <Title3 style={{ marginBottom: tokens.spacingVerticalM }}>Advanced Export Options</Title3>
          <div className={styles.batchExportSection}>
            <Title3
              style={{ marginBottom: tokens.spacingVerticalM, fontSize: tokens.fontSizeBase400 }}
            >
              Batch Export
            </Title3>
            <Checkbox
              label="Export to multiple formats"
              checked={batchExport}
              onChange={(_, { checked }) => setBatchExport(!!checked)}
            />

            {batchExport && (
              <div className={styles.formatCheckboxes}>
                {FORMAT_OPTIONS.map((option) => (
                  <div key={option.value}>
                    <Checkbox
                      label={option.label}
                      checked={selectedFormats.includes(option.value)}
                      onChange={(_, { checked }) => handleFormatToggle(option.value, !!checked)}
                    />
                    <Text size={200} style={{ marginLeft: tokens.spacingHorizontalXL }}>
                      {option.description}
                    </Text>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      <div className={styles.estimateCard}>
        <div className={styles.estimateRow}>
          <Text weight="semibold">Estimated File Size:</Text>
          <Text weight="bold">{estimatedFileSize.toFixed(1)} MB</Text>
        </div>

        {batchExport && (
          <div className={styles.estimateRow}>
            <Text weight="semibold">Total Disk Space Required:</Text>
            <Text weight="bold">{estimatedDiskSpace.toFixed(1)} MB</Text>
          </div>
        )}

        <div className={styles.estimateRow}>
          <Text weight="semibold">Estimated Export Time:</Text>
          <Text weight="bold">~{Math.ceil((wizardData.brief.duration / 60) * 2)} minutes</Text>
        </div>

        <Tooltip
          content="Estimates are based on your selected quality and duration settings"
          relationship="label"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS }}>
            <Info24Regular style={{ fontSize: '16px' }} />
            <Text size={200}>These are estimates and may vary</Text>
          </div>
        </Tooltip>
      </div>

      <div className={styles.exportActions}>
        <Button appearance="primary" size="large" onClick={startExport}>
          Start Export
        </Button>
      </div>
    </div>
  );

  const renderExportingView = () => (
    <div className={styles.exportProgress}>
      <Spinner size="extra-large" />
      <Title3>Exporting Video...</Title3>
      <Text>{exportStage}</Text>
      <div style={{ width: '100%', maxWidth: '500px' }}>
        <ProgressBar value={exportProgress / 100} />
        <Text size={200} style={{ marginTop: tokens.spacingVerticalS }}>
          {Math.round(exportProgress)}% complete
        </Text>
      </div>

      {isJobStuck && (
        <Card
          style={{
            padding: tokens.spacingVerticalL,
            backgroundColor: tokens.colorPaletteYellowBackground2,
            border: `1px solid ${tokens.colorPaletteYellowBorder1}`,
            marginTop: tokens.spacingVerticalL,
            width: '100%',
            maxWidth: '500px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: tokens.spacingHorizontalM,
            }}
          >
            <ErrorCircle24Regular
              style={{ fontSize: '24px', color: tokens.colorPaletteYellowForeground1 }}
            />
            <div style={{ flex: 1 }}>
              <Title3 style={{ color: tokens.colorPaletteYellowForeground1 }}>
                Export Appears Stuck
              </Title3>
              <Text style={{ marginTop: tokens.spacingVerticalS }}>
                The video export is stuck at {stuckProgress}% in the &quot;{stuckStage}&quot; stage.
                {stuckProgress >= 95 && (
                  <> The video may have finished rendering. Try &quot;Force Complete&quot; to verify the output file exists.</>
                )}
                {stuckProgress < 95 && (
                  <> You can continue waiting, retry from the beginning, or cancel.</>
                )}
              </Text>
              <div
                style={{
                  display: 'flex',
                  gap: tokens.spacingHorizontalM,
                  marginTop: tokens.spacingVerticalL,
                  flexWrap: 'wrap',
                }}
              >
                {stuckProgress >= 95 && (
                  <Tooltip
                    content="Check if output file exists and complete the job if video was successfully rendered"
                    relationship="label"
                  >
                    <Button
                      appearance="primary"
                      icon={<CheckmarkCircle24Regular />}
                      onClick={handleForceComplete}
                    >
                      Force Complete
                    </Button>
                  </Tooltip>
                )}
                <Tooltip
                  content="Start the export process over from the beginning"
                  relationship="label"
                >
                  <Button
                    appearance={stuckProgress >= 95 ? 'secondary' : 'primary'}
                    icon={<ArrowClockwise24Regular />}
                    onClick={handleRetryExport}
                  >
                    Retry Export
                  </Button>
                </Tooltip>
                <Tooltip content="Cancel the stuck job and return to settings" relationship="label">
                  <Button
                    appearance="secondary"
                    icon={<Dismiss24Regular />}
                    onClick={handleCancelStuckJob}
                  >
                    Cancel Job
                  </Button>
                </Tooltip>
              </div>
            </div>
          </div>
        </Card>
      )}

      {!isJobStuck && (
        <Button appearance="secondary" icon={<Dismiss24Regular />} onClick={cancelExport}>
          Cancel Export
        </Button>
      )}
    </div>
  );

  const renderCompletedView = () => (
    <div className={styles.completedSection}>
      <CheckmarkCircle24Regular
        style={{ fontSize: '64px', color: tokens.colorPaletteGreenForeground1 }}
      />
      <Title2>Export Completed!</Title2>
      <Text style={{ marginBottom: tokens.spacingVerticalL }}>
        Your video has been successfully exported and saved to your computer.
      </Text>

      <div className={styles.downloadList}>
        {exportResults.map((result, index) => (
          <Card key={index} className={styles.downloadItem}>
            <div className={styles.downloadItemHeader}>
              <div className={styles.downloadItemInfo}>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM }}
                >
                  <Text weight="semibold" size={400}>
                    {result.format} - {result.resolution}
                  </Text>
                  <Badge appearance="filled" color="success">
                    {(result.fileSize / 1024).toFixed(1)} MB
                  </Badge>
                </div>
                {result.fullPath && (
                  <div className={styles.filePath}>
                    <Text
                      size={200}
                      weight="semibold"
                      style={{ marginBottom: tokens.spacingVerticalXXS }}
                    >
                      File Location:
                    </Text>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                      {result.fullPath}
                    </Text>
                  </div>
                )}
              </div>
              <div className={styles.downloadItemActions}>
                <Button
                  appearance="primary"
                  icon={<Open24Regular />}
                  onClick={() => handleOpenFile(result.filePath, result.fullPath)}
                >
                  Open File
                </Button>
                <Button
                  appearance="secondary"
                  icon={<Folder24Regular />}
                  onClick={() => handleOpenFolder(result.filePath, result.fullPath)}
                >
                  Open Folder
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className={styles.exportActions}>
        <Button
          appearance="secondary"
          icon={<DocumentMultiple24Regular />}
          onClick={() => {
            setExportStatus('idle');
            setExportResults([]);
            setResolvedPaths({});
          }}
        >
          Export Another Version
        </Button>
      </div>
    </div>
  );

  const renderErrorView = () => (
    <div className={styles.exportProgress}>
      <ErrorCircle24Regular
        style={{ fontSize: '64px', color: tokens.colorPaletteRedForeground1 }}
      />
      <Title3>Export Failed</Title3>
      <div
        style={{
          padding: tokens.spacingVerticalM,
          backgroundColor: tokens.colorNeutralBackground3,
          borderRadius: tokens.borderRadiusMedium,
          marginBottom: tokens.spacingVerticalL,
          maxWidth: '600px',
        }}
      >
        <Text style={{ color: tokens.colorPaletteRedForeground1, fontWeight: 600 }}>
          Error Details:
        </Text>
        <Text style={{ display: 'block', marginTop: tokens.spacingVerticalXS }}>
          {exportStage || 'An error occurred while exporting your video.'}
        </Text>
        <Text
          size={200}
          style={{
            display: 'block',
            marginTop: tokens.spacingVerticalS,
            color: tokens.colorNeutralForeground3,
          }}
        >
          Check the browser console (F12) for detailed logs.
        </Text>
      </div>
      <div className={styles.exportActions}>
        <Button
          appearance="primary"
          onClick={() => {
            setExportStatus('idle');
            setExportProgress(0);
            setExportStage('');
            setExportResults([]);
            setResolvedPaths({});
          }}
        >
          Try Again
        </Button>
        <Button
          appearance="secondary"
          onClick={() => {
            setExportStatus('idle');
            setExportProgress(0);
            setExportStage('');
          }}
        >
          Back to Settings
        </Button>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title2>Final Export</Title2>
        <Text>Configure your video export settings and download the final result.</Text>
      </div>

      {exportStatus === 'idle' && renderSettingsView()}
      {exportStatus === 'exporting' && renderExportingView()}
      {exportStatus === 'completed' && renderCompletedView()}
      {exportStatus === 'error' && renderErrorView()}
    </div>
  );
};
