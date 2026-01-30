import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Cron Job: 미완료 투두 자동 이월 (매일 오전 9시 실행)
export async function GET(request: Request) {
  try {
    // Vercel Cron Job 인증 확인
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // 개발 환경에서는 CRON_SECRET이 없을 수 있음
      if (process.env.NODE_ENV === "production" && process.env.CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 어제 날짜의 미완료 투두들 찾기
    const incompleteTodos = await prisma.todo.findMany({
      where: {
        date: yesterday,
        completed: false,
      },
    });

    let carriedCount = 0;

    // 각 미완료 투두를 오늘로 이월
    for (const todo of incompleteTodos) {
      // 오늘 날짜에 같은 내용이 이미 있는지 확인
      const existingTodo = await prisma.todo.findFirst({
        where: {
          userId: todo.userId,
          content: todo.content,
          date: today,
        },
      });

      if (!existingTodo) {
        // 새로운 투두 생성 (이월 횟수 증가)
        await prisma.todo.create({
          data: {
            content: todo.content,
            userId: todo.userId,
            teamId: todo.teamId,
            date: today,
            carryOverCount: todo.carryOverCount + 1,
            priority: todo.priority,
          },
        });

        // 원본 투두는 이월 표시
        await prisma.todo.update({
          where: { id: todo.id },
          data: { completed: true, completedAt: new Date() },
        });

        carriedCount++;
      }
    }

    console.log(`Carry-over completed: ${carriedCount} todos carried over`);

    return NextResponse.json({
      success: true,
      carriedCount,
      processedDate: yesterday.toISOString().split("T")[0],
    });
  } catch (error) {
    console.error("Carry-over cron error:", error);
    return NextResponse.json({ error: "이월 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
