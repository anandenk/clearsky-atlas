import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "California Environmental Atlas",
  description:
    "Compare two California addresses through shared, source-backed tract evidence.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
