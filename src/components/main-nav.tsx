"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface MainNavProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

const navItems = [
  { href: "/today", label: "오늘 할일" },
  { href: "/dashboard", label: "팀 현황" },
  { href: "/history", label: "히스토리" },
  { href: "/stats/weekly", label: "주간 통계" },
  { href: "/stats/monthly", label: "월간 통계" },
  { href: "/settings", label: "설정" },
];

export function MainNav({ user }: MainNavProps) {
  const pathname = usePathname();

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/today" className="font-bold text-lg">
              팀 투두
            </Link>
            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className={cn(
                    "px-3 py-2 text-sm rounded-md transition-colors",
                    pathname === item.href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm hidden sm:inline">{user.name}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              로그아웃
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
