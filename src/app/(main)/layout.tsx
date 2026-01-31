import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { MainNav } from "@/components/main-nav";

// 개발 환경용 목업 유저
const devUser = {
  id: "dev-user-id",
  name: "개발자",
  email: "dev@example.com",
  teamId: "dev-team-id",
};

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 개발 환경에서는 인증 건너뛰기
  const isDev = process.env.NODE_ENV === "development";

  let user = devUser;

  if (!isDev) {
    const session = await auth();
    if (!session?.user) {
      redirect("/login");
    }
    user = session.user as typeof devUser;
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
