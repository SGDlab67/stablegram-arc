import type { Metadata, Viewport } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { APP_NAME } from "@/lib/data";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const robotoMono = Roboto_Mono({ variable: "--font-roboto-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Pay friends in what you hold.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f3f3f3",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <StoreProvider>
          <div className="mx-auto min-h-dvh w-full max-w-[430px] bg-page">{children}</div>
        </StoreProvider>
      </body>
    </html>
  );
}
