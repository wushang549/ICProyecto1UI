/** @type {import('next').NextConfig} */
const isGithubActions = process.env.GITHUB_ACTIONS === 'true'
const repository = process.env.GITHUB_REPOSITORY ?? ''
const repoName = repository.split('/')[1] ?? ''
const hasRepoName = repoName.length > 0

const nextConfig = {
  devIndicators: false,
  trailingSlash: true,
  output: isGithubActions ? 'export' : undefined,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  ...(isGithubActions && hasRepoName
    ? {
        basePath: `/${repoName}`,
        assetPrefix: `/${repoName}/`,
      }
    : {}),
}

export default nextConfig
