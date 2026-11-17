"use client";

import { useRef, useState } from "react";
import { Check, FileUp, Pencil, Play, Plus, RefreshCw, X } from "lucide-react";
import { Field, TextArea } from "@/components/common/field";
import { useAction } from "@/components/common/use-action";
import { importDomainsCsvAction, reviewDomainRecordAction, runDomainJobAction, saveDomainRecordAction } from "@/app/admin/actions";
import { GhostButton, Modal, PrimaryButton, SelectField, Toggle } from "./controls";

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
  return (
    <Modal open={open} onOpenChange={setOpen} wide title={record ? `Edit ${record.domain}` : "Add domain record"} description="Active trusted and malicious records require a verification source and date. Never trust a domain only because it contains a company name." trigger={record ? <GhostButton className="h-8 px-2.5 text-xs"><Pencil className="size-3.5" /> Edit</GhostButton> : <PrimaryButton><Plus className="size-4" /> Add record</PrimaryButton>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label={f.scope === "URL" ? "Exact URL" : "Domain / host"} value={f.domain} onChange={(e) => setF({ ...f, domain: e.target.value })} placeholder={f.scope === "URL" ? "https://example.com/login" : "example.com"} /></div>
        <SelectField label="List" value={f.listType} onChange={(v) => setF({ ...f, listType: v as DomainForm["listType"], trustStatus: DEFAULT_TRUST[v as DomainForm["listType"]] })} options={[{ value: "WHITELIST", label: "Whitelist (trusted)" }, { value: "BLACKLIST", label: "Blacklist (malicious)" }, { value: "SUSPICIOUS", label: "Suspicious" }]} />
        <SelectField label="Match scope" value={f.scope} onChange={(v) => setF({ ...f, scope: v as DomainForm["scope"] })} options={[{ value: "DOMAIN", label: "Domain + subdomains" }, { value: "HOST", label: "Exact host only" }, { value: "URL", label: "Exact URL only" }]} />
        <SelectField label="Status" value={f.status} onChange={(v) => setF({ ...f, status: v as DomainForm["status"] })} options={[{ value: "ACTIVE", label: "Active" }, { value: "PENDING", label: "Pending review" }, { value: "REJECTED", label: "Rejected" }]} />
        <SelectField label="Trust status" value={f.trustStatus} onChange={(v) => setF({ ...f, trustStatus: v as DomainForm["trustStatus"] })} options={[{ value: "VERIFIED_OFFICIAL", label: "Verified official" }, { value: "CONFIRMED_MALICIOUS", label: "Confirmed malicious" }, { value: "SUSPECTED", label: "Suspected" }, { value: "UNVERIFIED", label: "Unverified" }]} />
        <Field label="Platform name" value={f.platformName} onChange={(e) => setF({ ...f, platformName: e.target.value })} placeholder="Highway" />
        <Field label="Company name" value={f.companyName} onChange={(e) => setF({ ...f, companyName: e.target.value })} />
        <Field label="Official URL" value={f.officialUrl} onChange={(e) => setF({ ...f, officialUrl: e.target.value })} />
        <Field label="Category" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} placeholder="Load board" />
        <div className="sm:col-span-2"><Field label="Brand keywords (comma-separated, whitelist only)" value={f.brandKeywords.join(", ")} onChange={(e) => setF({ ...f, brandKeywords: e.target.value.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean) })} hint="Used to detect look-alike domains of this platform." /></div>
        <div className="sm:col-span-2"><TextArea label="Verification source" value={f.verificationSource} onChange={(e) => setF({ ...f, verificationSource: e.target.value })} placeholder="e.g. SEC filing / press release / threat report URL" /></div>
        <Field label="Verified on" type="date" value={f.verifiedAt} onChange={(e) => setF({ ...f, verifiedAt: e.target.value })} className="[&_input]:[color-scheme:dark]" />
        <div className="sm:col-span-2"><TextArea label="Notes" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
        <div className="sm:col-span-2">
          <PrimaryButton pending={pending} onClick={() => {
            const { id, ...data } = f;
            return run(() => saveDomainRecordAction(id ?? null, { ...data, verifiedAt: data.verifiedAt ? `${data.verifiedAt.slice(0, 10)}T00:00:00Z` : null }), { onSuccess: () => { setOpen(false); if (!record) setF(empty); } });
          }}>{record ? "Save record" : "Add record"}</PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}

export function ReviewButtons({ id }: { id: string }) {
  const { run, pending } = useAction();
  return (
    <span className="inline-flex gap-1.5">
      <button type="button" disabled={pending} onClick={() => run(() => reviewDomainRecordAction(id, "APPROVE"))} className="inline-flex h-8 items-center gap-1 rounded-lg border border-v-safe/30 px-2.5 text-xs text-v-safe hover:bg-v-safe/10"><Check className="size-3.5" /> Approve</button>
      <button type="button" disabled={pending} onClick={() => run(() => reviewDomainRecordAction(id, "REJECT"))} className="inline-flex h-8 items-center gap-1 rounded-lg border border-v-malicious/30 px-2.5 text-xs text-v-malicious hover:bg-v-malicious/10"><X className="size-3.5" /> Reject</button>
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
  return (
    <Modal open={open} onOpenChange={(o) => { setOpen(o); if (!o) setReport(null); }} wide title="Import domains from CSV" description="Columns: domain, listType, scope, status, trustStatus, platformName, companyName, officialUrl, category, brandKeywords (; separated), verificationSource, verifiedAt, notes. Rows without a source and date are imported as pending." trigger={<GhostButton><FileUp className="size-4" /> Import CSV</GhostButton>}>
      <div className="space-y-3">
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="block w-full text-sm text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-orange file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white" onChange={async (e) => { const file = e.target.files?.[0]; if (file) setText(await file.text()); }} />
        <TextArea label="…or paste CSV" value={text} onChange={(e) => setText(e.target.value)} placeholder="domain,listType,verificationSource,verifiedAt" />
        <Toggle label="Overwrite existing records" description="Otherwise existing domain/list pairs are skipped." checked={overwrite} onChange={setOverwrite} />
        <PrimaryButton pending={pending} disabled={!text.trim()} onClick={async () => {
          const r = await run(() => importDomainsCsvAction(text, overwrite));
          if (r.ok) setReport((r.data as { errors: string[] }).errors);
        }}>Import</PrimaryButton>
        {report && (report.length ? <ul className="max-h-40 overflow-auto rounded-xl border border-v-malicious/25 bg-v-malicious/[0.05] p-3 font-mono text-xs text-v-malicious">{report.map((e) => <li key={e}>{e}</li>)}</ul> : <p className="text-sm text-v-safe">Imported without errors.</p>)}
      </div>
    </Modal>
  );
}

export function DomainJobButtons() {
  const { run, pending } = useAction();
  return (
    <span className="inline-flex flex-wrap gap-2">
      <GhostButton disabled={pending} onClick={() => run(() => runDomainJobAction("revalidate"))}><RefreshCw className={`size-4 ${pending ? "animate-spin" : ""}`} /> Revalidate domains</GhostButton>
      <GhostButton disabled={pending} onClick={() => run(() => runDomainJobAction("feeds"))}><Play className="size-4" /> Sync threat feeds</GhostButton>
    </span>
  );
}
