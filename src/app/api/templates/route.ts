import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 템플릿 목록 조회
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const templates = await prisma.todoTemplate.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Template fetch error:", error);
    return NextResponse.json({ error: "템플릿 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// 템플릿 생성
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { content } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "템플릿 내용을 입력해주세요." }, { status: 400 });
    }

    const template = await prisma.todoTemplate.create({
      data: {
        content: content.trim(),
        userId: session.user.id,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Template creation error:", error);
    return NextResponse.json({ error: "템플릿 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// 템플릿 삭제
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "템플릿 ID가 필요합니다." }, { status: 400 });
    }

    // 본인의 템플릿인지 확인
    const template = await prisma.todoTemplate.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!template) {
      return NextResponse.json({ error: "템플릿을 찾을 수 없습니다." }, { status: 404 });
    }

    await prisma.todoTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Template deletion error:", error);
    return NextResponse.json({ error: "템플릿 삭제 중 오류가 발생했습니다." }, { status: 500 });
  }
}
