"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { TodoList } from "@/components/todo-list";
import { StartDayButton } from "@/components/start-day-button";
import { WeeklyCalendar, WeeklyCalendarRef } from "@/components/weekly-calendar";
import { QuickAddFab } from "@/components/quick-add-fab";
import { TeamGoals } from "@/components/team-goals";
import { Separator } from "@/components/ui/separator";

interface Todo {
  id: string;
  content: string;
  completed: boolean;
  carryOverCount: number;
  date: string | null;
}

export default function TodayPage() {
  const router = useRouter();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [hasTeam, setHasTeam] = useState<boolean | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weeklyRefreshTrigger, setWeeklyRefreshTrigger] = useState(0);
  const weeklyCalendarRef = useRef<WeeklyCalendarRef>(null);

  useEffect(() => {
    // 팀 확인
    fetch("/api/team")
      .then((res) => res.json())
      .then((data) => {
        if (!data.team) {
          router.push("/team");
        } else {
          setHasTeam(true);
        }
      });
  }, [router]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selected = new Date(selectedDate);
  selected.setHours(0, 0, 0, 0);
  const isToday = today.getTime() === selected.getTime();

  const dateStr = selectedDate.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  // 콜백 메모이제이션 - 불필요한 리렌더링 방지
  const handleTodosChange = useCallback((todos: Todo[]) => {
    setTodos(todos);
  }, []);

  const handleCalendarUpdate = useCallback((delta: { total: number; completed: number }) => {
    const dateStr = selectedDate.toISOString().split("T")[0];
    weeklyCalendarRef.current?.updateDay(dateStr, delta);
  }, [selectedDate]);

  if (hasTeam === null) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 팀 목표 */}
      <TeamGoals />

      <div>
        <h1 className="text-2xl font-bold">할 일</h1>
        <p className="text-sm text-muted-foreground">
          주간 일정을 한눈에 보고 관리하세요
        </p>
      </div>

      {/* 주간 달력 */}
      <WeeklyCalendar
        ref={weeklyCalendarRef}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        refreshTrigger={weeklyRefreshTrigger}
      />

      <Separator />

      {/* 선택된 날짜 표시 */}
      <div>
        <h2 className="text-xl font-semibold">{dateStr}</h2>
        {isToday && (
          <p className="text-sm text-muted-foreground">오늘의 할 일입니다</p>
        )}
      </div>

      {/* 오늘 시작 버튼 (오늘 날짜일 때만) */}
      {isToday && (
        <StartDayButton todoCount={todos.filter(t => !t.completed).length} />
      )}

      {/* 할일 목록 */}
      <TodoList
        date={selectedDate}
        onTodosChange={handleTodosChange}
        onCalendarUpdate={handleCalendarUpdate}
      />

      {/* 모바일 플로팅 추가 버튼 */}
      <QuickAddFab
        date={selectedDate}
        onTodoAdded={() => handleCalendarUpdate({ total: 1, completed: 0 })}
      />
    </div>
  );
}
