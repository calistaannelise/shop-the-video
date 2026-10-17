import type { Metadata } from "next";
import "./globals.css";
import "./motion.css";
import { StoreProvider } from "@/lib/store";
import SiteChrome from "@/components/SiteChrome";
export const metadata: Metadata = {
  title: "spott. — Spotted it? Shop it.",
  description:
    "Turn outfit inspiration into your next look. Upload a screenshot, discover similar pieces at every price, and make it yours.",
  icons: { icon: "/brand/icon.png" },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <StoreProvider>
          <SiteChrome>{children}</SiteChrome>
        </StoreProvider>
      </body>
    </html>
  );
}
