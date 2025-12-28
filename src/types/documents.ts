// Types for Document components

export type Id<T extends string> = string & { __tableName: T };

export type DocumentRelatedType = "contact" | "company" | "deal" | "activity";

export interface Document {
  _id: Id<"documents">;
  _creationTime: number;
  name: string;
  storageId: Id<"_storage">;
  mimeType: string;
  size: number;
  relatedToType?: DocumentRelatedType;
  relatedToId?: string;
  description?: string;
  uploadedBy?: Id<"users">;
  tags: string[];
  createdAt: number;
}

export interface DocumentWithUrl extends Document {
  url: string | null;
  uploader?: {
    _id: Id<"users">;
    firstName?: string;
    lastName?: string;
    email: string;
  } | null;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: "pending" | "uploading" | "complete" | "error";
  error?: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "pdf";
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType === "text/csv"
  )
    return "spreadsheet";
  if (mimeType.includes("document") || mimeType.includes("word"))
    return "document";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint"))
    return "presentation";
  if (mimeType.includes("zip") || mimeType.includes("compressed"))
    return "archive";
  if (mimeType.startsWith("text/")) return "text";
  return "file";
}

export function isPreviewable(mimeType: string): boolean {
  return (
    mimeType.startsWith("image/") ||
    mimeType === "application/pdf" ||
    mimeType.startsWith("video/") ||
    mimeType.startsWith("audio/") ||
    mimeType.startsWith("text/")
  );
}
