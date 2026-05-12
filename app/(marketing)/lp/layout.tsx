import type { Metadata } from "next";
import { LpFooter } from "@/components/marketing/lp/lp-footer";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    noimageindex: true,
    nocache: true,
  },
};

export default function LpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <main className="flex-1">{children}</main>
      <LpFooter />
    </>
  );
}
