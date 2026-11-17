import { PageHeader, EmptyState } from "@/components/common/app-shell";
import { ConfirmButton } from "@/components/common/confirm-button";
import { prisma } from "@/server/db";
import { formatDateTime } from "@/lib/format";
import { markMessageHandledAction } from "../actions";

export default async function Messages() {
  const msgs = await prisma.contactMessage.findMany({ orderBy: [{ handledAt: { sort: "asc", nulls: "first" } }, { createdAt: "desc" }], take: 100 });
  return (
    <>
      <PageHeader eyebrow="Inbox" title="Contact messages" description="Messages sent through the public contact form." />
      {msgs.length === 0 ? <EmptyState icon="Activity" title="No messages" text="Messages from the contact page appear here." /> : (
        <div className="space-y-3">
          {msgs.map((m) => (
            <article key={m.id} className={`surface rounded-2xl p-5 ${m.handledAt ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="font-medium text-white">{m.subject}</p><p className="text-xs text-muted-foreground">{m.name} · <a href={`mailto:${m.email}`} className="text-orange hover:underline">{m.email}</a>{m.company ? ` · ${m.company}` : ""} · {formatDateTime(m.createdAt)}</p></div>
                {!m.handledAt && <ConfirmButton action={markMessageHandledAction.bind(null, m.id)} title="Mark as handled?" description="The message stays in the list, dimmed." confirmLabel="Mark handled" className="h-9 border border-white/10 px-3 text-white hover:bg-white/5">Mark handled</ConfirmButton>}
              </div>
              <p className="mt-3 text-sm whitespace-pre-wrap text-white/80">{m.message}</p>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
