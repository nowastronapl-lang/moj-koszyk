/** @type {import('next').NextConfig} */
const isGithubActions = process.env.GITHUB_ACTIONS || false;

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: isGithubActions ? '/moj-koszyk' : '',
  assetPrefix: isGithubActions ? '/moj-koszyk/' : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;