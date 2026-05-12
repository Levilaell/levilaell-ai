"use client";

import * as React from "react";
import { useEffect, useState } from "react";

interface DynamicHeadlineProps {
  defaultHeadline: string;
  variants: Record<string, string>;
  className?: string;
  as?: React.ElementType;
}

const KEYWORD_PARAMS = ["utm_term", "utm_content", "keyword", "k"] as const;

function normalize(input: string): string {
  let decoded: string;
  try {
    decoded = decodeURIComponent(input);
  } catch {
    decoded = input;
  }
  // Strip diacríticos: PT-BR Google Ads keywords vêm sem acento por
  // padrão (broad match), mas variantes editoriais costumam ter.
  // Sem isso, "classificacao automatica" não casa com "classificação automática".
  return decoded
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/**
 * Match bidirecional: incoming.includes(variant) OU variant.includes(incoming).
 * Vence a chave mais longa (especificidade).
 */
function matchVariant(
  incoming: string,
  variants: Record<string, string>,
): string | null {
  const normalizedIncoming = normalize(incoming);
  if (!normalizedIncoming) return null;

  let bestKey: string | null = null;
  let bestLen = 0;

  for (const key of Object.keys(variants)) {
    const normalizedKey = normalize(key);
    if (!normalizedKey) continue;
    const matches =
      normalizedIncoming.includes(normalizedKey) ||
      normalizedKey.includes(normalizedIncoming);
    if (matches && normalizedKey.length > bestLen) {
      bestKey = key;
      bestLen = normalizedKey.length;
    }
  }

  return bestKey ? variants[bestKey] : null;
}

export function DynamicHeadline({
  defaultHeadline,
  variants,
  className,
  as,
}: DynamicHeadlineProps) {
  const [headline, setHeadline] = useState(defaultHeadline);
  const Tag = (as ?? "h1") as React.ElementType;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    for (const key of KEYWORD_PARAMS) {
      const raw = params.get(key);
      if (!raw) continue;
      const matched = matchVariant(raw, variants);
      if (matched) {
        // Lê window.location uma vez no mount; padrão correto pra
        // sincronizar default SSR com URL real do client.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHeadline(matched);
        return;
      }
    }
  }, [variants]);

  return <Tag className={className}>{headline}</Tag>;
}
