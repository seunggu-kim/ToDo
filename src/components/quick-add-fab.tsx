"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { ImageAttachment } from "@/components/image-attachment";
import {
  validateImageFile,
  uploadImage,
  MAX_IMAGES_PER_TODO,
  type PendingImage,
} from "@/lib/image-utils";

interface QuickAddFabProps {
  date: Date;
  onTodoAdded: () => void;
}

export function QuickAddFab({ date, onTodoAdded }: QuickAddFabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleOpen = () => {
    setIsOpen(true);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const handleClose = () => {
    setIsOpen(false);
    setContent("");
    pendingImages.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPendingImages([]);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }

    if (imageFiles.length === 0) return;
    e.preventDefault();
    addImageFiles(imageFiles);
  };

  const addImageFiles = async (files: File[]) => {
    const remaining = MAX_IMAGES_PER_TODO - pendingImages.length;
    if (remaining <= 0) {
      toast.error(`이미지는 최대 ${MAX_IMAGES_PER_TODO}장까지 첨부할 수 있습니다.`);
      return;
    }

    const toAdd = files.slice(0, remaining);
    const newPending: PendingImage[] = [];

    for (const file of toAdd) {
      const error = validateImageFile(file);
      if (error) {
        toast.error(error);
        continue;
      }

      newPending.push({
        id: `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        uploading: true,
        uploaded: false,
      });
    }

    if (newPending.length === 0) return;

    setPendingImages((prev) => [...prev, ...newPending]);

    for (const pending of newPending) {
      try {
        const result = await uploadImage(pending.file);
        setPendingImages((prev) =>
          prev.map((p) =>
            p.id === pending.id
              ? { ...p, uploading: false, uploaded: true, blobUrl: result.url }
              : p
          )
        );
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "업로드 실패";
        setPendingImages((prev) =>
          prev.map((p) =>
            p.id === pending.id
              ? { ...p, uploading: false, error: errorMsg }
              : p
          )
        );
        toast.error(`${pending.file.name}: ${errorMsg}`);
      }
    }
  };

  const handleAdd = async () => {
    if (!content.trim() || isAdding) return;

    const uploading = pendingImages.some((p) => p.uploading);
    if (uploading) {
      toast.error("이미지 업로드가 진행 중입니다. 잠시 후 다시 시도하세요.");
      return;
    }

    setIsAdding(true);

    const uploadedImages = pendingImages
      .filter((p) => p.uploaded && p.blobUrl)
      .map((p) => ({
        url: p.blobUrl!,
        filename: p.file.name,
        size: p.file.size,
      }));

    try {
      const dateStr = date.toISOString().split("T")[0];
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          date: dateStr,
          ...(uploadedImages.length > 0 ? { images: uploadedImages } : {}),
        }),
      });

      if (response.ok) {
        toast.success("할 일이 추가되었습니다");
        setContent("");
        pendingImages.forEach((p) => URL.revokeObjectURL(p.previewUrl));
        setPendingImages([]);
        onTodoAdded();
        textareaRef.current?.focus();
      } else {
        const data = await response.json();
        toast.error(data.error);
      }
    } catch {
      toast.error("할 일 추가에 실패했습니다");
    } finally {
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <>
      {/* 모바일에서만 표시 (768px 이하) */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        {!isOpen ? (
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg"
            onClick={handleOpen}
          >
            <Plus className="h-6 w-6" />
          </Button>
        ) : (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-end">
            <div className="w-full bg-background border-t shadow-lg rounded-t-2xl p-6 space-y-4 animate-in slide-in-from-bottom">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">빠른 추가</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder="할 일을 입력하세요... (Enter: 추가, Shift+Enter: 줄바꿈)"
                className="min-h-[100px] resize-none text-base"
                rows={4}
              />

              {/* 이미지 첨부 */}
              <ImageAttachment
                pendingImages={pendingImages}
                onPendingImagesChange={setPendingImages}
                onFilesSelected={addImageFiles}
              />

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleAdd}
                  disabled={!content.trim() || isAdding}
                >
                  {isAdding ? "추가 중..." : "추가"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClose}
                >
                  닫기
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
