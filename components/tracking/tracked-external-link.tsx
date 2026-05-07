"use client";

import * as React from "react";
import { track } from "@/lib/tracking";

type Props = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  trackLabel: string;
  trackData?: Record<string, unknown>;
};

/**
 * Anchor que dispara `external_link_clicked` no track quando clicado.
 * target=_blank + rel noopener por default — link externo seguro.
 */
export function TrackedExternalLink({
  trackLabel,
  trackData,
  onClick,
  target = "_blank",
  rel = "noopener noreferrer",
  ...rest
}: Props) {
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    track({
      type: "external_link_clicked",
      data: { label: trackLabel, href: rest.href ?? null, ...trackData },
    });
    onClick?.(e);
  }
  return <a {...rest} target={target} rel={rel} onClick={handleClick} />;
}
