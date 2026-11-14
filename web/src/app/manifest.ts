import type { MetadataRoute } from "next";
import { APP_NAME } from "@/lib/data";

// Lets a phone install this as an app: its own icon, full screen, no browser bar.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: "Settle up with friends in stocks and crypto.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f3eee5",
    theme_color: "#f3eee5",
    categories: ["finance", "social"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Pay or request", url: "/pay" },
      { name: "My code", url: "/me/code" },
    ],
  };
}
