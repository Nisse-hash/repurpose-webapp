import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Repurpose | ibuiltthis.ai",
  description: "Drop a URL. Get everything. Content repurposing powered by AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#C9A84C",
          colorBackground: "#13131A",
          colorText: "#FFFFFF",
          colorInputBackground: "#1a1a24",
          colorInputText: "#FFFFFF",
        },
      }}
    >
      <html
        lang="en"
        className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased dark`}
      >
        <body className="min-h-full flex flex-col bg-[#0a0a0f] text-white">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
