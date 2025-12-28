"use client";

import * as React from "react";
import { useState, useCallback, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  File,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mic,
  Phone,
} from "lucide-react";

// =============================================================================
// Types
// =============================================================================

type UploadStatus = "idle" | "selecting" | "uploading" | "processing" | "completed" | "error";

interface CallUploaderProps {
  activityId?: Id<"activities">;
  onUploadComplete?: (recordingId: Id<"callRecordings">) => void;
  onCancel?: () => void;
  compact?: boolean;
  className?: string;
}

interface FileInfo {
  file: File;
  name: string;
  size: number;
  type: string;
  duration?: number;
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.onloadedmetadata = () => {
      resolve(audio.duration);
    };
    audio.onerror = () => {
      reject(new Error("Failed to load audio file"));
    };
    audio.src = URL.createObjectURL(file);
  });
}

// =============================================================================
// Drag & Drop Zone Component
// =============================================================================

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  isActive: boolean;
  disabled?: boolean;
}

function DropZone({ onFileSelect, isActive, disabled }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("audio/")) {
        onFileSelect(file);
      }
    }
  }, [disabled, onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const handleClick = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click();
    }
  }, [disabled]);

  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-lg p-8 transition-all cursor-pointer",
        "hover:border-primary/50 hover:bg-primary/5",
        isDragOver && "border-primary bg-primary/10",
        disabled && "opacity-50 cursor-not-allowed",
        !isActive && "hidden"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleFileInput}
        disabled={disabled}
      />
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="p-3 rounded-full bg-primary/10">
          <Upload className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="font-medium">Drop your audio file here</p>
          <p className="text-sm text-muted-foreground">
            or click to browse
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Supports MP3, WAV, M4A, OGG, and other audio formats
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// File Preview Component
// =============================================================================

interface FilePreviewProps {
  fileInfo: FileInfo;
  onRemove: () => void;
  disabled?: boolean;
}

function FilePreview({ fileInfo, onRemove, disabled }: FilePreviewProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
      <div className="p-2 rounded-md bg-primary/10">
        <Mic className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{fileInfo.name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatFileSize(fileInfo.size)}</span>
          {fileInfo.duration && (
            <>
              <span>•</span>
              <span>{Math.floor(fileInfo.duration / 60)}:{String(Math.floor(fileInfo.duration % 60)).padStart(2, "0")}</span>
            </>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        disabled={disabled}
        className="shrink-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function CallUploader({
  activityId,
  onUploadComplete,
  onCancel,
  compact = false,
  className,
}: CallUploaderProps) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [callerPhone, setCallerPhone] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [provider, setProvider] = useState<"twilio" | "vonage" | "custom">("custom");

  const generateUploadUrl = useMutation(api.callRecordings.generateUploadUrl);
  const uploadRecording = useMutation(api.callRecordings.uploadRecording);

  const handleFileSelect = useCallback(async (file: File) => {
    setStatus("selecting");
    setError(null);

    try {
      const duration = await getAudioDuration(file);
      setFileInfo({
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        duration,
      });
    } catch {
      // If we can't get duration, still allow upload
      setFileInfo({
        file,
        name: file.name,
        size: file.size,
        type: file.type,
      });
    }
  }, []);

  const handleRemoveFile = useCallback(() => {
    setFileInfo(null);
    setStatus("idle");
    setError(null);
    setProgress(0);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!fileInfo) return;

    setStatus("uploading");
    setError(null);
    setProgress(0);

    try {
      // Step 1: Get upload URL
      setProgress(10);
      const uploadUrl = await generateUploadUrl();

      // Step 2: Upload to storage
      setProgress(30);
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": fileInfo.type,
        },
        body: fileInfo.file,
      });

      if (!result.ok) {
        throw new Error("Failed to upload file");
      }

      const { storageId } = await result.json();
      setProgress(70);

      // Step 3: Create recording record
      setStatus("processing");
      const recordingId = await uploadRecording({
        activityId,
        storageId,
        duration: fileInfo.duration || 0,
        fileSize: fileInfo.size,
        mimeType: fileInfo.type,
        callerPhone: callerPhone || undefined,
        receiverPhone: receiverPhone || undefined,
        provider,
      });

      setProgress(100);
      setStatus("completed");

      // Callback with new recording ID
      onUploadComplete?.(recordingId);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
      setStatus("error");
    }
  }, [
    fileInfo,
    activityId,
    callerPhone,
    receiverPhone,
    provider,
    generateUploadUrl,
    uploadRecording,
    onUploadComplete,
  ]);

  const handleRetry = useCallback(() => {
    setStatus("selecting");
    setError(null);
    setProgress(0);
  }, []);

  // Compact version for inline use
  if (compact) {
    return (
      <div className={cn("space-y-3", className)}>
        {status === "idle" && (
          <DropZone
            onFileSelect={handleFileSelect}
            isActive={true}
            disabled={false}
          />
        )}

        {fileInfo && status === "selecting" && (
          <>
            <FilePreview
              fileInfo={fileInfo}
              onRemove={handleRemoveFile}
              disabled={status === "uploading" || status === "processing"}
            />
            <Button onClick={handleUpload} className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Upload Recording
            </Button>
          </>
        )}

        {(status === "uploading" || status === "processing") && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">
                {status === "uploading" ? "Uploading..." : "Processing..."}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {status === "completed" && (
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">Upload complete!</span>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleRetry}>
              Try Again
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Full version with metadata inputs
  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Upload Call Recording
        </CardTitle>
        <CardDescription>
          Upload an audio recording from a call to transcribe and analyze it
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Drop Zone */}
        <DropZone
          onFileSelect={handleFileSelect}
          isActive={!fileInfo}
          disabled={status === "uploading" || status === "processing"}
        />

        {/* File Preview */}
        {fileInfo && (
          <FilePreview
            fileInfo={fileInfo}
            onRemove={handleRemoveFile}
            disabled={status === "uploading" || status === "processing"}
          />
        )}

        {/* Metadata Inputs */}
        {fileInfo && status === "selecting" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="callerPhone">Caller Phone (optional)</Label>
              <Input
                id="callerPhone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={callerPhone}
                onChange={(e) => setCallerPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receiverPhone">Receiver Phone (optional)</Label>
              <Input
                id="receiverPhone"
                type="tel"
                placeholder="+1 (555) 987-6543"
                value={receiverPhone}
                onChange={(e) => setReceiverPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="provider">Recording Source</Label>
              <Select value={provider} onValueChange={(v) => setProvider(v as typeof provider)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="twilio">Twilio</SelectItem>
                  <SelectItem value="vonage">Vonage</SelectItem>
                  <SelectItem value="custom">Custom / Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Progress */}
        {(status === "uploading" || status === "processing") && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {status === "uploading" ? "Uploading file..." : "Processing recording..."}
              </span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Success */}
        {status === "completed" && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">Upload successful!</p>
              <p className="text-sm opacity-80">
                Your recording is now ready. Transcription will begin processing.
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Upload failed</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleRetry}>
              Retry
            </Button>
          </div>
        )}

        {/* Actions */}
        {fileInfo && status === "selecting" && (
          <div className="flex gap-3 justify-end">
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button onClick={handleUpload}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Recording
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CallUploader;
