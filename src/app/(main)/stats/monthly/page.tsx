"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RefreshCw, Trophy, Target, TrendingUp, Lightbulb } from "lucide-react";

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
  newTodos: number;
  carriedOver: number;
  completed: number;
  completionRate: number;
}

interface DayOfWeekStat {
  day: string;
  total: number;
  newTodos: number;
  carriedOver: number;
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

interface Highlight {
  name: string;
  email: string;
  value: number;
}

interface Highlights {
  completionKing: Highlight | null;
  rateChampion: Highlight | null;
  growthStar: Highlight | null;
}

interface PeriodStats {
  total: number;
  completed: number;
  completionRate: number;
}

interface MonthlyData {
  period: {
    start: string;
    end: string;
  };
  currentUserEmail: string;
  overall: {
    total: number;
    newTodos: number;
    carryOver: number;
    completed: number;
    completionRate: number;
    mostProductiveDay: string;
  };
  previousPeriod: PeriodStats;
  byWeek: WeeklyStat[];
  byDayOfWeek: DayOfWeekStat[];
  byMember: MemberStat[];
  highlights: Highlights;
  insights: string[];
}

// 전월 대비 증감 표시 컴포넌트
function TrendIndicator({ current, previous, unit = "" }: { current: number; previous: number; unit?: string }) {
  if (previous === 0) return null;
  const diff = current - previous;
  if (diff === 0) return <span className="text-xs text-muted-foreground">전월과 동일</span>;
  const isUp = diff > 0;
  return (
    <span className={`text-xs ${isUp ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"}`}>
      {isUp ? "↑" : "↓"} 전월 대비 {isUp ? "+" : ""}{diff}{unit}
    </span>
  );
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
        const cacheKey = 'monthly-stats-cache-v4';
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
        const cacheKey = 'monthly-stats-cache-v4';
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

  const highlights = data.highlights;
  const insights = data.insights;
  const hasAnyHighlight = highlights?.completionKing || highlights?.rateChampion || highlights?.growthStar;

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

      {/* 하이라이트 카드 */}
      {hasAnyHighlight && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              <span>이번 달 하이라이트</span>
            </CardTitle>
            <CardDescription>
              최근 30일간 팀원들의 활약상
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {highlights.completionKing && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background/60 border">
                  <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex-shrink-0">
                    <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground whitespace-nowrap">완료왕</p>
                    <p className="font-semibold text-sm">{highlights.completionKing.name}</p>
                    <p className="text-sm text-muted-foreground whitespace-nowrap">{highlights.completionKing.value}개 완료</p>
                  </div>
                </div>
              )}

              {highlights.rateChampion && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background/60 border">
                  <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30 flex-shrink-0">
                    <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground whitespace-nowrap">완료율 챔피언</p>
                    <p className="font-semibold text-sm">{highlights.rateChampion.name}</p>
                    <p className="text-sm text-muted-foreground whitespace-nowrap">{highlights.rateChampion.value}% 달성</p>
                  </div>
                </div>
              )}

              {highlights.growthStar && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background/60 border">
                  <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30 flex-shrink-0">
                    <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground whitespace-nowrap">성장왕</p>
                    <p className="font-semibold text-sm">{highlights.growthStar.name}</p>
                    <p className="text-sm text-muted-foreground whitespace-nowrap">+{highlights.growthStar.value}%p 향상</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 인사이트 */}
      {insights && insights.length > 0 && (
        <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                {insights.map((insight, i) => (
                  <p key={i} className="text-sm text-blue-800 dark:text-blue-200">
                    {insight}
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>등록된 투두</CardDescription>
            <CardTitle className="text-3xl">{data.overall.total}</CardTitle>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>신규 {data.overall.newTodos}</span>
              {data.overall.carryOver > 0 && (
                <>
                  <span>·</span>
                  <span className="text-amber-600 dark:text-amber-400">이월 {data.overall.carryOver}</span>
                </>
              )}
            </div>
            {data.previousPeriod && (
              <TrendIndicator current={data.overall.total} previous={data.previousPeriod.total} unit="개" />
            )}
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>완료한 투두</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {data.overall.completed}
            </CardTitle>
            {data.previousPeriod && (
              <TrendIndicator current={data.overall.completed} previous={data.previousPeriod.completed} unit="개" />
            )}
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>완료율</CardDescription>
            <CardTitle className="text-3xl">{data.overall.completionRate}%</CardTitle>
            {data.previousPeriod && (
              <TrendIndicator current={data.overall.completionRate} previous={data.previousPeriod.completionRate} unit="%p" />
            )}
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
        <CardHeader className="pb-2">
          <CardTitle className="text-base">주차별 업무 구성</CardTitle>
          <CardDescription>주차별 신규 등록, 이월, 완료 현황</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="flex items-center justify-center h-[250px]">차트 로딩 중...</div>}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.byWeek}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(value) => [`${value}개`]} />
                <Legend />
                <Bar dataKey="newTodos" name="신규" fill="#94a3b8" />
                <Bar dataKey="carriedOver" name="이월" fill="#f59e0b" />
                <Bar dataKey="completed" name="완료" fill="#10b981" />
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
                <PolarRadiusAxis angle={90} />
                <Radar name="등록 수" dataKey="total" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.2} />
                <Radar name="완료 수" dataKey="completed" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </Suspense>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>팀원별 월간 순위</CardTitle>
          <CardDescription>완료 수 순으로 정렬된 팀원 현황</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.byMember.length > 0 ? (
              data.byMember.map((member, index) => {
                const isMe = member.email === data.currentUserEmail;
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-4 py-2 border-b last:border-0 ${isMe ? "bg-primary/5 -mx-3 px-3 rounded-lg border-b-0" : ""}`}
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{member.name}</p>
                        {isMe && <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">나</span>}
                      </div>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">등록</p>
                        <p className="text-lg font-semibold">{member.total}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-green-600 dark:text-green-400">완료</p>
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">{member.completed}</p>
                      </div>
                      <div className="text-right w-14">
                        <p className="text-xs text-muted-foreground">완료율</p>
                        <p className="text-lg font-semibold">{member.completionRate}%</p>
                      </div>
                    </div>
                  </div>
                );
              })
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
