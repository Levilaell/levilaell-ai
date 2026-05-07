import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSchedulingTarget } from "@/lib/calcom";
import { cn } from "@/lib/utils";

type CalcomVariant = "primary" | "secondary" | "white";

const variantClasses: Record<CalcomVariant, string> = {
  primary: "",
  secondary: "",
  white:
    "bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50 shadow-sm",
};

const baseVariant: Record<CalcomVariant, "brand" | "outline" | "default"> = {
  primary: "brand",
  secondary: "outline",
  white: "default",
};

type Props = {
  subject?: string;
  label?: string;
  size?: "default" | "lg" | "xl";
  variant?: CalcomVariant;
  className?: string;
};

export function SchedulingButton({
  subject,
  label = "Agendar call gratuita",
  size = "lg",
  variant = "primary",
  className,
}: Props) {
  const target = getSchedulingTarget(subject);
  const Icon = target.isMailto ? Mail : ArrowUpRight;

  return (
    <Button
      asChild
      size={size}
      variant={baseVariant[variant]}
      className={cn("rounded-xl", variantClasses[variant], className)}
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

// Alias for the new convention requested in the brief.
export const CalcomButton = SchedulingButton;
