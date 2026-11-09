import type { NextConfig } from "next";

// Browser should call a same-origin path (/backend). Next proxies to the real API.
// On Vercel set:
//   NEXT_PUBLIC_API_URL=/backend
//   API_PROXY_TARGET=https://your-api.onrender.com/api
const apiProxyTarget =
  process.env.API_PROXY_TARGET ??
  (process.env.NEXT_PUBLIC_API_URL?.startsWith("http")
    ? process.env.NEXT_PUBLIC_API_URL
    : undefined) ??
  "http://localhost:3001/api";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/problems", destination: "/practice", permanent: false },
      { source: "/catalogue", destination: "/practice", permanent: false },
      { source: "/simulations", destination: "/practice", permanent: false },
      { source: "/contests", destination: "/contest", permanent: false },
      { source: "/leaderboard", destination: "/dashboard/ranking", permanent: false },
      {
        source: "/contests/:slug/play",
        destination: "/contests/:slug/arena",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${apiProxyTarget.replace(/\/$/, "")}/:path*`,
      },
    ];
  },
};

export default nextConfig;
