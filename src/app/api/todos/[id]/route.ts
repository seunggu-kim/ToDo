import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { del } from "@vercel/blob";

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

      // 완료 시, 동일 내용의 이월 복사본이 있으면 삭제
      if (body.completed === true && existingTodo.date) {
        await prisma.todo.deleteMany({
          where: {
            userId: existingTodo.userId,
            content: existingTodo.content,
            completed: false,
            carryOverCount: { gt: existingTodo.carryOverCount },
            date: { gt: existingTodo.date },
            id: { not: id },
          },
        });
      }
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

    // 이미지 추가
    if (body.addImages && Array.isArray(body.addImages)) {
      for (let i = 0; i < body.addImages.length; i++) {
        const img = body.addImages[i];
        await prisma.todoImage.create({
          data: {
            url: img.url,
            filename: img.filename,
            size: img.size,
            order: img.order ?? i,
            todoId: id,
          },
        });
      }
    }

    // 이미지 삭제
    if (body.removeImageIds && Array.isArray(body.removeImageIds)) {
      for (const imageId of body.removeImageIds) {
        const image = await prisma.todoImage.findUnique({ where: { id: imageId } });
        if (image && image.todoId === id) {
          await prisma.todoImage.delete({ where: { id: imageId } });
          // 같은 URL 참조가 없으면 Blob 삭제
          const otherRefs = await prisma.todoImage.count({
            where: { url: image.url, id: { not: imageId } },
          });
          if (otherRefs === 0) {
            try { await del(image.url); } catch { /* non-critical */ }
          }
        }
      }
    }

    const todo = await prisma.todo.update({
      where: { id },
      data: updateData,
      include: { images: { orderBy: { order: "asc" } } },
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

    // 삭제 전 이미지의 Blob 파일 정리
    const images = await prisma.todoImage.findMany({ where: { todoId: id } });
    for (const image of images) {
      const otherRefs = await prisma.todoImage.count({
        where: { url: image.url, id: { not: image.id } },
      });
      if (otherRefs === 0) {
        try { await del(image.url); } catch { /* non-critical */ }
      }
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
