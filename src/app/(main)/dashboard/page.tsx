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
}

export default function DashboardPage() {
  const router = useRouter();
  const [members, setMembers] = useState<MemberData[]>([]);
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
        setMembers(data);
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

  const startedMembers = members.filter((m) => m.started);
  const notStartedMembers = members.filter((m) => !m.started);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">팀 현황</h1>
        <p className="text-muted-foreground">{today}</p>
      </div>

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
                          <p className="text-sm text-muted-foreground">
                            {formatTime(member.startedAt)}에 시작
                          </p>
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
