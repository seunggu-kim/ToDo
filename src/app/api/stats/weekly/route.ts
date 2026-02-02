import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 5분 캐싱 적용 (통계 데이터는 자주 변하지 않음)
export const revalidate = 300;

// 주간 통계 조회 (최근 7일)
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

    // 지난주 데이터 (성장률 계산용)
    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
    const eightDaysAgo = new Date(today);
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 7);

    // 이번 주 투두 데이터 조회
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

    // 지난주 투두 데이터 (성장률 계산용)
    const lastWeekTodos = await prisma.todo.findMany({
      where: {
        teamId: user.teamId,
        date: {
          gte: fourteenDaysAgo,
          lt: eightDaysAgo,
        },
      },
      select: {
        id: true,
        completed: true,
        userId: true,
      },
    });

    // 날짜별 집계 (팀 전체)
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
      const dateKey = todo.date?.toISOString().split("T")[0];
      if (dateKey && dailyStats[dateKey]) {
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

    // 팀원별 통계 (이번 주)
    const userStats: Record<string, {
      userId: string;
      name: string;
      email: string;
      total: number;
      completed: number;
      activeDays: Set<string>;
    }> = {};

    // 팀원별 일별 통계 (개인 추이 그래프용)
    const memberDailyStats: Record<string, Record<string, { total: number; completed: number }>> = {};

    todos.forEach((todo: typeof todos[number]) => {
      const dateKey = todo.date?.toISOString().split("T")[0];

      if (!userStats[todo.userId]) {
        userStats[todo.userId] = {
          userId: todo.userId,
          name: todo.user.name || "이름 없음",
          email: todo.user.email,
          total: 0,
          completed: 0,
          activeDays: new Set(),
        };
        memberDailyStats[todo.userId] = {};
        // 7일 초기화
        for (let i = 0; i < 7; i++) {
          const d = new Date(sevenDaysAgo);
          d.setDate(d.getDate() + i);
          const dk = d.toISOString().split("T")[0];
          memberDailyStats[todo.userId][dk] = { total: 0, completed: 0 };
        }
      }

      userStats[todo.userId].total++;
      if (todo.completed) {
        userStats[todo.userId].completed++;
      }
      if (dateKey) {
        userStats[todo.userId].activeDays.add(dateKey);
        if (memberDailyStats[todo.userId][dateKey]) {
          memberDailyStats[todo.userId][dateKey].total++;
          if (todo.completed) {
            memberDailyStats[todo.userId][dateKey].completed++;
          }
        }
      }
    });

    // 지난주 팀원별 통계 (성장률 계산용)
    const lastWeekUserStats: Record<string, { total: number; completed: number }> = {};
    lastWeekTodos.forEach((todo: typeof lastWeekTodos[number]) => {
      if (!lastWeekUserStats[todo.userId]) {
        lastWeekUserStats[todo.userId] = { total: 0, completed: 0 };
      }
      lastWeekUserStats[todo.userId].total++;
      if (todo.completed) {
        lastWeekUserStats[todo.userId].completed++;
      }
    });

    // 팀원별 최종 통계 배열
    const userArray = Object.values(userStats).map((stat) => {
      const completionRate = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
      const activeDaysCount = stat.activeDays.size;

      // 성장률 계산
      const lastWeek = lastWeekUserStats[stat.userId];
      const lastWeekRate = lastWeek && lastWeek.total > 0
        ? Math.round((lastWeek.completed / lastWeek.total) * 100)
        : 0;
      const growth = completionRate - lastWeekRate;

      return {
        name: stat.name,
        email: stat.email,
        total: stat.total,
        completed: stat.completed,
        completionRate,
        activeDays: activeDaysCount,
        growth,
      };
    });

    // 팀원별 일별 추이 데이터 변환
    const memberDaily = Object.entries(memberDailyStats).map(([userId, dailyData]) => {
      const memberInfo = userStats[userId];
      const daily = Object.entries(dailyData).map(([date, stats]) => ({
        date,
        completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : null,
        total: stats.total,
        completed: stats.completed,
      })).sort((a, b) => a.date.localeCompare(b.date));

      return {
        name: memberInfo?.name || "이름 없음",
        email: memberInfo?.email || "",
        daily,
      };
    });

    // === 하이라이트 계산 ===
    const highlights: {
      completionKing: { name: string; email: string; value: number } | null;
      rateChampion: { name: string; email: string; value: number } | null;
      consistencyMaster: { name: string; email: string; value: number } | null;
      growthStar: { name: string; email: string; value: number } | null;
    } = {
      completionKing: null,
      rateChampion: null,
      consistencyMaster: null,
      growthStar: null,
    };

    if (userArray.length > 0) {
      // 완료왕: 가장 많이 완료한 사람
      const sortedByCompleted = [...userArray].filter(u => u.completed > 0).sort((a, b) => b.completed - a.completed);
      if (sortedByCompleted.length > 0) {
        highlights.completionKing = {
          name: sortedByCompleted[0].name,
          email: sortedByCompleted[0].email,
          value: sortedByCompleted[0].completed,
        };
      }

      // 완료율 챔피언: 가장 높은 완료율 (최소 5개 이상 할일이 있는 사람)
      const sortedByRate = [...userArray].filter(u => u.total >= 5).sort((a, b) => b.completionRate - a.completionRate);
      if (sortedByRate.length > 0) {
        highlights.rateChampion = {
          name: sortedByRate[0].name,
          email: sortedByRate[0].email,
          value: sortedByRate[0].completionRate,
        };
      }

      // 꾸준함의 달인: 활동 일수가 가장 많은 사람 (동점이면 완료율, 최소 3일 이상)
      const sortedByConsistency = [...userArray].filter(u => u.activeDays >= 3).sort((a, b) => {
        if (b.activeDays !== a.activeDays) return b.activeDays - a.activeDays;
        return b.completionRate - a.completionRate;
      });
      if (sortedByConsistency.length > 0) {
        highlights.consistencyMaster = {
          name: sortedByConsistency[0].name,
          email: sortedByConsistency[0].email,
          value: sortedByConsistency[0].activeDays,
        };
      }

      // 성장왕: 전주 대비 성장률이 가장 높은 사람 (최소 0% 초과)
      const sortedByGrowth = [...userArray].filter(u => u.growth > 0).sort((a, b) => b.growth - a.growth);
      if (sortedByGrowth.length > 0) {
        highlights.growthStar = {
          name: sortedByGrowth[0].name,
          email: sortedByGrowth[0].email,
          value: sortedByGrowth[0].growth,
        };
      }
    }

    // === 인사이트 생성 ===
    const insights: string[] = [];

    // 가장 생산적인 날 찾기
    const bestDay = dailyArray.reduce((prev, curr) =>
      (curr.completionRate > prev.completionRate) ? curr : prev
      , dailyArray[0]);

    if (bestDay && bestDay.completionRate > 0) {
      const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
      const bestDayDate = new Date(bestDay.date);
      const dayName = dayNames[bestDayDate.getDay()];
      insights.push(`이번 주는 ${dayName}요일이 가장 생산적이었어요! (${bestDay.completionRate}% 완료)`);
    }

    // 팀 전체 완료율 평가
    const totalTodos = todos.length;
    const completedTodos = todos.filter((t: typeof todos[number]) => t.completed).length;
    const overallCompletionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

    if (overallCompletionRate >= 80) {
      insights.push("🎉 팀 전체 완료율이 80%를 넘었어요! 대단해요!");
    } else if (overallCompletionRate >= 60) {
      insights.push("👍 팀 전체 완료율이 60% 이상이에요. 잘하고 있어요!");
    }

    // MVP (하위 호환용, 기존 로직 유지)
    let mvp = null;
    if (userArray.length > 0) {
      mvp = userArray.reduce((prev, current) => {
        const prevScore = prev.total > 0 ? (prev.completionRate * 0.7) + (prev.completed * 0.3) : 0;
        const currentScore = current.total > 0 ? (current.completionRate * 0.7) + (current.completed * 0.3) : 0;
        return currentScore > prevScore ? current : prev;
      });
    }

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
      memberDaily, // NEW: 팀원별 일별 추이
      byMember: userArray,
      highlights, // NEW: 다양한 하이라이트
      insights, // NEW: 자동 생성 인사이트
      mvp, // deprecated but kept for compat
    });
  } catch (error) {
    console.error("Weekly stats fetch error:", error);
    return NextResponse.json({ error: "주간 통계 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
