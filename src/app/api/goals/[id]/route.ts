import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// 개발 환경 체크
const isDev = process.env.NODE_ENV === "development";

// D-day 계산 헬퍼
function calculateDday(targetDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// 목표 수정
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // 개발 환경: 목업 응답
    if (isDev) {
      const targetDate = body.targetDate ? new Date(body.targetDate) : new Date();
      const updatedGoal = {
        id,
        name: body.name || "수정된 목표",
        targetDate: targetDate.toISOString(),
        completed: body.completed || false,
        createdBy: { id: "user-1", name: "개발자" },
        dday: calculateDday(targetDate),
      };
      return NextResponse.json(updatedGoal);
    }

    // 프로덕션: 실제 DB 사용
    const { prisma } = await import("@/lib/prisma");
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

    return NextResponse.json({ ...goal, dday: calculateDday(new Date(goal.targetDate)) });
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
    const { id } = await params;

    // 개발 환경: 목업 응답
    if (isDev) {
      return NextResponse.json({ message: "삭제되었습니다." });
    }

    // 프로덕션: 실제 DB 사용
    const { prisma } = await import("@/lib/prisma");
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
