import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// O backend não libera CORS. Por isso o navegador nunca chama a porta 8080
// direto: ele chama /api na mesma origem do Vite, e o Vite repassa para o
// Spring tirando o prefixo (/api/tarefas/listar -> :8080/tarefas/listar).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
