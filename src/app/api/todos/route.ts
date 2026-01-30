import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 투두 목록 조회 (날짜별)
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
    const dateParam = searchParams.get("date");
    
    // 날짜 파라미터가 없으면 오늘 날짜 사용
    const date = dateParam ? new Date(dateParam) : new Date();
    date.setHours(0, 0, 0, 0);

    const todos = await prisma.todo.findMany({
      where: {
        userId: session.user.id,
        date: date,
      },
      orderBy: [
        { completed: "asc" },
        { priority: "desc" },
        { createdAt: "asc" },
      ],
    });

    return NextResponse.json(todos);
  } catch (error) {
    console.error("Todo fetch error:", error);
    return NextResponse.json({ error: "투두 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// 투두 생성
export async function POST(request: Request) {
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

    const { content, date: dateParam } = await request.json();

    if (!content) {
      return NextResponse.json({ error: "내용을 입력해주세요." }, { status: 400 });
    }

    const date = dateParam ? new Date(dateParam) : new Date();
    date.setHours(0, 0, 0, 0);

    const todo = await prisma.todo.create({
      data: {
        content,
        date,
        userId: session.user.id,
        teamId: user.teamId,
      },
    });

    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    console.error("Todo creation error:", error);
    return NextResponse.json({ error: "투두 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
