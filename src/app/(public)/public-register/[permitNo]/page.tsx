import { PermitExtract } from "@/features/public/register";

export default async function Page({ params }: { params: Promise<{ permitNo: string }> }) {
  const { permitNo } = await params;
  return <PermitExtract permitNo={permitNo} />;
}
