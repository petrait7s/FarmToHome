import type { MetadataRoute } from "next";

/** Lets visitors add FarmToHome to their home screen and open it full-screen like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FarmToHome",
    short_name: "FarmToHome",
    description: "Plan your household’s weekly market or monthly stock from directly sourced, traceable producers.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F4EBDD",
    theme_color: "#164A83",
    lang: "bn",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
