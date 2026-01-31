import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// 개발 환경 체크
const isDev = process.env.NODE_ENV === "development";

// 개발용 목업 팀 데이터
const mockTeam = {
  id: "dev-team-id",
  name: "개발팀",
  inviteCode: "DEV123",
  members: [
    { id: "dev-user-id", name: "개발자", email: "dev@example.com", image: null },
  ],
};

// 팀 생성
export async function POST(request: Request) {
  try {
    // 개발 환경: 목업 응답
    if (isDev) {
      const { name } = await request.json();
      return NextResponse.json({ ...mockTeam, name }, { status: 201 });
    }

    // 프로덕션: 실제 DB 사용
    const { prisma } = await import("@/lib/prisma");
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
    // 개발 환경: 목업 팀 데이터 반환
    if (isDev) {
      return NextResponse.json({ team: mockTeam });
    }

    // 프로덕션: 실제 DB 사용
    const { prisma } = await import("@/lib/prisma");
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
