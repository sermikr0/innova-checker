import { PageHeader } from "@/components/common/app-shell";
import { PasswordForm, ProfileForm } from "@/components/dashboard/account-forms";
import { requireUser } from "@/server/auth/session";
import { getT } from "@/i18n/server";
import { dashboardText } from "@/i18n/messages/dashboard";

export default async function ProfilePage() {
  const s = await requireUser("/dashboard/profile");
  const t = await getT(dashboardText);
  return (
    <>
      <PageHeader eyebrow={t.profile.eyebrow} title={t.profile.title} description={t.profile.description} />
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="surface rounded-2xl p-6"><h2 className="mb-5 text-[15px] font-semibold text-white">{t.profile.personalInfo}</h2><ProfileForm email={s.user.email} defaults={{ fullName: s.user.fullName, companyName: s.user.companyName }} /></section>
        <section className="surface rounded-2xl p-6"><h2 className="mb-1 text-[15px] font-semibold text-white">{t.changePassword}</h2><p className="mb-5 text-xs text-muted-foreground">{t.profile.changePasswordNote}</p><PasswordForm /></section>
      </div>
    </>
  );
}
