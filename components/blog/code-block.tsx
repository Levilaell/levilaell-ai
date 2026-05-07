"use client";

import { Highlight, themes } from "prism-react-renderer";
import { cn } from "@/lib/utils";

type Props = React.HTMLAttributes<HTMLElement> & {
  language?: string;
  children: string;
};

export function CodeBlock({ language, children, className, ...rest }: Props) {
  const lang = (language ?? "").toLowerCase();

  return (
    <Highlight code={children.trim()} language={lang || "text"} theme={themes.vsDark}>
      {({ className: hlClass, style, tokens, getLineProps, getTokenProps }) => (
        <div className="not-prose my-6 rounded-2xl border border-border overflow-hidden">
          {lang && (
            <div className="bg-zinc-900 text-zinc-400 text-xs font-mono px-4 py-2 border-b border-zinc-800">
              {lang}
            </div>
          )}
          <pre
            className={cn(
              "overflow-x-auto p-4 text-sm leading-relaxed font-mono",
              hlClass,
              className,
            )}
            style={style}
            {...rest}
          >
            {tokens.map((line, i) => {
              const lineProps = getLineProps({ line, key: i });
              return (
                <div
                  {...lineProps}
                  key={i}
                  className={cn(lineProps.className)}
                >
                  {line.map((token, j) => {
                    const tokenProps = getTokenProps({ token, key: j });
                    return <span {...tokenProps} key={j} />;
                  })}
                </div>
              );
            })}
          </pre>
        </div>
      )}
    </Highlight>
  );
}
