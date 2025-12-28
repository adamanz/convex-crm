"use client";

import * as React from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Upload, X, File, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DocumentRelatedType, UploadProgress } from "@/types/documents";
import { formatFileSize } from "@/types/documents";
import { Id } from "../../../convex/_generated/dataModel";

interface FileUploadProps {
  relatedToType?: DocumentRelatedType;
  relatedToId?: string;
  onUploadComplete?: (documentId: Id<"documents">) => void;
  onError?: (error: string) => void;
  maxSize?: number; // in bytes, default 10MB
  accept?: string;
  multiple?: boolean;
  className?: string;
}

export function FileUpload({
  relatedToType,
  relatedToId,
  onUploadComplete,
  onError,
  maxSize = 10 * 1024 * 1024, // 10MB
  accept,
  multiple = true,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [uploads, setUploads] = React.useState<UploadProgress[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const createDocument = useMutation(api.documents.create);

  const handleFiles = React.useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);

      // Validate file sizes
      const validFiles = fileArray.filter((file) => {
        if (file.size > maxSize) {
          onError?.(`${file.name} exceeds ${formatFileSize(maxSize)} limit`);
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      // Initialize upload progress
      const newUploads: UploadProgress[] = validFiles.map((file) => ({
        fileName: file.name,
        progress: 0,
        status: "pending",
      }));
      setUploads((prev) => [...prev, ...newUploads]);

      // Upload each file
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const uploadIndex = uploads.length + i;

        try {
          // Update status to uploading
          setUploads((prev) =>
            prev.map((u, idx) =>
              idx === uploadIndex ? { ...u, status: "uploading", progress: 10 } : u
            )
          );

          // Get upload URL
          const uploadUrl = await generateUploadUrl();

          setUploads((prev) =>
            prev.map((u, idx) =>
              idx === uploadIndex ? { ...u, progress: 30 } : u
            )
          );

          // Upload file
          const response = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": file.type },
            body: file,
          });

          if (!response.ok) {
            throw new Error("Upload failed");
          }

          const { storageId } = await response.json();

          setUploads((prev) =>
            prev.map((u, idx) =>
              idx === uploadIndex ? { ...u, progress: 70 } : u
            )
          );

          // Create document record
          const documentId = await createDocument({
            name: file.name,
            storageId,
            mimeType: file.type || "application/octet-stream",
            size: file.size,
            relatedToType,
            relatedToId,
            tags: [],
          });

          setUploads((prev) =>
            prev.map((u, idx) =>
              idx === uploadIndex
                ? { ...u, status: "complete", progress: 100 }
                : u
            )
          );

          onUploadComplete?.(documentId);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Upload failed";
          setUploads((prev) =>
            prev.map((u, idx) =>
              idx === uploadIndex
                ? { ...u, status: "error", error: errorMessage }
                : u
            )
          );
          onError?.(errorMessage);
        }
      }

      // Clear completed uploads after delay
      setTimeout(() => {
        setUploads((prev) => prev.filter((u) => u.status !== "complete"));
      }, 2000);
    },
    [
      generateUploadUrl,
      createDocument,
      relatedToType,
      relatedToId,
      maxSize,
      onUploadComplete,
      onError,
      uploads.length,
    ]
  );

  const handleDragOver = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(true);
    },
    []
  );

  const handleDragLeave = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
    },
    []
  );

  const handleDrop = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleClick = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
        e.target.value = "";
      }
    },
    [handleFiles]
  );

  const removeUpload = React.useCallback((index: number) => {
    setUploads((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <div className={cn("space-y-3", className)}>
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
        />
        <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          Drag and drop files here, or click to select
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Max {formatFileSize(maxSize)} per file
        </p>
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((upload, index) => (
            <div
              key={`${upload.fileName}-${index}`}
              className="flex items-center gap-3 p-2 bg-muted/50 rounded-md"
            >
              <File className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{upload.fileName}</p>
                {upload.status === "uploading" && (
                  <div className="h-1 bg-muted rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                )}
                {upload.status === "error" && (
                  <p className="text-xs text-destructive">{upload.error}</p>
                )}
              </div>
              {upload.status === "uploading" && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {upload.status === "error" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeUpload(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FileUpload;
