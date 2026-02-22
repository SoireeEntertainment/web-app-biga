import type { Metadata } from "next";
import { Josefin_Sans, Quicksand } from "next/font/google";
import "./globals.css";

const josefin = Josefin_Sans({
  variable: "--font-josefin",
  subsets: ["latin"],
  display: "swap",
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ordina online · Biga Pizzeria",
  description: "Ordina pizza, focacce e fritti da Biga Pizzeria – Villanova d'Asti. Consegna e ritiro.",
  icons: { icon: "/icon.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body
        className={`${josefin.variable} ${quicksand.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
