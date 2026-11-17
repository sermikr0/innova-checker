"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Field } from "@/components/common/field";
import { useAction } from "@/components/common/use-action";
import { ConfirmButton } from "@/components/common/confirm-button";
import { createUserAction, deleteUserAction, adminResetPasswordAction, adminRevokeDeviceAction, adminRevokeSessionsAction, setUnlimitedAccessAction, setUserActiveAction, updateUserAction } from "@/app/admin/actions";
import { ROLE_OPTIONS } from "@/lib/roles";
import { GhostButton, Modal, PrimaryButton, SelectField } from "./controls";

export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ fullName: "", email: "", companyName: "", role: "USER", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { run, pending } = useAction();
  return (
    <Modal open={open} onOpenChange={setOpen} title="Create user" description="The user can sign in immediately with this password." trigger={<PrimaryButton><UserPlus className="size-4" /> Create user</PrimaryButton>}>
      <div className="space-y-3">
        <Field label="Full name" value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} error={errors.fullName} />
        <Field label="E-mail" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} error={errors.email} />
        <Field label="Company" value={f.companyName} onChange={(e) => setF({ ...f, companyName: e.target.value })} error={errors.companyName} />
        <SelectField label="Role" value={f.role} onChange={(v) => setF({ ...f, role: v })} options={ROLE_OPTIONS} />
        <Field label="Initial password" type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} error={errors.password} />
        <PrimaryButton pending={pending} onClick={async () => {
          const r = await run(() => createUserAction(f), { onSuccess: () => { setOpen(false); setF({ fullName: "", email: "", companyName: "", role: "USER", password: "" }); } });
          setErrors(r.ok ? {} : r.fields ?? {});
        }}>Create user</PrimaryButton>
      </div>
    </Modal>
  );
}

export function EditUserForm({ user }: { user: { id: string; fullName: string; email: string; companyName: string; role: string } }) {
  const [f, setF] = useState(user);
  const { run, pending } = useAction();
  return (
    <div className="space-y-3">
      <Field label="Full name" value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} />
      <Field label="E-mail" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      <Field label="Company" value={f.companyName} onChange={(e) => setF({ ...f, companyName: e.target.value })} />
      <SelectField label="Role" value={f.role} onChange={(v) => setF({ ...f, role: v })} options={ROLE_OPTIONS} />
      <PrimaryButton pending={pending} onClick={() => run(() => updateUserAction(f))}>Save changes</PrimaryButton>
    </div>
  );
}

export function UserAccountActions({ userId, isActive, email }: { userId: string; isActive: boolean; email: string }) {
  const [pw, setPw] = useState("");
  const [open, setOpen] = useState(false);
  const { run, pending } = useAction();
  return (
    <div className="flex flex-wrap gap-2">
      <ConfirmButton action={setUserActiveAction.bind(null, userId, !isActive)} title={isActive ? "Deactivate this account?" : "Activate this account?"} description={isActive ? `${email} will be signed out and unable to log in.` : `${email} will be able to log in again.`} confirmLabel={isActive ? "Deactivate" : "Activate"} destructive={isActive} className={isActive ? "h-10 border border-v-suspicious/30 px-4 text-v-suspicious hover:bg-v-suspicious/10" : "h-10 border border-v-safe/30 px-4 text-v-safe hover:bg-v-safe/10"}>
        {isActive ? "Deactivate" : "Activate"}
      </ConfirmButton>
      <Modal open={open} onOpenChange={setOpen} title="Reset password" description="Sets a new password and signs the user out everywhere." trigger={<GhostButton>Reset password</GhostButton>}>
        <div className="space-y-3">
          <Field label="New password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
          <PrimaryButton pending={pending} onClick={() => run(() => adminResetPasswordAction(userId, pw), { onSuccess: () => { setOpen(false); setPw(""); } })}>Set password</PrimaryButton>
        </div>
      </Modal>
      <ConfirmButton action={adminRevokeSessionsAction.bind(null, userId)} title="Sign out all sessions?" description="Every browser signed in as this user will be signed out." confirmLabel="Sign out all" className="h-10 border border-white/10 px-4 text-white hover:bg-white/5">Sign out all sessions</ConfirmButton>
      <ConfirmButton action={deleteUserAction.bind(null, userId)} onDone={() => window.location.replace("/admin/users")} title="Delete this user?" description={`${email}, their devices, sessions, subscriptions and scan history will be permanently deleted.`} confirmLabel="Delete user" destructive className="h-10 border border-v-malicious/30 px-4 text-v-malicious hover:bg-v-malicious/10">Delete user</ConfirmButton>
    </div>
  );
}

export function RevokeDeviceButton({ userId, deviceId, label }: { userId: string; deviceId: string; label: string }) {
  return (
    <ConfirmButton action={adminRevokeDeviceAction.bind(null, userId, deviceId)} title="Revoke device?" description={`"${label}" will be signed out and removed from the user's devices.`} confirmLabel="Revoke" destructive className="h-8 border border-v-malicious/30 px-2.5 text-xs text-v-malicious hover:bg-v-malicious/10">Revoke</ConfirmButton>
  );
}

export function UnlimitedAccessButton({ userId, email, unlimited }: { userId: string; email: string; unlimited: boolean }) {
  return unlimited ? (
    <ConfirmButton action={setUnlimitedAccessAction.bind(null, userId, false)} title="Remove unlimited access?" description={`${email} becomes a regular user again and needs an active subscription to scan. Device limits apply again.`} confirmLabel="Remove unlimited" destructive className="h-10 border border-v-suspicious/30 px-4 text-v-suspicious hover:bg-v-suspicious/10">
      Remove unlimited access
    </ConfirmButton>
  ) : (
    <ConfirmButton action={setUnlimitedAccessAction.bind(null, userId, true)} title="Grant unlimited access?" description={`${email} will be able to scan without a subscription, on any number of devices, with no scan quota. The admin panel stays closed to this user.`} confirmLabel="Grant unlimited" className="h-10 border border-v-trusted/40 px-4 text-v-trusted hover:bg-v-trusted/10">
      Grant unlimited access
    </ConfirmButton>
  );
}
