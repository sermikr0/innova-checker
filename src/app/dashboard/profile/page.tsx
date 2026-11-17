import { PageHeader } from "@/components/common/app-shell";
import { PasswordForm, ProfileForm } from "@/components/dashboard/account-forms";
import { requireUser } from "@/server/auth/session";

export default async function ProfilePage() {
  const s = await requireUser("/dashboard/profile");
  return (
    <>
      <PageHeader eyebrow="Account" title="Profile" description="Update your personal details and password." />
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="surface rounded-2xl p-6"><h2 className="mb-5 text-[15px] font-semibold text-white">Personal information</h2><ProfileForm email={s.user.email} defaults={{ fullName: s.user.fullName, companyName: s.user.companyName }} /></section>
        <section className="surface rounded-2xl p-6"><h2 className="mb-1 text-[15px] font-semibold text-white">Change password</h2><p className="mb-5 text-xs text-muted-foreground">Changing your password signs out every other session.</p><PasswordForm /></section>
      </div>
    </>
  );
}
