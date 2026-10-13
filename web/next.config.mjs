// Every tool runs in the browser, so the whole site exports as static HTML (out/) and can be hosted anywhere.
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
}

export default nextConfig
