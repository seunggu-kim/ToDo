"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface StartDayButtonProps {
  todoCount: number;
}

export function StartDayButton({ todoCount }: StartDayButtonProps) {
  const [isStarted, setIsStarted] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkDayStart();
  }, []);

  const checkDayStart = async () => {
    try {
      const response = await fetch("/api/start-day");
      const data = await response.json();
      
      setIsStarted(data.started);
      setStartedAt(data.startedAt);
    } catch {
      console.error("Failed to check day start");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartDay = async () => {
    if (todoCount === 0) {
      toast.error("할 일을 먼저 추가해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/start-day", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error);
      } else {
        setIsStarted(true);
        setStartedAt(data.startedAt);
        
        if (data.slackNotified) {
          toast.success("오늘 업무를 시작했습니다! 슬랙에 알림이 전송되었습니다.");
        } else {
          toast.success("오늘 업무를 시작했습니다!");
        }
      }
    } catch {
      toast.error("시작 처리 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Button disabled className="w-full">
        확인 중...
      </Button>
    );
  }

  if (isStarted) {
    const time = startedAt
      ? new Date(startedAt).toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    return (
      <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚀</span>
          <div>
            <p className="font-medium">오늘 업무 시작됨</p>
            <p className="text-sm text-muted-foreground">{time}에 시작</p>
          </div>
        </div>
        <Badge>진행 중</Badge>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleStartDay}
        disabled={isSubmitting || todoCount === 0}
        className="w-full h-14 text-lg"
        size="lg"
      >
        {isSubmitting ? (
          "시작 중..."
        ) : (
          <>
            🚀 오늘 시작하기
            {todoCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {todoCount}개의 할 일
              </Badge>
            )}
          </>
        )}
      </Button>
      <div className="flex flex-col gap-1 text-xs text-muted-foreground px-1">
        <p>💡 버튼을 누르면 팀원들에게 슬랙 알림이 전송됩니다</p>
        <p>✏️ 시작 후에도 언제든 할일을 추가하거나 수정할 수 있어요</p>
      </div>
    </div>
  );
}
