import type { Metadata } from "next";
import "../src/styles/atlas.css";
import "../src/styles/comparison.css";
import "../src/styles/city.css";
import "../src/styles/geography.css";
import "../src/styles/map-first.css";
export const metadata: Metadata = {
  title: "ClearSky — California Environmental Atlas",
  description:
    "Explore and compare California addresses through shared, source-backed tract evidence.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
