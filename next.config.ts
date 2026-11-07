import type { NextConfig } from "next";

// Integration-owner configuration. Set only in the frontend worktree process.
const backend = process.env.ATLAS_BACKEND_ORIGIN;
if (backend && !/^http:\/\/(127\.0\.0\.1|localhost):3000$/.test(backend)) {
  throw new Error(
    "ATLAS_BACKEND_ORIGIN must be the local backend on port 3000.",
  );
}
const config: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: backend
        ? [{ source: "/api/:path*", destination: `${backend}/api/:path*` }]
        : [],
      afterFiles: [],
      fallback: [],
    };
  },
};
export default config;
