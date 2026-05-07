import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/app/", "/api/", "/admin/", "/owner/"]
      }
    ],
    sitemap: "https://aivideocreator.app/sitemap.xml",
    host: "https://aivideocreator.app"
  };
}
