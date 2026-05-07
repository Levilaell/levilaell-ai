import { cn } from "@/lib/utils";

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  align?: "left" | "center";
  as?: "h1" | "h2";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
  align = "left",
  as = "h2",
}: Props) {
  const Heading = as;
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow && (
        <span className="inline-block text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
          {eyebrow}
        </span>
      )}
      <Heading className={cn(as === "h1" ? "heading-1" : "heading-2")}>
        {title}
      </Heading>
      {description && (
        <p className="text-lead mt-4">{description}</p>
      )}
    </div>
  );
}
