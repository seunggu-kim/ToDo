import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 팀 생성
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "팀 이름을 입력해주세요." }, { status: 400 });
    }

    // 이미 팀에 속해 있는지 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { teamId: true },
    });

    if (user?.teamId) {
      return NextResponse.json({ error: "이미 팀에 속해 있습니다." }, { status: 400 });
    }

    // 팀 생성 및 사용자 연결
    const team = await prisma.team.create({
      data: {
        name,
        members: {
          connect: { id: session.user.id },
        },
      },
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error("Team creation error:", error);
    return NextResponse.json({ error: "팀 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// 현재 팀 정보 조회
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        team: {
          include: {
            members: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!user?.team) {
      return NextResponse.json({ team: null });
    }

    return NextResponse.json({ team: user.team });
  } catch (error) {
    console.error("Team fetch error:", error);
    return NextResponse.json({ error: "팀 정보 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
