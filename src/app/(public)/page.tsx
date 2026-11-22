import { Hero } from "@/features/landing/hero";
import {
  Benefits,
  Discovery,
  Faq,
  Guidance,
  HowItWorks,
  Lifecycle,
  Notices,
  RegisterBand,
  ServicesLifecycle,
  SupportBand,
  TrackSection,
} from "@/features/landing/sections";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Discovery />
      <ServicesLifecycle />
      <HowItWorks />
      <Lifecycle />
      <TrackSection />
      <RegisterBand />
      <Guidance />
      <Benefits />
      <Notices />
      <SupportBand />
      <Faq />
    </>
  );
}
