// Mock 데이터 정의
// NEXT_PUBLIC_MOCK_MODE=true 일 때 사용됩니다

export interface MockTodoImage {
  id: string;
  url: string;
  filename: string;
  size: number;
  order: number;
}

export interface MockTodo {
  id: string;
  content: string;
  completed: boolean;
  carryOverCount: number;
  date: string | null;
  priority: number;
  images?: MockTodoImage[];
}

export interface MockTemplate {
  id: string;
  content: string;
  createdAt: string;
}

export interface MockGoal {
  id: string;
  name: string;
  targetDate: string;
  completed: boolean;
  createdBy: { id: string; name: string };
}

export interface MockTeamMember {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

export interface MockTeam {
  id: string;
  name: string;
  inviteCode: string;
  members: MockTeamMember[];
}

// 오늘 날짜 기준으로 날짜 생성
const today = new Date();
const formatDate = (d: Date) => d.toISOString().split("T")[0];
const addDays = (d: Date, days: number) => {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
};

// 초기 Mock 데이터
export const initialMockData = {
  user: {
    id: "mock-user-1",
    name: "테스트 유저",
    email: "test@example.com",
    teamId: "mock-team-1",
  },

  team: {
    id: "mock-team-1",
    name: "개발팀",
    inviteCode: "ABC123",
    members: [
      { id: "mock-user-1", name: "테스트 유저", email: "test@example.com", image: null },
      { id: "mock-user-2", name: "김철수", email: "chulsu@example.com", image: null },
      { id: "mock-user-3", name: "이영희", email: "younghee@example.com", image: null },
    ],
  } as MockTeam,

  todos: [
    // 오늘 할 일
    { id: "todo-1", content: "프로젝트 기획서 작성", completed: false, carryOverCount: 0, date: formatDate(today), priority: 2 },
    { id: "todo-2", content: "코드 리뷰 진행", completed: true, carryOverCount: 0, date: formatDate(today), priority: 1 },
    { id: "todo-3", content: "버그 수정 - 로그인 이슈", completed: false, carryOverCount: 1, date: formatDate(today), priority: 3 },
    // 어제 할 일
    { id: "todo-4", content: "회의 준비", completed: true, carryOverCount: 0, date: formatDate(addDays(today, -1)), priority: 1 },
    { id: "todo-5", content: "문서 정리", completed: true, carryOverCount: 0, date: formatDate(addDays(today, -1)), priority: 0 },
    // 내일 할 일
    { id: "todo-6", content: "배포 준비", completed: false, carryOverCount: 0, date: formatDate(addDays(today, 1)), priority: 2 },
    // 백로그 (날짜 없음)
    { id: "todo-7", content: "리팩토링 - 유틸 함수", completed: false, carryOverCount: 0, date: null, priority: 0 },
    { id: "todo-8", content: "테스트 코드 작성", completed: false, carryOverCount: 0, date: null, priority: 0 },
    { id: "todo-9", content: "README 업데이트", completed: false, carryOverCount: 0, date: null, priority: 0 },
  ] as MockTodo[],

  templates: [
    { id: "tpl-1", content: "데일리 스탠드업", createdAt: "2024-01-01T00:00:00Z" },
    { id: "tpl-2", content: "코드 리뷰", createdAt: "2024-01-01T00:00:00Z" },
    { id: "tpl-3", content: "문서 작성", createdAt: "2024-01-01T00:00:00Z" },
  ] as MockTemplate[],

  goals: [
    { id: "goal-1", name: "MVP 출시", targetDate: formatDate(addDays(today, 14)), completed: false, createdBy: { id: "mock-user-1", name: "테스트 유저" } },
    { id: "goal-2", name: "베타 테스트 시작", targetDate: formatDate(addDays(today, 7)), completed: false, createdBy: { id: "mock-user-2", name: "김철수" } },
    { id: "goal-3", name: "디자인 리뷰", targetDate: formatDate(addDays(today, 3)), completed: false, createdBy: { id: "mock-user-1", name: "테스트 유저" } },
  ] as MockGoal[],

  dayStarts: [
    { userId: "mock-user-1", date: formatDate(today), startedAt: new Date().toISOString() },
  ],
};

// 타입
export type MockDataStore = typeof initialMockData;
