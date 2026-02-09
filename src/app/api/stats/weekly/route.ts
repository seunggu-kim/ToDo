import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 5분 캐싱 적용 (통계 데이터는 자주 변하지 않음)
export const revalidate = 300;

// 주간 통계 조회 (날짜 범위 지정 가능)
export async function GET(request: Request) {
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

    // URL 파라미터에서 날짜 범위 가져오기
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    let startDate: Date;
    let endDate: Date;

    if (startDateParam && endDateParam) {
      // 파라미터가 있으면 해당 범위 사용
      startDate = new Date(startDateParam);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // 파라미터가 없으면 현재 주간 (화~월) 계산
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const day = today.getDay(); // 0(Sun) - 6(Sat)

      // 화요일 기준으로 주간 계산
      const diffToTue = day < 2 ? -(day + 5) : -(day - 2);
      startDate = new Date(today);
      startDate.setDate(today.getDate() + diffToTue);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    }

    // 지난주 데이터 (성장률 계산 + 전주 대비 비교용)
    const prevWeekStart = new Date(startDate);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekEnd = new Date(startDate);
    prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);
    prevWeekEnd.setHours(23, 59, 59, 999);

    // 이번 주 투두 데이터 조회
    const todos = await prisma.todo.findMany({
      where: {
        teamId: user.teamId,
        date: {
          gte: startDate,
          lte: endDate,
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

    // 지난주 투두 데이터 (성장률 + 전주 비교용)
    const lastWeekTodos = await prisma.todo.findMany({
      where: {
        teamId: user.teamId,
        date: {
          gte: prevWeekStart,
          lte: prevWeekEnd,
        },
      },
      select: {
        id: true,
        completed: true,
        userId: true,
      },
    });

    // 팀원들의 dayStart 데이터 조회 (업무 시작 기준 꾸준함 계산용)
    const teamMembers = await prisma.user.findMany({
      where: { teamId: user.teamId },
      select: { id: true, name: true, email: true },
    });

    const dayStartsInWeek = await prisma.dayStart.findMany({
      where: {
        userId: { in: teamMembers.map(m => m.id) },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        userId: true,
        date: true,
      },
    });

    // 팀원별 업무 시작 일수 계산
    const memberDayStartCounts: Record<string, number> = {};
    dayStartsInWeek.forEach((ds) => {
      if (!memberDayStartCounts[ds.userId]) {
        memberDayStartCounts[ds.userId] = 0;
      }
      memberDayStartCounts[ds.userId]++;
    });

    // 날짜별 집계 (팀 전체) — 신규/이월 구분
    const dailyStats: Record<string, { total: number; newTodos: number; carriedOver: number; completed: number; date: string }> = {};

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split("T")[0];
      dailyStats[dateKey] = {
        date: dateKey,
        total: 0,
        newTodos: 0,
        carriedOver: 0,
        completed: 0,
      };
    }

    todos.forEach((todo: typeof todos[number]) => {
      const dateKey = todo.date?.toISOString().split("T")[0];
      if (dateKey && dailyStats[dateKey]) {
        dailyStats[dateKey].total++;
        if (todo.carryOverCount > 0) {
          dailyStats[dateKey].carriedOver++;
        } else {
          dailyStats[dateKey].newTodos++;
        }
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
          const d = new Date(startDate);
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

      // 성장률 계산: 전주에 최소 3개 이상 등록한 사람만 의미있는 비교 가능
      const lastWeek = lastWeekUserStats[stat.userId];
      const hasLastWeekData = lastWeek && lastWeek.total >= 3;
      const lastWeekRate = hasLastWeekData
        ? Math.round((lastWeek.completed / lastWeek.total) * 100)
        : 0;

      return {
        name: stat.name,
        email: stat.email,
        total: stat.total,
        completed: stat.completed,
        completionRate,
        activeDays: activeDaysCount,
        growth: hasLastWeekData ? completionRate - lastWeekRate : undefined,
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

      // 꾸준함의 달인: 업무 시작 일수가 가장 많은 사람 (동점이면 완료율, 최소 3일 이상)
      const membersWithDayStarts = teamMembers.map(m => {
        const userStat = userArray.find(u => u.email === m.email);
        return {
          name: m.name || "이름 없음",
          email: m.email,
          dayStartCount: memberDayStartCounts[m.id] || 0,
          completionRate: userStat?.completionRate || 0,
        };
      }).filter(m => m.dayStartCount >= 3);

      const sortedByConsistency = membersWithDayStarts.sort((a, b) => {
        if (b.dayStartCount !== a.dayStartCount) return b.dayStartCount - a.dayStartCount;
        return b.completionRate - a.completionRate;
      });
      if (sortedByConsistency.length > 0) {
        highlights.consistencyMaster = {
          name: sortedByConsistency[0].name,
          email: sortedByConsistency[0].email,
          value: sortedByConsistency[0].dayStartCount,
        };
      }

      // 성장왕: 전주 대비 성장률이 가장 높은 사람 (전주 3개 이상 등록한 사람만)
      const sortedByGrowth = [...userArray]
        .filter(u => u.growth !== undefined && u.growth > 0)
        .sort((a, b) => (b.growth ?? 0) - (a.growth ?? 0));
      if (sortedByGrowth.length > 0) {
        highlights.growthStar = {
          name: sortedByGrowth[0].name,
          email: sortedByGrowth[0].email,
          value: sortedByGrowth[0].growth!,
        };
      }
    }

    // === 인사이트 생성 ===
    const insights: string[] = [];

    // 팀 전체 통계
    const totalTodos = todos.length;
    const completedTodos = todos.filter((t: typeof todos[number]) => t.completed).length;
    const carryOverTotal = todos.filter((t: typeof todos[number]) => t.carryOverCount > 0).length;
    const newTodosTotal = totalTodos - carryOverTotal;
    const overallCompletionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

    // 전주 통계
    const prevTotal = lastWeekTodos.length;
    const prevCompleted = lastWeekTodos.filter((t: typeof lastWeekTodos[number]) => t.completed).length;
    const prevCompletionRate = prevTotal > 0 ? Math.round((prevCompleted / prevTotal) * 100) : 0;

    // 전주 대비 변화
    if (prevTotal > 0 && totalTodos > 0) {
      const rateDiff = overallCompletionRate - prevCompletionRate;
      if (rateDiff > 5) {
        insights.push(`전주 대비 팀 완료율이 ${rateDiff}%p 상승했어요!`);
      } else if (rateDiff < -5) {
        insights.push(`전주 대비 팀 완료율이 ${Math.abs(rateDiff)}%p 하락했어요.`);
      }
    }

    // 가장 많이 완료한 날 찾기 (최소 2개 이상일 때만 의미)
    const bestDay = dailyArray.reduce((prev, curr) =>
      (curr.completed > prev.completed) ? curr : prev
      , dailyArray[0]);

    if (bestDay && bestDay.completed >= 2) {
      const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
      const bestDayDate = new Date(bestDay.date);
      const dayName = dayNames[bestDayDate.getDay()];
      insights.push(`${dayName}요일에 가장 많이 완료했어요! (${bestDay.completed}개)`);
    }

    // 이월 비율 인사이트
    if (totalTodos > 0 && carryOverTotal > 0) {
      const carryOverRate = Math.round((carryOverTotal / totalTodos) * 100);
      if (carryOverRate >= 40) {
        insights.push(`이월 투두 비율이 ${carryOverRate}%에요. 업무 분배를 점검해 보세요.`);
      } else if (carryOverRate >= 20) {
        insights.push(`이월 투두가 ${carryOverTotal}개(${carryOverRate}%)로 적정 수준이에요.`);
      }
    }

    // 팀 전체 완료율 평가
    if (overallCompletionRate >= 80) {
      insights.push("팀 완료율이 80%를 넘었어요! 대단해요!");
    } else if (overallCompletionRate >= 60) {
      insights.push("팀 완료율이 60% 이상이에요. 잘하고 있어요!");
    }

    return NextResponse.json({
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      currentUserEmail: user!.email,
      overall: {
        total: totalTodos,
        newTodos: newTodosTotal,
        carryOver: carryOverTotal,
        completed: completedTodos,
        completionRate: overallCompletionRate,
      },
      previousPeriod: {
        total: prevTotal,
        completed: prevCompleted,
        completionRate: prevCompletionRate,
      },
      daily: dailyArray,
      memberDaily,
      byMember: userArray,
      highlights,
      insights,
    });
  } catch (error) {
    console.error("Weekly stats fetch error:", error);
    return NextResponse.json({ error: "주간 통계 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
