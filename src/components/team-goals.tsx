"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { GoalDialog } from "@/components/goal-dialog";
import { Flag, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Goal {
  id: string;
  name: string;
  targetDate: string;
  dday: number;
  createdBy: {
    id: string;
    name: string | null;
  };
}

export function TeamGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await fetch("/api/goals");
      if (response.ok) {
        const data = await response.json();
        setGoals(data);
      }
    } catch {
      toast.error("목표를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClick = () => {
    setSelectedGoal(null);
    setDialogOpen(true);
  };

  const handleGoalClick = (goal: Goal) => {
    setSelectedGoal(goal);
    setDialogOpen(true);
  };

  const handleSave = async (data: { name: string; targetDate: string }) => {
    try {
      if (selectedGoal) {
        // 수정
        const response = await fetch(`/api/goals/${selectedGoal.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error("수정 실패");
        }

        const updatedGoal = await response.json();
        setGoals((prev) =>
          prev.map((g) => (g.id === selectedGoal.id ? updatedGoal : g))
        );
        toast.success("목표가 수정되었습니다.");
      } else {
        // 생성
        const response = await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error("생성 실패");
        }

        const newGoal = await response.json();
        setGoals((prev) => [...prev, newGoal].sort((a, b) => a.dday - b.dday));
        toast.success("목표가 추가되었습니다.");
      }
    } catch {
      toast.error(selectedGoal ? "목표 수정에 실패했습니다." : "목표 추가에 실패했습니다.");
      throw new Error("Save failed");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/goals/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("삭제 실패");
      }

      setGoals((prev) => prev.filter((g) => g.id !== id));
      toast.success("목표가 삭제되었습니다.");
    } catch {
      toast.error("목표 삭제에 실패했습니다.");
      throw new Error("Delete failed");
    }
  };

  // D-day 표시 텍스트
  const formatDday = (dday: number): string => {
    if (dday === 0) return "D-Day";
    if (dday > 0) return `D-${dday}`;
    return `D+${Math.abs(dday)}`;
  };

  // D-day에 따른 색상 클래스 - 부드러운 파스텔 톤
  const getDdayColorClass = (dday: number): string => {
    if (dday < 0) {
      // 지남 - 연한 빨강
      return "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800";
    }
    if (dday === 0) {
      // D-Day - primary
      return "bg-primary/10 text-primary border-primary/30 dark:bg-primary/20 dark:border-primary/40";
    }
    if (dday <= 3) {
      // 3일 이내 - 연한 주황
      return "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800";
    }
    if (dday <= 7) {
      // 7일 이내 - 연한 노랑
      return "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800";
    }
    // 그 외 - 연한 회색
    return "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700";
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
        <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
        <span className="text-sm text-slate-500 dark:text-slate-400">로딩 중...</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex-shrink-0">
          <Flag className="h-4 w-4" />
        </div>

        {goals.length === 0 ? (
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              팀 목표
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              목표를 추가하고 D-day를 함께 확인하세요
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {goals.map((goal) => (
              <button
                key={goal.id}
                onClick={() => handleGoalClick(goal)}
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all hover:shadow-sm cursor-pointer",
                  getDdayColorClass(goal.dday)
                )}
              >
                <span className="truncate max-w-[140px]">{goal.name}</span>
                <span className="font-semibold">{formatDday(goal.dday)}</span>
              </button>
            ))}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={handleAddClick}
          className="flex-shrink-0"
        >
          <Plus className="h-4 w-4 mr-1" />
          추가
        </Button>
      </div>

      <GoalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        goal={selectedGoal}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </>
  );
}
