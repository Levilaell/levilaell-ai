import type { ArticleBlock } from "@/types/blog";
import { Callout } from "@/components/ui/callout";
import { cn } from "@/lib/utils";

const calloutToneMap: Record<"info" | "warning" | "success", "info" | "warning" | "success"> = {
  info: "info",
  warning: "warning",
  success: "success",
};

export function ArticleRenderer({ blocks }: { blocks: ArticleBlock[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((block, i) => (
        <BlockRenderer key={i} block={block} />
      ))}
    </div>
  );
}

function BlockRenderer({ block }: { block: ArticleBlock }) {
  switch (block.type) {
    case "paragraph":
      return (
        <p className="text-base md:text-lg leading-relaxed text-foreground/90">
          {block.text}
        </p>
      );
    case "heading": {
      const Heading = block.level === 2 ? "h2" : "h3";
      return (
        <Heading
          className={cn(
            block.level === 2 ? "heading-2 mt-12 mb-4" : "heading-3 mt-10 mb-3",
          )}
        >
          {block.text}
        </Heading>
      );
    }
    case "list":
      if (block.ordered) {
        return (
          <ol className="list-decimal list-outside pl-6 space-y-2.5 marker:font-mono marker:text-muted-foreground">
            {block.items.map((item, i) => (
              <li key={i} className="text-base md:text-lg leading-relaxed text-foreground/90">
                {item}
              </li>
            ))}
          </ol>
        );
      }
      return (
        <ul className="list-disc list-outside pl-6 space-y-2.5 marker:text-muted-foreground">
          {block.items.map((item, i) => (
            <li key={i} className="text-base md:text-lg leading-relaxed text-foreground/90">
              {item}
            </li>
          ))}
        </ul>
      );
    case "quote":
      return (
        <blockquote className="rounded-2xl border-l-4 border-brand bg-muted/40 px-6 py-5">
          <p className="text-lg md:text-xl italic leading-relaxed text-foreground">
            “{block.text}”
          </p>
          {block.cite && (
            <footer className="mt-3 text-sm text-muted-foreground">
              — {block.cite}
            </footer>
          )}
        </blockquote>
      );
    case "callout":
      return (
        <Callout tone={calloutToneMap[block.tone]}>{block.text}</Callout>
      );
    case "code":
      return (
        <pre className="rounded-2xl border border-border bg-zinc-950 text-zinc-100 p-5 overflow-x-auto text-sm font-mono leading-relaxed">
          <code>{block.code}</code>
        </pre>
      );
    default:
      return null;
  }
}
