import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// O backend não libera CORS. Por isso o navegador nunca chama a porta 8080
// direto: ele chama /api na mesma origem do Vite, e o Vite repassa para o
// Spring tirando o prefixo (/api/tarefas/listar -> :8080/tarefas/listar).
// API_URL troca o destino, por exemplo para um backend de teste em outra porta.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.API_URL ?? 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
