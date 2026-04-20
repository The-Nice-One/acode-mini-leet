import { defineConfig } from "vite";
import { exec } from "child_process";

// Custom Vite plugin to run your zip script after the build finishes
function packZipPlugin() {
  return {
    name: "pack-zip-plugin",
    // The closeBundle hook runs after the output has been written to the dist directory
    closeBundle() {
      exec("node .vscode/pack-zip.js", (err, stdout, stderr) => {
        if (err) {
          console.error("Error packing zip:", err);
          return;
        }
        console.log(stdout.trim());
      });
    },
  };
}

export default defineConfig({
  // Vite supports CSS modules automatically! Just ensure your files end with .module.css
  plugins: [packZipPlugin()],

  css: {
    modules: {
      localsConvention: "camelCaseOnly",
    },
  },

  build: {
    outDir: "dist",
    minify: true,
    emptyOutDir: false, // Set to false so Vite doesn't delete other files placed in dist

    // Library mode is used to bundle a specific entry point without an index.html
    lib: {
      entry: "src/main.ts",
      name: "MyPlugin", // A global name required if using 'iife' or 'umd' formats
      formats: ["iife"], // 'iife' mimics esbuild's default standalone output. Change to 'es' or 'cjs' if your platform requires it.
      fileName: () => "main.js", // Forces the output file to be named exactly main.js
    },

    // Enabling watch mode natively if needed can be done via CLI flags,
    // but configuring standard rollup options is helpful.
    rollupOptions: {
      // If you have external dependencies (like 'obsidian' or 'fs'), list them here:
      // external: ['fs', 'path'],
    },
  },

  // If you DO still need a local web server for testing your plugin, you can configure it here:
  server: {
    port: 3000,
  },
});
