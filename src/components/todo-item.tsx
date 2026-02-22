"use client";

import { useState, useEffect, useRef } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import { ImageAttachment } from "@/components/image-attachment";
import { toast } from "sonner";
import {
  validateImageFile,
  uploadImage,
  MAX_IMAGES_PER_TODO,
  type TodoImage,
  type PendingImage,
} from "@/lib/image-utils";

interface Todo {
  id: string;
  content: string;
  completed: boolean;
  carryOverCount: number;
  priority?: number;
  images?: TodoImage[];
}

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onImageClick?: (images: TodoImage[], index: number) => void;
  onImagesUpdate?: (id: string, addImages?: { url: string; filename: string; size: number }[], removeImageIds?: string[]) => void;
  isBacklog?: boolean;
}

export function TodoItem({ todo, onToggle, onUpdate, onDelete, onImageClick, onImagesUpdate, isBacklog }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(todo.content);
  const [editPendingImages, setEditPendingImages] = useState<PendingImage[]>([]);
  const [editRemovedImageIds, setEditRemovedImageIds] = useState<string[]>([]);
  const prevCompletedRef = useRef(todo.completed);
  const editContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 완료 상태로 변경되었을 때 애니메이션
    if (!prevCompletedRef.current && todo.completed) {
      triggerConfetti(todo.carryOverCount);
    }
    prevCompletedRef.current = todo.completed;
  }, [todo.completed, todo.carryOverCount]);

  const triggerConfetti = (carryOverCount: number) => {
    const count = carryOverCount >= 3 ? 100 : 50; // 많이 미룬 할일은 더 화려하게
    const spread = carryOverCount >= 3 ? 120 : 60;

    confetti({
      particleCount: count,
      spread: spread,
      origin: { y: 0.6 },
      colors: carryOverCount >= 3
        ? ['#ff0000', '#ff6600', '#ffaa00'] // 빨강/주황 계열
        : ['#10b981', '#3b82f6', '#8b5cf6'], // 초록/파랑/보라 계열
    });
  };

  const handleStartEdit = () => {
    if (todo.completed) return;
    setEditContent(todo.content);
    setEditPendingImages([]);
    setEditRemovedImageIds([]);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editContent.trim()) {
      onUpdate(todo.id, editContent.trim());

      // 이미지 변경사항 저장
      if (onImagesUpdate) {
        const addImages = editPendingImages
          .filter((p) => p.uploaded && p.blobUrl)
          .map((p) => ({
            url: p.blobUrl!,
            filename: p.file.name,
            size: p.file.size,
          }));

        if (addImages.length > 0 || editRemovedImageIds.length > 0) {
          onImagesUpdate(
            todo.id,
            addImages.length > 0 ? addImages : undefined,
            editRemovedImageIds.length > 0 ? editRemovedImageIds : undefined,
          );
        }
      }

      // cleanup preview URLs
      editPendingImages.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setIsEditing(false);
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // 편집 영역 내부로 포커스가 이동하면 저장하지 않음
    if (editContainerRef.current?.contains(e.relatedTarget as Node)) return;
    handleSave();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      editPendingImages.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setEditContent(todo.content);
      setEditPendingImages([]);
      setEditRemovedImageIds([]);
      setIsEditing(false);
    }
  };

  const handleRemoveExisting = (imageId: string) => {
    setEditRemovedImageIds((prev) => [...prev, imageId]);
  };

  const handleEditAddFiles = async (files: File[]) => {
    const existingCount = (todo.images || []).length - editRemovedImageIds.length;
    const remaining = MAX_IMAGES_PER_TODO - existingCount - editPendingImages.length;
    if (remaining <= 0) {
      toast.error(`이미지는 최대 ${MAX_IMAGES_PER_TODO}장까지 첨부할 수 있습니다.`);
      return;
    }

    const toAdd = files.slice(0, remaining);
    const newPending: PendingImage[] = [];

    for (const file of toAdd) {
      const error = validateImageFile(file);
      if (error) { toast.error(error); continue; }
      newPending.push({
        id: `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        uploading: true,
        uploaded: false,
      });
    }

    if (newPending.length === 0) return;
    setEditPendingImages((prev) => [...prev, ...newPending]);

    for (const pending of newPending) {
      try {
        const result = await uploadImage(pending.file);
        setEditPendingImages((prev) =>
          prev.map((p) =>
            p.id === pending.id
              ? { ...p, uploading: false, uploaded: true, blobUrl: result.url }
              : p
          )
        );
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "업로드 실패";
        setEditPendingImages((prev) =>
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

  const getPriorityColor = () => {
    switch (todo.priority) {
      case 3: return "bg-red-500";
      case 2: return "bg-yellow-500";
      case 1: return "bg-blue-500";
      default: return "bg-gray-300";
    }
  };

  const images = todo.images || [];
  const visibleExistingImages = isEditing
    ? images.filter((img) => !editRemovedImageIds.includes(img.id))
    : images;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 p-3 rounded-lg border bg-card transition-colors relative overflow-hidden",
        todo.completed && "bg-muted/50"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn("absolute left-0 top-0 bottom-0 w-1", getPriorityColor())} />
        <Checkbox
          checked={todo.completed}
          onCheckedChange={(checked) => onToggle(todo.id, checked as boolean)}
          disabled={isBacklog}
          className={cn(isBacklog && "opacity-50 cursor-not-allowed")}
        />

        {isEditing ? (
          <Input
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="flex-1"
            autoFocus
          />
        ) : (
          <div
            className={cn(
              "flex-1 cursor-pointer",
              todo.completed && "line-through text-muted-foreground"
            )}
            onClick={handleStartEdit}
          >
            {todo.content}
          </div>
        )}

        {todo.carryOverCount > 0 && (
          <Badge
            variant={todo.carryOverCount >= 3 ? "destructive" : "outline"}
            className="text-xs"
          >
            {todo.carryOverCount >= 3 && "🔥 "}
            {todo.carryOverCount}회 이월
          </Badge>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(todo.id)}
          className="text-muted-foreground hover:text-destructive"
        >
          삭제
        </Button>
      </div>

      {/* 편집 모드: 이미지 첨부 컴포넌트 */}
      {isEditing && (
        <div className="pl-9" ref={editContainerRef}>
          <ImageAttachment
            existingImages={visibleExistingImages}
            pendingImages={editPendingImages}
            onPendingImagesChange={setEditPendingImages}
            onRemoveExisting={handleRemoveExisting}
            onFilesSelected={handleEditAddFiles}
          />
        </div>
      )}

      {/* 보기 모드: 이미지 썸네일 */}
      {!isEditing && images.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pl-9">
          {images.map((img, index) => (
            <button
              key={img.id}
              type="button"
              className="w-10 h-10 rounded overflow-hidden border bg-muted hover:ring-2 hover:ring-primary/50 transition-all"
              onClick={() => onImageClick?.(images, index)}
            >
              <img
                src={img.url}
                alt={img.filename}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
