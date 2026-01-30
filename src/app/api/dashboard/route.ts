import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 팀 대시보드 데이터 조회
export async function GET() {
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 팀 멤버들의 오늘 데이터 가져오기
    const teamMembers = await prisma.user.findMany({
      where: { teamId: user.teamId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        todos: {
          where: { date: today },
          select: {
            id: true,
            content: true,
            completed: true,
            carryOverCount: true,
          },
          orderBy: [
            { completed: "asc" },
            { priority: "desc" },
          ],
        },
        dayStarts: {
          where: { date: today },
          select: {
            startedAt: true,
          },
        },
      },
    });

    const dashboardData = teamMembers.map((member: typeof teamMembers[number]) => {
      const todos = member.todos;
      const totalCount = todos.length;
      const completedCount = todos.filter((t) => t.completed).length;
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

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Dashboard fetch error:", error);
    return NextResponse.json({ error: "대시보드 데이터 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
