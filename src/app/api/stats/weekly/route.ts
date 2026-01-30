import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 주간 통계 조회 (최근 7일)
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

    // 최근 7일 날짜 계산
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    // 최근 7일간의 투두 데이터 조회
    const todos = await prisma.todo.findMany({
      where: {
        teamId: user.teamId,
        date: {
          gte: sevenDaysAgo,
          lte: today,
        },
      },
      select: {
        id: true,
        content: true,
        completed: true,
        date: true,
        userId: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // 날짜별 집계
    const dailyStats: Record<string, { total: number; completed: number; date: string }> = {};
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split("T")[0];
      dailyStats[dateKey] = {
        date: dateKey,
        total: 0,
        completed: 0,
      };
    }

    todos.forEach((todo: typeof todos[number]) => {
      const dateKey = todo.date.toISOString().split("T")[0];
      if (dailyStats[dateKey]) {
        dailyStats[dateKey].total++;
        if (todo.completed) {
          dailyStats[dateKey].completed++;
        }
      }
    });

    const dailyArray = Object.values(dailyStats).map((stat) => ({
      ...stat,
      completionRate: stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0,
    }));

    // 팀원별 통계
    const userStats: Record<string, { name: string; email: string; total: number; completed: number }> = {};
    
    todos.forEach((todo: typeof todos[number]) => {
      if (!userStats[todo.userId]) {
        userStats[todo.userId] = {
          name: todo.user.name || "이름 없음",
          email: todo.user.email,
          total: 0,
          completed: 0,
        };
      }
      userStats[todo.userId].total++;
      if (todo.completed) {
        userStats[todo.userId].completed++;
      }
    });

    const userArray = Object.values(userStats).map((stat) => ({
      ...stat,
      completionRate: stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0,
      score: stat.total > 0 ? (stat.completionRate * 0.7) + (stat.completed * 0.3) : 0,
    }));

    // MVP 계산 (완료율 70% + 완료 개수 30% 가중치)
    let mvp = null;
    if (userArray.length > 0) {
      mvp = userArray.reduce((prev, current) => {
        const prevScore = prev.total > 0 ? (prev.completionRate * 0.7) + (prev.completed * 0.3) : 0;
        const currentScore = current.total > 0 ? (current.completionRate * 0.7) + (current.completed * 0.3) : 0;
        return currentScore > prevScore ? current : prev;
      });
    }

    // 전체 통계
    const totalTodos = todos.length;
    const completedTodos = todos.filter((t: typeof todos[number]) => t.completed).length;
    const overallCompletionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

    return NextResponse.json({
      period: {
        start: sevenDaysAgo.toISOString(),
        end: today.toISOString(),
      },
      overall: {
        total: totalTodos,
        completed: completedTodos,
        completionRate: overallCompletionRate,
      },
      daily: dailyArray,
      byMember: userArray,
      mvp: mvp,
    });
  } catch (error) {
    console.error("Weekly stats fetch error:", error);
    return NextResponse.json({ error: "주간 통계 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
