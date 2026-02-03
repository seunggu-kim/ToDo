"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { GoalDialog } from "@/components/goal-dialog";
import { Target, Plus } from "lucide-react";
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

  // D-day에 따른 색상 클래스
  const getDdayColorClass = (dday: number): string => {
    if (dday < 0) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800";
    if (dday <= 3) return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800";
    if (dday <= 7) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800";
    return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700";
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
        <Target className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">로딩 중...</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 overflow-x-auto">
        <Target className="h-4 w-4 text-muted-foreground flex-shrink-0" />

        {goals.length === 0 ? (
          <span className="text-sm text-muted-foreground">
            팀 목표를 추가해보세요
          </span>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            {goals.map((goal) => (
              <button
                key={goal.id}
                onClick={() => handleGoalClick(goal)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border transition-all hover:scale-105 cursor-pointer",
                  getDdayColorClass(goal.dday)
                )}
              >
                <span className="truncate max-w-[120px]">{goal.name}</span>
                <span className="font-bold">{formatDday(goal.dday)}</span>
              </button>
            ))}
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={handleAddClick}
          className="h-7 w-7 flex-shrink-0 ml-auto"
        >
          <Plus className="h-4 w-4" />
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
