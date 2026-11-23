import { pageTitle } from "@/lib/i18n/server";
import { HelpCentre } from "@/features/public/misc";

export async function generateMetadata() {
  return pageTitle("meta.support");
}

export default function Page() {
  return <HelpCentre />;
}
