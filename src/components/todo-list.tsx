"use client";

import { useState, useEffect, useCallback } from "react";
import { TodoItem } from "./todo-item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface Todo {
  id: string;
  content: string;
  completed: boolean;
  carryOverCount: number;
  date: string;
}

interface TodoListProps {
  date: Date;
  onTodosChange?: (todos: Todo[]) => void;
}

export function TodoList({ date, onTodosChange }: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchTodos = useCallback(async () => {
    try {
      const dateStr = date.toISOString().split("T")[0];
      const response = await fetch(`/api/todos?date=${dateStr}`);
      
      if (response.ok) {
        const data = await response.json();
        setTodos(data);
        onTodosChange?.(data);
      }
    } catch {
      toast.error("투두 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [date, onTodosChange]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTodo.trim()) return;

    try {
      const dateStr = date.toISOString().split("T")[0];
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newTodo.trim(), date: dateStr }),
      });

      if (response.ok) {
        const todo = await response.json();
        const newTodos = [...todos, todo];
        setTodos(newTodos);
        onTodosChange?.(newTodos);
        setNewTodo("");
      } else {
        const data = await response.json();
        toast.error(data.error);
      }
    } catch {
      toast.error("투두 추가에 실패했습니다.");
    }
  };

  const handleToggle = async (id: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });

      if (response.ok) {
        const updatedTodo = await response.json();
        const newTodos = todos.map((t) => (t.id === id ? updatedTodo : t));
        setTodos(newTodos);
        onTodosChange?.(newTodos);
      }
    } catch {
      toast.error("투두 업데이트에 실패했습니다.");
    }
  };

  const handleUpdate = async (id: string, content: string) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        const updatedTodo = await response.json();
        const newTodos = todos.map((t) => (t.id === id ? updatedTodo : t));
        setTodos(newTodos);
        onTodosChange?.(newTodos);
      }
    } catch {
      toast.error("투두 업데이트에 실패했습니다.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const newTodos = todos.filter((t) => t.id !== id);
        setTodos(newTodos);
        onTodosChange?.(newTodos);
      }
    } catch {
      toast.error("투두 삭제에 실패했습니다.");
    }
  };

  const completedCount = todos.filter((t) => t.completed).length;
  const totalCount = todos.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {totalCount > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>진행률</span>
            <span>{completedCount}/{totalCount} 완료</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="새로운 할 일 추가..."
          className="flex-1"
        />
        <Button type="submit" disabled={!newTodo.trim()}>
          추가
        </Button>
      </form>

      <div className="space-y-2">
        {todos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            아직 할 일이 없습니다. 위에서 추가해보세요!
          </div>
        ) : (
          todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={handleToggle}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
