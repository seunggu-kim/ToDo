import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 팀 탈퇴
export async function POST() {
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

    // 사용자의 팀 정보 제거
    await prisma.user.update({
      where: { id: session.user.id },
      data: { teamId: null },
    });

    return NextResponse.json({ success: true, message: "팀에서 탈퇴했습니다." });
  } catch (error) {
    console.error("Team leave error:", error);
    return NextResponse.json({ error: "탈퇴 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
