import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // domains: ["localhost"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        port: "",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: "",
      },
      {
        protocol: "http",
        hostname: "img.bbystatic.com",
        port: "",
      },
      {
        protocol: "https",
        hostname: "pub-73fe63a332d247cb9166493e4dbbd09b.r2.dev",
        port: "",
      },
    ],
  },
  // ✅ Turbopack config for Next ≤ 15.2 lives here
  experimental: {
    turbo: {
      resolveAlias: {
        "react-quill": "/src/shims/ReactQuill.tsx",
      },
    },
  },

  // ✅ Webpack aliases (fallback / if you ever run webpack)
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "react-quill": path.resolve(__dirname, "src/shims/ReactQuill.tsx"),
    };
    return config;
  },
};

export default nextConfig;
