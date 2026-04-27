"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileChange: (file: File | null, content: string) => void;
  accept?: string;
  label: string;
  icon?: "resume" | "jd";
}

export function FileUpload({
  onFileChange,
  accept = ".pdf,.txt",
  label,
  icon = "resume",
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = useCallback(
    async (selectedFile: File) => {
      setFile(selectedFile);
      setIsLoading(true);

      try {
        let content = "";

        if (selectedFile.type === "text/plain" || selectedFile.name.endsWith(".txt")) {
          content = await selectedFile.text();
        } else if (selectedFile.type === "application/pdf") {
          // For PDF files, we'll send the file to API for processing
          // For now, just store the file reference
          content = `[PDF_FILE:${selectedFile.name}]`;
        }

        setPreview(content.slice(0, 200) + (content.length > 200 ? "..." : ""));
        onFileChange(selectedFile, content);
      } catch (error) {
        console.error("Error reading file:", error);
        onFileChange(null, "");
      } finally {
        setIsLoading(false);
      }
    },
    [onFileChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFile(droppedFile);
      }
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        handleFile(selectedFile);
      }
    },
    [handleFile]
  );

  const handleClear = useCallback(() => {
    setFile(null);
    setPreview(null);
    onFileChange(null, "");
  }, [onFileChange]);

  const Icon = icon === "resume" ? FileText : Upload;

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>

      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "relative border-2 border-dashed rounded-xl p-8 transition-all duration-200",
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
              : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600",
            isLoading && "opacity-50 pointer-events-none"
          )}
        >
          <input
            type="file"
            accept={accept}
            onChange={handleInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <div className="flex flex-col items-center gap-3 text-center">
            <div
              className={cn(
                "p-3 rounded-full transition-colors",
                isDragging
                  ? "bg-blue-100 dark:bg-blue-900/50"
                  : "bg-slate-100 dark:bg-slate-800"
              )}
            >
              <Icon
                className={cn(
                  "w-6 h-6",
                  isDragging
                    ? "text-blue-500"
                    : "text-slate-400 dark:text-slate-500"
                )}
              />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {isDragging ? "松开以上传" : "点击或拖拽文件到这里"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                支持 PDF、TXT 格式
              </p>
            </div>
          </div>

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 rounded-xl">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          )}
        </div>
      ) : (
        <div className="relative p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
              <Icon className="w-5 h-5 text-blue-500" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                {file.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {(file.size / 1024).toFixed(1)} KB
              </p>

              {preview && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-mono line-clamp-3">
                  {preview}
                </p>
              )}
            </div>

            <button
              onClick={handleClear}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
