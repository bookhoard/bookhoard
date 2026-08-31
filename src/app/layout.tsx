import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toast";
import { ServiceWorkerRegister } from "@/components/pwa/sw-register";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "600", "700", "800"],
});

const title = "Bookhoarder";
const description = "Your self-hosted EPUB library.";
// Only affects absolute URLs in OG/Twitter tags (link-preview images, etc.)
// — the app itself works fine without this being set. Defaults to the
// public demo's domain; self-hosters can override to get correct previews
// for their own instance.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bookhoarder.dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: title,
    images: [{ url: "/og-image.jpg", width: 1000, height: 1000, alt: title }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og-image.jpg"],
  },
  appleWebApp: {
    capable: true,
    title,
    statusBarStyle: "default",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("theme")?.value;
  const htmlClassName = themeCookie === "dark" ? "dark" : undefined;

  return (
    <html
      lang="en"
      className={htmlClassName}
      style={themeCookie === "dark" || themeCookie === "light" ? { colorScheme: themeCookie } : undefined}
      suppressHydrationWarning
    >
      <body
        className={`${inter.variable} ${plusJakartaSans.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          scriptProps={{ "data-cfasync": "false" }}
        >
          <TooltipProvider delay={200}>
            <Toaster>{children}</Toaster>
          </TooltipProvider>
          <ServiceWorkerRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
