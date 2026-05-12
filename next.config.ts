import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/lp/document-classification",
        destination: "/triagem-documentos",
        permanent: true,
      },
      {
        source: "/lp/client-document-collection",
        destination: "/cobranca-automatica",
        permanent: true,
      },
      {
        source: "/lp/invoice-extraction",
        destination: "/processamento-notas",
        permanent: true,
      },
      {
        source: "/lp/free-diagnosis",
        destination: "/automacao-contabil",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
