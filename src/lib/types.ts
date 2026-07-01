export type Profile = "solo" | "couple" | "family" | "nomad" | "student";

export const PROFILES: { value: Profile; label: string }[] = [
  { value: "solo", label: "Solo" },
  { value: "couple", label: "Couple" },
  { value: "family", label: "Family with kids" },
  { value: "nomad", label: "Digital nomad" },
  { value: "student", label: "Student" },
];

export const PRIORITY_OPTIONS = [
  "Housing",
  "Banking",
  "Healthcare & insurance",
  "Residency & registration",
  "Taxes",
  "Phone & internet",
  "Pets",
  "Kids & schooling",
  "Driving license",
  "Community & language",
] as const;

export type Priority = (typeof PRIORITY_OPTIONS)[number];

export interface ReloInput {
  fromCountry: string;
  toCountry: string;
  profile: Profile;
  visaStatus: string;
  timeline: string;
  priorities: string[];
  budget?: string;
  notes?: string;
}

export interface ChecklistItem {
  title: string;
  why: string;
  tip?: string;
  category: string;
  estimate?: string;
}

export const PHASE_KEYS = ["before", "week1", "month1", "days90"] as const;
export type PhaseKey = (typeof PHASE_KEYS)[number];

export interface Phase {
  key: PhaseKey;
  title: string;
  items: ChecklistItem[];
}

export interface ReloPlan {
  destinationSummary: string;
  phases: Phase[];
}

export const PHASE_TITLES: Record<PhaseKey, string> = {
  before: "Before you go",
  week1: "First week",
  month1: "First month",
  days90: "First 90 days",
};
