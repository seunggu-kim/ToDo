"use client";

import { useRef } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MAX_IMAGES_PER_TODO,
  ACCEPTED_TYPES,
  type PendingImage,
  type TodoImage,
} from "@/lib/image-utils";

interface ImageAttachmentProps {
  /** 이미 저장된 이미지들 (서버) */
  existingImages?: TodoImage[];
  /** 새로 추가 중인 이미지들 */
  pendingImages: PendingImage[];
  onPendingImagesChange: (images: PendingImage[]) => void;
  /** 기존 이미지 삭제 요청 */
  onRemoveExisting?: (imageId: string) => void;
  /** 파일 선택 콜백 (부모에서 업로드 처리) */
  onFilesSelected?: (files: File[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export function ImageAttachment({
  existingImages = [],
  pendingImages,
  onPendingImagesChange,
  onRemoveExisting,
  onFilesSelected,
  maxImages = MAX_IMAGES_PER_TODO,
  disabled = false,
}: ImageAttachmentProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const totalCount = existingImages.length + pendingImages.length;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0 && onFilesSelected) {
      onFilesSelected(files);
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePending = (id: string) => {
    const img = pendingImages.find((p) => p.id === id);
    if (img) URL.revokeObjectURL(img.previewUrl);
    onPendingImagesChange(pendingImages.filter((p) => p.id !== id));
  };

  if (totalCount === 0 && disabled) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* 기존 이미지 썸네일 */}
      {existingImages.map((img) => (
        <div
          key={img.id}
          className="relative group w-12 h-12 rounded-md overflow-hidden border bg-muted"
        >
          <img
            src={img.url}
            alt={img.filename}
            className="w-full h-full object-cover"
          />
          {!disabled && onRemoveExisting && (
            <button
              type="button"
              onClick={() => onRemoveExisting(img.id)}
              className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}

      {/* 업로드 중/완료 이미지 썸네일 */}
      {pendingImages.map((img) => (
        <div
          key={img.id}
          className="relative group w-12 h-12 rounded-md overflow-hidden border bg-muted"
        >
          <img
            src={img.previewUrl}
            alt={img.file.name}
            className="w-full h-full object-cover"
          />
          {img.uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 className="h-4 w-4 text-white animate-spin" />
            </div>
          )}
          {img.error && (
            <div className="absolute inset-0 bg-red-500/40 flex items-center justify-center">
              <X className="h-4 w-4 text-white" />
            </div>
          )}
          {!disabled && (
            <button
              type="button"
              onClick={() => removePending(img.id)}
              className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}

      {/* 추가 버튼 */}
      {!disabled && totalCount < maxImages && (
        <>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="w-12 h-12 rounded-md border-dashed"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="h-5 w-5 text-muted-foreground" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </>
      )}
    </div>
  );
}
