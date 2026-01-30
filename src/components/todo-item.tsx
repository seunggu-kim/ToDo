"use client";

import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface Todo {
  id: string;
  content: string;
  completed: boolean;
  carryOverCount: number;
  priority?: number;
}

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}

export function TodoItem({ todo, onToggle, onUpdate, onDelete }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(todo.content);
  const [prevCompleted, setPrevCompleted] = useState(todo.completed);

  useEffect(() => {
    // 완료 상태로 변경되었을 때 애니메이션
    if (!prevCompleted && todo.completed) {
      triggerConfetti(todo.carryOverCount);
    }
    setPrevCompleted(todo.completed);
  }, [todo.completed]);

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

  const handleSave = () => {
    if (editContent.trim()) {
      onUpdate(todo.id, editContent.trim());
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditContent(todo.content);
      setIsEditing(false);
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

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border bg-card transition-colors relative overflow-hidden",
        todo.completed && "bg-muted/50"
      )}
    >
      <div className={cn("absolute left-0 top-0 bottom-0 w-1", getPriorityColor())} />
      <Checkbox
        checked={todo.completed}
        onCheckedChange={(checked) => onToggle(todo.id, checked as boolean)}
      />
      
      {isEditing ? (
        <Input
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onBlur={handleSave}
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
          onClick={() => !todo.completed && setIsEditing(true)}
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
  );
}
