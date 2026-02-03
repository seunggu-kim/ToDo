"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect, useState } from "react";
import { isMockMode, createMockableFetch } from "@/lib/mock-api";

// Mock 모드 배너 컴포넌트
function MockModeBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(isMockMode());
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-yellow-500 text-yellow-950 px-4 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2">
      <span className="animate-pulse">●</span>
      Mock 모드
      <button
        onClick={() => {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { resetMockData } = require("@/lib/mock-api");
          resetMockData();
        }}
        className="ml-2 px-2 py-0.5 bg-yellow-600 hover:bg-yellow-700 rounded text-xs"
      >
        초기화
      </button>
    </div>
  );
}

// Mock fetch 초기화
function MockFetchInitializer() {
  useEffect(() => {
    if (isMockMode() && typeof window !== "undefined") {
      console.log("[Mock Mode] 활성화됨 - API 호출이 mock 데이터를 사용합니다");
      window.fetch = createMockableFetch();
    }
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <MockFetchInitializer />
      {children}
      <MockModeBanner />
    </SessionProvider>
  );
}
