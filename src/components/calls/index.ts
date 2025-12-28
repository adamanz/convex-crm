// Call Recording & Transcription Components
// ==========================================

// Main player component
export { CallRecordingPlayer } from "./CallRecordingPlayer";
export { default as CallRecordingPlayerDefault } from "./CallRecordingPlayer";

// Transcription display
export { TranscriptionView } from "./TranscriptionView";
export { default as TranscriptionViewDefault } from "./TranscriptionView";

// AI Analysis components
export { CallSummary } from "./CallSummary";
export { default as CallSummaryDefault } from "./CallSummary";

export { KeyPhrasesPanel } from "./KeyPhrasesPanel";
export { default as KeyPhrasesPanelDefault } from "./KeyPhrasesPanel";

export { SentimentIndicator, SentimentSummary } from "./SentimentIndicator";
export { default as SentimentIndicatorDefault } from "./SentimentIndicator";

// Upload component
export { CallUploader } from "./CallUploader";
export { default as CallUploaderDefault } from "./CallUploader";

// Re-export types for convenience
export type {
  // Add any exported types here as needed
} from "./CallRecordingPlayer";
