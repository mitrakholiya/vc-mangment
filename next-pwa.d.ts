declare module "next-pwa" {
  import { NextConfig } from "next";

  function withPWA(config: {
    dest: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
    runtimeCaching?: any[];
    buildExcludes?: string[];
    [key: string]: any;
  }): (nextConfig: NextConfig) => NextConfig;

  export = withPWA;
}
