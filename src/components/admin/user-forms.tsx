"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Field } from "@/components/common/field";
import { useAction } from "@/components/common/use-action";
import { ConfirmButton } from "@/components/common/confirm-button";
import { createUserAction, deleteUserAction, adminResetPasswordAction, adminRevokeDeviceAction, adminRevokeSessionsAction, setUnlimitedAccessAction, setUserActiveAction, updateUserAction } from "@/app/admin/actions";
import { ROLE_OPTIONS } from "@/lib/roles";
import { GhostButton, Modal, PrimaryButton, SelectField } from "./controls";
import { useT } from "@/i18n/client";
import { adminUsersText } from "@/i18n/messages/admin-users";

/** Role choices in the interface language (values and order from ROLE_OPTIONS). */
function useRoleOptions() {
  const t = useT(adminUsersText);
  return ROLE_OPTIONS.map((o) => ({ value: o.value, label: t.roleOptions[o.value] }));
}

export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ fullName: "", email: "", companyName: "", role: "USER", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { run, pending } = useAction();
  const t = useT(adminUsersText).forms;
  const roleOptions = useRoleOptions();
  return (
    <Modal open={open} onOpenChange={setOpen} title={t.createUser} description={t.createUserText} trigger={<PrimaryButton><UserPlus className="size-4" /> {t.createUser}</PrimaryButton>}>
      <div className="space-y-3">
        <Field label={t.fullName} value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} error={errors.fullName} />
        <Field label={t.email} type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} error={errors.email} />
        <Field label={t.company} value={f.companyName} onChange={(e) => setF({ ...f, companyName: e.target.value })} error={errors.companyName} />
        <SelectField label={t.role} value={f.role} onChange={(v) => setF({ ...f, role: v })} options={roleOptions} />
        <Field label={t.initialPassword} type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} error={errors.password} />
        <PrimaryButton pending={pending} onClick={async () => {
          const r = await run(() => createUserAction(f), { onSuccess: () => { setOpen(false); setF({ fullName: "", email: "", companyName: "", role: "USER", password: "" }); } });
          setErrors(r.ok ? {} : r.fields ?? {});
        }}>{t.createUser}</PrimaryButton>
      </div>
    </Modal>
  );
}

export function EditUserForm({ user }: { user: { id: string; fullName: string; email: string; companyName: string; role: string } }) {
  const [f, setF] = useState(user);
  const { run, pending } = useAction();
  const t = useT(adminUsersText).forms;
  const roleOptions = useRoleOptions();
  return (
    <div className="space-y-3">
      <Field label={t.fullName} value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} />
      <Field label={t.email} type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      <Field label={t.company} value={f.companyName} onChange={(e) => setF({ ...f, companyName: e.target.value })} />
      <SelectField label={t.role} value={f.role} onChange={(v) => setF({ ...f, role: v })} options={roleOptions} />
      <PrimaryButton pending={pending} onClick={() => run(() => updateUserAction(f))}>{t.saveChanges}</PrimaryButton>
    </div>
  );
}

export function UserAccountActions({ userId, isActive, email }: { userId: string; isActive: boolean; email: string }) {
  const [pw, setPw] = useState("");
  const [open, setOpen] = useState(false);
  const { run, pending } = useAction();
  const t = useT(adminUsersText).forms;
  return (
    <div className="flex flex-wrap gap-2">
      <ConfirmButton action={setUserActiveAction.bind(null, userId, !isActive)} title={isActive ? t.deactivateTitle : t.activateTitle} description={isActive ? t.deactivateText(email) : t.activateText(email)} confirmLabel={isActive ? t.deactivate : t.activate} destructive={isActive} className={isActive ? "h-10 border border-v-suspicious/30 px-4 text-v-suspicious hover:bg-v-suspicious/10" : "h-10 border border-v-safe/30 px-4 text-v-safe hover:bg-v-safe/10"}>
        {isActive ? t.deactivate : t.activate}
      </ConfirmButton>
      <Modal open={open} onOpenChange={setOpen} title={t.resetPassword} description={t.resetPasswordText} trigger={<GhostButton>{t.resetPassword}</GhostButton>}>
        <div className="space-y-3">
          <Field label={t.newPassword} type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
          <PrimaryButton pending={pending} onClick={() => run(() => adminResetPasswordAction(userId, pw), { onSuccess: () => { setOpen(false); setPw(""); } })}>{t.setPassword}</PrimaryButton>
        </div>
      </Modal>
      <ConfirmButton action={adminRevokeSessionsAction.bind(null, userId)} title={t.signOutTitle} description={t.signOutText} confirmLabel={t.signOutConfirm} className="h-10 border border-white/10 px-4 text-white hover:bg-white/5">{t.signOutButton}</ConfirmButton>
      <ConfirmButton action={deleteUserAction.bind(null, userId)} onDone={() => window.location.replace("/admin/users")} title={t.deleteTitle} description={t.deleteText(email)} confirmLabel={t.deleteUser} destructive className="h-10 border border-v-malicious/30 px-4 text-v-malicious hover:bg-v-malicious/10">{t.deleteUser}</ConfirmButton>
    </div>
  );
}

export function RevokeDeviceButton({ userId, deviceId, label }: { userId: string; deviceId: string; label: string }) {
  const t = useT(adminUsersText).forms;
  return (
    <ConfirmButton action={adminRevokeDeviceAction.bind(null, userId, deviceId)} title={t.revokeTitle} description={t.revokeText(label)} confirmLabel={t.revoke} destructive className="h-8 border border-v-malicious/30 px-2.5 text-xs text-v-malicious hover:bg-v-malicious/10">{t.revoke}</ConfirmButton>
  );
}

export function UnlimitedAccessButton({ userId, email, unlimited }: { userId: string; email: string; unlimited: boolean }) {
  const t = useT(adminUsersText).forms;
  return unlimited ? (
    <ConfirmButton action={setUnlimitedAccessAction.bind(null, userId, false)} title={t.removeUnlimitedTitle} description={t.removeUnlimitedText(email)} confirmLabel={t.removeUnlimitedConfirm} destructive className="h-10 border border-v-suspicious/30 px-4 text-v-suspicious hover:bg-v-suspicious/10">
      {t.removeUnlimitedButton}
    </ConfirmButton>
  ) : (
    <ConfirmButton action={setUnlimitedAccessAction.bind(null, userId, true)} title={t.grantUnlimitedTitle} description={t.grantUnlimitedText(email)} confirmLabel={t.grantUnlimitedConfirm} className="h-10 border border-v-trusted/40 px-4 text-v-trusted hover:bg-v-trusted/10">
      {t.grantUnlimitedButton}
    </ConfirmButton>
  );
}
