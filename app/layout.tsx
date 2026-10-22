import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { JetBrains_Mono, Poppins } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Splitly",
  description: "Split expenses with friends and settle up with fewer payments.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      {/* Browser extensions (e.g. Grammarly) add attributes to <body> before
          hydration; this silences only that element's attribute diff. */}
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ClerkProvider>
          <SiteHeader />
          {children}
          <Toaster />
        </ClerkProvider>
      </body>
    </html>
  );
}
