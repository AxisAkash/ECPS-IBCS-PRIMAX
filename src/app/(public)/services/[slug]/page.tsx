import { notFound } from "next/navigation";
import { ServiceDetail } from "@/features/public/services";
import { SERVICES, serviceBySlug } from "@/lib/domain/catalog";

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!serviceBySlug(slug)) notFound();
  return <ServiceDetail slug={slug} />;
}
