import { Orbitron, Poppins, Sora } from "next/font/google";

export const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"]
});

export const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"]
});

export const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-tech",
  weight: ["500", "700"]
});
