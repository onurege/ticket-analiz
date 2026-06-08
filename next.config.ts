import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: [
    "mssql",
    "better-sqlite3",
    // sqlite-vec ve pdf-parse Node native binding / dinamik import kullanıyor;
    // Turbopack bundle ederken `import.meta.resolve` desteği yok, externalize
    // edilmezse "__TURBOPACK__import$2e$meta__.resolve is not a function"
    // hatası verir. Bu paketler sadece sunucu tarafında çalışmalı.
    "sqlite-vec",
    "sqlite-vec-darwin-arm64",
    "sqlite-vec-darwin-x64",
    "sqlite-vec-linux-x64",
    "pdf-parse",
    "mammoth",
    // transformers.js ONNX runtime native binding; bundle'ı patlatır
    "@xenova/transformers",
    "onnxruntime-node",
    "sharp",
  ],
};

export default config;
