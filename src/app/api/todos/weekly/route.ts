import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 주간 할일 요약 조회
export async function GET(request: Request) {
  try {
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
    const startDateParam = searchParams.get("startDate");
    
    // startDate가 없으면 이번 주 월요일부터 시작
    const startDate = startDateParam ? new Date(startDateParam) : getMonday(new Date());
    startDate.setHours(0, 0, 0, 0);

    // 7일치 데이터 생성
    const weekData = [];
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      currentDate.setHours(0, 0, 0, 0);

      const todos = await prisma.todo.findMany({
        where: {
          userId: session.user.id,
          date: currentDate,
        },
      });

      const totalCount = todos.length;
      const completedCount = todos.filter(t => t.completed).length;
      const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

      weekData.push({
        date: currentDate.toISOString().split("T")[0],
        totalCount,
        completedCount,
        progress,
      });
    }

    return NextResponse.json(weekData);
  } catch (error) {
    console.error("Weekly todos fetch error:", error);
    return NextResponse.json({ error: "주간 할일 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// 이번 주 월요일 날짜 구하기
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 일요일이면 -6, 아니면 +1
  return new Date(d.setDate(diff));
}
