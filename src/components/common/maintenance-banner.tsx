import { Wrench } from "lucide-react";
import { getSystemSettings } from "@/server/settings";

export async function MaintenanceBanner() {
  const s = await getSystemSettings();
  if (!s.maintenanceMode) return null;
  return (
    <div className="border-b border-v-suspicious/30 bg-v-suspicious/10 px-4 py-2.5 text-center text-sm text-v-suspicious" role="status">
      <Wrench className="mr-2 inline size-4 align-[-3px]" />
      {s.maintenanceMessage}
    </div>
  );
}
