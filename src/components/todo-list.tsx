"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { TodoItem } from "./todo-item";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { FileText, ChevronDown, Plus, X, Inbox, Calendar } from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

interface Todo {
  id: string;
  content: string;
  completed: boolean;
  carryOverCount: number;
  date: string | null;
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
  onCalendarUpdate?: (delta: { total: number; completed: number }) => void;
}

export function TodoList({ date, onTodosChange, onCalendarUpdate }: TodoListProps) {
  const [todayTodos, setTodayTodos] = useState<Todo[]>([]);
  const [backlogTodos, setBacklogTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [newBacklogTodo, setNewBacklogTodo] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingBacklog, setIsAddingBacklog] = useState(false);
  const [templates, setTemplates] = useState<TodoTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showBacklog, setShowBacklog] = useState(true);
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backlogInputRef = useRef<HTMLInputElement>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);

  const fetchTodos = useCallback(async () => {
    try {
      const dateStr = date.toISOString().split("T")[0];

      // 오늘 할일과 백로그를 병렬로 가져오기
      const [todayRes, backlogRes] = await Promise.all([
        fetch(`/api/todos?date=${dateStr}`),
        fetch(`/api/todos?backlog=true`),
      ]);

      if (todayRes.ok && backlogRes.ok) {
        const todayData = await todayRes.json();
        const backlogData = await backlogRes.json();
        setTodayTodos(todayData);
        setBacklogTodos(backlogData);
        onTodosChange?.(todayData);
      }
    } catch {
      toast.error("투두 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchTodos();
    fetchTemplates();
  }, [date]);

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
    textareaRef.current?.focus();
  };

  const handleAddTemplate = async () => {
    if (!newTemplate.trim()) return;

    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newTemplate.trim() }),
      });

      if (response.ok) {
        const template = await response.json();
        setTemplates([...templates, template]);
        setNewTemplate("");
        setIsAddingTemplate(false);
        toast.success("템플릿이 추가되었습니다.");
      } else {
        toast.error("템플릿 추가에 실패했습니다.");
      }
    } catch {
      toast.error("템플릿 추가에 실패했습니다.");
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTemplates(templates.filter(t => t.id !== id));
        toast.success("템플릿이 삭제되었습니다.");
      } else {
        toast.error("템플릿 삭제에 실패했습니다.");
      }
    } catch {
      toast.error("템플릿 삭제에 실패했습니다.");
    }
  };

  // 오늘 할일 추가
  const handleAddToday = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!newTodo.trim() || isAdding) return;

    setIsAdding(true);
    const content = newTodo.trim();
    const dateStr = date.toISOString().split("T")[0];

    const tempTodo: Todo = {
      id: `temp-${Date.now()}`,
      content,
      completed: false,
      carryOverCount: 0,
      date: dateStr,
    };

    const newTodos = [...todayTodos, tempTodo];
    setTodayTodos(newTodos);
    onTodosChange?.(newTodos);
    setNewTodo("");

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);

    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, date: dateStr }),
      });

      if (response.ok) {
        const todo = await response.json();
        const updatedTodos = newTodos.map(t =>
          t.id === tempTodo.id ? todo : t
        );
        setTodayTodos(updatedTodos);
        onTodosChange?.(updatedTodos);
        onCalendarUpdate?.({ total: 1, completed: 0 });
      } else {
        const revertedTodos = newTodos.filter(t => t.id !== tempTodo.id);
        setTodayTodos(revertedTodos);
        onTodosChange?.(revertedTodos);
        const data = await response.json();
        toast.error(data.error);
      }
    } catch {
      const revertedTodos = newTodos.filter(t => t.id !== tempTodo.id);
      setTodayTodos(revertedTodos);
      onTodosChange?.(revertedTodos);
      toast.error("투두 추가에 실패했습니다.");
    } finally {
      setIsAdding(false);
    }
  };

  // 백로그 추가
  const handleAddBacklog = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!newBacklogTodo.trim() || isAddingBacklog) return;

    setIsAddingBacklog(true);
    const content = newBacklogTodo.trim();

    const tempTodo: Todo = {
      id: `temp-${Date.now()}`,
      content,
      completed: false,
      carryOverCount: 0,
      date: null,
    };

    const newTodos = [...backlogTodos, tempTodo];
    setBacklogTodos(newTodos);
    setNewBacklogTodo("");

    setTimeout(() => {
      backlogInputRef.current?.focus();
    }, 0);

    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, isBacklog: true }),
      });

      if (response.ok) {
        const todo = await response.json();
        const updatedTodos = newTodos.map(t =>
          t.id === tempTodo.id ? todo : t
        );
        setBacklogTodos(updatedTodos);
        toast.success("백로그에 추가되었습니다.");
      } else {
        const revertedTodos = newTodos.filter(t => t.id !== tempTodo.id);
        setBacklogTodos(revertedTodos);
        const data = await response.json();
        toast.error(data.error);
      }
    } catch {
      const revertedTodos = newTodos.filter(t => t.id !== tempTodo.id);
      setBacklogTodos(revertedTodos);
      toast.error("백로그 추가에 실패했습니다.");
    } finally {
      setIsAddingBacklog(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddToday();
    }
  };

  const handleBacklogKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddBacklog();
    }
  };

  // 드래그 앤 드롭 처리
  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    // 같은 위치로 드래그한 경우
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const dateStr = date.toISOString().split("T")[0];

    // 백로그 → 오늘
    if (source.droppableId === "backlog" && destination.droppableId === "today") {
      const movedTodo = backlogTodos.find(t => t.id === draggableId);
      if (!movedTodo) return;

      // 낙관적 UI 업데이트
      const newBacklog = backlogTodos.filter(t => t.id !== draggableId);
      const updatedTodo = { ...movedTodo, date: dateStr };
      const newToday = [...todayTodos];
      newToday.splice(destination.index, 0, updatedTodo);

      setBacklogTodos(newBacklog);
      setTodayTodos(newToday);
      onTodosChange?.(newToday);
      onCalendarUpdate?.({ total: 1, completed: movedTodo.completed ? 1 : 0 });

      try {
        const response = await fetch(`/api/todos/${draggableId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: dateStr }),
        });

        if (!response.ok) {
          // 롤백
          setBacklogTodos(backlogTodos);
          setTodayTodos(todayTodos);
          onTodosChange?.(todayTodos);
          onCalendarUpdate?.({ total: -1, completed: movedTodo.completed ? -1 : 0 });
          toast.error("이동에 실패했습니다.");
        } else {
          toast.success("오늘 할 일로 이동했습니다.");
        }
      } catch {
        setBacklogTodos(backlogTodos);
        setTodayTodos(todayTodos);
        onTodosChange?.(todayTodos);
        onCalendarUpdate?.({ total: -1, completed: movedTodo.completed ? -1 : 0 });
        toast.error("이동에 실패했습니다.");
      }
    }

    // 오늘 → 백로그
    if (source.droppableId === "today" && destination.droppableId === "backlog") {
      const movedTodo = todayTodos.find(t => t.id === draggableId);
      if (!movedTodo) return;

      // 낙관적 UI 업데이트
      const newToday = todayTodos.filter(t => t.id !== draggableId);
      const updatedTodo = { ...movedTodo, date: null };
      const newBacklog = [...backlogTodos];
      newBacklog.splice(destination.index, 0, updatedTodo);

      setTodayTodos(newToday);
      setBacklogTodos(newBacklog);
      onTodosChange?.(newToday);
      onCalendarUpdate?.({ total: -1, completed: movedTodo.completed ? -1 : 0 });

      try {
        const response = await fetch(`/api/todos/${draggableId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: null }),
        });

        if (!response.ok) {
          // 롤백
          setTodayTodos(todayTodos);
          setBacklogTodos(backlogTodos);
          onTodosChange?.(todayTodos);
          onCalendarUpdate?.({ total: 1, completed: movedTodo.completed ? 1 : 0 });
          toast.error("이동에 실패했습니다.");
        } else {
          toast.success("백로그로 이동했습니다.");
        }
      } catch {
        setTodayTodos(todayTodos);
        setBacklogTodos(backlogTodos);
        onTodosChange?.(todayTodos);
        onCalendarUpdate?.({ total: 1, completed: movedTodo.completed ? 1 : 0 });
        toast.error("이동에 실패했습니다.");
      }
    }

    // 같은 영역 내 순서 변경 (오늘)
    if (source.droppableId === "today" && destination.droppableId === "today") {
      const newTodos = Array.from(todayTodos);
      const [removed] = newTodos.splice(source.index, 1);
      newTodos.splice(destination.index, 0, removed);
      setTodayTodos(newTodos);
      onTodosChange?.(newTodos);
    }

    // 같은 영역 내 순서 변경 (백로그)
    if (source.droppableId === "backlog" && destination.droppableId === "backlog") {
      const newTodos = Array.from(backlogTodos);
      const [removed] = newTodos.splice(source.index, 1);
      newTodos.splice(destination.index, 0, removed);
      setBacklogTodos(newTodos);
    }
  };

  const handleToggle = async (id: string, completed: boolean) => {
    // 오늘 할일에서 찾기
    const inToday = todayTodos.find(t => t.id === id);

    if (inToday) {
      const previousTodos = [...todayTodos];
      const newTodos = todayTodos
        .map((t) => (t.id === id ? { ...t, completed } : t))
        .sort((a, b) => {
          if (a.completed !== b.completed) return a.completed ? 1 : -1;
          if (a.priority !== b.priority) return (b.priority || 0) - (a.priority || 0);
          return 0;
        });
      setTodayTodos(newTodos);
      onTodosChange?.(newTodos);
      onCalendarUpdate?.({ total: 0, completed: completed ? 1 : -1 });

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
          setTodayTodos(previousTodos);
          onTodosChange?.(previousTodos);
          onCalendarUpdate?.({ total: 0, completed: completed ? -1 : 1 });
          toast.error("투두 업데이트에 실패했습니다.");
        }
      } catch {
        setTodayTodos(previousTodos);
        onTodosChange?.(previousTodos);
        onCalendarUpdate?.({ total: 0, completed: completed ? -1 : 1 });
        toast.error("투두 업데이트에 실패했습니다.");
      }
    } else {
      // 백로그에서는 완료 처리 불가
      toast.error("보관함에 있는 할 일은 완료할 수 없습니다.", {
        description: "오늘 할 일로 이동시킨 후 완료해주세요.",
      });
      return;
    }
  };

  const handleUpdate = async (id: string, content: string) => {
    const inToday = todayTodos.find(t => t.id === id);

    if (inToday) {
      const previousTodos = [...todayTodos];
      const newTodos = todayTodos.map((t) => (t.id === id ? { ...t, content } : t));
      setTodayTodos(newTodos);
      onTodosChange?.(newTodos);

      try {
        const response = await fetch(`/api/todos/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });

        if (!response.ok) {
          setTodayTodos(previousTodos);
          onTodosChange?.(previousTodos);
          toast.error("투두 업데이트에 실패했습니다.");
        }
      } catch {
        setTodayTodos(previousTodos);
        onTodosChange?.(previousTodos);
        toast.error("투두 업데이트에 실패했습니다.");
      }
    } else {
      const previousTodos = [...backlogTodos];
      const newTodos = backlogTodos.map((t) => (t.id === id ? { ...t, content } : t));
      setBacklogTodos(newTodos);

      try {
        const response = await fetch(`/api/todos/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });

        if (!response.ok) {
          setBacklogTodos(previousTodos);
          toast.error("투두 업데이트에 실패했습니다.");
        }
      } catch {
        setBacklogTodos(previousTodos);
        toast.error("투두 업데이트에 실패했습니다.");
      }
    }
  };

  const handleDelete = async (id: string) => {
    const inToday = todayTodos.find(t => t.id === id);

    if (inToday) {
      const previousTodos = [...todayTodos];
      const deletedTodo = inToday;
      const newTodos = todayTodos.filter((t) => t.id !== id);
      setTodayTodos(newTodos);
      onTodosChange?.(newTodos);

      if (deletedTodo) {
        onCalendarUpdate?.({
          total: -1,
          completed: deletedTodo.completed ? -1 : 0
        });
      }

      try {
        const response = await fetch(`/api/todos/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          setTodayTodos(previousTodos);
          onTodosChange?.(previousTodos);
          if (deletedTodo) {
            onCalendarUpdate?.({
              total: 1,
              completed: deletedTodo.completed ? 1 : 0
            });
          }
          toast.error("투두 삭제에 실패했습니다.");
        }
      } catch {
        setTodayTodos(previousTodos);
        onTodosChange?.(previousTodos);
        if (deletedTodo) {
          onCalendarUpdate?.({
            total: 1,
            completed: deletedTodo.completed ? 1 : 0
          });
        }
        toast.error("투두 삭제에 실패했습니다.");
      }
    } else {
      const previousTodos = [...backlogTodos];
      const newTodos = backlogTodos.filter((t) => t.id !== id);
      setBacklogTodos(newTodos);

      try {
        const response = await fetch(`/api/todos/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          setBacklogTodos(previousTodos);
          toast.error("투두 삭제에 실패했습니다.");
        }
      } catch {
        setBacklogTodos(previousTodos);
        toast.error("투두 삭제에 실패했습니다.");
      }
    }
  };

  const completedCount = todayTodos.filter((t) => t.completed).length;
  const totalCount = todayTodos.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Backlog */}
        <div className="flex flex-col gap-4 p-5 rounded-xl bg-muted/20 border min-h-[600px]">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Inbox className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold text-lg text-muted-foreground">할 일 보관함</h2>
              <span className="text-sm px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                {backlogTodos.length}
              </span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
            💡 할 일을 드래그해서 오른쪽으로 옮겨보세요!
          </p>

          <form onSubmit={handleAddBacklog} className="flex gap-2">
            <Input
              ref={backlogInputRef}
              value={newBacklogTodo}
              onChange={(e) => setNewBacklogTodo(e.target.value)}
              onKeyDown={handleBacklogKeyDown}
              placeholder="보관함에 추가..."
              className="flex-1 bg-background"
            />
            <Button type="submit" variant="secondary" disabled={!newBacklogTodo.trim() || isAddingBacklog}>
              {isAddingBacklog ? "추가..." : "추가"}
            </Button>
          </form>

          <Droppable droppableId="backlog">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`flex-1 space-y-2 rounded-lg p-2 transition-colors min-h-[200px] ${snapshot.isDraggingOver ? "bg-secondary/50 border-2 border-dashed border-secondary" : ""
                  }`}
              >
                {backlogTodos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                    <Inbox className="h-8 w-8 mb-2 opacity-50" />
                    <p>보관함이 비어있습니다</p>
                  </div>
                ) : (
                  backlogTodos.map((todo, index) => (
                    <Draggable key={todo.id} draggableId={todo.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`${snapshot.isDragging ? "opacity-80 shadow-lg" : ""}`}
                        >
                          <TodoItem
                            todo={todo}
                            onToggle={handleToggle}
                            onUpdate={handleUpdate}
                            onDelete={handleDelete}
                            isBacklog={true}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>

        {/* Right Column: Today's Tasks */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary" />
                <h2 className="font-bold text-xl">오늘 할 일</h2>
                {totalCount > 0 && (
                  <span className="text-sm text-muted-foreground font-medium">
                    {completedCount} / {totalCount} 완료
                  </span>
                )}
              </div>
            </div>

            {totalCount > 0 && (
              <div className="space-y-1">
                <Progress value={progress} className="h-2" />
              </div>
            )}

            <form onSubmit={handleAddToday} className="flex gap-2">
              <div className="flex-1">
                <Textarea
                  ref={textareaRef}
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="오늘 할 일 추가... (Enter)"
                  className="min-h-[50px] max-h-[120px] resize-none text-base shadow-sm"
                  rows={2}
                />
              </div>
              <Button type="submit" size="lg" disabled={!newTodo.trim() || isAdding}>
                {isAdding ? "..." : "추가"}
              </Button>
            </form>

            {/* Templates Section */}
            <div className="border rounded-xl p-4 space-y-3 bg-card shadow-sm">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowTemplates(!showTemplates)}>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">자주 쓰는 템플릿</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                >
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showTemplates ? "rotate-180" : ""}`} />
                </Button>
              </div>

              {showTemplates && (
                <div className="space-y-2 pt-1 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex flex-wrap gap-2">
                    {templates.length > 0 ? (
                      templates.map((template) => (
                        <div
                          key={template.id}
                          className="flex items-center gap-1 group bg-secondary/50 hover:bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full text-sm transition-colors"
                        >
                          <button
                            type="button"
                            onClick={() => handleSelectTemplate(template.content)}
                            className="flex-1 text-left"
                          >
                            {template.content}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTemplate(template.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity ml-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground w-full text-center py-2">
                        등록된 템플릿이 없습니다
                      </p>
                    )}
                  </div>

                  {isAddingTemplate ? (
                    <div className="flex gap-2 pt-2">
                      <Input
                        ref={templateInputRef}
                        value={newTemplate}
                        onChange={(e) => setNewTemplate(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTemplate();
                          } else if (e.key === "Escape") {
                            setIsAddingTemplate(false);
                            setNewTemplate("");
                          }
                        }}
                        placeholder="새 템플릿 입력..."
                        className="h-9 text-sm"
                        autoFocus
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddTemplate}
                        disabled={!newTemplate.trim()}
                      >
                        저장
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsAddingTemplate(false);
                          setNewTemplate("");
                        }}
                      >
                        취소
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsAddingTemplate(true);
                        setTimeout(() => templateInputRef.current?.focus(), 0);
                      }}
                      className="w-full mt-2 border-dashed"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      새 템플릿 만들기
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          <Droppable droppableId="today">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`space-y-3 min-h-[300px] rounded-xl p-1 transition-colors ${snapshot.isDraggingOver ? "bg-primary/5 ring-2 ring-primary/20 ring-inset" : ""
                  }`}
              >
                {todayTodos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/10">
                    <Calendar className="h-10 w-10 mb-3 opacity-20" />
                    <p className="font-medium">오늘 할 일이 없습니다</p>
                    <p className="text-sm mt-1">왼쪽 보관함에서 할 일을 가져오세요!</p>
                  </div>
                ) : (
                  todayTodos.map((todo, index) => (
                    <Draggable key={todo.id} draggableId={todo.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`transform transition-all ${snapshot.isDragging ? "scale-105 shadow-xl rotate-1 z-50" : ""
                            }`}
                        >
                          <TodoItem
                            todo={todo}
                            onToggle={handleToggle}
                            onUpdate={handleUpdate}
                            onDelete={handleDelete}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </div>
    </DragDropContext>
  );
}
