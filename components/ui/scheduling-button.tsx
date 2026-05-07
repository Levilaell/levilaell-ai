import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSchedulingTarget } from "@/lib/calcom";
import { cn } from "@/lib/utils";

type Props = {
  subject?: string;
  label?: string;
  size?: "default" | "lg" | "xl";
  variant?: "brand" | "default" | "outline";
  className?: string;
};

export function SchedulingButton({
  subject,
  label = "Agendar call gratuita",
  size = "lg",
  variant = "brand",
  className,
}: Props) {
  const target = getSchedulingTarget(subject);
  const Icon = target.isMailto ? Mail : ArrowUpRight;

  return (
    <Button
      asChild
      size={size}
      variant={variant}
      className={cn("rounded-xl", className)}
    >
      <Link
        href={target.href}
        target={target.isMailto ? undefined : "_blank"}
        rel={target.isMailto ? undefined : "noopener noreferrer"}
      >
        <Icon className="size-4" aria-hidden />
        <span>{label}</span>
      </Link>
    </Button>
  );
}
