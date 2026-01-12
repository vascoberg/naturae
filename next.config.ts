import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bmkxhnktszwqiuiywwbz.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // iNaturalist afbeeldingen voor openbare foto's modus
      {
        protocol: "https",
        hostname: "inaturalist-open-data.s3.amazonaws.com",
        pathname: "/photos/**",
      },
      {
        protocol: "https",
        hostname: "static.inaturalist.org",
        pathname: "/photos/**",
      },
      // Flickr afbeeldingen
      {
        protocol: "https",
        hostname: "live.staticflickr.com",
      },
      {
        protocol: "https",
        hostname: "farm*.staticflickr.com",
      },
    ],
  },
  serverExternalPackages: [],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
