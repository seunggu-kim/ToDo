"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
        <Badge variant="outline" className="text-xs">
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
