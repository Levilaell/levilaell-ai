import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/diagnosis/result/", "/lp/"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
