"use client";

import { useEffect } from "react";
import { track } from "@/lib/tracking";

type Props = {
  type: string;
  data?: Record<string, unknown>;
};

/** Dispara um tracking event uma única vez quando o componente monta. */
export function TrackOnMount({ type, data }: Props) {
  useEffect(() => {
    track({ type, data });
    // Intentionally not declaring `data` in deps — quero firing único por mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);
  return null;
}
