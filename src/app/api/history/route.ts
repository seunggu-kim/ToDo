import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 날짜별 히스토리 조회
// 날짜별 또는 기간별 히스토리 조회
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    let dateFilter: any = {};
    let isRange = false;

    if (startDateParam && endDateParam) {
      isRange = true;
      const start = new Date(startDateParam);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDateParam);
      end.setHours(23, 59, 59, 999);

      dateFilter = {
        gte: start,
        lte: end,
      };
    } else if (dateParam) {
      const date = new Date(dateParam);
      date.setHours(0, 0, 0, 0);
      dateFilter = date;
    } else {
      return NextResponse.json({ error: "날짜 또는 기간을 지정해주세요." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { teamId: true },
    });

    if (!user?.teamId) {
      return NextResponse.json({ error: "팀에 속해 있지 않습니다." }, { status: 400 });
    }

    // 해당 날짜/기간의 팀 전체 데이터 조회
    const teamMembers = await prisma.user.findMany({
      where: { teamId: user.teamId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        todos: {
          where: { date: dateFilter },
          select: {
            id: true,
            content: true,
            completed: true,
            carryOverCount: true,
            completedAt: true,
            date: true,
          },
          orderBy: [
            { date: "asc" },
            { completed: "asc" },
            { priority: "desc" },
          ],
        },
        dayStarts: {
          where: { date: dateFilter },
          select: {
            startedAt: true,
            date: true,
          },
          orderBy: {
            date: "asc"
          }
        },
      },
    });

    const historyData = teamMembers.map((member: typeof teamMembers[number]) => {
      const todos = member.todos;
      const totalCount = todos.length;
      const completedCount = todos.filter((t: typeof todos[number]) => t.completed).length;

      // 기간 조회일 경우 started 여부는 큰 의미가 없을 수 있으나, 리스트로 반환
      const dayStarts = member.dayStarts;

      return {
        id: member.id,
        name: member.name,
        email: member.email,
        image: member.image,
        todos,
        totalCount,
        completedCount,
        progress: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
        dayStarts, // range 조회 지원을 위해 변경
      };
    });

    return NextResponse.json({
      startDate: startDateParam,
      endDate: endDateParam,
      date: dateParam,
      members: historyData,
    });
  } catch (error) {
    console.error("History fetch error:", error);
    return NextResponse.json({ error: "히스토리 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
