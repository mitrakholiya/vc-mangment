import ProfileBar from "@/components/ProfileBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background w-full overflow-hidden">
        
      {/* Top profile / nav bar */}
   <ProfileBar/>

      {/* Page content */}
      <main className="">
        {children}
      </main>
    </div>
  );
}
