import type { NextConfig } from "next";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const isGitHubActionsBuild = process.env.GITHUB_ACTIONS === "true";
const isUserSiteRepository = repositoryName.endsWith(".github.io");
const deploymentBasePath = isGitHubActionsBuild && repositoryName && !isUserSiteRepository
  ? `/${repositoryName}`
  : "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  basePath: deploymentBasePath,
  assetPrefix: deploymentBasePath || undefined,
  images: {
    unoptimized: true
  }
};

export default nextConfig;