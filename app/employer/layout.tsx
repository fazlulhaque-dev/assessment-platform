import Navbar from "@/components/shared/Navbar";

export default function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-svh flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
