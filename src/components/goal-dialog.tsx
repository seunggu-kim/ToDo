"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";

interface Goal {
  id: string;
  name: string;
  targetDate: string;
  dday: number;
}

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal | null;
  onSave: (data: { name: string; targetDate: string }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function GoalDialog({
  open,
  onOpenChange,
  goal,
  onSave,
  onDelete,
}: GoalDialogProps) {
  const [name, setName] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isEditMode = !!goal;

  useEffect(() => {
    if (open) {
      if (goal) {
        setName(goal.name);
        // ISO 날짜를 YYYY-MM-DD 형식으로 변환
        const date = new Date(goal.targetDate);
        setTargetDate(date.toISOString().split("T")[0]);
      } else {
        setName("");
        // 기본값: 오늘 날짜
        setTargetDate(new Date().toISOString().split("T")[0]);
      }
    }
  }, [open, goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !targetDate) {
      return;
    }

    setIsLoading(true);
    try {
      await onSave({ name: name.trim(), targetDate });
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!goal || !onDelete) return;

    if (!confirm("정말 이 목표를 삭제하시겠습니까?")) {
      return;
    }

    setIsLoading(true);
    try {
      await onDelete(goal.id);
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "목표 수정" : "새 목표 추가"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">목표 이름</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 첫 빌드, MVP 출시"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="targetDate">목표 날짜</Label>
            <Input
              id="targetDate"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2">
            {isEditMode && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
                className="mr-auto"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                삭제
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim() || !targetDate}>
              {isLoading ? "저장 중..." : isEditMode ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
