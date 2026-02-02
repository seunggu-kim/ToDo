"use client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import { ko } from "date-fns/locale";

interface HistoryWeekSelectorProps {
    startDate: Date;
    endDate: Date;
    onWeekChange: (start: Date, end: Date) => void;
    disabled?: boolean;
}

export function HistoryWeekSelector({
    startDate,
    endDate,
    onWeekChange,
    disabled
}: HistoryWeekSelectorProps) {

    const handlePrevWeek = () => {
        onWeekChange(subDays(startDate, 7), subDays(endDate, 7));
    };

    const handleNextWeek = () => {
        onWeekChange(addDays(startDate, 7), addDays(endDate, 7));
    };

    const handleThisWeek = () => {
        // Current Tue-Mon logic is handled by parent or helper, 
        // but here we can reset to "current week" relative to today if passed handler supports it.
        // However, simplest is to let parent decide "current". 
        // But for "This Week" button, we need to recalculate 'this week' logic here or ask parent.
        // Let's assume parent passes the correct initial state, 
        // but for "Reset" we might need a prop or just recalculate locally for now.

        // Recalculate 'This Week' (Tue-Mon)
        // If today is Mon (1/27), 'This Week' started last Tue (1/21).
        // If today is Tue (1/28), 'This Week' starts today Tue (1/28).

        // Logic: Find most recent Tuesday (or today if today is Tuesday)
        const today = new Date();
        const day = today.getDay(); // 0(Sun) - 6(Sat)

        // diff to get to Tuesday (2)
        // If day is 0 (Sun): -5 days
        // If day is 1 (Mon): -6 days
        // If day is 2 (Tue): 0 days
        // ...
        // If day < 2 (Sun, Mon), go back to last week's Tue
        // If day >= 2 (Tue~Sat), go back to this week's Tue

        const diffToTue = day < 2 ? -(day + 5) : -(day - 2);
        const thisTue = addDays(today, diffToTue);
        const nextMon = addDays(thisTue, 6);

        onWeekChange(thisTue, nextMon);
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePrevWeek}
                    disabled={disabled}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-lg font-bold min-w-[240px] text-center">
                    {format(startDate, "M.d(eee)", { locale: ko })} ~ {format(endDate, "M.d(eee)", { locale: ko })}
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNextWeek}
                    disabled={disabled}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            <Button variant="ghost" size="sm" onClick={handleThisWeek} disabled={disabled}>
                이번 주 보기
            </Button>
        </div>
    );
}
