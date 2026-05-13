export const siteConfig = {
  name: "Levi Lael",
  domain: "levilael.com.br",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://levilael.com.br",
  tagline:
    "Engenharia de automação para escritórios contábeis",
  description:
    "Sistema sob medida pro fluxo do seu escritório contábil. Triagem de documentos, cobrança automática, processamento de notas fiscais — não SaaS pronto.",
  email: {
    contact: "hello@levilael.com.br",
    from: process.env.RESEND_FROM_EMAIL ?? "Levi Lael <hello@levilael.com.br>",
    internal:
      process.env.INTERNAL_NOTIFICATION_EMAIL ?? "hello@levilael.com.br",
  },
  social: {
    linkedin:
      process.env.NEXT_PUBLIC_LINKEDIN_URL ??
      "https://www.linkedin.com/in/levi-lael",
    github: process.env.NEXT_PUBLIC_GITHUB_URL ?? "https://github.com/levilael",
  },
  nav: [
    { label: "Diagnóstico", href: "/diagnosis" },
    { label: "Sobre", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Newsletter", href: "/newsletter" },
    { label: "Contato", href: "/contact" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
