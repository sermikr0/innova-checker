import { ShieldAlert } from "lucide-react";
import { PageHero } from "./sections";
import type { LegalDoc } from "@/i18n/messages/legal-types";

/** Renders the Terms of Use or the Privacy policy with a summary box and a table of contents. */
export function LegalDocument({ doc, tocLabel }: { doc: LegalDoc; tocLabel: string }) {
  return (
    <>
      <PageHero eyebrow={doc.eyebrow} title={doc.title} subtitle={doc.subtitle} />
      <article className="mx-auto max-w-3xl px-4 sm:px-6">
        <p className="text-xs text-muted-foreground">{doc.updated}</p>
        <section className="mt-5 rounded-2xl border border-orange/30 bg-orange/[0.06] p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-white"><ShieldAlert className="size-5 text-orange" /> {doc.summaryTitle}</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-[14.5px] leading-relaxed text-white/85 marker:text-orange">
            {doc.summary.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </section>
        <nav aria-label={tocLabel} className="surface mt-8 rounded-2xl p-5">
          <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-white/50 uppercase">{tocLabel}</p>
          <ol className="grid gap-1.5 text-sm sm:grid-cols-2">
            {doc.sections.map((s) => (
              <li key={s.id}><a href={`#${s.id}`} className="text-white/75 hover:text-orange">{s.title}</a></li>
            ))}
          </ol>
        </nav>
        <div className="mt-10 space-y-9">
          {doc.sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <h2 className="text-lg font-semibold text-white">{s.title}</h2>
              {s.paragraphs.map((p) => <p key={p} className="mt-3 text-[15px] leading-relaxed text-white/75">{p}</p>)}
              {s.items && (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-white/75 marker:text-white/40">
                  {s.items.map((i) => <li key={i}>{i}</li>)}
                </ul>
              )}
              {s.after?.map((p) => <p key={p} className="mt-3 text-[15px] leading-relaxed text-white/75">{p}</p>)}
            </section>
          ))}
        </div>
      </article>
    </>
  );
}
