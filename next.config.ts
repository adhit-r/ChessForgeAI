
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Configure for static export to GitHub Pages
  output: 'export',
  images: {
    unoptimized: true, // Required for static export if not using a custom loader
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // If your GitHub Pages site is at a subdirectory (e.g., your-username.github.io/your-repo-name)
  // you might need to set basePath. For example:
  // basePath: '/your-repo-name',
  // assetPrefix: '/your-repo-name/',
  // The GitHub Actions workflow for GitHub Pages usually handles this,
  // but if you encounter issues with paths, this is where to look.
};

export default nextConfig;
