import { pageTitle } from "@/lib/i18n/server";
import { GuidesPage } from "@/features/public/misc";

export async function generateMetadata() {
  return pageTitle("meta.guides");
}

export default function Page() {
  return <GuidesPage />;
}
