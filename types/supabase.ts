import type { DiagnosisAnalysis, PainArea } from "@/types/diagnosis";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type DiagnosisRow = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  whatsapp: string | null;
  company: string | null;
  q1_size: string;
  q2_business_model: string;
  q2_business_model_other: string | null;
  q3_pain_areas: PainArea[];
  q4_tech_maturity: string;
  q5_hours_weekly: string;
  q6_automation_history: string;
  q7_main_goal: string;
  q8_timeline: string;
  q9_budget: string;
  q10_revenue: string | null;
  q10_employees: number | null;
  ai_analysis: DiagnosisAnalysis | null;
  status: "processing" | "completed" | "failed";
  error_message: string | null;
  lead_score: number | null;
};

type DiagnosisInsert = Omit<
  DiagnosisRow,
  "id" | "created_at" | "ai_analysis" | "error_message" | "lead_score"
> & {
  id?: string;
  created_at?: string;
  ai_analysis?: DiagnosisRow["ai_analysis"];
  error_message?: DiagnosisRow["error_message"];
  lead_score?: DiagnosisRow["lead_score"];
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
