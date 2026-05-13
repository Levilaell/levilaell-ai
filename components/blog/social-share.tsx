"use client";

import { XIcon, WhatsappIcon } from "@/components/ui/social-icons";
import { siteConfig } from "@/lib/site";

type Props = {
  slug: string;
  title: string;
};

export function SocialShare({ slug, title }: Props) {
  const url = `${siteConfig.url}/blog/${slug}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      icon: XIcon,
    },
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      icon: WhatsappIcon,
    },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground mr-2">
        Compartilhar
      </span>
      {links.map(({ label, href, icon: Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Compartilhar no ${label}`}
          className="size-8 rounded-lg border border-border hover:bg-muted hover:text-foreground text-muted-foreground transition-colors grid place-items-center"
        >
          <Icon className="size-4" />
        </a>
      ))}
    </div>
  );
}
