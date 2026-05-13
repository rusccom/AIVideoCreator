import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/app/",
          "/login",
          "/owner/",
          "/privacy",
          "/register",
          "/terms"
        ]
      }
    ],
    sitemap: "https://aivideocreator.app/sitemap.xml",
    host: "https://aivideocreator.app"
  };
}
