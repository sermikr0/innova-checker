import type { Metadata } from "next";
import { LegalDocument } from "@/components/marketing/legal-document";
import { termsText } from "@/i18n/messages/terms";
import { getT } from "@/i18n/server";

const CONTENTS = { en: "Contents", ru: "Содержание", uz: "Mundarija" };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(termsText);
  return { title: t.metaTitle, description: t.metaDescription };
}

export default async function Page() {
  return <LegalDocument doc={await getT(termsText)} tocLabel={await getT(CONTENTS)} />;
}
