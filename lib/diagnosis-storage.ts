import type { DiagnosisAnalysis, DiagnosisSubmission } from "@/types/diagnosis";

const DRAFT_KEY = "diagnosis:draft:v2";
const RESULT_PREFIX = "diagnosis:result:";

export type DiagnosisDraft = {
  step: number;
  answers: Partial<DiagnosisSubmission>;
};

export type StoredResult = {
  id: string;
  createdAt: string;
  name: string;
  analysis: DiagnosisAnalysis;
  timeline?: string;
};

export function loadDraft(): DiagnosisDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DiagnosisDraft;
  } catch {
    return null;
  }
}

export function saveDraft(draft: DiagnosisDraft): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // ignore quota / privacy errors
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

export function saveResult(result: StoredResult): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      `${RESULT_PREFIX}${result.id}`,
      JSON.stringify(result),
    );
  } catch {
    // ignore
  }
}

export function loadResult(id: string): StoredResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${RESULT_PREFIX}${id}`);
    if (!raw) return null;
    return JSON.parse(raw) as StoredResult;
  } catch {
    return null;
  }
}
