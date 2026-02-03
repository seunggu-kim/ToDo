import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { MainNav } from "@/components/main-nav";

// 개발/Mock 환경용 목업 유저
const mockUser = {
  id: "mock-user-1",
  name: "테스트 유저",
  email: "test@example.com",
  teamId: "mock-team-1",
};

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 개발 환경 또는 Mock 모드에서는 인증 건너뛰기
  const isDev = process.env.NODE_ENV === "development";
  const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === "true";

  let user = mockUser;

  if (!isDev && !isMockMode) {
    const session = await auth();
    if (!session?.user) {
      redirect("/login");
    }
    user = session.user as typeof mockUser;
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav user={user} />
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {children}
      </main>
    </div>
  );
}
