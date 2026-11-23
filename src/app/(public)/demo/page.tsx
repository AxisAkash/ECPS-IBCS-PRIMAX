import { pageTitle } from "@/lib/i18n/server";
import { DemoHub } from "@/features/public/misc";

export async function generateMetadata() {
  return pageTitle("meta.demo");
}

export default function Page() {
  return <DemoHub />;
}
