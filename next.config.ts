import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sharp is a native (C++) module used by our upload actions to resize
  // images. Keep it external so Next loads the platform binary at runtime
  // instead of trying to bundle it.
  serverExternalPackages: ["sharp"],
};

export default nextConfig;
