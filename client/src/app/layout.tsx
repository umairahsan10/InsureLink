import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ClaimsMessagingProvider } from "@/contexts/ClaimsMessagingContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InsureLink — Smart Health Insurance Platform",
  description:
    "Pakistan's comprehensive healthcare insurance management platform. Connect insurers, hospitals, corporates, and patients in one seamless ecosystem.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <ClaimsMessagingProvider>
            {children}
          </ClaimsMessagingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
