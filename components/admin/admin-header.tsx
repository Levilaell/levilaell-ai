"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { AlertTriangle, BarChart3, LogOut, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/admin-format";

type Props = {
  onNewTopicClick?: () => void;
  /** Custo IA acumulado no mês corrente — opcional, só usado pro warning bar. */
  costMonthBRL?: number;
  /** Limite mensal pra computar o ratio. Default 100 (mesmo do server). */
  monthlyLimitBRL?: number;
};

export function AdminHeader({
  onNewTopicClick,
  costMonthBRL,
  monthlyLimitBRL = 100,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onLogout = () => {
    startTransition(async () => {
      await fetch("/api/admin/logout", { method: "POST" });
      router.replace("/admin/login");
      router.refresh();
    });
  };

  // Warning bar: aparece quando >= 80% do orçamento mensal foi gasto.
  const showWarning =
    typeof costMonthBRL === "number" &&
    monthlyLimitBRL > 0 &&
    costMonthBRL / monthlyLimitBRL >= 0.8;
  const ratioPct = showWarning
    ? Math.min(100, Math.round((costMonthBRL! / monthlyLimitBRL) * 100))
    : 0;

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/admin"
          className="flex items-center gap-3 font-semibold tracking-tight"
        >
          <Image
            src="/brand/levilael-logo.png"
            alt="Levi Lael"
            width={1326}
            height={508}
            className="h-12 mt-1 w-auto mix-blend-multiply"
          />
          <span className="text-sm text-muted-foreground">
            Editorial · Admin
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="rounded-lg text-muted-foreground hover:text-foreground"
          >
            <Link href="/admin/stats">
              <BarChart3 className="size-4" aria-hidden />
              <span className="hidden sm:inline">Stats</span>
            </Link>
          </Button>
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

      {showWarning && (
        <div className="border-t border-amber-200 bg-amber-50 text-amber-900">
          <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2 text-xs sm:px-6">
            <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
            <span>
              Você está em <strong>{ratioPct}%</strong> do limite mensal de IA (
              {formatBRL(costMonthBRL!)} de {formatBRL(monthlyLimitBRL)}).
            </span>
            <Link
              href="/admin/stats"
              className="ml-auto underline-offset-2 hover:underline"
            >
              Detalhes
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
