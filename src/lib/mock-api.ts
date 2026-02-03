// Mock API 핸들러
// NEXT_PUBLIC_MOCK_MODE=true 일 때 실제 API 대신 사용됩니다

import { initialMockData, MockTodo, MockTemplate, MockGoal, MockDataStore } from "./mock-data";

// Mock 모드 활성화 여부
export const isMockMode = () => {
  if (typeof window === "undefined") return false;
  return process.env.NEXT_PUBLIC_MOCK_MODE === "true";
};

// localStorage 키
const STORAGE_KEY = "mock-data";

// Mock 데이터 스토어 관리
function getMockStore(): MockDataStore {
  if (typeof window === "undefined") return initialMockData;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return initialMockData;
    }
  }

  // 초기 데이터 저장
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialMockData));
  return initialMockData;
}

function saveMockStore(store: MockDataStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

// Mock 데이터 초기화 (디버깅용)
export function resetMockData() {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialMockData));
  window.location.reload();
}

// ID 생성
const generateId = () => `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// D-day 계산
function calculateDday(targetDate: string): number {
  const target = new Date(targetDate);
  const today = new Date();
  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// Mock API 핸들러들
type MockResponse = { data: unknown; status: number };

const mockHandlers: Record<string, (url: URL, options?: RequestInit) => MockResponse> = {
  // Team
  "GET /api/team": () => {
    const store = getMockStore();
    return { data: { team: store.team }, status: 200 };
  },

  // Todos - 목록 조회
  "GET /api/todos": (url) => {
    const store = getMockStore();
    const date = url.searchParams.get("date");
    const backlog = url.searchParams.get("backlog");

    let todos: MockTodo[];
    if (backlog === "true") {
      todos = store.todos.filter((t) => t.date === null);
    } else if (date) {
      todos = store.todos.filter((t) => t.date === date);
    } else {
      todos = store.todos;
    }

    // 정렬: 완료 안된 것 먼저, 우선순위 높은 것 먼저
    todos.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return (b.priority || 0) - (a.priority || 0);
    });

    return { data: todos, status: 200 };
  },

  // Todos - 추가
  "POST /api/todos": (url, options) => {
    const store = getMockStore();
    const body = JSON.parse(options?.body as string || "{}");

    const newTodo: MockTodo = {
      id: generateId(),
      content: body.content,
      completed: false,
      carryOverCount: 0,
      date: body.isBacklog ? null : body.date || null,
      priority: body.priority || 0,
    };

    store.todos.push(newTodo);
    saveMockStore(store);

    return { data: newTodo, status: 200 };
  },

  // Todos - 수정
  "PATCH /api/todos/:id": (url, options) => {
    const store = getMockStore();
    const id = url.pathname.split("/").pop();
    const body = JSON.parse(options?.body as string || "{}");

    const todoIndex = store.todos.findIndex((t) => t.id === id);
    if (todoIndex === -1) {
      return { data: { error: "Todo not found" }, status: 404 };
    }

    store.todos[todoIndex] = { ...store.todos[todoIndex], ...body };
    saveMockStore(store);

    return { data: store.todos[todoIndex], status: 200 };
  },

  // Todos - 삭제
  "DELETE /api/todos/:id": (url) => {
    const store = getMockStore();
    const id = url.pathname.split("/").pop();

    store.todos = store.todos.filter((t) => t.id !== id);
    saveMockStore(store);

    return { data: { success: true }, status: 200 };
  },

  // Todos - 주간 데이터
  "GET /api/todos/weekly": (url) => {
    const store = getMockStore();
    const startDate = url.searchParams.get("startDate");

    if (!startDate) {
      return { data: [], status: 200 };
    }

    const start = new Date(startDate);
    const weekData = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];

      const dayTodos = store.todos.filter((t) => t.date === dateStr);
      const completed = dayTodos.filter((t) => t.completed).length;

      weekData.push({
        date: dateStr,
        totalCount: dayTodos.length,
        completedCount: completed,
        progress: dayTodos.length > 0 ? Math.round((completed / dayTodos.length) * 100) : 0,
      });
    }

    return { data: weekData, status: 200 };
  },

  // Templates
  "GET /api/templates": () => {
    const store = getMockStore();
    return { data: store.templates, status: 200 };
  },

  "POST /api/templates": (url, options) => {
    const store = getMockStore();
    const body = JSON.parse(options?.body as string || "{}");

    const newTemplate: MockTemplate = {
      id: generateId(),
      content: body.content,
      createdAt: new Date().toISOString(),
    };

    store.templates.push(newTemplate);
    saveMockStore(store);

    return { data: newTemplate, status: 200 };
  },

  "DELETE /api/templates/:id": (url) => {
    const store = getMockStore();
    const id = url.pathname.split("/").pop();

    store.templates = store.templates.filter((t) => t.id !== id);
    saveMockStore(store);

    return { data: { success: true }, status: 200 };
  },

  // Goals
  "GET /api/goals": () => {
    const store = getMockStore();
    const goalsWithDday = store.goals
      .filter((g) => !g.completed)
      .map((g) => ({
        ...g,
        dday: calculateDday(g.targetDate),
      }))
      .sort((a, b) => a.dday - b.dday);

    return { data: goalsWithDday, status: 200 };
  },

  "POST /api/goals": (url, options) => {
    const store = getMockStore();
    const body = JSON.parse(options?.body as string || "{}");

    const newGoal: MockGoal = {
      id: generateId(),
      name: body.name,
      targetDate: body.targetDate,
      completed: false,
      createdBy: { id: store.user.id, name: store.user.name },
    };

    store.goals.push(newGoal);
    saveMockStore(store);

    return {
      data: { ...newGoal, dday: calculateDday(newGoal.targetDate) },
      status: 200
    };
  },

  "PATCH /api/goals/:id": (url, options) => {
    const store = getMockStore();
    const id = url.pathname.split("/").pop();
    const body = JSON.parse(options?.body as string || "{}");

    const goalIndex = store.goals.findIndex((g) => g.id === id);
    if (goalIndex === -1) {
      return { data: { error: "Goal not found" }, status: 404 };
    }

    store.goals[goalIndex] = { ...store.goals[goalIndex], ...body };
    saveMockStore(store);

    const goal = store.goals[goalIndex];
    return {
      data: { ...goal, dday: calculateDday(goal.targetDate) },
      status: 200
    };
  },

  "DELETE /api/goals/:id": (url) => {
    const store = getMockStore();
    const id = url.pathname.split("/").pop();

    store.goals = store.goals.filter((g) => g.id !== id);
    saveMockStore(store);

    return { data: { success: true }, status: 200 };
  },

  // Dashboard
  "GET /api/dashboard": () => {
    const store = getMockStore();
    const today = new Date().toISOString().split("T")[0];

    const members = store.team.members.map((member) => {
      const memberTodos = store.todos.filter(
        (t) => t.date === today
      );
      const completed = memberTodos.filter((t) => t.completed).length;

      return {
        ...member,
        todos: memberTodos,
        totalCount: memberTodos.length,
        completedCount: completed,
        progress: memberTodos.length > 0 ? Math.round((completed / memberTodos.length) * 100) : 0,
        started: true,
        startedAt: new Date().toISOString(),
        streak: Math.floor(Math.random() * 10) + 1,
      };
    });

    const myTodos = store.todos.filter((t) => t.date === today);
    const myCompleted = myTodos.filter((t) => t.completed).length;

    return {
      data: {
        members,
        myInsights: {
          weeklyTotal: 25,
          weeklyCompleted: 18,
          weeklyRate: 72,
          teamWeeklyRate: 68,
          streak: 5,
          mostCarriedTodo: store.todos.find((t) => t.carryOverCount > 0) || null,
          carriedTodosToday: store.todos.filter((t) => t.date === today && t.carryOverCount > 0),
        },
      },
      status: 200,
    };
  },

  // Start Day
  "POST /api/start-day": () => {
    const store = getMockStore();
    const today = new Date().toISOString().split("T")[0];

    const existing = store.dayStarts.find(
      (d) => d.userId === store.user.id && d.date === today
    );

    if (!existing) {
      store.dayStarts.push({
        userId: store.user.id,
        date: today,
        startedAt: new Date().toISOString(),
      });
      saveMockStore(store);
    }

    return { data: { success: true, alreadyStarted: !!existing }, status: 200 };
  },

  "GET /api/start-day": () => {
    const store = getMockStore();
    const today = new Date().toISOString().split("T")[0];

    const started = store.dayStarts.some(
      (d) => d.userId === store.user.id && d.date === today
    );

    return { data: { started }, status: 200 };
  },

  // History
  "GET /api/history": (url) => {
    const store = getMockStore();
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    if (!startDate || !endDate) {
      return { data: { members: [] }, status: 200 };
    }

    const members = store.team.members.map((member) => {
      const memberTodos = store.todos.filter((t) => {
        if (!t.date) return false;
        return t.date >= startDate && t.date <= endDate;
      });

      return {
        ...member,
        todos: memberTodos,
        totalCount: memberTodos.length,
        completedCount: memberTodos.filter((t) => t.completed).length,
      };
    });

    return { data: { members }, status: 200 };
  },

  // Stats - Weekly
  "GET /api/stats/weekly": (url) => {
    const store = getMockStore();
    const startDateParam = url.searchParams.get("startDate");
    const endDateParam = url.searchParams.get("endDate");

    // 기본값: 이번 주 (화~월)
    const today = new Date();
    const day = today.getDay();
    const diffToTue = day < 2 ? -(day + 5) : -(day - 2);
    const defaultStart = new Date(today);
    defaultStart.setDate(defaultStart.getDate() + diffToTue);
    const defaultEnd = new Date(defaultStart);
    defaultEnd.setDate(defaultEnd.getDate() + 6);

    const startDate = startDateParam || defaultStart.toISOString().split("T")[0];
    const endDate = endDateParam || defaultEnd.toISOString().split("T")[0];

    // 일별 통계 생성
    const daily: { date: string; total: number; completed: number; completionRate: number }[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      const dayTodos = store.todos.filter((t) => t.date === dateStr);
      const completed = dayTodos.filter((t) => t.completed).length;
      const total = dayTodos.length;

      daily.push({
        date: dateStr,
        total,
        completed,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      });
    }

    // 팀원별 일별 통계
    const memberDaily = store.team.members.map((member) => ({
      name: member.name,
      email: member.email,
      daily: daily.map((d) => {
        // Mock: 각 팀원별로 약간 다른 완료율 생성
        const baseRate = d.completionRate;
        const variance = Math.floor(Math.random() * 30) - 15;
        const rate = Math.max(0, Math.min(100, baseRate + variance));
        return {
          date: d.date,
          completionRate: d.total > 0 ? rate : null,
          total: Math.floor(d.total / store.team.members.length) + Math.floor(Math.random() * 2),
          completed: Math.floor(d.completed / store.team.members.length) + Math.floor(Math.random() * 2),
        };
      }),
    }));

    // 팀원별 요약 통계
    const byMember = store.team.members.map((member, index) => {
      const memberTotal = 5 + Math.floor(Math.random() * 15);
      const memberCompleted = Math.floor(memberTotal * (0.5 + Math.random() * 0.4));
      return {
        name: member.name,
        email: member.email,
        total: memberTotal,
        completed: memberCompleted,
        completionRate: Math.round((memberCompleted / memberTotal) * 100),
        activeDays: 3 + Math.floor(Math.random() * 4),
        growth: index === 0 ? 15 : (Math.random() > 0.5 ? Math.floor(Math.random() * 20) : -Math.floor(Math.random() * 10)),
      };
    }).sort((a, b) => b.completionRate - a.completionRate);

    // 전체 통계
    const totalAll = daily.reduce((sum, d) => sum + d.total, 0);
    const completedAll = daily.reduce((sum, d) => sum + d.completed, 0);

    // 하이라이트
    const topByCompleted = [...byMember].sort((a, b) => b.completed - a.completed)[0];
    const topByRate = [...byMember].sort((a, b) => b.completionRate - a.completionRate)[0];
    const topByGrowth = [...byMember].filter(m => m.growth && m.growth > 0).sort((a, b) => (b.growth || 0) - (a.growth || 0))[0];

    return {
      data: {
        period: { start: startDate, end: endDate },
        overall: {
          total: totalAll,
          completed: completedAll,
          completionRate: totalAll > 0 ? Math.round((completedAll / totalAll) * 100) : 0,
        },
        daily,
        memberDaily,
        byMember,
        highlights: {
          completionKing: topByCompleted ? { name: topByCompleted.name, email: topByCompleted.email, value: topByCompleted.completed } : null,
          rateChampion: topByRate ? { name: topByRate.name, email: topByRate.email, value: topByRate.completionRate } : null,
          consistencyMaster: byMember[0] ? { name: byMember[0].name, email: byMember[0].email, value: byMember[0].activeDays || 5 } : null,
          growthStar: topByGrowth ? { name: topByGrowth.name, email: topByGrowth.email, value: topByGrowth.growth || 0 } : null,
        },
        insights: [
          "이번 주 팀 완료율이 지난 주 대비 5% 상승했습니다.",
          "수요일에 가장 많은 할 일을 완료했습니다.",
          `${topByCompleted?.name || "팀원"}님이 가장 많은 할 일을 완료했습니다.`,
        ],
        mvp: byMember[0] || null,
      },
      status: 200,
    };
  },

  // Stats - Monthly
  "GET /api/stats/monthly": () => {
    const store = getMockStore();
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

    const startDate = thirtyDaysAgo.toISOString().split("T")[0];
    const endDate = today.toISOString().split("T")[0];

    // 주차별 통계 (4주)
    const byWeek = [];
    for (let week = 0; week < 4; week++) {
      const weekStart = new Date(thirtyDaysAgo);
      weekStart.setDate(weekStart.getDate() + (week * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      let weekTotal = 0;
      let weekCompleted = 0;

      for (let d = new Date(weekStart); d <= weekEnd && d <= today; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        const dayTodos = store.todos.filter((t) => t.date === dateStr);
        weekTotal += dayTodos.length;
        weekCompleted += dayTodos.filter((t) => t.completed).length;
      }

      // Mock: 실제 데이터가 적으면 랜덤 값 추가
      if (weekTotal < 3) {
        weekTotal = 10 + Math.floor(Math.random() * 15);
        weekCompleted = Math.floor(weekTotal * (0.5 + Math.random() * 0.4));
      }

      byWeek.push({
        week: `${week + 1}주차`,
        total: weekTotal,
        completed: weekCompleted,
        completionRate: weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0,
      });
    }

    // 요일별 통계
    const dayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
    const byDayOfWeek = dayNames.map((day, dayIndex) => {
      // Mock 데이터 생성
      const total = 8 + Math.floor(Math.random() * 12);
      const completed = Math.floor(total * (0.4 + Math.random() * 0.5));
      return {
        day,
        total,
        completed,
        completionRate: Math.round((completed / total) * 100),
      };
    });

    // 가장 생산성 높은 요일 찾기
    const mostProductiveDay = [...byDayOfWeek].sort((a, b) => b.completionRate - a.completionRate)[0].day;

    // 팀원별 통계
    const byMember = store.team.members.map((member) => {
      const memberTotal = 15 + Math.floor(Math.random() * 30);
      const memberCompleted = Math.floor(memberTotal * (0.5 + Math.random() * 0.4));
      return {
        name: member.name,
        email: member.email,
        total: memberTotal,
        completed: memberCompleted,
        completionRate: Math.round((memberCompleted / memberTotal) * 100),
      };
    }).sort((a, b) => b.completionRate - a.completionRate);

    // 전체 통계
    const totalAll = byWeek.reduce((sum, w) => sum + w.total, 0);
    const completedAll = byWeek.reduce((sum, w) => sum + w.completed, 0);

    return {
      data: {
        period: { start: startDate, end: endDate },
        overall: {
          total: totalAll,
          completed: completedAll,
          completionRate: totalAll > 0 ? Math.round((completedAll / totalAll) * 100) : 0,
          mostProductiveDay,
        },
        byWeek,
        byDayOfWeek,
        byMember,
      },
      status: 200,
    };
  },

  // Search
  "GET /api/todos/search": (url) => {
    const store = getMockStore();
    const query = url.searchParams.get("q")?.toLowerCase() || "";

    const results = store.todos.filter((t) =>
      t.content.toLowerCase().includes(query)
    );

    return { data: results, status: 200 };
  },
};

// URL 패턴 매칭
function matchRoute(method: string, pathname: string): string | null {
  const routes = Object.keys(mockHandlers);

  // 정확한 매칭 먼저
  const exactKey = `${method} ${pathname}`;
  if (routes.includes(exactKey)) {
    return exactKey;
  }

  // 패턴 매칭 (:id 등)
  for (const route of routes) {
    const [routeMethod, routePath] = route.split(" ");
    if (routeMethod !== method) continue;

    const routeParts = routePath.split("/");
    const pathParts = pathname.split("/");

    if (routeParts.length !== pathParts.length) continue;

    let match = true;
    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(":")) continue;
      if (routeParts[i] !== pathParts[i]) {
        match = false;
        break;
      }
    }

    if (match) return route;
  }

  return null;
}

// Mock fetch 함수
export async function mockFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  // 약간의 지연을 추가해서 실제 API처럼 느끼게
  await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200));

  const url = new URL(
    typeof input === "string" ? input : input.toString(),
    window.location.origin
  );
  const method = init?.method || "GET";

  const routeKey = matchRoute(method, url.pathname);

  if (routeKey && mockHandlers[routeKey]) {
    const { data, status } = mockHandlers[routeKey](url, init);

    return new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 매칭되는 핸들러가 없으면 404
  console.warn(`[Mock API] No handler for: ${method} ${url.pathname}`);
  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}

// 전역 fetch 래퍼 (선택적으로 사용)
export function createMockableFetch() {
  const originalFetch = window.fetch.bind(window);

  return async function (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    if (isMockMode()) {
      const url = typeof input === "string" ? input : input.toString();
      // API 경로만 mock 처리
      if (url.startsWith("/api/") || url.includes("/api/")) {
        return mockFetch(input, init);
      }
    }
    return originalFetch(input, init);
  };
}
