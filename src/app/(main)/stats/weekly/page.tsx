"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

const LineChart = lazy(() => import("recharts").then(mod => ({ default: mod.LineChart })));
const Line = lazy(() => import("recharts").then(mod => ({ default: mod.Line })));
const BarChart = lazy(() => import("recharts").then(mod => ({ default: mod.BarChart })));
const Bar = lazy(() => import("recharts").then(mod => ({ default: mod.Bar })));
const XAxis = lazy(() => import("recharts").then(mod => ({ default: mod.XAxis })));
const YAxis = lazy(() => import("recharts").then(mod => ({ default: mod.YAxis })));
const CartesianGrid = lazy(() => import("recharts").then(mod => ({ default: mod.CartesianGrid })));
const Tooltip = lazy(() => import("recharts").then(mod => ({ default: mod.Tooltip })));
const Legend = lazy(() => import("recharts").then(mod => ({ default: mod.Legend })));
const ResponsiveContainer = lazy(() => import("recharts").then(mod => ({ default: mod.ResponsiveContainer })));

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
  score?: number;
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
  mvp: MemberStat | null;
}

export default function WeeklyStatsPage() {
  const [data, setData] = useState<WeeklyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchWeeklyStats();
  }, []);

  const fetchWeeklyStats = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) setIsRefreshing(true);
      
      const response = await fetch("/api/stats/weekly", {
        cache: showRefreshToast ? "no-store" : "default",
      });
      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error);
      } else {
        setData(result);
        if (showRefreshToast) {
          toast.success("통계가 업데이트되었습니다.");
        }
      }
    } catch {
      toast.error("주간 통계 조회 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchWeeklyStats(true);
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
          <h1 className="text-2xl font-bold">주간 통계</h1>
          <p className="text-muted-foreground">
            최근 7일간의 팀 생산성을 확인하세요.
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

      {/* MVP 카드 */}
      {data.mvp && (
        <Card className="border-yellow-500/50 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              <span>이번 주의 MVP</span>
            </CardTitle>
            <CardDescription>
              가장 열심히 활동한 팀원에게 박수를!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{data.mvp.name}</p>
                <p className="text-sm text-muted-foreground">{data.mvp.email}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {data.mvp.completionRate}%
                </p>
                <p className="text-sm text-muted-foreground">
                  {data.mvp.completed} / {data.mvp.total} 완료
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
          <Suspense fallback={<div className="flex items-center justify-center h-[300px]">차트 로딩 중...</div>}>
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
          </Suspense>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>일별 투두 현황</CardTitle>
          <CardDescription>날짜별 전체/완료 투두 개수</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="flex items-center justify-center h-[300px]">차트 로딩 중...</div>}>
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
          </Suspense>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>팀원별 통계</CardTitle>
          <CardDescription>팀원별 주간 완료 현황 - 모두 꾸준히 잘하고 계시네요!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.byMember.length > 0 ? (
              data.byMember.map((member, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    {data.mvp && member.email === data.mvp.email && (
                      <span className="text-xl">🥇</span>
                    )}
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{member.completionRate}%</p>
                    <p className="text-sm text-muted-foreground">
                      {member.completed} / {member.total}
                    </p>
                    {member.completionRate >= 80 && (
                      <p className="text-xs text-green-600 dark:text-green-400">훌륭해요!</p>
                    )}
                    {member.completionRate >= 50 && member.completionRate < 80 && (
                      <p className="text-xs text-blue-600 dark:text-blue-400">잘하고 있어요!</p>
                    )}
                    {member.completionRate < 50 && member.completionRate > 0 && (
                      <p className="text-xs text-orange-600 dark:text-orange-400">꾸준히 해요!</p>
                    )}
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
