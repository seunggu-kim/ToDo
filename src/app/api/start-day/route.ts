import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendSlackMessage, createStartDayMessage } from "@/lib/slack";

// 오늘 시작 확인
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayStart = await prisma.dayStart.findUnique({
      where: {
        userId_date: {
          userId: session.user.id,
          date: today,
        },
      },
    });

    return NextResponse.json({ started: !!dayStart, startedAt: dayStart?.startedAt });
  } catch (error) {
    console.error("Day start check error:", error);
    return NextResponse.json({ error: "확인 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// 오늘 시작하기
export async function POST() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        team: true,
      },
    });

    if (!user?.teamId || !user.team) {
      return NextResponse.json({ error: "팀에 속해 있지 않습니다." }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 이미 오늘 시작했는지 확인
    const existingStart = await prisma.dayStart.findUnique({
      where: {
        userId_date: {
          userId: session.user.id,
          date: today,
        },
      },
    });

    if (existingStart) {
      return NextResponse.json({ error: "이미 오늘 시작했습니다." }, { status: 400 });
    }

    // 오늘 할일 가져오기
    const todos = await prisma.todo.findMany({
      where: {
        userId: session.user.id,
        date: today,
      },
      orderBy: { priority: "desc" },
    });

    // 오늘 시작 기록
    const dayStart = await prisma.dayStart.create({
      data: {
        userId: session.user.id,
        date: today,
      },
    });

    // 슬랙 알림 전송
    if (user.team.slackWebhookUrl) {
      const message = createStartDayMessage(
        user.name || user.email,
        todos.map((t: typeof todos[number]) => ({ content: t.content, completed: t.completed }))
      );
      
      await sendSlackMessage(user.team.slackWebhookUrl, message);
    }

    return NextResponse.json({
      success: true,
      startedAt: dayStart.startedAt,
      todoCount: todos.length,
      slackNotified: !!user.team.slackWebhookUrl,
    });
  } catch (error) {
    console.error("Day start error:", error);
    return NextResponse.json({ error: "시작 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
