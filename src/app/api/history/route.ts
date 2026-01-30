import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 날짜별 히스토리 조회
export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    
    if (!dateParam) {
      return NextResponse.json({ error: "날짜를 지정해주세요." }, { status: 400 });
    }

    const date = new Date(dateParam);
    date.setHours(0, 0, 0, 0);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { teamId: true },
    });

    if (!user?.teamId) {
      return NextResponse.json({ error: "팀에 속해 있지 않습니다." }, { status: 400 });
    }

    // 해당 날짜의 팀 전체 데이터 조회
    const teamMembers = await prisma.user.findMany({
      where: { teamId: user.teamId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        todos: {
          where: { date },
          select: {
            id: true,
            content: true,
            completed: true,
            carryOverCount: true,
            completedAt: true,
          },
          orderBy: [
            { completed: "asc" },
            { priority: "desc" },
          ],
        },
        dayStarts: {
          where: { date },
          select: {
            startedAt: true,
          },
        },
      },
    });

    const historyData = teamMembers.map((member: typeof teamMembers[number]) => {
      const todos = member.todos;
      const totalCount = todos.length;
      const completedCount = todos.filter((t: typeof todos[number]) => t.completed).length;
      const dayStart = member.dayStarts[0];

      return {
        id: member.id,
        name: member.name,
        email: member.email,
        image: member.image,
        todos,
        totalCount,
        completedCount,
        progress: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
        started: !!dayStart,
        startedAt: dayStart?.startedAt,
      };
    });

    return NextResponse.json({
      date: date.toISOString(),
      members: historyData,
    });
  } catch (error) {
    console.error("History fetch error:", error);
    return NextResponse.json({ error: "히스토리 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
