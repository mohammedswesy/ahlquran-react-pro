import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        chunkSizeWarningLimit: 900,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes('node_modules')) return undefined

                    if (id.includes('node_modules/xlsx')) return 'xlsx'
                    if (id.includes('node_modules/recharts')) return 'charts'
                    if (id.includes('node_modules/react-icons')) return 'icons'
                    if (id.includes('node_modules/@radix-ui')) return 'radix-ui'

                    if (
                        id.includes('node_modules/react/') ||
                        id.includes('node_modules/react-dom/') ||
                        id.includes('node_modules/react-router')
                    ) {
                        return 'react-core'
                    }

                    return 'vendor'
                },
            },
        },
    },
})
