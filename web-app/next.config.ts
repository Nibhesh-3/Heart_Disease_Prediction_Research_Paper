import type { NextConfig } from "next";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    "localhost",
    "localhost:3000",
    "127.0.0.1",
    "127.0.0.1:3000",
    "192.168.0.105",
    "192.168.0.105:3000",
    "auralis-backend-jd46.onrender.com",
    "*.onrender.com",
    "adria-aversive-blowfly.ngrok-free.dev",
    "*.ngrok-free.dev",
    "*.ngrok-free.app",
    "*.ngrok.io",
  ],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/:path*`,
      },
      {
        source: "/token",
        destination: `${BACKEND_URL}/token`,
      },
      {
        source: "/register",
        destination: `${BACKEND_URL}/register`,
      },
      {
        source: "/predict",
        destination: `${BACKEND_URL}/predict`,
      },
      {
        source: "/history",
        destination: `${BACKEND_URL}/history`,
      },
      {
        source: "/users/:path*",
        destination: `${BACKEND_URL}/users/:path*`,
      },
      {
        source: "/feature-importances",
        destination: `${BACKEND_URL}/feature-importances`,
      },
      {
        source: "/model-benchmarks",
        destination: `${BACKEND_URL}/model-benchmarks`,
      },
      {
        source: "/counterfactual",
        destination: `${BACKEND_URL}/counterfactual`,
      },
      {
        source: "/overall-risk",
        destination: `${BACKEND_URL}/overall-risk`,
      },
      {
        source: "/pdfcreate",
        destination: `${BACKEND_URL}/pdfcreate`,
      },
      {
        source: "/email-report",
        destination: `${BACKEND_URL}/email-report`,
      },
      {
        source: "/forgot-password",
        destination: `${BACKEND_URL}/forgot-password`,
      },
      {
        source: "/delete",
        destination: `${BACKEND_URL}/delete`,
      },
      {
        source: "/auth/google",
        destination: `${BACKEND_URL}/auth/google`,
      },
    ];
  },
};

export default nextConfig;
