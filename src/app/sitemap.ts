import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://dual-id-attendance-system.web.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/admin/login",
    "/classroom"
  ];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "daily",
    priority: route === "" ? 1 : 0.8
  }));
}
