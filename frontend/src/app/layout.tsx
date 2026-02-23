import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentXPay",
  description: "AI Agent Native Payment Infrastructure — Built on Monad",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
