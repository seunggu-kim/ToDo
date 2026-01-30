import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 초대 코드로 팀 참여
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { inviteCode } = await request.json();

    if (!inviteCode) {
      return NextResponse.json({ error: "초대 코드를 입력해주세요." }, { status: 400 });
    }

    // 이미 팀에 속해 있는지 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { teamId: true },
    });

    if (user?.teamId) {
      return NextResponse.json({ error: "이미 팀에 속해 있습니다." }, { status: 400 });
    }

    // 초대 코드로 팀 찾기
    const team = await prisma.team.findUnique({
      where: { inviteCode },
    });

    if (!team) {
      return NextResponse.json({ error: "유효하지 않은 초대 코드입니다." }, { status: 404 });
    }

    // 팀에 참여
    await prisma.user.update({
      where: { id: session.user.id },
      data: { teamId: team.id },
    });

    return NextResponse.json({ message: "팀에 참여했습니다.", team });
  } catch (error) {
    console.error("Team join error:", error);
    return NextResponse.json({ error: "팀 참여 중 오류가 발생했습니다." }, { status: 500 });
  }
}
