import { Suspense } from "react";
import { PublicRegister } from "@/features/public/register";

export const metadata = { title: "Public Register" };

export default function Page() {
  return (
    <Suspense>
      <PublicRegister />
    </Suspense>
  );
}
