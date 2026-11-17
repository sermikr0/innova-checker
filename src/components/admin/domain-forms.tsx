"use client";

import { useRef, useState } from "react";
import { Check, FileUp, Pencil, Play, Plus, RefreshCw, X } from "lucide-react";
import { Field, TextArea } from "@/components/common/field";
import { useAction } from "@/components/common/use-action";
import { importDomainsCsvAction, reviewDomainRecordAction, runDomainJobAction, saveDomainRecordAction } from "@/app/admin/actions";
import { GhostButton, Modal, PrimaryButton, SelectField, Toggle } from "./controls";
import { useT } from "@/i18n/client";
import { adminDomainsText } from "@/i18n/messages/admin-domains";

export type DomainForm = {
  id?: string;
  domain: string;
  listType: "WHITELIST" | "BLACKLIST" | "SUSPICIOUS";
  scope: "DOMAIN" | "HOST" | "URL";
  status: "ACTIVE" | "PENDING" | "REJECTED";
  trustStatus: "VERIFIED_OFFICIAL" | "CONFIRMED_MALICIOUS" | "SUSPECTED" | "UNVERIFIED";
  platformName: string;
  companyName: string;
  officialUrl: string;
  category: string;
  brandKeywords: string[];
  verificationSource: string;
  verifiedAt: string;
  notes: string;
};

const DEFAULT_TRUST = { WHITELIST: "VERIFIED_OFFICIAL", BLACKLIST: "CONFIRMED_MALICIOUS", SUSPICIOUS: "SUSPECTED" } as const;

export function DomainRecordDialog({ record, defaultList = "WHITELIST" }: { record?: DomainForm; defaultList?: DomainForm["listType"] }) {
  const today = new Date().toISOString().slice(0, 10);
  const empty: DomainForm = { domain: "", listType: defaultList, scope: "DOMAIN", status: "ACTIVE", trustStatus: DEFAULT_TRUST[defaultList], platformName: "", companyName: "", officialUrl: "", category: "", brandKeywords: [], verificationSource: "", verifiedAt: today, notes: "" };
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<DomainForm>(record ?? empty);
  const { run, pending } = useAction();
  const txt = useT(adminDomainsText);
  const t = txt.form;
  return (
    <Modal open={open} onOpenChange={setOpen} wide title={record ? t.editTitle(record.domain) : t.addTitle} description={t.description} trigger={record ? <GhostButton className="h-8 px-2.5 text-xs"><Pencil className="size-3.5" /> {txt.edit}</GhostButton> : <PrimaryButton><Plus className="size-4" /> {t.addRecord}</PrimaryButton>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label={f.scope === "URL" ? t.exactUrl : t.domainHost} value={f.domain} onChange={(e) => setF({ ...f, domain: e.target.value })} placeholder={f.scope === "URL" ? "https://example.com/login" : "example.com"} /></div>
        <SelectField label={t.list} value={f.listType} onChange={(v) => setF({ ...f, listType: v as DomainForm["listType"], trustStatus: DEFAULT_TRUST[v as DomainForm["listType"]] })} options={[{ value: "WHITELIST", label: t.lists.WHITELIST }, { value: "BLACKLIST", label: t.lists.BLACKLIST }, { value: "SUSPICIOUS", label: t.lists.SUSPICIOUS }]} />
        <SelectField label={t.scope} value={f.scope} onChange={(v) => setF({ ...f, scope: v as DomainForm["scope"] })} options={[{ value: "DOMAIN", label: t.scopes.DOMAIN }, { value: "HOST", label: t.scopes.HOST }, { value: "URL", label: t.scopes.URL }]} />
        <SelectField label={t.status} value={f.status} onChange={(v) => setF({ ...f, status: v as DomainForm["status"] })} options={[{ value: "ACTIVE", label: t.statuses.ACTIVE }, { value: "PENDING", label: t.statuses.PENDING }, { value: "REJECTED", label: t.statuses.REJECTED }]} />
        <SelectField label={t.trustStatus} value={f.trustStatus} onChange={(v) => setF({ ...f, trustStatus: v as DomainForm["trustStatus"] })} options={[{ value: "VERIFIED_OFFICIAL", label: txt.trust.VERIFIED_OFFICIAL }, { value: "CONFIRMED_MALICIOUS", label: txt.trust.CONFIRMED_MALICIOUS }, { value: "SUSPECTED", label: txt.trust.SUSPECTED }, { value: "UNVERIFIED", label: txt.trust.UNVERIFIED }]} />
        <Field label={t.platformName} value={f.platformName} onChange={(e) => setF({ ...f, platformName: e.target.value })} placeholder="Highway" />
        <Field label={t.companyName} value={f.companyName} onChange={(e) => setF({ ...f, companyName: e.target.value })} />
        <Field label={t.officialUrl} value={f.officialUrl} onChange={(e) => setF({ ...f, officialUrl: e.target.value })} />
        <Field label={t.category} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} placeholder={t.categoryPlaceholder} />
        <div className="sm:col-span-2"><Field label={t.brandKeywords} value={f.brandKeywords.join(", ")} onChange={(e) => setF({ ...f, brandKeywords: e.target.value.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean) })} hint={t.brandKeywordsHint} /></div>
        <div className="sm:col-span-2"><TextArea label={t.source} value={f.verificationSource} onChange={(e) => setF({ ...f, verificationSource: e.target.value })} placeholder={t.sourcePlaceholder} /></div>
        <Field label={t.verifiedOn} type="date" value={f.verifiedAt} onChange={(e) => setF({ ...f, verifiedAt: e.target.value })} className="[&_input]:[color-scheme:dark]" />
        <div className="sm:col-span-2"><TextArea label={t.notes} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
        <div className="sm:col-span-2">
          <PrimaryButton pending={pending} onClick={() => {
            const { id, ...data } = f;
            return run(() => saveDomainRecordAction(id ?? null, { ...data, verifiedAt: data.verifiedAt ? `${data.verifiedAt.slice(0, 10)}T00:00:00Z` : null }), { onSuccess: () => { setOpen(false); if (!record) setF(empty); } });
          }}>{record ? t.saveRecord : t.addRecord}</PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}

export function ReviewButtons({ id }: { id: string }) {
  const { run, pending } = useAction();
  const t = useT(adminDomainsText).form;
  return (
    <span className="inline-flex gap-1.5">
      <button type="button" disabled={pending} onClick={() => run(() => reviewDomainRecordAction(id, "APPROVE"))} className="inline-flex h-8 items-center gap-1 rounded-lg border border-v-safe/30 px-2.5 text-xs text-v-safe hover:bg-v-safe/10"><Check className="size-3.5" /> {t.approve}</button>
      <button type="button" disabled={pending} onClick={() => run(() => reviewDomainRecordAction(id, "REJECT"))} className="inline-flex h-8 items-center gap-1 rounded-lg border border-v-malicious/30 px-2.5 text-xs text-v-malicious hover:bg-v-malicious/10"><X className="size-3.5" /> {t.reject}</button>
    </span>
  );
}

export function ImportCsvDialog() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [overwrite, setOverwrite] = useState(false);
  const [report, setReport] = useState<string[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { run, pending } = useAction();
  const t = useT(adminDomainsText).form;
  return (
    <Modal open={open} onOpenChange={(o) => { setOpen(o); if (!o) setReport(null); }} wide title={t.importTitle} description={t.importText} trigger={<GhostButton><FileUp className="size-4" /> {t.importCsv}</GhostButton>}>
      <div className="space-y-3">
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="block w-full text-sm text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-orange file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white" onChange={async (e) => { const file = e.target.files?.[0]; if (file) setText(await file.text()); }} />
        <TextArea label={t.pasteCsv} value={text} onChange={(e) => setText(e.target.value)} placeholder="domain,listType,verificationSource,verifiedAt" />
        <Toggle label={t.overwrite} description={t.overwriteText} checked={overwrite} onChange={setOverwrite} />
        <PrimaryButton pending={pending} disabled={!text.trim()} onClick={async () => {
          const r = await run(() => importDomainsCsvAction(text, overwrite));
          if (r.ok) setReport((r.data as { errors: string[] }).errors);
        }}>{t.import}</PrimaryButton>
        {report && (report.length ? <ul className="max-h-40 overflow-auto rounded-xl border border-v-malicious/25 bg-v-malicious/[0.05] p-3 font-mono text-xs text-v-malicious">{report.map((e) => <li key={e}>{e}</li>)}</ul> : <p className="text-sm text-v-safe">{t.importedOk}</p>)}
      </div>
    </Modal>
  );
}

export function DomainJobButtons() {
  const { run, pending } = useAction();
  const t = useT(adminDomainsText).form;
  return (
    <span className="inline-flex flex-wrap gap-2">
      <GhostButton disabled={pending} onClick={() => run(() => runDomainJobAction("revalidate"))}><RefreshCw className={`size-4 ${pending ? "animate-spin" : ""}`} /> {t.revalidate}</GhostButton>
      <GhostButton disabled={pending} onClick={() => run(() => runDomainJobAction("feeds"))}><Play className="size-4" /> {t.syncFeeds}</GhostButton>
    </span>
  );
}
