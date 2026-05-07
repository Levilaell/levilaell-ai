"use client";

import * as React from "react";
import Link, { type LinkProps } from "next/link";
import { track } from "@/lib/tracking";

type Props = Omit<LinkProps, "onClick"> & {
  /** Label semântico que vai pra `event_data.cta_label`. */
  trackLabel: string;
  /** Override opcional de `event_data.cta_destination` (default = href). */
  destination?: string;
  className?: string;
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  target?: React.HTMLAttributeAnchorTarget;
  rel?: string;
  "aria-label"?: string;
};

/**
 * <Link> tracked: dispara `cta_clicked` com `cta_label` + `cta_destination`.
 * Use dentro de <Button asChild> ou diretamente onde precisar.
 */
export function TrackedLink({
  trackLabel,
  destination,
  href,
  onClick,
  ...rest
}: Props) {
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    track({
      type: "cta_clicked",
      data: {
        cta_label: trackLabel,
        cta_destination:
          destination ?? (typeof href === "string" ? href : String(href)),
      },
    });
    onClick?.(e);
  }
  return <Link href={href} onClick={handleClick} {...rest} />;
}
