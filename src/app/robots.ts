import type { MetadataRoute } from "next";
import { brand } from "@/shared/brand";

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: disallowedRoutes() }], sitemap: `${brand.url}/sitemap.xml`, host: brand.url };
}

function disallowedRoutes() {
  return ["/api/", "/app/", "/login", "/owner/", "/privacy", "/register", "/terms"];
}
