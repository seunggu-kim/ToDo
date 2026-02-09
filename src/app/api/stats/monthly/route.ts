import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 5분 캐싱 적용 (통계 데이터는 자주 변하지 않음)
export const revalidate = 300;

// 월간 통계 조회 (최근 30일)
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { teamId: true, email: true },
    });

    if (!user?.teamId) {
      return NextResponse.json({ error: "팀에 속해 있지 않습니다." }, { status: 400 });
    }

    // 최근 30일 날짜 계산
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

    // 이전 30일 (전월 대비 비교용)
    const prevPeriodEnd = new Date(thirtyDaysAgo);
    prevPeriodEnd.setDate(prevPeriodEnd.getDate() - 1);
    prevPeriodEnd.setHours(23, 59, 59, 999);
    const prevPeriodStart = new Date(prevPeriodEnd);
    prevPeriodStart.setDate(prevPeriodStart.getDate() - 29);
    prevPeriodStart.setHours(0, 0, 0, 0);

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
        carryOverCount: true,
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

    // 이전 30일 투두 데이터 (전월 비교용)
    const prevTodos = await prisma.todo.findMany({
      where: {
        teamId: user.teamId,
        date: {
          gte: prevPeriodStart,
          lte: prevPeriodEnd,
        },
      },
      select: {
        id: true,
        completed: true,
        userId: true,
      },
    });

    // 요일별 집계 — 신규/이월 구분
    const dayOfWeekStats: Record<number, { total: number; newTodos: number; carriedOver: number; completed: number }> = {
      0: { total: 0, newTodos: 0, carriedOver: 0, completed: 0 }, // 일요일
      1: { total: 0, newTodos: 0, carriedOver: 0, completed: 0 },
      2: { total: 0, newTodos: 0, carriedOver: 0, completed: 0 },
      3: { total: 0, newTodos: 0, carriedOver: 0, completed: 0 },
      4: { total: 0, newTodos: 0, carriedOver: 0, completed: 0 },
      5: { total: 0, newTodos: 0, carriedOver: 0, completed: 0 },
      6: { total: 0, newTodos: 0, carriedOver: 0, completed: 0 }, // 토요일
    };

    const dayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

    todos.forEach((todo: typeof todos[number]) => {
      if (!todo.date) return; // 백로그는 스킵
      const dayOfWeek = todo.date.getDay();
      dayOfWeekStats[dayOfWeek].total++;
      if (todo.carryOverCount > 0) {
        dayOfWeekStats[dayOfWeek].carriedOver++;
      } else {
        dayOfWeekStats[dayOfWeek].newTodos++;
      }
      if (todo.completed) {
        dayOfWeekStats[dayOfWeek].completed++;
      }
    });

    const byDayOfWeek = Object.entries(dayOfWeekStats).map(([day, stats]) => ({
      day: dayNames[parseInt(day)],
      total: stats.total,
      newTodos: stats.newTodos,
      carriedOver: stats.carriedOver,
      completed: stats.completed,
      completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
    }));

    // 주차별 집계 (4주) — 신규/이월 구분
    const weeklyStats: Array<{ week: string; total: number; newTodos: number; carriedOver: number; completed: number }> = [];

    for (let i = 0; i < 4; i++) {
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() - (i * 7));

      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 6);

      const weekTodos = todos.filter((todo: typeof todos[number]) => {
        if (!todo.date) return false; // 백로그는 스킵
        const todoDate = new Date(todo.date);
        return todoDate >= weekStart && todoDate <= weekEnd;
      });

      weeklyStats.unshift({
        week: `${weekStart.getMonth() + 1}/${weekStart.getDate()} - ${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`,
        total: weekTodos.length,
        newTodos: weekTodos.filter((t: typeof weekTodos[number]) => t.carryOverCount === 0).length,
        carriedOver: weekTodos.filter((t: typeof weekTodos[number]) => t.carryOverCount > 0).length,
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
      .sort((a, b) => b.completed - a.completed);

    // 전체 통계
    const totalTodos = todos.length;
    const completedTodos = todos.filter((t: typeof todos[number]) => t.completed).length;
    const carryOverTotal = todos.filter((t: typeof todos[number]) => t.carryOverCount > 0).length;
    const newTodosTotal = totalTodos - carryOverTotal;
    const overallCompletionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

    // 가장 생산적인 요일 찾기 (완료 수 기준)
    const mostProductiveDay = byDayOfWeek.reduce((prev, current) =>
      (current.completed > prev.completed) ? current : prev
    );

    // 전월 통계
    const prevTotal = prevTodos.length;
    const prevCompleted = prevTodos.filter((t: typeof prevTodos[number]) => t.completed).length;
    const prevCompletionRate = prevTotal > 0 ? Math.round((prevCompleted / prevTotal) * 100) : 0;

    // 전월 팀원별 통계 (성장왕 계산용)
    const prevUserStats: Record<string, { total: number; completed: number }> = {};
    prevTodos.forEach((todo: typeof prevTodos[number]) => {
      if (!prevUserStats[todo.userId]) {
        prevUserStats[todo.userId] = { total: 0, completed: 0 };
      }
      prevUserStats[todo.userId].total++;
      if (todo.completed) {
        prevUserStats[todo.userId].completed++;
      }
    });

    // === 하이라이트 계산 ===
    const highlights: {
      completionKing: { name: string; email: string; value: number } | null;
      rateChampion: { name: string; email: string; value: number } | null;
      growthStar: { name: string; email: string; value: number } | null;
    } = {
      completionKing: null,
      rateChampion: null,
      growthStar: null,
    };

    if (userArray.length > 0) {
      // 완료왕: 가장 많이 완료한 사람 (이미 completed 기준 정렬됨)
      if (userArray[0].completed > 0) {
        highlights.completionKing = {
          name: userArray[0].name,
          email: userArray[0].email,
          value: userArray[0].completed,
        };
      }

      // 완료율 챔피언: 가장 높은 완료율 (월간은 최소 10개 이상)
      const sortedByRate = [...userArray].filter(u => u.total >= 10).sort((a, b) => b.completionRate - a.completionRate);
      if (sortedByRate.length > 0) {
        highlights.rateChampion = {
          name: sortedByRate[0].name,
          email: sortedByRate[0].email,
          value: sortedByRate[0].completionRate,
        };
      }

      // 성장왕: 전월 대비 성장률 (전월 최소 10개 이상)
      const userIdByEmail: Record<string, string> = {};
      Object.entries(userStats).forEach(([userId, stat]) => {
        userIdByEmail[stat.email] = userId;
      });

      const growthCandidates = userArray
        .map(u => {
          const userId = userIdByEmail[u.email];
          const prevData = userId ? prevUserStats[userId] : null;
          const hasPrevData = prevData && prevData.total >= 10;
          const prevRate = hasPrevData ? Math.round((prevData.completed / prevData.total) * 100) : null;
          const growth = prevRate !== null ? u.completionRate - prevRate : null;
          return { ...u, growth };
        })
        .filter(u => u.growth !== null && u.growth > 0)
        .sort((a, b) => (b.growth ?? 0) - (a.growth ?? 0));

      if (growthCandidates.length > 0) {
        highlights.growthStar = {
          name: growthCandidates[0].name,
          email: growthCandidates[0].email,
          value: growthCandidates[0].growth!,
        };
      }
    }

    // === 인사이트 생성 ===
    const insights: string[] = [];

    // 전월 대비 변화
    if (prevTotal > 0 && totalTodos > 0) {
      const rateDiff = overallCompletionRate - prevCompletionRate;
      if (rateDiff > 5) {
        insights.push(`전월 대비 팀 완료율이 ${rateDiff}%p 상승했어요!`);
      } else if (rateDiff < -5) {
        insights.push(`전월 대비 팀 완료율이 ${Math.abs(rateDiff)}%p 하락했어요.`);
      }
    }

    // 가장 높은 완료율을 보인 주차
    if (weeklyArray.length > 0) {
      const bestWeek = weeklyArray.reduce((prev, curr) =>
        curr.completionRate > prev.completionRate ? curr : prev
      );
      if (bestWeek.completionRate > 0) {
        insights.push(`${bestWeek.week} 주간이 가장 높은 완료율을 보였어요. (${bestWeek.completionRate}%)`);
      }
    }

    // 요일 패턴
    if (mostProductiveDay.completed >= 2) {
      insights.push(`${mostProductiveDay.day}에 가장 많이 완료하는 경향이 있어요. (${mostProductiveDay.completed}개)`);
    }

    // 이월 비율 인사이트
    if (totalTodos > 0 && carryOverTotal > 0) {
      const carryOverRate = Math.round((carryOverTotal / totalTodos) * 100);
      if (carryOverRate >= 40) {
        insights.push(`이월 투두 비율이 ${carryOverRate}%에요. 업무량 조절을 고려해 보세요.`);
      } else if (carryOverRate >= 20) {
        insights.push(`이월 투두가 ${carryOverTotal}개(${carryOverRate}%)로 적정 수준이에요.`);
      }
    }

    // 전체 평가
    if (overallCompletionRate >= 80) {
      insights.push("팀 완료율이 80%를 넘었어요! 대단해요!");
    } else if (overallCompletionRate >= 60) {
      insights.push("팀 완료율이 60% 이상이에요. 잘하고 있어요!");
    }

    return NextResponse.json({
      period: {
        start: thirtyDaysAgo.toISOString(),
        end: today.toISOString(),
      },
      currentUserEmail: user!.email,
      overall: {
        total: totalTodos,
        newTodos: newTodosTotal,
        carryOver: carryOverTotal,
        completed: completedTodos,
        completionRate: overallCompletionRate,
        mostProductiveDay: mostProductiveDay.day,
      },
      previousPeriod: {
        total: prevTotal,
        completed: prevCompleted,
        completionRate: prevCompletionRate,
      },
      byWeek: weeklyArray,
      byDayOfWeek,
      byMember: userArray,
      highlights,
      insights,
    });
  } catch (error) {
    console.error("Monthly stats fetch error:", error);
    return NextResponse.json({ error: "월간 통계 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
