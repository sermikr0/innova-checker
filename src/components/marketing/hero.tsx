import { Lock, Radar, ScrollText, ShieldCheck } from "lucide-react";
import { ScanBox } from "@/components/scan/scan-box";

function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="grid-bg absolute inset-0" />
      {/* Light beam (wide glow + bright core) */}
      <div className="absolute -top-40 right-[8%] h-[980px] w-[260px] rotate-[16deg] animate-beam bg-gradient-to-b from-transparent via-orange/35 to-orange/70 blur-[70px] sm:right-[14%]" />
      <div className="absolute -top-32 right-[15%] h-[860px] w-[3px] rotate-[16deg] bg-gradient-to-b from-transparent via-orange-soft/80 to-[#ffe2c7] opacity-80 blur-[1.5px] sm:right-[20%]" />
      <div className="noise-dots absolute top-[420px] right-[2%] h-[300px] w-[520px] opacity-50 [mask-image:radial-gradient(ellipse_at_60%_40%,#000_10%,transparent_65%)]" />
      {/* Floor glow beneath the scanner */}
      <div className="absolute top-[520px] left-1/2 h-[320px] w-[1200px] -translate-x-1/2 rounded-[100%] bg-orange/20 blur-[130px]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
    </div>
  );
}

export function Hero({ signedIn }: { signedIn: boolean }) {
  return (
    <section id="scan" className="relative scroll-mt-20">
      <HeroBackdrop />
      <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-16 sm:px-6 sm:pt-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs text-white/80 backdrop-blur">
            <span className="rounded-full bg-orange px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase">New</span>
            Phishing protection built for logistics teams
          </span>
          <h1 className="mt-7 text-5xl leading-[1.02] font-semibold tracking-[-0.03em] sm:text-7xl lg:text-[84px]">
            <span className="text-gradient-silver">Know Before </span>
            <span className="text-gradient-silver">You </span>
            <span className="text-gradient-orange">Click.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg">
            Advanced URL security intelligence to detect phishing, scams, malicious websites, and suspicious links before they become a threat.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl">
          <ScanBox variant="hero" signedIn={signedIn} />
        </div>

        <div className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[13px] text-white/60">
          <span className="inline-flex items-center gap-2"><Radar className="size-4 text-orange" /> 8 analysis modules</span>
          <span className="inline-flex items-center gap-2"><Lock className="size-4 text-orange" /> Isolated, no script execution</span>
          <span className="inline-flex items-center gap-2"><ScrollText className="size-4 text-orange" /> Evidence for every check</span>
          <span className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-orange" /> No fabricated verdicts</span>
        </div>
      </div>
    </section>
  );
}
