import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Componentes
import Navbar from "@/components/Navbar";
import Aside from "@/components/Aside";
import AiConfig from "@/components/AiConfig";
import { Toaster } from "@/components/ui/sonner";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Contextos
import { RecordingProvider } from "@/context/RecordingContext";
import { MetricsProvider } from "@/context/MetricsContext";
import { UserProvider } from "@/context/UserContext";
import { ClassProvider } from "@/context/ClassContext";



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
          <MetricsProvider>
            <UserProvider>
              <ClassProvider>
                <Navbar />
                <main className="relative flex-1 flex overflow-hidden">
                  <Aside />
                  <AiConfig />
                  <div className="flex-1 overflow-auto">
                    {children}
                    <Toaster
                      position='top-left'
                    />
                  </div>
                </main>
                {/* Toast container */}
                <ToastContainer
                  autoClose={2000}
                  position='bottom-center'
                  newestOnTop={false}
                  rtl={false}
                  closeOnClick
                />
              </ClassProvider>
            </UserProvider>
          </MetricsProvider>
        </RecordingProvider>
      </body>
    </html>
  );
}
