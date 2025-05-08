import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Munch Club",
  description: "Coordinate meal plans",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <nav style={{ padding: "1rem", backgroundColor: "#f0f0f0", textAlign: "center" }}>
            <Link href="/">
              <button style={{ padding: "0.5rem 1rem", cursor: "pointer" }}>Home</button>
            </Link>
          </nav>
          {children}
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
