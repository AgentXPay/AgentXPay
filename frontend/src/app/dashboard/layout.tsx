import Web3Provider from "@/providers/Web3Provider";
import Sidebar from "@/components/layout/Sidebar";
import { Toaster } from "sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Web3Provider>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="ml-64 p-8">
          {children}
        </main>
        <Toaster
          theme="dark"
          position="top-right"
          richColors
          toastOptions={{
            style: {
              background: "rgba(30, 30, 40, 0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#e0e0e0",
            },
          }}
        />
      </div>
    </Web3Provider>
  );
}
