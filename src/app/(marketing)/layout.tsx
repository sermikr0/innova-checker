import { Footer } from "@/components/marketing/footer";
import { Navbar } from "@/components/marketing/navbar";
import { MaintenanceBanner } from "@/components/common/maintenance-banner";

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-col">
      <MaintenanceBanner />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
