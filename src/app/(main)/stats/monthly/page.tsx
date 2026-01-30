"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

interface WeeklyStat {
  week: string;
  total: number;
  completed: number;
  completionRate: number;
}

interface DayOfWeekStat {
  day: string;
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

interface MonthlyData {
  period: {
    start: string;
    end: string;
  };
  overall: {
    total: number;
    completed: number;
    completionRate: number;
    mostProductiveDay: string;
  };
  byWeek: WeeklyStat[];
  byDayOfWeek: DayOfWeekStat[];
  byMember: MemberStat[];
}

export default function MonthlyStatsPage() {
  const [data, setData] = useState<MonthlyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMonthlyStats();
  }, []);

  const fetchMonthlyStats = async () => {
    try {
      const response = await fetch("/api/stats/monthly");
      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error);
      } else {
        setData(result);
      }
    } catch {
      toast.error("월간 통계 조회 중 오류가 발생했습니다.");
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
        <h1 className="text-2xl font-bold">월간 통계</h1>
        <p className="text-muted-foreground">
          최근 30일간의 팀 생산성을 분석합니다.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
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
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>최고 생산성</CardDescription>
            <CardTitle className="text-2xl">{data.overall.mostProductiveDay}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>주차별 완료율 추이</CardTitle>
          <CardDescription>4주간의 완료율 변화</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.byWeek}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completionRate" name="완료율 (%)" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>요일별 생산성 분석</CardTitle>
          <CardDescription>어느 요일에 가장 많이 완료하나요?</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={data.byDayOfWeek}>
              <PolarGrid />
              <PolarAngleAxis dataKey="day" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar name="완료율 (%)" dataKey="completionRate" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              <Tooltip />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>요일별 상세 현황</CardTitle>
          <CardDescription>요일별 투두 완료 통계</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.byDayOfWeek.map((dayStat, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{dayStat.day}</p>
                  <p className="text-sm text-muted-foreground">
                    {dayStat.completed} / {dayStat.total} 완료
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{dayStat.completionRate}%</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>팀원별 월간 순위</CardTitle>
          <CardDescription>완료율 순으로 정렬된 팀원 현황</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.byMember.length > 0 ? (
              data.byMember.map((member, index) => (
                <div key={index} className="flex items-center gap-4 py-2 border-b last:border-0">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">{member.completionRate}%</p>
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
