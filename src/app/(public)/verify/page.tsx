import { pageTitle } from "@/lib/i18n/server";
import { VerifyPermit } from "@/features/public/register";

export async function generateMetadata() {
  return pageTitle("meta.verify");
}

export default function Page() {
  return <VerifyPermit />;
}
