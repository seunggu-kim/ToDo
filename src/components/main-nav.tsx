"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

interface MainNavProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

const navItems = [
  { href: "/today", label: "할 일" },
  { href: "/dashboard", label: "팀 현황" },
  { href: "/search", label: "검색" },
  { href: "/history", label: "히스토리" },
  { href: "/stats/weekly", label: "주간 통계" },
  { href: "/stats/monthly", label: "월간 통계" },
  { href: "/settings", label: "설정" },
];

export function MainNav({ user }: MainNavProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="border-b bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/today" className="font-bold text-lg">
              팀 투두
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className={cn(
                    "px-3 py-2 text-sm rounded-md transition-colors whitespace-nowrap",
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

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm hidden md:inline">{user.name}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="hidden sm:flex"
            >
              로그아웃
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="lg:hidden py-4 space-y-1 border-t">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "block px-3 py-2 text-sm rounded-md transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-4 border-t mt-4 space-y-2">
              <div className="px-3 py-2 flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{user.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full justify-start"
              >
                로그아웃
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
