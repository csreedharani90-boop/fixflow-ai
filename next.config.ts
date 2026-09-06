import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@moss-dev/moss",
    "@moss-dev/moss-core",
    "@moss-dev/moss-core-win32-x64-msvc",
  ],
};

export default nextConfig;