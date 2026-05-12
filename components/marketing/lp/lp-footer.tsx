import Link from "next/link";
import { siteConfig } from "@/lib/site";

export function LpFooter() {
  return (
    <footer className="border-t border-border bg-background py-8">
      <div className="container-page flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-muted-foreground">
        <p>
          © {new Date().getFullYear()} Levi Lael ·{" "}
          <a
            href={`mailto:${siteConfig.email.contact}`}
            className="hover:text-foreground transition-colors"
          >
            {siteConfig.email.contact}
          </a>
        </p>
        <Link
          href="/privacy"
          className="hover:text-foreground transition-colors"
        >
          Política de privacidade
        </Link>
      </div>
    </footer>
  );
}
