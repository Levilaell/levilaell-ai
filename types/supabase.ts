import type { DiagnosisAnalysis } from "@/types/diagnosis";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Migration 0007 (>=2026-05-18) tornou q2_business_model / q4_tech_maturity /
// q7_main_goal / q9_budget nullable, e adicionou q2_erp + q3_client_profile.
// q3_pain_areas / q5_hours_weekly / q6_automation_history / q8_timeline
// continuam NOT NULL — são reusados com semântica nova pelos registros v2.
type DiagnosisRow = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  whatsapp: string | null;
  company: string | null;
  q1_size: string;
  q2_business_model: string | null;
  q2_business_model_other: string | null;
  q3_pain_areas: string[];
  q4_tech_maturity: string | null;
  q5_hours_weekly: string;
  q6_automation_history: string;
  q7_main_goal: string | null;
  q8_timeline: string;
  q9_budget: string | null;
  q10_revenue: string | null;
  q10_employees: number | null;
  q2_erp: string | null;
  q3_client_profile: string | null;
  ai_analysis: DiagnosisAnalysis | null;
  status: "processing" | "completed" | "failed";
  error_message: string | null;
  lead_score: number | null;
  contacted_at: string | null;
  qualified_at: string | null;
  lead_notes: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  landing_page: string | null;
  referrer: string | null;
};

type DiagnosisInsert = Omit<
  DiagnosisRow,
  | "id"
  | "created_at"
  | "ai_analysis"
  | "error_message"
  | "lead_score"
  | "contacted_at"
  | "qualified_at"
  | "lead_notes"
  | "utm_source"
  | "utm_medium"
  | "utm_campaign"
  | "utm_content"
  | "utm_term"
  | "landing_page"
  | "referrer"
> & {
  id?: string;
  created_at?: string;
  ai_analysis?: DiagnosisRow["ai_analysis"];
  error_message?: DiagnosisRow["error_message"];
  lead_score?: DiagnosisRow["lead_score"];
  contacted_at?: DiagnosisRow["contacted_at"];
  qualified_at?: DiagnosisRow["qualified_at"];
  lead_notes?: DiagnosisRow["lead_notes"];
  utm_source?: DiagnosisRow["utm_source"];
  utm_medium?: DiagnosisRow["utm_medium"];
  utm_campaign?: DiagnosisRow["utm_campaign"];
  utm_content?: DiagnosisRow["utm_content"];
  utm_term?: DiagnosisRow["utm_term"];
  landing_page?: DiagnosisRow["landing_page"];
  referrer?: DiagnosisRow["referrer"];
};

type EmailSequenceRow = {
  id: string;
  diagnosis_id: string | null;
  email_number: number;
  scheduled_at: string;
  sent_at: string | null;
  status: "scheduled" | "sent" | "failed" | "cancelled";
  error_message: string | null;
  body_html: string | null;
  body_subject: string | null;
};

type EmailSequenceInsert = {
  id?: string;
  diagnosis_id: string;
  email_number: number;
  scheduled_at: string;
  sent_at?: string | null;
  status?: "scheduled" | "sent" | "failed" | "cancelled";
  error_message?: string | null;
  body_html?: string | null;
  body_subject?: string | null;
};

type SubscriberRow = {
  id: string;
  email: string;
  name: string | null;
  subscribed_at: string;
  unsubscribed_at: string | null;
  source: string | null;
  tags: string[];
};

type SubscriberInsert = {
  id?: string;
  email: string;
  name?: string | null;
  subscribed_at?: string;
  unsubscribed_at?: string | null;
  source?: string | null;
  tags?: string[];
};

type ContactRow = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  service_interest: string | null;
  subject: string | null;
  message: string;
  created_at: string;
  status: string;
};

type ContactInsert = {
  id?: string;
  name: string;
  email: string;
  company?: string | null;
  service_interest?: string | null;
  subject?: string | null;
  message: string;
  created_at?: string;
  status?: string;
};

type PublicExampleRow = {
  id: string;
  diagnosis_id: string | null;
  slug: string;
  title: string;
  meta_description: string | null;
  content: DiagnosisAnalysis & { lead_summary?: string };
  published: boolean;
  views: number;
  created_at: string;
};

type PublicExampleInsert = {
  id?: string;
  diagnosis_id?: string | null;
  slug: string;
  title: string;
  meta_description?: string | null;
  content: DiagnosisAnalysis & { lead_summary?: string };
  published?: boolean;
  views?: number;
  created_at?: string;
};

type TrackingEventRow = {
  id: string;
  event_type: string;
  event_data: Json | null;
  session_id: string | null;
  user_agent: string | null;
  referrer: string | null;
  page_path: string | null;
  created_at: string;
};

type TrackingEventInsert = {
  id?: string;
  event_type: string;
  event_data?: Json | null;
  session_id?: string | null;
  user_agent?: string | null;
  referrer?: string | null;
  page_path?: string | null;
  created_at?: string;
};

type ContentPipelineRow = {
  id: string;
  created_at: string;
  updated_at: string;
  channel: "blog" | "newsletter" | "x";
  topic: string;
  pillar: string | null;
  keyword: string | null;
  notes: string | null;
  metadata: Json;
  status:
    | "queued"
    | "generating"
    | "generated"
    | "approved"
    | "publishing"
    | "published"
    | "rejected"
    | "failed";
  generated_content: Json | null;
  edited_content: Json | null;
  generated_at: string | null;
  approved_at: string | null;
  published_at: string | null;
  notion_page_id: string | null;
  resend_batch_id: string | null;
  newsletter_recipients_count: number | null;
  tokens_used: number;
  cost_estimate_brl: number;
  error_message: string | null;
  generated_in_ms: number | null;
  generation_count: number;
};

type ContentPipelineInsert = {
  id?: string;
  created_at?: string;
  updated_at?: string;
  channel: ContentPipelineRow["channel"];
  topic: string;
  pillar?: string | null;
  keyword?: string | null;
  notes?: string | null;
  metadata?: Json;
  status?: ContentPipelineRow["status"];
  generated_content?: Json | null;
  edited_content?: Json | null;
  generated_at?: string | null;
  approved_at?: string | null;
  published_at?: string | null;
  notion_page_id?: string | null;
  resend_batch_id?: string | null;
  newsletter_recipients_count?: number | null;
  tokens_used?: number;
  cost_estimate_brl?: number;
  error_message?: string | null;
  generated_in_ms?: number | null;
  generation_count?: number;
};

type NewsletterSendRow = {
  id: string;
  pipeline_id: string | null;
  subscriber_id: string | null;
  sent_at: string;
  status: "sent" | "failed";
  error_message: string | null;
};

type NewsletterSendInsert = {
  id?: string;
  pipeline_id?: string | null;
  subscriber_id?: string | null;
  sent_at?: string;
  status?: "sent" | "failed";
  error_message?: string | null;
};

export type Database = {
  public: {
    Tables: {
      diagnoses: {
        Row: DiagnosisRow;
        Insert: DiagnosisInsert;
        Update: Partial<DiagnosisInsert>;
        Relationships: [];
      };
      email_sequences: {
        Row: EmailSequenceRow;
        Insert: EmailSequenceInsert;
        Update: Partial<EmailSequenceInsert>;
        Relationships: [];
      };
      subscribers: {
        Row: SubscriberRow;
        Insert: SubscriberInsert;
        Update: Partial<SubscriberInsert>;
        Relationships: [];
      };
      contacts: {
        Row: ContactRow;
        Insert: ContactInsert;
        Update: Partial<ContactInsert>;
        Relationships: [];
      };
      public_examples: {
        Row: PublicExampleRow;
        Insert: PublicExampleInsert;
        Update: Partial<PublicExampleInsert>;
        Relationships: [];
      };
      tracking_events: {
        Row: TrackingEventRow;
        Insert: TrackingEventInsert;
        Update: Partial<TrackingEventInsert>;
        Relationships: [];
      };
      content_pipeline: {
        Row: ContentPipelineRow;
        Insert: ContentPipelineInsert;
        Update: Partial<ContentPipelineInsert>;
        Relationships: [];
      };
      newsletter_sends: {
        Row: NewsletterSendRow;
        Insert: NewsletterSendInsert;
        Update: Partial<NewsletterSendInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
