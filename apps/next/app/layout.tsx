import "./globals.css";
import { Inter } from "next/font/google";
import { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/react";
import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "ChatHN – Chat with Hacker News using natural language",
  description:
    "Chat with Hacker News using natural language. Built with OpenAI Functions and Vercel AI SDK.",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClerkProvider>
          {children}
          <Toaster />
        </ClerkProvider>
      </body>
      <Analytics />
    </html>
  );
}
