import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "SoleTrack | Slipper Inventory & Sales Management",
  description:
    "Professional inventory management system for slipper retail and wholesale businesses. Track purchases, sales, pricing, and daily profits in real time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="app-container">
            <Sidebar />
            <div className="main-content">{children}</div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
