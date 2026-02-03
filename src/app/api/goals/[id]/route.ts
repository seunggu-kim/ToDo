import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 목표 수정
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();

    // 해당 목표가 같은 팀의 것인지 확인
    const existingGoal = await prisma.teamGoal.findUnique({
      where: { id },
    });

    if (!existingGoal) {
      return NextResponse.json({ error: "목표를 찾을 수 없습니다." }, { status: 404 });
    }

    if (existingGoal.teamId !== user.teamId) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const updateData: {
      name?: string;
      targetDate?: Date;
      completed?: boolean;
      completedAt?: Date | null;
    } = {};

    if (body.name !== undefined) {
      if (body.name.trim() === "") {
        return NextResponse.json({ error: "목표 이름을 입력해주세요." }, { status: 400 });
      }
      updateData.name = body.name.trim();
    }

    if (body.targetDate !== undefined) {
      const parsedDate = new Date(body.targetDate);
      parsedDate.setHours(0, 0, 0, 0);
      updateData.targetDate = parsedDate;
    }

    if (body.completed !== undefined) {
      updateData.completed = body.completed;
      updateData.completedAt = body.completed ? new Date() : null;
    }

    const goal = await prisma.teamGoal.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // D-day 계산
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(goal.targetDate);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return NextResponse.json({ ...goal, dday: diffDays });
  } catch (error) {
    console.error("Goal update error:", error);
    return NextResponse.json({ error: "목표 수정 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// 목표 삭제
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // 해당 목표가 같은 팀의 것인지 확인
    const existingGoal = await prisma.teamGoal.findUnique({
      where: { id },
    });

    if (!existingGoal) {
      return NextResponse.json({ error: "목표를 찾을 수 없습니다." }, { status: 404 });
    }

    if (existingGoal.teamId !== user.teamId) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    await prisma.teamGoal.delete({
      where: { id },
    });

    return NextResponse.json({ message: "삭제되었습니다." });
  } catch (error) {
    console.error("Goal delete error:", error);
    return NextResponse.json({ error: "목표 삭제 중 오류가 발생했습니다." }, { status: 500 });
  }
}
