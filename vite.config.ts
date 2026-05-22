import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1600, // Safe threshold for premium 3D graphic websites
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Group heavy 3D WebGL assets
            if (id.includes('three') || id.includes('@react-three') || id.includes('@types/three') || id.includes('three-stdlib')) {
              return 'three-vendor'
            }
            // Group heavy kinetic animation frameworks
            if (id.includes('gsap')) {
              return 'gsap-vendor'
            }
            // Other standard dependencies
            return 'vendor'
          }
        }
      }
    }
  }
})
