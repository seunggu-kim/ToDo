"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface Todo {
  id: string;
  content: string;
  completed: boolean;
  carryOverCount: number;
  completedAt: Date | null;
}

interface Member {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  todos: Todo[];
  totalCount: number;
  completedCount: number;
  progress: number;
  started: boolean;
  startedAt: Date | null;
}

interface HistoryData {
  date: string;
  members: Member[];
}

export default function HistoryPage() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/history?date=${selectedDate}`);
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error);
      } else {
        setHistoryData(data);
      }
    } catch {
      toast.error("히스토리 조회 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">히스토리</h1>
        <p className="text-muted-foreground">
          과거 특정 날짜의 팀 현황을 조회합니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>날짜 선택</CardTitle>
          <CardDescription>조회하고 싶은 날짜를 선택하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
            />
            <Button onClick={fetchHistory} disabled={isLoading}>
              {isLoading ? "조회 중..." : "조회"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {historyData && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">
              {format(new Date(historyData.date), "PPP (EEEE)", { locale: ko })}
            </h2>
            <p className="text-sm text-muted-foreground">
              총 {historyData.members.length}명의 팀원
            </p>
          </div>

          {historyData.members.map((member) => (
            <Card key={member.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {member.name?.charAt(0) || member.email.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{member.name || "이름 없음"}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {member.started ? (
                      <div className="text-sm text-green-600">
                        ✓ 시작함
                        {member.startedAt && (
                          <span className="block text-xs text-muted-foreground">
                            {format(new Date(member.startedAt), "HH:mm")}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">미시작</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>완료율</span>
                    <span className="font-medium">
                      {member.completedCount} / {member.totalCount} ({member.progress}%)
                    </span>
                  </div>
                  <Progress value={member.progress} />
                </div>

                {member.todos.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">투두 목록</p>
                    {member.todos.map((todo) => (
                      <div
                        key={todo.id}
                        className="flex items-start gap-2 text-sm"
                      >
                        <span className="text-muted-foreground">
                          {todo.completed ? "✓" : "○"}
                        </span>
                        <span
                          className={
                            todo.completed
                              ? "line-through text-muted-foreground"
                              : ""
                          }
                        >
                          {todo.content}
                          {todo.carryOverCount > 0 && (
                            <span className="ml-2 text-xs text-orange-500">
                              (이월 {todo.carryOverCount}회)
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    투두가 없습니다.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!historyData && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            날짜를 선택하고 조회 버튼을 눌러주세요.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
