"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LogOut, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  onNewTopicClick?: () => void;
};

export function AdminHeader({ onNewTopicClick }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onLogout = () => {
    startTransition(async () => {
      await fetch("/api/admin/logout", { method: "POST" });
      router.replace("/admin/login");
      router.refresh();
    });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/admin"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <span
            aria-hidden
            className="grid size-7 place-items-center rounded-md bg-foreground text-background font-mono text-xs font-semibold"
          >
            LL
          </span>
          <span className="text-sm">
            Editorial
            <span className="ml-1 text-muted-foreground">· Admin</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {onNewTopicClick && (
            <Button
              size="sm"
              variant="brand"
              onClick={onNewTopicClick}
              className="rounded-lg"
            >
              <Plus className="size-4" aria-hidden />
              Novo tema
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={onLogout}
            disabled={isPending}
            className="rounded-lg text-muted-foreground hover:text-foreground"
          >
            <LogOut className="size-4" aria-hidden />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
