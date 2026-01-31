import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// 개발 환경 체크
const isDev = process.env.NODE_ENV === "development";

// 개발용 목업 데이터
const mockTodos = [
  { id: "1", content: "드래그 앤 드롭 테스트", date: new Date().toISOString().split('T')[0], completed: false, carryOverCount: 0, priority: 1 },
  { id: "2", content: "백로그에서 오늘로 이동하기", date: new Date().toISOString().split('T')[0], completed: false, carryOverCount: 0, priority: 0 },
  { id: "3", content: "완료된 할일 체크하기", date: new Date().toISOString().split('T')[0], completed: true, carryOverCount: 0, priority: 0 },
];

const mockBacklog = [
  { id: "b1", content: "나중에 할 일 1", date: null, completed: false, carryOverCount: 0, priority: 0 },
  { id: "b2", content: "나중에 할 일 2", date: null, completed: false, carryOverCount: 0, priority: 0 },
];

// 투두 목록 조회 (날짜별 또는 백로그)
export async function GET(request: Request) {
  try {
    // 개발 환경: 목업 데이터 반환
    if (isDev) {
      const { searchParams } = new URL(request.url);
      const backlog = searchParams.get("backlog");

      if (backlog === "true") {
        return NextResponse.json(mockBacklog);
      }
      return NextResponse.json(mockTodos);
    }

    // 프로덕션: 실제 DB 사용
    const { prisma } = await import("@/lib/prisma");
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { teamId: true },
    });

    if (!user?.teamId) {
      return NextResponse.json({ error: "팀에 속해 있지 않습니다." }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const backlog = searchParams.get("backlog");

    // 백로그 조회: 날짜가 없는 할일들
    if (backlog === "true") {
      const todos = await prisma.todo.findMany({
        where: {
          userId: session.user.id,
          date: null,
        },
        orderBy: [
          { priority: "desc" },
          { createdAt: "asc" },
        ],
      });
      return NextResponse.json(todos);
    }

    // 날짜별 조회: 날짜 파라미터가 없으면 오늘 날짜 사용
    const date = dateParam ? new Date(dateParam) : new Date();
    date.setHours(0, 0, 0, 0);

    const todos = await prisma.todo.findMany({
      where: {
        userId: session.user.id,
        date,
      },
      orderBy: [
        { priority: "desc" },
        { createdAt: "asc" },
      ],
    });

    return NextResponse.json(todos);
  } catch (error) {
    console.error("Error fetching todos:", error);
    return NextResponse.json({ error: "Failed to fetch todos" }, { status: 500 });
  }
}

// 투두 생성
export async function POST(request: Request) {
  try {
    // 개발 환경: 목업 응답
    if (isDev) {
      const { content, isBacklog } = await request.json();
      const newTodo = {
        id: `dev-${Date.now()}`,
        content,
        date: isBacklog ? null : new Date().toISOString().split('T')[0],
        completed: false,
        carryOverCount: 0,
        priority: 0,
      };
      return NextResponse.json(newTodo, { status: 201 });
    }

    // 프로덕션: 실제 DB 사용
    const { prisma } = await import("@/lib/prisma");
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { teamId: true },
    });

    if (!user?.teamId) {
      return NextResponse.json({ error: "팀에 속해 있지 않습니다." }, { status: 400 });
    }

    const { content, date: dateParam, isBacklog } = await request.json();

    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "내용을 입력해주세요." }, { status: 400 });
    }

    // 백로그인 경우 날짜를 null로 설정
    let date: Date | null = null;
    if (!isBacklog && dateParam !== null) {
      date = dateParam ? new Date(dateParam) : new Date();
      date.setHours(0, 0, 0, 0);
    }

    const todo = await prisma.todo.create({
      data: {
        content,
        date,
        userId: session.user.id,
        teamId: user.teamId,
      },
    });

    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    console.error("Error creating todo:", error);
    return NextResponse.json({ error: "Failed to create todo" }, { status: 500 });
  }
}
