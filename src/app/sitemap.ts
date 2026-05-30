import type { MetadataRoute } from "next";
import { brand } from "@/shared/brand";

const baseUrl = brand.url;

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1
    }
  ];
}
