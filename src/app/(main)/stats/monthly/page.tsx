"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

const BarChart = lazy(() => import("recharts").then(mod => ({ default: mod.BarChart })));
const Bar = lazy(() => import("recharts").then(mod => ({ default: mod.Bar })));
const XAxis = lazy(() => import("recharts").then(mod => ({ default: mod.XAxis })));
const YAxis = lazy(() => import("recharts").then(mod => ({ default: mod.YAxis })));
const CartesianGrid = lazy(() => import("recharts").then(mod => ({ default: mod.CartesianGrid })));
const Tooltip = lazy(() => import("recharts").then(mod => ({ default: mod.Tooltip })));
const Legend = lazy(() => import("recharts").then(mod => ({ default: mod.Legend })));
const ResponsiveContainer = lazy(() => import("recharts").then(mod => ({ default: mod.ResponsiveContainer })));
const RadarChart = lazy(() => import("recharts").then(mod => ({ default: mod.RadarChart })));
const PolarGrid = lazy(() => import("recharts").then(mod => ({ default: mod.PolarGrid })));
const PolarAngleAxis = lazy(() => import("recharts").then(mod => ({ default: mod.PolarAngleAxis })));
const PolarRadiusAxis = lazy(() => import("recharts").then(mod => ({ default: mod.PolarRadiusAxis })));
const Radar = lazy(() => import("recharts").then(mod => ({ default: mod.Radar })));

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
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchMonthlyStats();
  }, []);

  const fetchMonthlyStats = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) setIsRefreshing(true);
      
      // 캐시 확인 (새로고침이 아닐 때만)
      if (!showRefreshToast) {
        const cacheKey = 'monthly-stats-cache';
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const { data: cachedData, timestamp } = JSON.parse(cached);
            const age = Date.now() - timestamp;
            // 5분(300초) 이내면 캐시 사용
            if (age < 5 * 60 * 1000) {
              setData(cachedData);
              setIsLoading(false);
              return;
            }
          } catch {
            // 캐시 파싱 실패 시 무시하고 계속 진행
          }
        }
      }
      
      const response = await fetch("/api/stats/monthly", {
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error);
      } else {
        setData(result);
        // 캐시에 저장
        const cacheKey = 'monthly-stats-cache';
        localStorage.setItem(cacheKey, JSON.stringify({
          data: result,
          timestamp: Date.now(),
        }));
        if (showRefreshToast) {
          toast.success("통계가 업데이트되었습니다.");
        }
      }
    } catch {
      toast.error("월간 통계 조회 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchMonthlyStats(true);
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">월간 통계</h1>
          <p className="text-muted-foreground">
            최근 30일간의 팀 생산성을 분석합니다.
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "업데이트 중..." : "새로고침"}
        </Button>
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
          <Suspense fallback={<div className="flex items-center justify-center h-[300px]">차트 로딩 중...</div>}>
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
          </Suspense>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>요일별 생산성 분석</CardTitle>
          <CardDescription>어느 요일에 가장 많이 완료하나요?</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="flex items-center justify-center h-[400px]">차트 로딩 중...</div>}>
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
          </Suspense>
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
