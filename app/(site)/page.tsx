import { Hero } from "@/components/sections/home/hero";
import { PainMirroring } from "@/components/sections/home/pain-mirroring";
import { AboutSummary } from "@/components/sections/home/about-summary";
import { HowDiagnosisWorks } from "@/components/sections/home/how-diagnosis-works";
import { WhatWeAutomate } from "@/components/sections/home/what-i-automate";
import { RecentContent } from "@/components/sections/home/recent-content";
import { HomeFAQ } from "@/components/sections/home/faq";
import { FinalCTA } from "@/components/sections/home/final-cta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <PainMirroring />
      <AboutSummary />
      <HowDiagnosisWorks />
      <WhatWeAutomate />
      <RecentContent />
      <HomeFAQ />
      <FinalCTA />
    </>
  );
}
