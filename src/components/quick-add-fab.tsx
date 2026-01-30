"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

interface QuickAddFabProps {
  date: Date;
  onTodoAdded: () => void;
}

export function QuickAddFab({ date, onTodoAdded }: QuickAddFabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isAdding, setIsAdding] = useState(false);
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
  };

  const handleAdd = async () => {
    if (!content.trim() || isAdding) return;

    setIsAdding(true);

    try {
      const dateStr = date.toISOString().split("T")[0];
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), date: dateStr }),
      });

      if (response.ok) {
        toast.success("할 일이 추가되었습니다");
        setContent("");
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
                placeholder="할 일을 입력하세요... (Enter: 추가, Shift+Enter: 줄바꿈)"
                className="min-h-[100px] resize-none text-base"
                rows={4}
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
