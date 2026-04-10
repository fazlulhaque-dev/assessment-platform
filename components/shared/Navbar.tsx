"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useAppSelector } from "@/store/hooks";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, LayoutDashboard, PlusCircle } from "lucide-react";

export default function Navbar() {
  const { logout } = useAuth();
  const { user, role } = useAppSelector((s) => s.auth);

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link
          href={
            role === "employer" ? "/employer/dashboard" : "/candidate/dashboard"
          }
          className="flex items-center gap-2 font-semibold text-lg"
        >
          <span className="text-primary">Assess</span>
          <span>Platform</span>
        </Link>

        <nav className="flex items-center gap-4">
          {role === "employer" && (
            <>
              <Link
                href="/employer/dashboard"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                <LayoutDashboard className="mr-1.5 h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/employer/exams/create"
                className={cn(buttonVariants({ size: "sm" }))}
              >
                <PlusCircle className="mr-1.5 h-4 w-4" />
                New Exam
              </Link>
            </>
          )}
          {role === "candidate" && (
            <Link
              href="/candidate/dashboard"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              <LayoutDashboard className="mr-1.5 h-4 w-4" />
              My Exams
            </Link>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "relative h-8 w-8 rounded-full p-0",
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium truncate">
                  {user?.full_name}
                </p>
                <p className="text-xs text-muted-foreground truncate capitalize">
                  {role}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
}
