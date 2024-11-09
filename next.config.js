/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co"
          }
        ]
      }
    ]
  }
};

export default config;