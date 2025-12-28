"use client";

import * as React from "react";
import { Upload, X, File, ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface FileUploadFile {
  file: File;
  id: string;
  progress: number;
  preview?: string;
  error?: string;
}

export interface FileUploadProps {
  accept?: string;
  maxSize?: number; // in bytes
  multiple?: boolean;
  disabled?: boolean;
  onFilesChange?: (files: File[]) => void;
  onUpload?: (files: File[]) => Promise<void>;
  className?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function FileUpload({
  accept,
  maxSize = 10 * 1024 * 1024, // 10MB default
  multiple = false,
  disabled = false,
  onFilesChange,
  onUpload,
  className,
}: FileUploadProps) {
  const [files, setFiles] = React.useState<FileUploadFile[]>([]);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      return `File size exceeds ${formatFileSize(maxSize)}`;
    }

    if (accept) {
      const acceptedTypes = accept.split(",").map((t) => t.trim());
      const fileType = file.type;
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();

      const isAccepted = acceptedTypes.some((type) => {
        if (type.startsWith(".")) {
          return fileExtension === type.toLowerCase();
        }
        if (type.endsWith("/*")) {
          return fileType.startsWith(type.replace("/*", "/"));
        }
        return fileType === type;
      });

      if (!isAccepted) {
        return "File type not accepted";
      }
    }

    return null;
  };

  const createFilePreview = (file: File): string | undefined => {
    if (file.type.startsWith("image/")) {
      return URL.createObjectURL(file);
    }
    return undefined;
  };

  const processFiles = (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const processedFiles: FileUploadFile[] = fileArray.map((file) => {
      const error = validateFile(file);
      return {
        file,
        id: generateId(),
        progress: error ? 0 : 100,
        preview: createFilePreview(file),
        error: error || undefined,
      };
    });

    const updatedFiles = multiple
      ? [...files, ...processedFiles]
      : processedFiles;

    setFiles(updatedFiles);

    const validFiles = updatedFiles
      .filter((f) => !f.error)
      .map((f) => f.file);
    onFilesChange?.(validFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!disabled && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = "";
  };

  const handleBrowseClick = () => {
    inputRef.current?.click();
  };

  const handleRemoveFile = (id: string) => {
    const fileToRemove = files.find((f) => f.id === id);
    if (fileToRemove?.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }

    const updatedFiles = files.filter((f) => f.id !== id);
    setFiles(updatedFiles);

    const validFiles = updatedFiles
      .filter((f) => !f.error)
      .map((f) => f.file);
    onFilesChange?.(validFiles);
  };

  const handleUpload = async () => {
    if (!onUpload) return;

    const validFiles = files.filter((f) => !f.error).map((f) => f.file);
    if (validFiles.length === 0) return;

    setIsUploading(true);
    try {
      await onUpload(validFiles);
      // Clear files after successful upload
      files.forEach((f) => {
        if (f.preview) {
          URL.revokeObjectURL(f.preview);
        }
      });
      setFiles([]);
      onFilesChange?.([]);
    } finally {
      setIsUploading(false);
    }
  };

  // Store a ref to track previews for cleanup
  const previewsRef = React.useRef<string[]>([]);

  // Track previews as they're created
  React.useEffect(() => {
    const currentPreviews = files
      .map((f) => f.preview)
      .filter((p): p is string => !!p);
    previewsRef.current = currentPreviews;
  }, [files]);

  // Cleanup previews on unmount
  React.useEffect(() => {
    return () => {
      previewsRef.current.forEach((preview) => {
        URL.revokeObjectURL(preview);
      });
    };
  }, []);

  const hasValidFiles = files.some((f) => !f.error);
  const isImage = (file: File) => file.type.startsWith("image/");

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-all duration-200 cursor-pointer",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          disabled={disabled}
          className="sr-only"
        />
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Upload className="h-6 w-6 text-zinc-400 dark:text-zinc-500" />
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Drop files here or click to browse
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {accept ? `Accepted: ${accept}` : "All file types accepted"}
            {maxSize && ` (max ${formatFileSize(maxSize)})`}
          </p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((fileItem) => (
            <div
              key={fileItem.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                fileItem.error
                  ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
                  : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
              )}
            >
              {/* Preview or Icon */}
              {fileItem.preview ? (
                <div className="relative h-10 w-10 overflow-hidden rounded">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fileItem.preview}
                    alt={fileItem.file.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded bg-zinc-100 dark:bg-zinc-800">
                  {isImage(fileItem.file) ? (
                    <ImageIcon className="h-5 w-5 text-zinc-400" />
                  ) : (
                    <File className="h-5 w-5 text-zinc-400" />
                  )}
                </div>
              )}

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {fileItem.file.name}
                </p>
                <p
                  className={cn(
                    "text-xs",
                    fileItem.error
                      ? "text-red-600 dark:text-red-400"
                      : "text-zinc-500 dark:text-zinc-400"
                  )}
                >
                  {fileItem.error || formatFileSize(fileItem.file.size)}
                </p>
              </div>

              {/* Progress / Remove */}
              {!fileItem.error && fileItem.progress < 100 && (
                <div className="w-16">
                  <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${fileItem.progress}%` }}
                    />
                  </div>
                </div>
              )}

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile(fileItem.id);
                }}
                className="h-8 w-8 shrink-0 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Remove file</span>
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {onUpload && hasValidFiles && (
        <Button
          onClick={handleUpload}
          disabled={isUploading || disabled}
          className="w-full"
        >
          {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isUploading ? "Uploading..." : "Upload Files"}
        </Button>
      )}
    </div>
  );
}
