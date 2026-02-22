import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { del } from "@vercel/blob";

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

    // 이미지 + todo 소유권 확인
    const image = await prisma.todoImage.findUnique({
      where: { id },
      include: { todo: { select: { userId: true } } },
    });

    if (!image) {
      return NextResponse.json({ error: "이미지를 찾을 수 없습니다." }, { status: 404 });
    }

    if (image.todo.userId !== session.user.id) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 같은 URL을 참조하는 다른 TodoImage가 있는지 확인 (이월로 공유될 수 있음)
    const otherRefs = await prisma.todoImage.count({
      where: {
        url: image.url,
        id: { not: id },
      },
    });

    // DB 레코드 삭제
    await prisma.todoImage.delete({ where: { id } });

    // 다른 참조가 없을 때만 Blob 파일 삭제
    if (otherRefs === 0) {
      try {
        await del(image.url);
      } catch (e) {
        console.error("Blob delete error (non-critical):", e);
      }
    }

    return NextResponse.json({ message: "삭제되었습니다." });
  } catch (error) {
    console.error("Image delete error:", error);
    return NextResponse.json(
      { error: "이미지 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
