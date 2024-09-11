import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import Navbar from "@/components/Navbar";
import Aside from "@/components/Aside";
import { RecordingProvider } from "@/context/RecordingContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EnganchAI",
  description: "Aplicación de IA para la detección de enganches en clases",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <RecordingProvider>
        <Navbar />
        <main className="relative flex-1">
          <Aside/>
          {children}
        </main>
        </RecordingProvider>
      </body>
    </html>
  );
}
