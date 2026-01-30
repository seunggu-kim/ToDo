"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { TodoItem } from "./todo-item";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText, ChevronDown } from "lucide-react";

interface Todo {
  id: string;
  content: string;
  completed: boolean;
  carryOverCount: number;
  date: string;
  priority?: number;
}

interface TodoTemplate {
  id: string;
  content: string;
  createdAt: string;
}

interface TodoListProps {
  date: Date;
  onTodosChange?: (todos: Todo[]) => void;
}

export function TodoList({ date, onTodosChange }: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [templates, setTemplates] = useState<TodoTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    fetchTemplates();
  }, [fetchTodos]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch {
      // 템플릿 로드 실패는 조용히 처리
    }
  };

  const handleSelectTemplate = (content: string) => {
    setNewTodo(content);
    setShowTemplates(false);
    textareaRef.current?.focus();
  };

  const handleAdd = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!newTodo.trim() || isAdding) return;

    setIsAdding(true);
    const content = newTodo.trim();

    // 낙관적 UI 업데이트 - 임시 ID로 바로 추가
    const tempTodo: Todo = {
      id: `temp-${Date.now()}`,
      content,
      completed: false,
      carryOverCount: 0,
      date: date.toISOString().split("T")[0],
    };
    
    const newTodos = [...todos, tempTodo];
    setTodos(newTodos);
    onTodosChange?.(newTodos);
    setNewTodo("");
    
    // 포커스 유지
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);

    try {
      const dateStr = date.toISOString().split("T")[0];
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, date: dateStr }),
      });

      if (response.ok) {
        const todo = await response.json();
        // 임시 아이템을 실제 데이터로 교체
        const updatedTodos = newTodos.map(t => 
          t.id === tempTodo.id ? todo : t
        );
        setTodos(updatedTodos);
        onTodosChange?.(updatedTodos);
      } else {
        // 실패시 임시 아이템 제거
        const revertedTodos = newTodos.filter(t => t.id !== tempTodo.id);
        setTodos(revertedTodos);
        onTodosChange?.(revertedTodos);
        const data = await response.json();
        toast.error(data.error);
      }
    } catch {
      // 실패시 임시 아이템 제거
      const revertedTodos = newTodos.filter(t => t.id !== tempTodo.id);
      setTodos(revertedTodos);
      onTodosChange?.(revertedTodos);
      toast.error("투두 추가에 실패했습니다.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter 키 (Shift 없이): 추가
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
    // Shift+Enter: 줄바꿈 (기본 동작)
  };

  const handleToggle = async (id: string, completed: boolean) => {
    // 낙관적 UI 업데이트 - 즉시 체크박스 상태 변경
    const previousTodos = [...todos];
    const newTodos = todos
      .map((t) => (t.id === id ? { ...t, completed } : t))
      .sort((a, b) => {
        // API와 동일한 정렬: 미완료 먼저, 완료 나중
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        if (a.priority !== b.priority) return (b.priority || 0) - (a.priority || 0);
        return 0;
      });
    setTodos(newTodos);
    onTodosChange?.(newTodos);

    // 모든 할일이 완료되었는지 확인
    if (completed && newTodos.length > 0) {
      const allCompleted = newTodos.every(t => t.completed);
      if (allCompleted) {
        toast.success("🎉 오늘 할일을 모두 완료했습니다!", {
          description: "정말 멋져요! 내일도 화이팅!",
          duration: 5000,
        });
      }
    }

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });

      if (!response.ok) {
        // 실패 시 롤백
        setTodos(previousTodos);
        onTodosChange?.(previousTodos);
        toast.error("투두 업데이트에 실패했습니다.");
      }
      // 성공 시에는 이미 낙관적으로 업데이트했으므로 아무것도 안 함
    } catch {
      // 실패 시 롤백
      setTodos(previousTodos);
      onTodosChange?.(previousTodos);
      toast.error("투두 업데이트에 실패했습니다.");
    }
  };

  const handleUpdate = async (id: string, content: string) => {
    // 낙관적 UI 업데이트 - 즉시 내용 변경
    const previousTodos = [...todos];
    const newTodos = todos.map((t) => (t.id === id ? { ...t, content } : t));
    setTodos(newTodos);
    onTodosChange?.(newTodos);

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        // 실패 시 롤백
        setTodos(previousTodos);
        onTodosChange?.(previousTodos);
        toast.error("투두 업데이트에 실패했습니다.");
      }
      // 성공 시에는 이미 낙관적으로 업데이트했으므로 아무것도 안 함
    } catch {
      // 실패 시 롤백
      setTodos(previousTodos);
      onTodosChange?.(previousTodos);
      toast.error("투두 업데이트에 실패했습니다.");
    }
  };

  const handleDelete = async (id: string) => {
    // 낙관적 UI 업데이트 - 즉시 삭제
    const previousTodos = [...todos];
    const newTodos = todos.filter((t) => t.id !== id);
    setTodos(newTodos);
    onTodosChange?.(newTodos);

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        // 실패 시 롤백
        setTodos(previousTodos);
        onTodosChange?.(previousTodos);
        toast.error("투두 삭제에 실패했습니다.");
      }
    } catch {
      // 실패 시 롤백
      setTodos(previousTodos);
      onTodosChange?.(previousTodos);
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

      <div className="space-y-2">
        <form onSubmit={handleAdd} className="flex gap-2">
          <div className="flex-1 space-y-2">
            <Textarea
              ref={textareaRef}
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="새로운 할 일 추가... (Enter: 추가, Shift+Enter: 줄바꿈)"
              className="min-h-[60px] max-h-[120px] resize-none"
              rows={2}
            />
            {templates.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowTemplates(!showTemplates)}
                className="w-full"
              >
                <FileText className="h-4 w-4 mr-2" />
                템플릿에서 선택
                <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showTemplates ? "rotate-180" : ""}`} />
              </Button>
            )}
          </div>
          <Button type="submit" disabled={!newTodo.trim() || isAdding}>
            {isAdding ? "추가 중..." : "추가"}
          </Button>
        </form>

        {showTemplates && templates.length > 0 && (
          <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
            <p className="text-sm font-medium text-muted-foreground mb-2">템플릿 선택</p>
            <div className="space-y-1">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleSelectTemplate(template.content)}
                  className="w-full text-left p-2 rounded hover:bg-muted transition-colors text-sm"
                >
                  {template.content}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

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
