import { Suspense } from "react";
import { TrackPage } from "@/features/public/misc";

export const metadata = { title: "Track an application" };

export default function Page() {
  return (
    <Suspense>
      <TrackPage />
    </Suspense>
  );
}
