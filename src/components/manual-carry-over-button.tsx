"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { RefreshCw } from "lucide-react";

export function ManualCarryOverButton() {
    const [isLoading, setIsLoading] = useState(false);

    const handleCarryOver = async () => {
        if (!confirm("어제의 미완료 할 일을 오늘로 가져오시겠습니까?")) return;

        setIsLoading(true);
        try {
            const response = await fetch("/api/cron/carry-over");
            const data = await response.json();

            if (response.ok) {
                if (data.carriedCount > 0) {
                    toast.success(`${data.carriedCount}개 할 일을 가져왔습니다! 🎯`);
                    // 페이지 새로고침하여 이월된 할 일 표시
                    window.location.reload();
                } else {
                    toast.info("가져올 미완료 할 일이 없습니다.");
                }
            } else {
                toast.error(`이월 실패: ${data.error || "알 수 없는 오류"}`);
            }
        } catch (error) {
            toast.error("이월 처리 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            onClick={handleCarryOver}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="gap-2"
        >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "가져오는 중..." : "어제 할 일 가져오기"}
        </Button>
    );
}
