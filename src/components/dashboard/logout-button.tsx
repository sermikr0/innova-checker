"use client";

import { LogOut } from "lucide-react";

export function LogoutNavButton() {
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.replace("/login");
      }}
      className="mt-1 flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-white/65 transition-colors hover:bg-v-malicious/10 hover:text-v-malicious"
    >
      <LogOut className="size-[18px] text-white/45" /> Log out
    </button>
  );
}
