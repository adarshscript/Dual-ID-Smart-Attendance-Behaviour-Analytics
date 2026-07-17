import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ChatbotShell } from "@/components/chatbot/chatbot-shell";
import { FeedbackShell } from "@/components/shared/feedback-shell";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://dual-id-attendance-system.web.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "DIAS",
  title: {
    default: "DIAS | Dual ID Attendance System",
    template: "%s | DIAS"
  },
  description:
    "DIAS is an IoT-based dual authentication attendance system that combines RFID and fingerprint verification with real-time Firebase dashboards for admins and students.",
  keywords: [
    "DIAS",
    "Dual ID Attendance System",
    "attendance management system",
    "RFID attendance system",
    "fingerprint attendance system",
    "IoT attendance dashboard",
    "student attendance website",
    "college attendance system",
    "Firebase attendance system"
  ],
  creator: "Adarsh Maurya",
  authors: [{ name: "Adarsh Maurya" }],
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "DIAS | Dual ID Attendance System",
    description:
      "Real-time RFID and fingerprint based attendance tracking with admin analytics, student dashboards, and live classroom monitoring.",
    url: "/",
    siteName: "DIAS",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "DIAS | Dual ID Attendance System",
    description:
      "Real-time IoT attendance dashboard powered by RFID, fingerprint verification, and Firebase."
  },
  category: "technology"
};

export const viewport: Viewport = {
  themeColor: "#ffb11f"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="dias-root">
        {children}
        <FeedbackShell />
        <ChatbotShell />
      </body>
    </html>
  );
}
