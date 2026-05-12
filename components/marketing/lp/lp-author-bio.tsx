import { siteConfig } from "@/lib/site";
import { GithubIcon, LinkedinIcon } from "@/components/ui/social-icons";

export function LpAuthorBio() {
  return (
    <div className="container-page py-16 md:py-20">
      <div className="max-w-2xl mx-auto">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">
          Quem está por trás
        </p>
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-4">
          Levi Lael
        </h2>
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
          Engenheiro full-stack que já levou sistemas de IA para produção em
          fintech e automação B2B. Stack: Next.js, Python, Anthropic, Supabase,
          n8n. Filosofia: IA em produção, não em apresentação.
        </p>
        <div className="mt-6 flex items-center gap-4">
          <a
            href={siteConfig.social.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            aria-label="GitHub"
          >
            <GithubIcon className="size-4" />
            <span>GitHub</span>
          </a>
          <a
            href={siteConfig.social.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            aria-label="LinkedIn"
          >
            <LinkedinIcon className="size-4" />
            <span>LinkedIn</span>
          </a>
        </div>
      </div>
    </div>
  );
}
