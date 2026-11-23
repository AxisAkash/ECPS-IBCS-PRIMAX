import { pageTitle } from "@/lib/i18n/server";
import { Suspense } from "react";
import { PublicRegister } from "@/features/public/register";

export async function generateMetadata() {
  return pageTitle("meta.register");
}

export default function Page() {
  return (
    <Suspense>
      <PublicRegister />
    </Suspense>
  );
}
