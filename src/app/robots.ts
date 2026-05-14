import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: disallowedRoutes() }], sitemap: "https://aivideocreator.app/sitemap.xml", host: "https://aivideocreator.app" };
}

function disallowedRoutes() {
  return ["/admin/", "/api/", "/app/", "/login", "/owner/", "/privacy", "/register", "/terms"];
}
