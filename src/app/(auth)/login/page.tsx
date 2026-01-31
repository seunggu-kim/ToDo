"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("이메일 또는 비밀번호가 올바르지 않습니다.");
      } else {
        router.push("/today");
        router.refresh();
      }
    } catch {
      toast.error("로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">로그인</CardTitle>
        <CardDescription className="text-center">
          팀 투두리스트에 로그인하세요
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-6">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "로그인 중..." : "로그인"}
          </Button>

          {process.env.NODE_ENV === "development" && (
            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed border-primary/50 text-primary"
              onClick={async () => {
                setIsLoading(true);
                try {
                  // 1. 먼저 개발용 계정/팀 생성 시도
                  const regRes = await fetch("/api/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: "개발자",
                      email: "dev@example.com",
                      password: "password123",
                    }),
                  });
                  // 이미 있어도 무시 (400)

                  // 2. 로그인 시도
                  await signIn("credentials", {
                    email: "dev@example.com",
                    password: "password123",
                    callbackUrl: "/today",
                  });
                } catch {
                  toast.error("데모 로그인 중 오류가 발생했습니다.");
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
            >
              🚀 개발용 퀵 로그인 (가입 없이 바로 확인)
            </Button>
          )}

          <p className="text-sm text-muted-foreground text-center">
            계정이 없으신가요?{" "}
            <Link href="/register" className="text-primary hover:underline">
              회원가입
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
