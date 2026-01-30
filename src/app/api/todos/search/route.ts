import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 할일 검색
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
    const query = searchParams.get("q");

    if (!query || !query.trim()) {
      return NextResponse.json({ error: "검색어를 입력해주세요." }, { status: 400 });
    }

    // 검색 수행 (최근 90일)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    ninetyDaysAgo.setHours(0, 0, 0, 0);

    const todos = await prisma.todo.findMany({
      where: {
        userId: session.user.id,
        content: {
          contains: query.trim(),
          mode: "insensitive",
        },
        date: {
          gte: ninetyDaysAgo,
        },
      },
      orderBy: {
        date: "desc",
      },
      take: 50, // 최대 50개
    });

    // 날짜별로 그룹화
    const groupedByDate: Record<string, typeof todos> = {};
    todos.forEach(todo => {
      const dateKey = todo.date.toISOString().split("T")[0];
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = [];
      }
      groupedByDate[dateKey].push(todo);
    });

    const results = Object.entries(groupedByDate).map(([date, todos]) => ({
      date,
      todos: todos.map(t => ({
        id: t.id,
        content: t.content,
        completed: t.completed,
        carryOverCount: t.carryOverCount,
      })),
    }));

    return NextResponse.json({
      query: query.trim(),
      results,
      totalCount: todos.length,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "검색 중 오류가 발생했습니다." }, { status: 500 });
  }
}
