"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SchedulingLink } from "@/components/ui/scheduling-button";
import { TrackedLink } from "@/components/tracking/tracked-link";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center"
          aria-label={siteConfig.name}
        >
          <Image
            src="/brand/levilael-logo.png"
            alt={siteConfig.name}
            width={1326}
            height={508}
            priority
            className="h-6 w-auto mix-blend-multiply"
          />
        </Link>

        <nav
          className="hidden md:flex items-center gap-7"
          aria-label="Navegação principal"
        >
          {siteConfig.nav
            .filter((n) => n.href !== "/diagnosis")
            .map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-sm transition-colors",
                    active
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
        </nav>

        <div className="flex items-center gap-3">
          <SchedulingLink
            source="header"
            subject="Conversa técnica — Levi Lael"
            label="Agendar conversa"
            className="hidden lg:inline text-sm text-muted-foreground hover:text-foreground transition-colors"
          />
          <Button
            asChild
            size="default"
            variant="brand"
            className="rounded-lg hidden sm:inline-flex"
          >
            <TrackedLink href="/diagnosis" trackLabel="header_diagnosis">
              Diagnóstico gratuito
            </TrackedLink>
          </Button>
          <button
            type="button"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            className="md:hidden rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border/60 bg-background">
          <nav
            className="container-page py-3 flex flex-col"
            aria-label="Navegação mobile"
          >
            {siteConfig.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="py-2 text-sm text-foreground/90 hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <Button
              asChild
              size="lg"
              variant="brand"
              className="mt-3 rounded-lg sm:hidden"
            >
              <TrackedLink
                href="/diagnosis"
                trackLabel="header_mobile_diagnosis"
                onClick={() => setOpen(false)}
              >
                Diagnóstico gratuito →
              </TrackedLink>
            </Button>
            <SchedulingLink
              source="header_mobile"
              subject="Conversa técnica — Levi Lael"
              label="Agendar conversa"
              className="mt-3 py-2 text-sm text-foreground/90 hover:text-foreground"
              onNavigate={() => setOpen(false)}
            />
          </nav>
        </div>
      )}
    </header>
  );
}
