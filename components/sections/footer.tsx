import Link from "next/link";
import { GithubIcon, LinkedinIcon } from "@/components/ui/social-icons";
import { TrackedExternalLink } from "@/components/tracking/tracked-external-link";
import { SchedulingLink } from "@/components/ui/scheduling-button";
import { siteConfig } from "@/lib/site";

type FooterLink = { label: string; href: string } | { kind: "scheduling" };

const navColumns: { title: string; links: FooterLink[] }[] = [
  {
    title: "Produtos",
    links: [
      { label: "Diagnóstico gratuito", href: "/diagnosis" },
      { label: "Newsletter", href: "/newsletter" },
    ],
  },
  {
    title: "Conteúdo",
    links: [
      { label: "Blog", href: "/blog" },
      {
        label: "Exemplos de diagnóstico",
        href: "/diagnosis/examples/clinicas-pequenas-saude",
      },
      { label: "Sobre", href: "/about" },
    ],
  },
  {
    title: "Contato",
    links: [
      { label: "E-mail", href: `mailto:${siteConfig.email.contact}` },
      { kind: "scheduling" },
      { label: "Formulário", href: "/contact" },
      { label: "Privacidade", href: "/privacy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-muted/40">
      <div className="container-page py-14 md:py-16">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">
              {siteConfig.domain}
            </p>
            <p className="font-semibold text-lg leading-tight">Levi Lael</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs leading-relaxed">
              Engenharia de operações com IA e automação para empresas que querem crescer sem inchar a equipe.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <TrackedExternalLink
                href={siteConfig.social.linkedin}
                aria-label="LinkedIn"
                trackLabel="footer_linkedin"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <LinkedinIcon className="size-5" />
              </TrackedExternalLink>
              <TrackedExternalLink
                href={siteConfig.social.github}
                aria-label="GitHub"
                trackLabel="footer_github"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <GithubIcon className="size-5" />
              </TrackedExternalLink>
            </div>
          </div>

          {navColumns.map((col) => (
            <div key={col.title}>
              <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">
                {col.title}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((l, i) =>
                  "kind" in l ? (
                    <li key={`scheduling-${i}`}>
                      <SchedulingLink
                        source="footer"
                        subject="Conversa técnica — Levi Lael"
                        className="text-sm text-foreground/80 hover:text-foreground transition-colors"
                      />
                    </li>
                  ) : (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="text-sm text-foreground/80 hover:text-foreground transition-colors"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Levi Lael · Todos os direitos reservados.
          </p>
          <p className="text-xs text-muted-foreground">
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacidade
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
