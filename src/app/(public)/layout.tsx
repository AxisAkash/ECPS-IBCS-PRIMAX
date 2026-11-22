import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicHeader />
      <main id="main" tabIndex={-1} className="focus:outline-none">
        {children}
      </main>
      <PublicFooter />
    </>
  );
}
