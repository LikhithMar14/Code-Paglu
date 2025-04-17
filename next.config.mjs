/** @type {import('next').NextConfig} */
import MonacoWebpackPlugin from "monaco-editor-webpack-plugin";

const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.plugins.push(
        new MonacoWebpackPlugin({
          languages: [
            "javascript",
            "typescript",
            "html",
            "css",
            "json",
            "python",
            "java",
            "csharp",
            "php",
            "ruby",
            "go",
            "rust",
            "sql",
            "markdown",
            "yaml",
            "shell",
            "xml",
          ],
          filename: "static/[name].worker.js",
        })
      );
    }
    return config;
  },
};

export default nextConfig;
