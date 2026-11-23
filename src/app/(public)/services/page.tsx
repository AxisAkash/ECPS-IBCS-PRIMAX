import { pageTitle } from "@/lib/i18n/server";
import { ServicesIndex } from "@/features/public/services";

export async function generateMetadata() {
  return pageTitle("meta.services");
}

export default function Page() {
  return <ServicesIndex />;
}
