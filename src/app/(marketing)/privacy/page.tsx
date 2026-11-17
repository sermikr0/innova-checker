import type { Metadata } from "next";
import { LegalDocument } from "@/components/marketing/legal-document";
import { privacyText } from "@/i18n/messages/privacy";
import { getT } from "@/i18n/server";

const CONTENTS = { en: "Contents", ru: "Содержание", uz: "Mundarija" };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(privacyText);
  return { title: t.metaTitle, description: t.metaDescription };
}

export default async function Page() {
  return <LegalDocument doc={await getT(privacyText)} tocLabel={await getT(CONTENTS)} />;
}
