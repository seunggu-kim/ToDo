"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TodoList } from "@/components/todo-list";
import { StartDayButton } from "@/components/start-day-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
  const dateStr = today.toLocaleDateString("ko-KR", {
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
      <div>
        <h1 className="text-2xl font-bold">오늘 할 일</h1>
        <p className="text-muted-foreground">{dateStr}</p>
      </div>

      <StartDayButton todoCount={todos.filter(t => !t.completed).length} />

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">할 일 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <TodoList date={today} onTodosChange={setTodos} />
        </CardContent>
      </Card>
    </div>
  );
}
