import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 팀 설정 업데이트 (슬랙 웹훅 URL 등)
export async function PATCH(request: Request) {
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

    const { slackWebhookUrl, name } = await request.json();

    const updateData: { slackWebhookUrl?: string; name?: string } = {};
    
    if (slackWebhookUrl !== undefined) {
      // 슬랙 웹훅 URL 유효성 검사
      if (slackWebhookUrl && !slackWebhookUrl.startsWith("https://hooks.slack.com/")) {
        return NextResponse.json({ error: "유효하지 않은 슬랙 웹훅 URL입니다." }, { status: 400 });
      }
      updateData.slackWebhookUrl = slackWebhookUrl || null;
    }

    if (name) {
      updateData.name = name;
    }

    const team = await prisma.team.update({
      where: { id: user.teamId },
      data: updateData,
    });

    return NextResponse.json(team);
  } catch (error) {
    console.error("Team settings update error:", error);
    return NextResponse.json({ error: "팀 설정 업데이트 중 오류가 발생했습니다." }, { status: 500 });
  }
}
