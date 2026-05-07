import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type {
  DiagnosisAnalysis,
  DiagnosisStatus,
  DiagnosisAnswers,
  PainArea,
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
};

export async function saveDiagnosis(
  input: SaveDiagnosisInput,
): Promise<{ id: string } | null> {
  const supabase = getSupabaseService();
  if (!supabase) return null;

  const leadScore = calculateLeadScore(input);
  const { data, error } = await supabase
    .from("diagnoses")
    .insert({
      id: input.id,
      name: input.name,
      email: input.email,
      whatsapp: input.whatsapp || null,
      company: input.company || null,
      q1_size: input.q1_size,
      q2_business_model: input.q2_business_model,
      q2_business_model_other: input.q2_business_model_other ?? null,
      q3_pain_areas: input.q3_pain_areas as PainArea[],
      q4_tech_maturity: input.q4_tech_maturity,
      q5_hours_weekly: input.q5_hours_weekly,
      q6_automation_history: input.q6_automation_history,
      q7_main_goal: input.q7_main_goal,
      q8_timeline: input.q8_timeline,
      q9_budget: input.q9_budget,
      q10_revenue: input.q10_revenue ?? null,
      q10_employees:
        typeof input.q10_employees === "number" ? input.q10_employees : null,
      status: "processing",
      lead_score: leadScore,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[supabase] saveDiagnosis error:", error);
    return null;
  }
  return { id: data.id };
}

export async function updateDiagnosisStatus(
  id: string,
  patch: {
    status: DiagnosisStatus;
    ai_analysis?: DiagnosisAnalysis | null;
    error_message?: string | null;
  },
): Promise<boolean> {
  const supabase = getSupabaseService();
  if (!supabase) return false;

  const { error } = await supabase
    .from("diagnoses")
    .update({
      status: patch.status,
      ai_analysis: patch.ai_analysis ?? null,
      error_message: patch.error_message ?? null,
    })
    .eq("id", id);

  if (error) {
    console.error("[supabase] updateDiagnosisStatus error:", error);
    return false;
  }
  return true;
}

export type DiagnosisFetched = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  status: DiagnosisStatus;
  analysis: DiagnosisAnalysis | null;
  q8_timeline: string;
};

export async function getDiagnosisById(
  id: string,
): Promise<DiagnosisFetched | null> {
  const supabase = getSupabaseService();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("diagnoses")
    .select("id, name, email, created_at, status, ai_analysis, q8_timeline")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    createdAt: data.created_at,
    status: data.status,
    analysis: data.ai_analysis,
    q8_timeline: data.q8_timeline,
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
): Promise<boolean> {
  const supabase = getSupabaseService();
  if (!supabase) return false;

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
    console.error("[supabase] saveSubscriber error:", error);
    return false;
  }
  return true;
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

export async function saveContact(input: SaveContactInput): Promise<boolean> {
  const supabase = getSupabaseService();
  if (!supabase) return false;

  const { error } = await supabase.from("contacts").insert({
    name: input.name,
    email: input.email,
    company: input.company ?? null,
    service_interest: input.service_interest ?? null,
    subject: input.subject ?? null,
    message: input.message,
  });

  if (error) {
    console.error("[supabase] saveContact error:", error);
    return false;
  }
  return true;
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
    console.error("[supabase] trackEvent error:", error);
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
): Promise<boolean> {
  const supabase = getSupabaseService();
  if (!supabase) return false;

  const rows = items.map((item) => ({
    diagnosis_id: diagnosisId,
    email_number: item.email_number,
    scheduled_at: item.scheduled_at,
    status: "scheduled" as const,
  }));

  const { error } = await supabase.from("email_sequences").insert(rows);
  if (error) {
    console.error("[supabase] scheduleEmailSequence error:", error);
    return false;
  }
  return true;
}

export async function cancelEmailSequence(
  diagnosisId: string,
): Promise<boolean> {
  const supabase = getSupabaseService();
  if (!supabase) return false;
  const { error } = await supabase
    .from("email_sequences")
    .update({ status: "cancelled" })
    .eq("diagnosis_id", diagnosisId)
    .eq("status", "scheduled");
  if (error) {
    console.error("[supabase] cancelEmailSequence error:", error);
    return false;
  }
  return true;
}
