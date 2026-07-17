import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DIAS | Dual ID Attendance System",
    short_name: "DIAS",
    description:
      "Dual authentication attendance system with RFID, fingerprint verification, and live analytics.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f2e8",
    theme_color: "#ffb11f"
  };
}
