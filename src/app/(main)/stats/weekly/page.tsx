"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface DailyStat {
  date: string;
  total: number;
  completed: number;
  completionRate: number;
}

interface MemberStat {
  name: string;
  email: string;
  total: number;
  completed: number;
  completionRate: number;
}

interface WeeklyData {
  period: {
    start: string;
    end: string;
  };
  overall: {
    total: number;
    completed: number;
    completionRate: number;
  };
  daily: DailyStat[];
  byMember: MemberStat[];
}

export default function WeeklyStatsPage() {
  const [data, setData] = useState<WeeklyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWeeklyStats();
  }, []);

  const fetchWeeklyStats = async () => {
    try {
      const response = await fetch("/api/stats/weekly");
      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error);
      } else {
        setData(result);
      }
    } catch {
      toast.error("주간 통계 조회 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">주간 통계</h1>
        <p className="text-muted-foreground">
          최근 7일간의 팀 생산성을 확인하세요.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>전체 투두</CardDescription>
            <CardTitle className="text-3xl">{data.overall.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>완료한 투두</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {data.overall.completed}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>평균 완료율</CardDescription>
            <CardTitle className="text-3xl">{data.overall.completionRate}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>일별 완료율 추이</CardTitle>
          <CardDescription>최근 7일간의 완료율 변화</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.daily}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => {
                  const date = new Date(value as string);
                  return date.toLocaleDateString("ko-KR");
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="completionRate" name="완료율 (%)" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>일별 투두 현황</CardTitle>
          <CardDescription>날짜별 전체/완료 투두 개수</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.daily}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date"
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => {
                  const date = new Date(value as string);
                  return date.toLocaleDateString("ko-KR");
                }}
              />
              <Legend />
              <Bar dataKey="total" name="전체" fill="#94a3b8" />
              <Bar dataKey="completed" name="완료" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>팀원별 통계</CardTitle>
          <CardDescription>팀원별 주간 완료 현황</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.byMember.length > 0 ? (
              data.byMember.map((member, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{member.completionRate}%</p>
                    <p className="text-sm text-muted-foreground">
                      {member.completed} / {member.total}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                데이터가 없습니다.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
