import { siteConfig } from "@/lib/site";

const description =
  siteConfig.description ??
  "Automação de processos sob medida para escritórios contábeis brasileiros.";

const logoUrl = `${siteConfig.url}/brand/levilael-logo.png`;

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.name,
  url: siteConfig.url,
  logo: logoUrl,
  description,
  sameAs: [] as string[],
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteConfig.name,
  url: siteConfig.url,
  description,
};
