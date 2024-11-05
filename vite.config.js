import { defineConfig } from 'vite'

export default defineConfig({
  // Ensure public directory is served correctly
  publicDir: 'public',
  
  // Configure asset handling
  build: {
    assetsDir: 'assets',
    // Copy files from public to dist during build
    copyPublicDir: true,
    rollupOptions: {
      // Explicitly include binary files
      input: {
        main: './index.html'
      }
    }
  },

  // Configure server for development
  server: {
    port: 3000,
    // Enable CORS during development
    cors: true
  },

  // Configure asset plugins
  assetsInclude: ['**/*.glb', '**/*.gltf'],
})