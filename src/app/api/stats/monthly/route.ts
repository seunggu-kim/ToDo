import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 월간 통계 조회 (최근 30일)
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

    // 최근 30일 날짜 계산
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

    // 최근 30일간의 투두 데이터 조회
    const todos = await prisma.todo.findMany({
      where: {
        teamId: user.teamId,
        date: {
          gte: thirtyDaysAgo,
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

    // 요일별 집계
    const dayOfWeekStats: Record<number, { total: number; completed: number }> = {
      0: { total: 0, completed: 0 }, // 일요일
      1: { total: 0, completed: 0 },
      2: { total: 0, completed: 0 },
      3: { total: 0, completed: 0 },
      4: { total: 0, completed: 0 },
      5: { total: 0, completed: 0 },
      6: { total: 0, completed: 0 }, // 토요일
    };

    const dayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

    todos.forEach((todo: typeof todos[number]) => {
      const dayOfWeek = todo.date.getDay();
      dayOfWeekStats[dayOfWeek].total++;
      if (todo.completed) {
        dayOfWeekStats[dayOfWeek].completed++;
      }
    });

    const byDayOfWeek = Object.entries(dayOfWeekStats).map(([day, stats]) => ({
      day: dayNames[parseInt(day)],
      total: stats.total,
      completed: stats.completed,
      completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
    }));

    // 주차별 집계 (4주)
    const weeklyStats: Array<{ week: string; total: number; completed: number }> = [];
    
    for (let i = 0; i < 4; i++) {
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() - (i * 7));
      
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 6);

      const weekTodos = todos.filter((todo: typeof todos[number]) => {
        const todoDate = new Date(todo.date);
        return todoDate >= weekStart && todoDate <= weekEnd;
      });

      weeklyStats.unshift({
        week: `${weekStart.getMonth() + 1}/${weekStart.getDate()} - ${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`,
        total: weekTodos.length,
        completed: weekTodos.filter((t: typeof weekTodos[number]) => t.completed).length,
      });
    }

    const weeklyArray = weeklyStats.map((stat) => ({
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

    const userArray = Object.values(userStats)
      .map((stat) => ({
        ...stat,
        completionRate: stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0,
      }))
      .sort((a, b) => b.completionRate - a.completionRate);

    // 전체 통계
    const totalTodos = todos.length;
    const completedTodos = todos.filter((t: typeof todos[number]) => t.completed).length;
    const overallCompletionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

    // 가장 생산적인 요일 찾기
    const mostProductiveDay = byDayOfWeek.reduce((prev, current) => 
      (current.completed > prev.completed) ? current : prev
    );

    return NextResponse.json({
      period: {
        start: thirtyDaysAgo.toISOString(),
        end: today.toISOString(),
      },
      overall: {
        total: totalTodos,
        completed: completedTodos,
        completionRate: overallCompletionRate,
        mostProductiveDay: mostProductiveDay.day,
      },
      byWeek: weeklyArray,
      byDayOfWeek,
      byMember: userArray,
    });
  } catch (error) {
    console.error("Monthly stats fetch error:", error);
    return NextResponse.json({ error: "월간 통계 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
