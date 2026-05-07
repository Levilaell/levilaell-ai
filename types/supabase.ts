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
  q1_company_type: string;
  q2_industry: string;
  q3_pain_areas: PainArea[];
  q4_tech_maturity: string;
  q5_hours_weekly: string;
  q6_automation_history: string;
  q7_main_goal: string;
  ai_analysis: DiagnosisAnalysis | null;
  status: "processing" | "completed" | "failed";
  lead_score: number | null;
};

type DiagnosisInsert = {
  id?: string;
  created_at?: string;
  name: string;
  email: string;
  whatsapp?: string | null;
  company?: string | null;
  q1_company_type: string;
  q2_industry: string;
  q3_pain_areas: PainArea[];
  q4_tech_maturity: string;
  q5_hours_weekly: string;
  q6_automation_history: string;
  q7_main_goal: string;
  ai_analysis?: DiagnosisAnalysis | null;
  status?: "processing" | "completed" | "failed";
  lead_score?: number | null;
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

export type Database = {
  public: {
    Tables: {
      diagnoses: {
        Row: DiagnosisRow;
        Insert: DiagnosisInsert;
        Update: Partial<DiagnosisInsert>;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
