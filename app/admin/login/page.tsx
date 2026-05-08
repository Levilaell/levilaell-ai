import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  isAdminConfigured,
  verifyAdminSession,
} from "@/lib/admin-auth";
import { LoginForm } from "@/components/admin/login-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const fromParam = typeof sp.from === "string" ? sp.from : undefined;
  const safeFrom = fromParam?.startsWith("/admin") ? fromParam : "/admin";

  // Se já tá logado, manda direto pro dashboard.
  const c = await cookies();
  const token = c.get(ADMIN_SESSION_COOKIE)?.value;
  if (token) {
    const v = await verifyAdminSession(token);
    if (v.valid) redirect(safeFrom);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 grid size-10 place-items-center rounded-lg bg-foreground text-background font-mono text-sm font-semibold">
            LL
          </div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Editorial
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acesso restrito.
          </p>
        </div>

        {!isAdminConfigured() ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <strong>ADMIN_PASSWORD ausente.</strong> Defina no .env.local antes
            de logar.
          </div>
        ) : (
          <LoginForm redirectTo={safeFrom} />
        )}
      </div>
    </div>
  );
}
