import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router'
import App from '../App'
import { AvisosProvider } from '../ui/Avisos'

// Um QueryClient novo por teste, sem novas tentativas: um erro tem que
// aparecer na hora, não depois de repetir.
export function novoQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
}

export function Provedores({ children, qc }: { children: ReactNode; qc: QueryClient }) {
  return (
    <QueryClientProvider client={qc}>
      <AvisosProvider>{children}</AvisosProvider>
    </QueryClientProvider>
  )
}

// Monta o app inteiro já num endereço (ex.: "/pessoa/nova").
export function renderizarApp(endereco = '/') {
  const qc = novoQueryClient()
  const usuario = userEvent.setup()
  const tela = render(
    <Provedores qc={qc}>
      <MemoryRouter initialEntries={[endereco]}>
        <App />
      </MemoryRouter>
    </Provedores>,
  )
  return { ...tela, usuario, qc }
}
