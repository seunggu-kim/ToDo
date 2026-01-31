import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 투두 수정
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // 해당 투두가 현재 사용자의 것인지 확인
    const existingTodo = await prisma.todo.findUnique({
      where: { id },
    });

    if (!existingTodo) {
      return NextResponse.json({ error: "투두를 찾을 수 없습니다." }, { status: 404 });
    }

    if (existingTodo.userId !== session.user.id) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const updateData: {
      content?: string;
      completed?: boolean;
      completedAt?: Date | null;
      priority?: number;
      date?: Date | null;
    } = {};

    if (body.content !== undefined) {
      updateData.content = body.content;
    }

    if (body.completed !== undefined) {
      updateData.completed = body.completed;
      updateData.completedAt = body.completed ? new Date() : null;
    }

    if (body.priority !== undefined) {
      updateData.priority = body.priority;
    }

    // 날짜 업데이트 (드래그 앤 드롭용)
    if (body.date !== undefined) {
      if (body.date === null) {
        // 백로그로 이동
        updateData.date = null;
      } else {
        // 특정 날짜로 이동
        const newDate = new Date(body.date);
        newDate.setHours(0, 0, 0, 0);
        updateData.date = newDate;
      }
    }

    const todo = await prisma.todo.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(todo);
  } catch (error) {
    console.error("Todo update error:", error);
    return NextResponse.json({ error: "투두 수정 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// 투두 삭제
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id } = await params;

    // 해당 투두가 현재 사용자의 것인지 확인
    const existingTodo = await prisma.todo.findUnique({
      where: { id },
    });

    if (!existingTodo) {
      return NextResponse.json({ error: "투두를 찾을 수 없습니다." }, { status: 404 });
    }

    if (existingTodo.userId !== session.user.id) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    await prisma.todo.delete({
      where: { id },
    });

    return NextResponse.json({ message: "삭제되었습니다." });
  } catch (error) {
    console.error("Todo delete error:", error);
    return NextResponse.json({ error: "투두 삭제 중 오류가 발생했습니다." }, { status: 500 });
  }
}
