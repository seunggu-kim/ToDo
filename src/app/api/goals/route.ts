import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// 개발 환경 체크
const isDev = process.env.NODE_ENV === "development";

// D-day 계산 헬퍼
function calculateDday(targetDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// 개발용 목업 데이터
function getMockGoals() {
  const today = new Date();

  // 다양한 D-day 상황을 보여주는 목데이터
  const mockGoals = [
    {
      id: "goal-1",
      name: "MVP 출시",
      targetDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // D-2
      completed: false,
      createdBy: { id: "user-1", name: "김개발" },
    },
    {
      id: "goal-2",
      name: "첫 빌드",
      targetDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // D-7
      completed: false,
      createdBy: { id: "user-1", name: "김개발" },
    },
    {
      id: "goal-3",
      name: "베타 테스트",
      targetDate: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString(), // D-21
      completed: false,
      createdBy: { id: "user-2", name: "이디자인" },
    },
  ];

  return mockGoals.map((goal) => ({
    ...goal,
    dday: calculateDday(new Date(goal.targetDate)),
  }));
}

// 팀 목표 목록 조회 (미완료 목표, 날짜순)
export async function GET() {
  try {
    // 개발 환경: 목업 데이터 반환
    if (isDev) {
      return NextResponse.json(getMockGoals());
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

    const goals = await prisma.teamGoal.findMany({
      where: {
        teamId: user.teamId,
        completed: false,
      },
      orderBy: {
        targetDate: "asc",
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const goalsWithDday = goals.map((goal) => ({
      ...goal,
      dday: calculateDday(new Date(goal.targetDate)),
    }));

    return NextResponse.json(goalsWithDday);
  } catch (error) {
    console.error("Error fetching goals:", error);
    return NextResponse.json({ error: "목표 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// 새 목표 생성
export async function POST(request: Request) {
  try {
    const { name, targetDate } = await request.json();

    // 개발 환경: 목업 응답
    if (isDev) {
      const parsedDate = new Date(targetDate);
      const newGoal = {
        id: `goal-${Date.now()}`,
        name: name.trim(),
        targetDate: parsedDate.toISOString(),
        completed: false,
        createdBy: { id: "user-1", name: "개발자" },
        dday: calculateDday(parsedDate),
      };
      return NextResponse.json(newGoal, { status: 201 });
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

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "목표 이름을 입력해주세요." }, { status: 400 });
    }

    if (!targetDate) {
      return NextResponse.json({ error: "목표 날짜를 선택해주세요." }, { status: 400 });
    }

    const parsedDate = new Date(targetDate);
    parsedDate.setHours(0, 0, 0, 0);

    const goal = await prisma.teamGoal.create({
      data: {
        name: name.trim(),
        targetDate: parsedDate,
        teamId: user.teamId,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ ...goal, dday: calculateDday(parsedDate) }, { status: 201 });
  } catch (error) {
    console.error("Error creating goal:", error);
    return NextResponse.json({ error: "목표 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
