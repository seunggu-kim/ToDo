"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { ko } from "date-fns/locale";
import { HistoryWeekSelector } from "@/components/history-week-selector";
import { HistoryMemberCard } from "@/components/history-member-card";

interface Todo {
  id: string;
  content: string;
  completed: boolean;
  carryOverCount: number;
  completedAt: string | null;
  date: string;
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
  // Initialize with current Tue-Mon week
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() => {
    const today = new Date();
    const day = today.getDay(); // 0(Sun) - 6(Sat)

    // Calculate most recent Tuesday
    // If today is Sun(0) or Mon(1), we want the Tuesday of the PREVIOUS week.
    // If today is Tue(2) ~ Sat(6), we want THIS week's Tuesday.

    // day < 2 ? -(day + 5) : -(day - 2)
    // Ex: Mon(1) -> -(1+5) = -6 days (Last Tue)
    // Ex: Tue(2) -> -(2-2) = 0 days (Today)
    // Ex: Wed(3) -> -(3-2) = -1 day (Yesterday)

    const diffToTue = day < 2 ? -(day + 5) : -(day - 2);
    const start = addDays(today, diffToTue);
    const end = addDays(start, 6); // Mon is 6 days after Tue

    return { start, end };
  });

  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchHistory = async (start: Date, end: Date) => {
    setIsLoading(true);
    try {
      const startStr = format(start, "yyyy-MM-dd");
      const endStr = format(end, "yyyy-MM-dd");

      const response = await fetch(
        `/api/history?startDate=${startStr}&endDate=${endStr}`
      );
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

  // Fetch on mount and when dateRange changes
  // Actually, let's just use effect for simplicity, 
  // or trigger fetch when selector changes.
  // Using effect ensures initial load works too.
  useEffect(() => {
    fetchHistory(dateRange.start, dateRange.end);
  }, [dateRange]);

  const handleWeekChange = (start: Date, end: Date) => {
    setDateRange({ start, end });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">주간 히스토리 (화~월)</h1>
        <p className="text-muted-foreground">
          팀원들의 주간 업무 수행 내역을 확인합니다.
        </p>
      </div>

      <HistoryWeekSelector
        startDate={dateRange.start}
        endDate={dateRange.end}
        onWeekChange={handleWeekChange}
        disabled={isLoading}
      />

      {historyData ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                {format(dateRange.start, "M월 d일", { locale: ko })} - {format(dateRange.end, "M월 d일", { locale: ko })} 리포트
              </h2>
              <p className="text-sm text-muted-foreground">
                총 {historyData.members.length}명의 팀원
              </p>
            </div>
          </div>

          <div className="grid gap-6">
            {historyData.members.map((member) => (
              <HistoryMemberCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      ) : (
        !isLoading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              데이터를 불러오는 중이거나 없습니다.
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}
