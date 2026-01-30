"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface MemberData {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  todos: {
    id: string;
    content: string;
    completed: boolean;
    carryOverCount: number;
  }[];
  totalCount: number;
  completedCount: number;
  progress: number;
  started: boolean;
  startedAt: string | null;
  streak: number;
}

interface MyInsights {
  weeklyTotal: number;
  weeklyCompleted: number;
  weeklyRate: number;
  teamWeeklyRate: number;
  streak: number;
  mostCarriedTodo: {
    content: string;
    carryOverCount: number;
  } | null;
  carriedTodosToday: {
    id: string;
    content: string;
    carryOverCount: number;
  }[];
}

interface DashboardData {
  members: MemberData[];
  myInsights: MyInsights;
}

export default function DashboardPage() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await fetch("/api/dashboard");
      
      if (response.status === 400) {
        router.push("/team");
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        toast.error("대시보드 데이터를 불러오는데 실패했습니다.");
      }
    } catch {
      toast.error("대시보드 데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  const getInitials = (name: string | null, email: string) => {
    if (name) return name.charAt(0).toUpperCase();
    return email.charAt(0).toUpperCase();
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { members, myInsights } = dashboardData;
  const startedMembers = members.filter((m) => m.started);
  const notStartedMembers = members.filter((m) => !m.started);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">팀 현황</h1>
        <p className="text-muted-foreground">{today}</p>
      </div>

      {/* 개인 성찰 카드 */}
      <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>나의 이번 주</span>
            {myInsights.streak > 0 && (
              <Badge variant="secondary" className="ml-auto">
                🔥 {myInsights.streak}일 연속
              </Badge>
            )}
          </CardTitle>
          <CardDescription>스스로를 돌아보는 시간</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-2xl font-bold">{myInsights.weeklyCompleted}</div>
              <p className="text-xs text-muted-foreground">완료한 할일</p>
            </div>
            <div>
              <div className="text-2xl font-bold">{myInsights.weeklyTotal}</div>
              <p className="text-xs text-muted-foreground">전체 할일</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{myInsights.weeklyRate}%</div>
              <p className="text-xs text-muted-foreground">내 완료율</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-muted-foreground">{myInsights.teamWeeklyRate}%</div>
              <p className="text-xs text-muted-foreground">팀 평균</p>
            </div>
          </div>
          
          {myInsights.mostCarriedTodo && (
            <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900">
              <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                가장 많이 미룬 할일 ({myInsights.mostCarriedTodo.carryOverCount}회)
              </p>
              <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
                {myInsights.mostCarriedTodo.content}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 이월 할일 하이라이트 */}
      {myInsights.carriedTodosToday.length > 0 && (
        <Card className="border-orange-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🔥 오늘의 이월 할일</span>
              <Badge variant="outline">{myInsights.carriedTodosToday.length}개</Badge>
            </CardTitle>
            <CardDescription>
              혹시 이 할일들, 너무 어렵거나 애매한 건 아닐까요? 다시 한번 점검해보세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {myInsights.carriedTodosToday.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <span className="flex-1">{todo.content}</span>
                <Badge variant="destructive" className="text-xs">
                  🔥 {todo.carryOverCount}회
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Separator />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-sm text-muted-foreground">전체 팀원</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{startedMembers.length}</div>
            <p className="text-sm text-muted-foreground">시작한 팀원</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {members.reduce((acc, m) => acc + m.completedCount, 0)}
            </div>
            <p className="text-sm text-muted-foreground">완료된 할 일</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {members.reduce((acc, m) => acc + m.totalCount, 0)}
            </div>
            <p className="text-sm text-muted-foreground">전체 할 일</p>
          </CardContent>
        </Card>
      </div>

      {startedMembers.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span>🚀</span> 업무 진행 중
          </h2>
          <div className="grid gap-4">
            {startedMembers.map((member) => (
              <Card key={member.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {getInitials(member.name, member.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{member.name || member.email}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">
                              {formatTime(member.startedAt)}에 시작
                            </p>
                            {member.streak > 0 && (
                              <Badge variant="outline" className="text-xs">
                                🔥 {member.streak}일 연속
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {member.completedCount}/{member.totalCount} 완료
                        </Badge>
                      </div>
                      <Progress value={member.progress} className="h-2" />
                      {member.todos.length > 0 && (
                        <div className="space-y-1">
                          {member.todos.map((todo) => (
                            <div
                              key={todo.id}
                              className={`text-sm flex items-center gap-2 ${
                                todo.completed ? "text-muted-foreground line-through" : ""
                              }`}
                            >
                              <span>{todo.completed ? "✓" : "○"}</span>
                              <span>{todo.content}</span>
                              {todo.carryOverCount > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {todo.carryOverCount}회 이월
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {notStartedMembers.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span>💤</span> 아직 시작하지 않음
          </h2>
          <div className="grid gap-2">
            {notStartedMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-sm">
                    {getInitials(member.name, member.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-sm">{member.name || member.email}</p>
                  {member.totalCount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {member.totalCount}개의 할 일 대기 중
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
