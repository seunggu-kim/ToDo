"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface WeekData {
  date: string;
  totalCount: number;
  completedCount: number;
  progress: number;
}

interface WeeklyCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  refreshTrigger?: number;
}

export function WeeklyCalendar({ selectedDate, onDateSelect, refreshTrigger }: WeeklyCalendarProps) {
  const [weekData, setWeekData] = useState<WeekData[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getMonday(new Date()));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchWeekData(currentWeekStart);
  }, [currentWeekStart, refreshTrigger]);

  const fetchWeekData = async (startDate: Date) => {
    setIsLoading(true);
    try {
      const dateStr = startDate.toISOString().split("T")[0];
      const response = await fetch(`/api/todos/weekly?startDate=${dateStr}`);
      
      if (response.ok) {
        const data = await response.json();
        setWeekData(data);
      } else {
        toast.error("주간 데이터를 불러오는데 실패했습니다.");
      }
    } catch {
      toast.error("주간 데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const goToPreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentWeekStart(getMonday(today));
    onDateSelect(today);
  };

  const isToday = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    return date.getTime() === today.getTime();
  };

  const isSelected = (dateStr: string) => {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    return date.getTime() === selected.getTime();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
    return {
      day: dayNames[date.getDay()],
      date: date.getDate(),
    };
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousWeek}
            disabled={isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextWeek}
            disabled={isLoading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToToday}
            disabled={isLoading}
          >
            오늘로
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          {currentWeekStart.getMonth() + 1}월 {currentWeekStart.getDate()}일 주간
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 md:grid md:grid-cols-7">
        {weekData.map((day) => {
          const { day: dayName, date: dayNumber } = formatDate(day.date);
          const today = isToday(day.date);
          const selected = isSelected(day.date);

          return (
            <Card
              key={day.date}
              className={`
                cursor-pointer transition-all hover:shadow-md p-2.5 min-w-[100px] flex-shrink-0 md:min-w-0
                ${selected ? "border-primary border-2 bg-primary/5" : ""}
                ${today ? "ring-2 ring-primary/50" : ""}
              `}
              onClick={() => onDateSelect(new Date(day.date))}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-muted-foreground">
                    {dayName}
                  </div>
                  {today && (
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                  )}
                </div>
                <div className="text-xl font-bold leading-none">{dayNumber}</div>
                {day.totalCount > 0 ? (
                  <>
                    <Badge variant="secondary" className="text-xs w-full justify-center py-0.5">
                      {day.totalCount}개
                    </Badge>
                    <Progress value={day.progress} className="h-1" />
                    <div className="text-[10px] text-center text-muted-foreground leading-none">
                      {day.completedCount}/{day.totalCount}
                    </div>
                  </>
                ) : (
                  <div className="text-[10px] text-center text-muted-foreground py-1.5 leading-none">
                    할일 없음
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// 이번 주 월요일 날짜 구하기
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}
