/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
  async rewrites() {
    const indexerUrl =
      process.env.NEXT_PUBLIC_INDEXER_API_URL || "http://localhost:8099";
    return [
      {
        source: "/api/indexer/:path*",
        destination: `${indexerUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
