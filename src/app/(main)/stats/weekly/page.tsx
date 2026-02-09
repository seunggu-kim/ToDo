"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RefreshCw, Trophy, Target, Flame, TrendingUp, Lightbulb } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { HistoryWeekSelector } from "@/components/history-week-selector";
import { format, addDays } from "date-fns";
import { ko } from "date-fns/locale";

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
  newTodos: number;
  carriedOver: number;
  completed: number;
  completionRate: number;
}

interface MemberDailyStat {
  name: string;
  email: string;
  daily: {
    date: string;
    completionRate: number | null;
    total: number;
    completed: number;
  }[];
}

interface MemberStat {
  name: string;
  email: string;
  total: number;
  completed: number;
  completionRate: number;
  activeDays?: number;
  growth?: number;
}

interface Highlight {
  name: string;
  email: string;
  value: number;
}

interface Highlights {
  completionKing: Highlight | null;
  rateChampion: Highlight | null;
  consistencyMaster: Highlight | null;
  growthStar: Highlight | null;
}

interface PeriodStats {
  total: number;
  completed: number;
  completionRate: number;
}

interface WeeklyData {
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
  };
  previousPeriod: PeriodStats;
  daily: DailyStat[];
  memberDaily: MemberDailyStat[];
  byMember: MemberStat[];
  highlights: Highlights;
  insights: string[];
}

// 날짜에 요일을 포함한 포맷 (예: 2/3(화))
const formatDateWithDay = (value: unknown) => {
  const date = new Date(String(value));
  return format(date, "M/d(eee)", { locale: ko });
};

// 팀원별로 다른 색상 사용
const MEMBER_COLORS = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088fe",
  "#00C49F", "#FFBB28", "#FF8042", "#a855f7", "#ec4899"
];

// 현재 주간 (화~월) 계산 함수
function getCurrentWeek() {
  const today = new Date();
  const day = today.getDay(); // 0(Sun) - 6(Sat)
  const diffToTue = day < 2 ? -(day + 5) : -(day - 2);
  const start = addDays(today, diffToTue);
  const end = addDays(start, 6);
  return { start, end };
}

// 전주 대비 증감 표시 컴포넌트
function TrendIndicator({ current, previous, unit = "" }: { current: number; previous: number; unit?: string }) {
  if (previous === 0) return null;
  const diff = current - previous;
  if (diff === 0) return <span className="text-xs text-muted-foreground">전주와 동일</span>;
  const isUp = diff > 0;
  return (
    <span className={`text-xs ${isUp ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"}`}>
      {isUp ? "↑" : "↓"} 전주 대비 {isUp ? "+" : ""}{diff}{unit}
    </span>
  );
}

export default function WeeklyStatsPage() {
  const [data, setData] = useState<WeeklyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showMemberTrends, setShowMemberTrends] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(getCurrentWeek);

  useEffect(() => {
    fetchWeeklyStats();
  }, [dateRange]);

  const fetchWeeklyStats = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) setIsRefreshing(true);
      else setIsLoading(true);

      const startStr = format(dateRange.start, "yyyy-MM-dd");
      const endStr = format(dateRange.end, "yyyy-MM-dd");

      // 캐시 확인 (새로고침이 아닐 때만)
      const cacheKey = `weekly-stats-cache-v6-${startStr}-${endStr}`;
      if (!showRefreshToast) {
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

      const response = await fetch(
        `/api/stats/weekly?startDate=${startStr}&endDate=${endStr}`,
        { cache: "no-store" }
      );
      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error);
      } else {
        setData(result);
        // 캐시에 저장
        localStorage.setItem(cacheKey, JSON.stringify({
          data: result,
          timestamp: Date.now(),
        }));
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

  const handleWeekChange = (start: Date, end: Date) => {
    setDateRange({ start, end });
  };

  // 개인별 추이 데이터를 차트용으로 변환
  const getMergedDailyData = () => {
    if (!data) return [];

    // 기본 팀 전체 데이터에 개인별 데이터 병합
    return data.daily.map((day, index) => {
      const merged: Record<string, number | string | null> = {
        date: day.date,
        팀평균: day.completionRate,
      };

      if (showMemberTrends && data.memberDaily) {
        data.memberDaily.forEach((member) => {
          const memberDay = member.daily[index];
          if (memberDay) {
            merged[member.name] = memberDay.completionRate;
          }
        });
      }

      return merged;
    });
  };

  const highlights = data?.highlights;
  const insights = data?.insights;
  const hasAnyHighlight = highlights?.completionKing || highlights?.rateChampion ||
    highlights?.consistencyMaster || highlights?.growthStar;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">주간 통계 (화~월)</h1>
          <p className="text-muted-foreground">
            팀의 주간 생산성을 확인하세요.
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "업데이트 중..." : "새로고침"}
        </Button>
      </div>

      <HistoryWeekSelector
        startDate={dateRange.start}
        endDate={dateRange.end}
        onWeekChange={handleWeekChange}
        disabled={isLoading || isRefreshing}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      ) : !data ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">데이터를 불러올 수 없습니다.</p>
        </div>
      ) : (
        <>

      {/* 하이라이트 카드 */}
      {hasAnyHighlight && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🌟</span>
              <span>이번 주 하이라이트</span>
            </CardTitle>
            <CardDescription>
              이번 주 팀원들의 활약상
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

              {highlights.consistencyMaster && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background/60 border">
                  <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30 flex-shrink-0">
                    <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground whitespace-nowrap">꾸준함의 달인</p>
                    <p className="font-semibold text-sm">{highlights.consistencyMaster.name}</p>
                    <p className="text-sm text-muted-foreground whitespace-nowrap">{highlights.consistencyMaster.value}일 업무 시작</p>
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>일별 완료율 추이</CardTitle>
              <CardDescription>이번 주 완료율 변화</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-members"
                checked={showMemberTrends}
                onCheckedChange={(checked) => setShowMemberTrends(checked === true)}
              />
              <Label htmlFor="show-members" className="text-sm cursor-pointer">
                팀원별 추이 보기
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="flex items-center justify-center h-[300px]">차트 로딩 중...</div>}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getMergedDailyData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateWithDay}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  labelFormatter={formatDateWithDay}
                  formatter={(value, name) => {
                    if (value === null) return ["-", name];
                    return [`${value}%`, name];
                  }}
                />
                <Legend />
                {/* 팀 평균 (항상 표시, 굵은 선) */}
                <Line
                  type="monotone"
                  dataKey="팀평균"
                  name="팀 평균"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
                {/* 팀원별 라인 (체크시에만 표시) */}
                {showMemberTrends && data.memberDaily.map((member, index) => (
                  <Line
                    key={member.email}
                    type="monotone"
                    dataKey={member.name}
                    name={member.name}
                    stroke={MEMBER_COLORS[index % MEMBER_COLORS.length]}
                    strokeWidth={1.5}
                    strokeOpacity={0.7}
                    dot={{ r: 2 }}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Suspense>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">일별 업무 구성</CardTitle>
          <CardDescription>날짜별 신규 등록, 이월, 완료 현황</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="flex items-center justify-center h-[250px]">차트 로딩 중...</div>}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={formatDateWithDay} />
                <YAxis allowDecimals={false} />
                <Tooltip
                  labelFormatter={formatDateWithDay}
                  formatter={(value) => [`${value}개`]}
                />
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
          <CardTitle>팀원별 요약</CardTitle>
          <CardDescription>완료율 순으로 정렬된 주간 현황</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.byMember.length > 0 ? (
              data.byMember.map((member, index) => {
                const isMe = member.email === data.currentUserEmail;
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-4 py-3 border-b last:border-0 ${isMe ? "bg-primary/5 -mx-3 px-3 rounded-lg border-b-0" : ""}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{member.name}</p>
                        {isMe && <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">나</span>}
                      </div>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                      {member.growth !== undefined && member.growth > 0 && (
                        <p className="text-xs text-green-600 dark:text-green-400">
                          ↑ 전주 대비 +{member.growth}%p
                        </p>
                      )}
                      {member.growth !== undefined && member.growth < 0 && (
                        <p className="text-xs text-orange-600 dark:text-orange-400">
                          ↓ 전주 대비 {member.growth}%p
                        </p>
                      )}
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
      </>
      )}
    </div>
  );
}
