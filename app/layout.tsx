import type { Metadata } from "next";
import "../src/styles/atlas.css";
import "../src/styles/comparison.css";
export const metadata: Metadata = {
  title: "Common ground — California Environmental Atlas",
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
