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

    // 스트릭 계산을 위한 과거 데이터 조회 (최근 30일)
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dashboardData = await Promise.all(teamMembers.map(async (member: typeof teamMembers[number]) => {
      const todos = member.todos;
      const totalCount = todos.length;
      const completedCount = todos.filter((t: typeof todos[number]) => t.completed).length;
      const dayStart = member.dayStarts[0];

      // 스트릭 계산: 과거 30일간의 데이터 조회
      const pastTodos = await prisma.todo.findMany({
        where: {
          userId: member.id,
          date: {
            gte: thirtyDaysAgo,
            lt: today,
          },
        },
        select: {
          date: true,
          completed: true,
        },
      });

      // 날짜별로 그룹화
      const dailyCompletion: Record<string, { total: number; completed: number }> = {};
      pastTodos.forEach((todo: typeof pastTodos[number]) => {
        const dateKey = todo.date.toISOString().split("T")[0];
        if (!dailyCompletion[dateKey]) {
          dailyCompletion[dateKey] = { total: 0, completed: 0 };
        }
        dailyCompletion[dateKey].total++;
        if (todo.completed) {
          dailyCompletion[dateKey].completed++;
        }
      });

      // 연속 달성일 계산 (오늘부터 역순으로)
      let streak = 0;
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - 1); // 어제부터 시작

      while (true) {
        const dateKey = checkDate.toISOString().split("T")[0];
        const dayData = dailyCompletion[dateKey];

        if (dayData && dayData.total > 0 && dayData.completed === dayData.total) {
          // 100% 완료한 날
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (!dayData || dayData.total === 0) {
          // 투두가 없는 날은 스킵
          checkDate.setDate(checkDate.getDate() - 1);
          if (checkDate < thirtyDaysAgo) break;
        } else {
          // 100% 완료하지 못한 날
          break;
        }

        if (checkDate < thirtyDaysAgo) break;
      }

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
        streak,
      };
    }));

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Dashboard fetch error:", error);
    return NextResponse.json({ error: "대시보드 데이터 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
