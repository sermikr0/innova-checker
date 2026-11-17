/** Version of the Terms of Use people accept. Changing it asks everyone to accept again. */
export const TERMS_VERSION = "2026-11-17";

export type LegalSection = { id: string; title: string; paragraphs: string[]; items?: string[]; after?: string[] };

export type LegalDoc = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  updated: string;
  summaryTitle: string;
  summary: string[];
  sections: LegalSection[];
};
