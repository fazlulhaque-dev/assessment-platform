import Navbar from "@/components/shared/Navbar";
import OfflineBanner from "@/components/shared/OfflineBanner";

export default function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-svh flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
      <OfflineBanner />
    </div>
  );
}
