import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import { CodeBlock } from "@/components/blog/code-block";
import { cn } from "@/lib/utils";

type Props = {
  markdown: string;
  className?: string;
};

const NOTION_CALLOUT_PREFIX = /^>\s*([⚠️ℹ️💡✅🚨📌])\s*/u;

const components: Components = {
  h1: (props) => (
    <h1 className="scroll-mt-24" {...props} />
  ),
  h2: (props) => (
    <h2 className="scroll-mt-24" {...props} />
  ),
  h3: (props) => (
    <h3 className="scroll-mt-24" {...props} />
  ),
  a: ({ href, children, ...rest }) => {
    const isExternal = href?.startsWith("http");
    return (
      <a
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        {...rest}
      >
        {children}
      </a>
    );
  },
  blockquote: ({ children }) => {
    // Detecta callouts do Notion convertidos em markdown
    const text = extractText(children);
    const match = text.match(NOTION_CALLOUT_PREFIX);
    if (match) {
      const tone = toneFromEmoji(match[1]);
      return (
        <aside
          className={cn(
            "not-prose my-6 rounded-2xl border p-5 flex gap-3",
            toneClasses(tone),
          )}
        >
          <span aria-hidden className="text-xl flex-shrink-0">
            {match[1]}
          </span>
          <div className="text-sm md:text-base leading-relaxed">
            {stripCalloutEmoji(children)}
          </div>
        </aside>
      );
    }
    return <blockquote>{children}</blockquote>;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  code: ({ inline, className, children, ...rest }: any) => {
    if (inline) {
      return (
        <code className={className} {...rest}>
          {children}
        </code>
      );
    }
    const lang = /language-(\w+)/.exec(className ?? "")?.[1];
    return (
      <CodeBlock language={lang} {...rest}>
        {String(children).replace(/\n$/, "")}
      </CodeBlock>
    );
  },
  pre: ({ children }) => <>{children}</>,
};

export function ArticleRenderer({ markdown, className }: Props) {
  return (
    <div
      className={cn(
        "prose prose-zinc dark:prose-invert max-w-none",
        "prose-headings:font-semibold prose-headings:tracking-tight",
        "prose-h2:mt-12 prose-h3:mt-10",
        "prose-a:text-foreground prose-a:underline prose-a:decoration-amber-500 prose-a:decoration-2 prose-a:underline-offset-4 hover:prose-a:decoration-amber-400",
        "prose-strong:text-foreground",
        "prose-code:text-foreground prose-code:bg-muted prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:font-mono prose-code:text-sm prose-code:before:content-none prose-code:after:content-none",
        "prose-blockquote:border-l-4 prose-blockquote:border-amber-500 prose-blockquote:bg-muted/40 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:py-1 prose-blockquote:px-5 prose-blockquote:font-normal",
        "prose-img:rounded-xl prose-img:border prose-img:border-border",
        "prose-li:marker:text-muted-foreground",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSlug]}
        components={components}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Callout helpers
// ---------------------------------------------------------------------------
type CalloutTone = "warning" | "info" | "success" | "alert";

function toneFromEmoji(emoji: string): CalloutTone {
  switch (emoji) {
    case "⚠️":
    case "🚨":
      return "warning";
    case "💡":
      return "info";
    case "✅":
      return "success";
    case "📌":
    case "ℹ️":
    default:
      return "alert";
  }
}

function toneClasses(tone: CalloutTone): string {
  switch (tone) {
    case "warning":
      return "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900";
    case "success":
      return "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900";
    case "info":
      return "bg-zinc-50 border-zinc-200 dark:bg-zinc-900/30 dark:border-zinc-800";
    case "alert":
    default:
      return "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900";
  }
}

function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node && typeof node === "object" && "props" in node) {
    return extractText(
      (node as { props: { children?: React.ReactNode } }).props.children,
    );
  }
  return "";
}

function stripCalloutEmoji(node: React.ReactNode): React.ReactNode {
  if (typeof node === "string") {
    return node.replace(NOTION_CALLOUT_PREFIX, "").trimStart();
  }
  if (Array.isArray(node)) {
    let stripped = false;
    return node.map((child) => {
      if (!stripped && typeof child === "string") {
        const next = child.replace(NOTION_CALLOUT_PREFIX, "");
        if (next !== child) stripped = true;
        return next;
      }
      return child;
    });
  }
  return node;
}
