/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:5000/api/:path*',
      },
      {
        source: '/cdn/:path*',
        destination: 'http://127.0.0.1:5000/cdn/:path*',
      },
      {
        source: '/webshare',
        destination: 'http://127.0.0.1:5000/webshare',
      },
    ];
  },
};

export default nextConfig;
