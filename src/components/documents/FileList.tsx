"use client";

import * as React from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  File,
  FileImage,
  FileVideo,
  FileAudio,
  FileText,
  FileSpreadsheet,
  FileArchive,
  Trash2,
  Download,
  Eye,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { DocumentWithUrl } from "@/types/documents";
import { formatFileSize, getFileIcon } from "@/types/documents";
import { formatRelativeTime } from "@/lib/utils";
import { Id } from "@convex/_generated/dataModel";

interface FileListProps {
  documents: DocumentWithUrl[];
  onPreview?: (document: DocumentWithUrl) => void;
  onDelete?: (documentId: Id<"documents">) => void;
  showRelated?: boolean;
  className?: string;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  const iconType = getFileIcon(mimeType);
  const iconClass = "h-5 w-5";

  switch (iconType) {
    case "image":
      return <FileImage className={cn(iconClass, "text-green-500")} />;
    case "video":
      return <FileVideo className={cn(iconClass, "text-purple-500")} />;
    case "audio":
      return <FileAudio className={cn(iconClass, "text-orange-500")} />;
    case "pdf":
      return <FileText className={cn(iconClass, "text-red-500")} />;
    case "spreadsheet":
      return <FileSpreadsheet className={cn(iconClass, "text-emerald-500")} />;
    case "document":
      return <FileText className={cn(iconClass, "text-blue-500")} />;
    case "archive":
      return <FileArchive className={cn(iconClass, "text-amber-500")} />;
    case "text":
      return <FileText className={cn(iconClass, "text-gray-500")} />;
    default:
      return <File className={cn(iconClass, "text-muted-foreground")} />;
  }
}

export function FileList({
  documents,
  onPreview,
  onDelete,
  showRelated = false,
  className,
}: FileListProps) {
  const removeDocument = useMutation(api.documents.remove);

  const handleDelete = React.useCallback(
    async (documentId: Id<"documents">) => {
      try {
        await removeDocument({ id: documentId });
        onDelete?.(documentId);
      } catch (error) {
        console.error("Failed to delete document:", error);
      }
    },
    [removeDocument, onDelete]
  );

  const handleDownload = React.useCallback((document: DocumentWithUrl) => {
    if (document.url) {
      const link = window.document.createElement("a");
      link.href = document.url;
      link.download = document.name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    }
  }, []);

  if (documents.length === 0) {
    return (
      <div className={cn("text-center py-8 text-muted-foreground", className)}>
        <File className="mx-auto h-8 w-8 mb-2" />
        <p className="text-sm">No files attached</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      {documents.map((doc) => (
        <div
          key={doc._id}
          className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 group"
        >
          <FileIcon mimeType={doc.mimeType} />

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{doc.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(doc.size)} · {formatRelativeTime(doc.createdAt)}
              {doc.uploader && (
                <>
                  {" "}
                  · {doc.uploader.firstName || doc.uploader.email.split("@")[0]}
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onPreview && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onPreview(doc)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleDownload(doc)}
            >
              <Download className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onPreview && (
                  <DropdownMenuItem onClick={() => onPreview(doc)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => handleDownload(doc)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDelete(doc._id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  );
}

export default FileList;
