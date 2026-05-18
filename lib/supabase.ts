import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type {
  DiagnosisAnalysis,
  DiagnosisStatus,
  DiagnosisAnswers,
} from "@/types/diagnosis";
import { calculateLeadScore } from "@/lib/lead-score";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(url && (anonKey || serviceKey));
}

let browserClient: SupabaseClient<Database> | null = null;
let serviceClient: SupabaseClient<Database> | null = null;

export function getSupabaseAnon(): SupabaseClient<Database> | null {
  if (!url || !anonKey) return null;
  if (!browserClient) {
    browserClient = createClient<Database>(url, anonKey, {
      auth: { persistSession: false },
    });
  }
  return browserClient;
}

export function getSupabaseService(): SupabaseClient<Database> | null {
  if (!url || !serviceKey) return null;
  if (!serviceClient) {
    serviceClient = createClient<Database>(url, serviceKey, {
      auth: { persistSession: false },
    });
  }
  return serviceClient;
}

// ---------------------------------------------------------------------------
// Diagnoses
// ---------------------------------------------------------------------------
export type SaveDiagnosisInput = DiagnosisAnswers & {
  id?: string;
  name: string;
  email: string;
  whatsapp?: string;
  company?: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  landing_page?: string | null;
  referrer?: string | null;
};

export class SupabaseWriteError extends Error {
  code: string;
  details: string;
  hint: string;
  constructor(label: string, err: unknown) {
    const e = err as {
      code?: string;
      message?: string;
      details?: string;
      hint?: string;
    };
    const message = `[DB_ERROR] ${label}: ${e.message ?? "unknown"}${
      e.code ? ` (code=${e.code})` : ""
    }`;
    super(message);
    this.name = "SupabaseWriteError";
    this.code = e.code ?? "";
    this.details = e.details ?? "";
    this.hint = e.hint ?? "";
  }
}

export async function saveDiagnosis(
  input: SaveDiagnosisInput,
): Promise<{ id: string }> {
  const supabase = getSupabaseService();
  if (!supabase) {
    throw new Error(
      "[DB_ERROR] saveDiagnosis: Supabase service client não configurado.",
    );
  }

  const leadScore = calculateLeadScore(input);

  // Mapping form V2 → coluna do banco (ver 0007_diagnosis_contabil_refactor.sql)
  //   form.q1_size               → diagnoses.q1_size
  //   form.q2_erp                → diagnoses.q2_erp (coluna nova)
  //   form.q3_client_profile     → diagnoses.q3_client_profile (coluna nova)
  //   form.q4_pain_areas         → diagnoses.q3_pain_areas (REUSO jsonb)
  //   form.q5_hours_weekly       → diagnoses.q5_hours_weekly (REUSO; valores novos)
  //   form.q6_automation_history → diagnoses.q6_automation_history (REUSO)
  //   form.q7_timeline           → diagnoses.q8_timeline (REUSO; valores novos)
  //
  // Colunas legacy preenchidas com NULL pra registros V2:
  //   q2_business_model, q2_business_model_other, q4_tech_maturity,
  //   q7_main_goal, q9_budget, q10_revenue, q10_employees.

  // Log com payload sanitizado — sem PII (nome / email / whatsapp em texto).
  console.log("[DB] saveDiagnosis insert", {
    has_id: Boolean(input.id),
    has_name: Boolean(input.name),
    has_email: Boolean(input.email),
    has_whatsapp: Boolean(input.whatsapp),
    has_company: Boolean(input.company),
    q1_size: input.q1_size,
    q2_erp: input.q2_erp,
    q3_client_profile: input.q3_client_profile,
    pain_areas_count: input.q4_pain_areas?.length ?? 0,
    q5_hours_weekly: input.q5_hours_weekly,
    q6_automation_history: input.q6_automation_history,
    q7_timeline: input.q7_timeline,
    lead_score: leadScore,
  });

  const { data, error } = await supabase
    .from("diagnoses")
    .insert({
      id: input.id,
      name: input.name,
      email: input.email,
      whatsapp: input.whatsapp || null,
      company: input.company || null,
      q1_size: input.q1_size,
      // V2: ERP + perfil de cliente
      q2_erp: input.q2_erp,
      q3_client_profile: input.q3_client_profile,
      // Reuso: q4_pain_areas (form) → q3_pain_areas (banco, jsonb)
      q3_pain_areas: input.q4_pain_areas,
      // Reuso direto (mesmo slot, valores novos)
      q5_hours_weekly: input.q5_hours_weekly,
      q6_automation_history: input.q6_automation_history,
      // Reuso: q7_timeline (form) → q8_timeline (banco)
      q8_timeline: input.q7_timeline,
      // Legacy NULL em registros V2
      q2_business_model: null,
      q2_business_model_other: null,
      q4_tech_maturity: null,
      q7_main_goal: null,
      q9_budget: null,
      q10_revenue: null,
      q10_employees: null,
      utm_source: input.utm_source ?? null,
      utm_medium: input.utm_medium ?? null,
      utm_campaign: input.utm_campaign ?? null,
      utm_content: input.utm_content ?? null,
      utm_term: input.utm_term ?? null,
      landing_page: input.landing_page ?? null,
      referrer: input.referrer ?? null,
      status: "processing",
      lead_score: leadScore,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[DB_ERROR] saveDiagnosis insert failed", {
      code: (error as { code?: string }).code,
      message: error.message,
      details: (error as { details?: string }).details,
      hint: (error as { hint?: string }).hint,
    });
    throw new SupabaseWriteError("saveDiagnosis", error);
  }
  console.log("[DB] saveDiagnosis ok", { id: data.id });
  return { id: data.id };
}

export async function updateDiagnosisStatus(
  id: string,
  patch: {
    status: DiagnosisStatus;
    ai_analysis?: DiagnosisAnalysis | null;
    error_message?: string | null;
    lead_score?: number | null;
  },
): Promise<void> {
  const supabase = getSupabaseService();
  if (!supabase) {
    console.warn(
      "[DB] updateDiagnosisStatus skipped — Supabase service client não configurado.",
    );
    return;
  }

  console.log("[DB] updateDiagnosisStatus", {
    id,
    status: patch.status,
    has_analysis: Boolean(patch.ai_analysis),
    has_error: Boolean(patch.error_message),
    lead_score: patch.lead_score ?? null,
  });

  const update: Database["public"]["Tables"]["diagnoses"]["Update"] = {
    status: patch.status,
    ai_analysis: patch.ai_analysis ?? null,
    error_message: patch.error_message ?? null,
  };
  if (patch.lead_score !== undefined) {
    update.lead_score = patch.lead_score;
  }

  const { error } = await supabase
    .from("diagnoses")
    .update(update)
    .eq("id", id);

  if (error) {
    console.error("[DB_ERROR] updateDiagnosisStatus failed", {
      id,
      code: (error as { code?: string }).code,
      message: error.message,
      details: (error as { details?: string }).details,
    });
    throw new SupabaseWriteError("updateDiagnosisStatus", error);
  }
}

export type DiagnosisFetched = {
  id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  createdAt: string;
  status: DiagnosisStatus;
  analysis: DiagnosisAnalysis | null;
  q8_timeline: string;
  error_message: string | null;
  retry_count: number;
};

// Lite: usado pelo endpoint /status (polling). Lê só o que muda durante
// o processamento, sem trazer PII nem ai_analysis pesado.
export type DiagnosisStatusLite = {
  status: DiagnosisStatus;
  error_message: string | null;
  retry_count: number;
};

export async function getDiagnosisStatusLite(
  id: string,
): Promise<DiagnosisStatusLite | null> {
  const supabase = getSupabaseService();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("diagnoses")
    .select("status, error_message, retry_count")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return {
    status: data.status,
    error_message: data.error_message,
    retry_count: data.retry_count,
  };
}

// Reset pra retry manual: zera análise/erro, status volta pra processing,
// incrementa retry_count. Retorna o retry_count atualizado pra rate limit.
// Não dispara o reprocessamento aqui — caller (rota /retry) que chama
// generateDiagnosisAnalysis via after().
export async function resetDiagnosisForRetry(
  id: string,
): Promise<{ retry_count: number } | null> {
  const supabase = getSupabaseService();
  if (!supabase) return null;
  // Atualização condicional — só reseta se ainda não atingiu o limite.
  // Postgres trata isso como um único write atômico (sem race entre
  // dois cliques simultâneos do botão).
  const { data, error } = await supabase
    .from("diagnoses")
    .update({
      status: "processing",
      ai_analysis: null,
      error_message: null,
      retry_count: 1,
    })
    .eq("id", id)
    .eq("retry_count", 0)
    .select("retry_count")
    .single();
  if (error || !data) return null;
  return { retry_count: data.retry_count };
}

// Busca answers V2 a partir do registro do banco — usado pelo retry pra
// reconstruir DiagnosisAnswers e chamar generateDiagnosisAnalysis de novo.
export async function getDiagnosisAnswers(
  id: string,
): Promise<DiagnosisAnswers | null> {
  const supabase = getSupabaseService();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("diagnoses")
    .select(
      "q1_size, q2_erp, q3_client_profile, q3_pain_areas, q5_hours_weekly, q6_automation_history, q8_timeline",
    )
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  if (!data.q2_erp || !data.q3_client_profile) return null;
  return {
    q1_size: data.q1_size as DiagnosisAnswers["q1_size"],
    q2_erp: data.q2_erp as DiagnosisAnswers["q2_erp"],
    q3_client_profile:
      data.q3_client_profile as DiagnosisAnswers["q3_client_profile"],
    q4_pain_areas: data.q3_pain_areas as DiagnosisAnswers["q4_pain_areas"],
    q5_hours_weekly:
      data.q5_hours_weekly as DiagnosisAnswers["q5_hours_weekly"],
    q6_automation_history:
      data.q6_automation_history as DiagnosisAnswers["q6_automation_history"],
    q7_timeline: data.q8_timeline as DiagnosisAnswers["q7_timeline"],
  };
}

export async function getDiagnosisById(
  id: string,
): Promise<DiagnosisFetched | null> {
  const supabase = getSupabaseService();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("diagnoses")
    .select(
      "id, name, email, whatsapp, created_at, status, ai_analysis, q8_timeline, error_message, retry_count",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    whatsapp: data.whatsapp,
    createdAt: data.created_at,
    status: data.status,
    analysis: data.ai_analysis,
    q8_timeline: data.q8_timeline,
    error_message: data.error_message,
    retry_count: data.retry_count,
  };
}

// ---------------------------------------------------------------------------
// Subscribers
// ---------------------------------------------------------------------------
export type SaveSubscriberInput = {
  email: string;
  name?: string | null;
  source?: string | null;
};

export async function saveSubscriber(
  input: SaveSubscriberInput,
): Promise<void> {
  const supabase = getSupabaseService();
  if (!supabase) {
    throw new Error(
      "[DB_ERROR] saveSubscriber: Supabase service client não configurado.",
    );
  }

  console.log("[DB] saveSubscriber upsert", {
    has_email: Boolean(input.email),
    has_name: Boolean(input.name),
    source: input.source ?? null,
  });

  const { error } = await supabase.from("subscribers").upsert(
    {
      email: input.email.toLowerCase(),
      name: input.name ?? null,
      source: input.source ?? null,
      unsubscribed_at: null,
    },
    { onConflict: "email" },
  );

  if (error) {
    console.error("[DB_ERROR] saveSubscriber failed", {
      code: (error as { code?: string }).code,
      message: error.message,
    });
    throw new SupabaseWriteError("saveSubscriber", error);
  }
}

// ---------------------------------------------------------------------------
// Contacts
// ---------------------------------------------------------------------------
export type SaveContactInput = {
  name: string;
  email: string;
  company?: string | null;
  service_interest?: string | null;
  subject?: string | null;
  message: string;
};

export async function saveContact(input: SaveContactInput): Promise<void> {
  const supabase = getSupabaseService();
  if (!supabase) {
    throw new Error(
      "[DB_ERROR] saveContact: Supabase service client não configurado.",
    );
  }

  console.log("[DB] saveContact insert", {
    has_name: Boolean(input.name),
    has_email: Boolean(input.email),
    has_company: Boolean(input.company),
    service_interest: input.service_interest ?? null,
    subject: input.subject ?? null,
    message_length: input.message.length,
  });

  const { error } = await supabase.from("contacts").insert({
    name: input.name,
    email: input.email,
    company: input.company ?? null,
    service_interest: input.service_interest ?? null,
    subject: input.subject ?? null,
    message: input.message,
  });

  if (error) {
    console.error("[DB_ERROR] saveContact failed", {
      code: (error as { code?: string }).code,
      message: error.message,
    });
    throw new SupabaseWriteError("saveContact", error);
  }
}

// ---------------------------------------------------------------------------
// Tracking
// ---------------------------------------------------------------------------
export type TrackEventInput = {
  event_type: string;
  event_data?: Record<string, unknown> | null;
  session_id?: string | null;
  user_agent?: string | null;
  referrer?: string | null;
  page_path?: string | null;
};

// Fire-and-forget: nunca trava o request principal por falha de tracking.
export async function trackEvent(input: TrackEventInput): Promise<boolean> {
  const supabase = getSupabaseService();
  if (!supabase) return false;

  const { error } = await supabase.from("tracking_events").insert({
    event_type: input.event_type,
    event_data: (input.event_data ?? null) as never,
    session_id: input.session_id ?? null,
    user_agent: input.user_agent ?? null,
    referrer: input.referrer ?? null,
    page_path: input.page_path ?? null,
  });

  if (error) {
    console.error("[DB_ERROR] trackEvent failed (silent)", {
      event_type: input.event_type,
      code: (error as { code?: string }).code,
      message: error.message,
    });
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Public examples
// ---------------------------------------------------------------------------
export async function getPublicExamples() {
  const supabase = getSupabaseService();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("public_examples")
    .select("id, slug, title, meta_description, content, created_at, views")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[supabase] getPublicExamples error:", error);
    return [];
  }
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Email sequences
// ---------------------------------------------------------------------------
export type EmailSequenceItem = {
  email_number: number;
  scheduled_at: string;
};

export async function scheduleEmailSequence(
  diagnosisId: string,
  items: EmailSequenceItem[],
): Promise<void> {
  const supabase = getSupabaseService();
  if (!supabase) {
    throw new Error(
      "[DB_ERROR] scheduleEmailSequence: Supabase service client não configurado.",
    );
  }

  console.log("[DB] scheduleEmailSequence insert", {
    diagnosis_id: diagnosisId,
    count: items.length,
    numbers: items.map((i) => i.email_number),
  });

  const rows = items.map((item) => ({
    diagnosis_id: diagnosisId,
    email_number: item.email_number,
    scheduled_at: item.scheduled_at,
    status: "scheduled" as const,
  }));

  const { error } = await supabase.from("email_sequences").insert(rows);
  if (error) {
    console.error("[DB_ERROR] scheduleEmailSequence failed", {
      diagnosis_id: diagnosisId,
      code: (error as { code?: string }).code,
      message: error.message,
    });
    throw new SupabaseWriteError("scheduleEmailSequence", error);
  }
}

export async function cancelEmailSequence(
  diagnosisId: string,
): Promise<void> {
  const supabase = getSupabaseService();
  if (!supabase) return;
  const { error } = await supabase
    .from("email_sequences")
    .update({ status: "cancelled" })
    .eq("diagnosis_id", diagnosisId)
    .eq("status", "scheduled");
  if (error) {
    console.error("[DB_ERROR] cancelEmailSequence failed", {
      diagnosis_id: diagnosisId,
      message: error.message,
    });
    throw new SupabaseWriteError("cancelEmailSequence", error);
  }
}
