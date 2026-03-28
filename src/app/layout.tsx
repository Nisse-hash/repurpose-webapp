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
          colorTextOnPrimaryBackground: "#0A0A0F",
          colorTextSecondary: "#999999",
          colorNeutral: "#FFFFFF",
          borderRadius: "12px",
          fontSize: "15px",
        },
        elements: {
          card: {
            background: "radial-gradient(circle at 40% 20%, #1e1e2a, #13131A)",
            border: "1px solid rgba(201, 168, 76, 0.15)",
            boxShadow: "0 0 40px rgba(201, 168, 76, 0.08), 0 8px 32px rgba(0,0,0,0.6)",
          },
          headerTitle: {
            color: "#FFFFFF",
            fontSize: "22px",
            fontWeight: "700",
          },
          headerSubtitle: {
            color: "#999999",
          },
          socialButtonsBlockButton: {
            background: "#1a1a24",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#FFFFFF",
            "&:hover": {
              background: "#222230",
            },
          },
          formFieldInput: {
            background: "#1a1a24",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#FFFFFF",
            "&:focus": {
              borderColor: "#C9A84C",
              boxShadow: "0 0 0 2px rgba(201, 168, 76, 0.2)",
            },
          },
          formButtonPrimary: {
            background: "linear-gradient(135deg, #C9A84C, #F0B429)",
            color: "#0A0A0F",
            fontWeight: "700",
            "&:hover": {
              background: "linear-gradient(135deg, #d4b35a, #f5c040)",
            },
          },
          footerActionLink: {
            color: "#C9A84C",
            "&:hover": {
              color: "#F0B429",
            },
          },
          dividerLine: {
            background: "rgba(255,255,255,0.06)",
          },
          dividerText: {
            color: "#666666",
          },
          formFieldLabel: {
            color: "#999999",
          },
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
