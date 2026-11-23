import { pageTitle } from "@/lib/i18n/server";
import { Suspense } from "react";
import { TrackPage } from "@/features/public/misc";

export async function generateMetadata() {
  return pageTitle("meta.track");
}

export default function Page() {
  return (
    <Suspense>
      <TrackPage />
    </Suspense>
  );
}
