/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Accept bigger multipart/form-data bodies for server actions
      bodySizeLimit: '5mb', // e.g., '2mb' | '10mb' | '50mb'
    },
  },
};

module.exports = nextConfig;