import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dresy za free",
  description: "Registrace týmů pro získání dresů",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  );
}

