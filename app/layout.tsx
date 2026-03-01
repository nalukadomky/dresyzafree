import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ui/toast";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";

export const metadata: Metadata = {
  title: "MyPitch | Správa týmu a hodnocení spoluhráčů",
  description: "MyPitch – platforma pro správu týmu, docházky, hodnocení spoluhráčů a týmový web.",
  openGraph: {
    title: "MyPitch | Správa týmu a hodnocení spoluhráčů",
    description: "MyPitch – platforma pro správu týmu, docházky, hodnocení spoluhráčů a týmový web.",
    siteName: "MyPitch",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "MyPitch | Správa týmu a hodnocení spoluhráčů",
    description: "MyPitch – platforma pro správu týmu, docházky, hodnocení spoluhráčů a týmový web.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('dresy-theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);})();`,
          }}
        />
        <ThemeProvider>
          <ToastProvider>
            <ConfirmProvider>
              {children}
            </ConfirmProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
