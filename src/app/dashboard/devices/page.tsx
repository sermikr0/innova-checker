import { Monitor, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/common/app-shell";
import { ConfirmButton } from "@/components/common/confirm-button";
import { requireUser } from "@/server/auth/session";
import { userDevices } from "@/server/dashboard";
import { deviceLimitFor } from "@/server/subscriptions/service";
import { getSystemSettings } from "@/server/settings";
import { formatDateTime, timeAgo } from "@/lib/format";
import { revokeMyDeviceAction, revokeMySessionAction } from "../actions";

export default async function DevicesPage() {
  const s = await requireUser("/dashboard/devices");
  const [devices, limit, settings] = await Promise.all([userDevices(s.user.id, s.deviceId), deviceLimitFor(s.user), getSystemSettings()]);
  const active = devices.filter((d) => d.signedIn).length;
  return (
    <>
      <PageHeader eyebrow="Device licences" title="Devices" description={`${active} of ${limit ?? "unlimited"} device slot(s) in use. A device uses a slot while it is signed in; signing out frees it.`} />
      {!settings.allowUserDeviceRemoval && <p className="mb-4 text-sm text-v-suspicious">Device removal is managed by your administrator.</p>}
      <div className="space-y-3">
        {devices.map((d) => (
          <div key={d.id} className={`surface rounded-2xl p-5 ${d.revokedAt ? "opacity-60" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <span className="flex size-11 items-center justify-center rounded-xl bg-orange/10 ring-1 ring-orange/25"><Monitor className="size-5 text-orange" /></span>
                <div>
                  <p className="flex flex-wrap items-center gap-2 font-medium text-white">
                    {d.label}
                    {d.current && <span className="rounded-full bg-orange/15 px-2 py-0.5 text-[10.5px] font-semibold text-orange">This device</span>}
                    {d.revokedAt ? <span className="rounded-full bg-v-malicious/10 px-2 py-0.5 text-[10.5px] font-semibold text-v-malicious">Removed</span> : d.signedIn ? <span className="rounded-full bg-v-safe/10 px-2 py-0.5 text-[10.5px] font-semibold text-v-safe">Signed in</span> : <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10.5px] font-semibold text-muted-foreground">Signed out</span>}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Registered {formatDateTime(d.createdAt)} · last seen {timeAgo(d.lastSeenAt)} · IP {d.lastIp ?? "—"}</p>
                </div>
              </div>
              {!d.revokedAt && !d.current && settings.allowUserDeviceRemoval && (
                <ConfirmButton action={revokeMyDeviceAction.bind(null, d.id)} title="Remove this device?" description={`"${d.label}" will be signed out and must sign in again to be used. You can remove up to ${settings.deviceRemovalsPer30Days} devices per 30 days.`} confirmLabel="Remove device" destructive className="h-9 border border-v-malicious/30 px-3 text-v-malicious hover:bg-v-malicious/10">
                  <Trash2 className="size-4" /> Remove
                </ConfirmButton>
              )}
            </div>
            {d.sessions.length > 0 && !d.revokedAt && (
              <ul className="mt-4 divide-y divide-white/[0.05] rounded-xl border border-white/[0.06] bg-black/20">
                {d.sessions.map((ss) => (
                  <li key={ss.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-[13px]">
                    <span className="text-white/75">Session started {formatDateTime(ss.createdAt)} · last active {timeAgo(ss.lastSeenAt)} · expires {formatDateTime(ss.expiresAt)}</span>
                    {ss.id === s.sessionId ? (
                      <span className="text-xs text-orange">Current session</span>
                    ) : (
                      <ConfirmButton action={revokeMySessionAction.bind(null, ss.id)} title="Sign out this session?" description="The browser using this session will be signed out." confirmLabel="Sign out" className="h-8 border border-white/10 px-2.5 text-xs text-white/80 hover:bg-white/5">Sign out</ConfirmButton>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
