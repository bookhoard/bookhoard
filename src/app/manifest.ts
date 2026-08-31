import type { MetadataRoute } from "next";

/**
 * Installable-shell only — no offline reading. Icons are a placeholder
 * (logo/book.png at 200x200) until real 192/512 + maskable PNGs are
 * exported from public/logo.png; Lighthouse will flag icon sizing until then.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bookhoarder",
    short_name: "Bookhoarder",
    description: "Your self-hosted EPUB library.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf9f7",
    theme_color: "#b01607",
    icons: [
      {
        src: "/logo/book.png",
        sizes: "200x200",
        type: "image/png",
      },
    ],
  };
}
