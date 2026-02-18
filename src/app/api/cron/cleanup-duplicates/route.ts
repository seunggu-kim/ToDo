import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// 일회성 데이터 정리: 이월로 인해 쌓인 중복 미완료 투두 삭제
// 같은 userId + content로 미완료 이월 투두가 여러 날짜에 있으면 최신 것만 남김
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const isCronAuth = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    const session = await auth();
    const isUserAuth = !!session?.user?.id;

    if (!isCronAuth && !isUserAuth) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // 미완료 이월 투두 중 중복 후보 조회 (carryOverCount > 0)
    const carryOverTodos = await prisma.todo.findMany({
      where: {
        completed: false,
        carryOverCount: { gt: 0 },
        date: { not: null },
      },
      select: {
        id: true,
        userId: true,
        content: true,
        date: true,
        carryOverCount: true,
      },
      orderBy: { date: "desc" },
    });

    // userId + content 기준으로 그룹핑, 최신 날짜 것만 유지
    const latestByKey = new Map<string, typeof carryOverTodos[number]>();
    const toDelete: string[] = [];

    for (const todo of carryOverTodos) {
      const key = `${todo.userId}::${todo.content}`;
      const existing = latestByKey.get(key);

      if (!existing) {
        latestByKey.set(key, todo);
      } else {
        // 이미 더 최신(또는 같은) 것이 있으므로 이건 삭제 대상
        toDelete.push(todo.id);
      }
    }

    let deletedCount = 0;
    if (toDelete.length > 0) {
      const result = await prisma.todo.deleteMany({
        where: { id: { in: toDelete } },
      });
      deletedCount = result.count;
    }

    console.log(`Cleanup completed: ${deletedCount} duplicate carry-over todos deleted`);

    return NextResponse.json({
      success: true,
      deletedCount,
      checked: carryOverTodos.length,
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json({ error: "정리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
