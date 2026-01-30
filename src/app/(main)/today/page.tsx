"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TodoList } from "@/components/todo-list";
import { StartDayButton } from "@/components/start-day-button";
import { WeeklyCalendar } from "@/components/weekly-calendar";
import { QuickAddFab } from "@/components/quick-add-fab";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Info } from "lucide-react";

interface Todo {
  id: string;
  content: string;
  completed: boolean;
  carryOverCount: number;
  date: string;
}

export default function TodayPage() {
  const router = useRouter();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [hasTeam, setHasTeam] = useState<boolean | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [refreshKey, setRefreshKey] = useState(0);

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

  if (hasTeam === null) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 이월 안내 배너 */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-900 dark:text-blue-100">
          매일 오전 9시, 미완료 항목이 자동으로 오늘로 이월됩니다
        </p>
      </div>

      <div>
        <h1 className="text-2xl font-bold">할 일</h1>
        <p className="text-sm text-muted-foreground">
          주간 일정을 한눈에 보고 관리하세요
        </p>
      </div>

      {/* 주간 달력 */}
      <WeeklyCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />

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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">할 일 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <TodoList key={refreshKey} date={selectedDate} onTodosChange={setTodos} />
        </CardContent>
      </Card>

      {/* 모바일 플로팅 추가 버튼 */}
      <QuickAddFab 
        date={selectedDate} 
        onTodoAdded={() => setRefreshKey(prev => prev + 1)} 
      />
    </div>
  );
}
