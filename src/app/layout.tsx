import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Providers from "./providers";
import ProfileBar from "@/components/ProfileBar";

import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VC Management",
  description: "Manage your Venture Capital contributions and loans easily.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VC Management",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#FFFFFF",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-dvh`}>
        <Providers>
          <main className="flex-1 flex flex-col w-full">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
