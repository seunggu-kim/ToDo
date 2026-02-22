import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Cron Job: 미완료 투두 자동 이월 (매일 오전 9시 실행)
// 또는 로그인한 사용자가 수동으로 호출 가능
export async function GET(request: Request) {
  try {
    // Vercel Cron Job 인증 확인
    const authHeader = request.headers.get("authorization");
    const isCronAuth = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    // 로그인한 사용자 확인 (수동 이월용)
    const session = await auth();
    const isUserAuth = !!session?.user?.id;

    // Cron 인증도 아니고 로그인 사용자도 아니면 거부
    if (!isCronAuth && !isUserAuth) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 어제 날짜의 미완료 투두들 찾기 (이미지 포함)
    const incompleteTodos = await prisma.todo.findMany({
      where: {
        date: yesterday,
        completed: false,
      },
      include: { images: true },
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
        // 새로운 투두 생성 (이월 횟수 증가 + 이미지 복사)
        await prisma.todo.create({
          data: {
            content: todo.content,
            userId: todo.userId,
            teamId: todo.teamId,
            date: today,
            carryOverCount: todo.carryOverCount + 1,
            priority: todo.priority,
            ...(todo.images.length > 0
              ? {
                  images: {
                    create: todo.images.map((img) => ({
                      url: img.url,
                      filename: img.filename,
                      size: img.size,
                      order: img.order,
                    })),
                  },
                }
              : {}),
          },
        });

        // 이전 날짜의 원본 삭제 (cascade로 old TodoImage 삭제, Blob URL은 new에서 참조)
        await prisma.todo.delete({
          where: { id: todo.id },
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
