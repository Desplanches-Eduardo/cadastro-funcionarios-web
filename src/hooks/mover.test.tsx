import { act, renderHook, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import type { Funcionario } from '../api/types'
import { banco, pedidos, popularBanco, servidor } from '../test/api-falsa'
import { novoQueryClient, Provedores } from '../test/renderizar'
import { useMoverFuncionario } from './mutations'
import { chaves, useFuncionarios } from './queries'

async function preparar() {
  const dados = popularBanco()
  const qc = novoQueryClient()
  const wrapper = ({ children }: { children: ReactNode }) => <Provedores qc={qc}>{children}</Provedores>
  const { result } = renderHook(() => ({ mover: useMoverFuncionario(), lista: useFuncionarios() }), { wrapper })
  await waitFor(() => expect(result.current.lista.isSuccess).toBe(true))
  const ana = result.current.lista.data!.find((f) => f.nome === 'Ana Souza')!
  // Onde a Ana está, segundo a tela (cache) e segundo o servidor.
  const naTela = () => qc.getQueryData<Funcionario[]>(chaves.funcionarios)!.find((f) => f.id === ana.id)!.tarefas?.id
  const noServidor = () => banco.funcionarios.find((f) => f.id === ana.id)!.tarefaId
  return { ...dados, result, ana, naTela, noServidor }
}

describe('useMoverFuncionario', () => {
  it('muda a tela na hora, antes de o servidor responder', async () => {
    const { result, ana, inventario, fechamento, naTela, noServidor } = await preparar()

    // O servidor segura o PUT até o teste liberar. Sem resposta aqui, o MSW
    // segue para o servidor falso normal.
    let liberar!: () => void
    const espera = new Promise<void>((r) => (liberar = r))
    servidor.use(http.put('*/api/funcionarios/alterar/:id', () => espera.then(() => undefined)))

    act(() => result.current.mover(ana, inventario))
    await waitFor(() => expect(naTela()).toBe(inventario.id))
    expect(noServidor()).toBe(fechamento.id) // servidor ainda não respondeu

    liberar()
    await waitFor(() => expect(noServidor()).toBe(inventario.id))
    expect(await screen.findByText('Ana Souza agora está em Inventário')).toBeInTheDocument()
  })

  it('manda o registro completo no PUT', async () => {
    const { result, ana, inventario } = await preparar()
    act(() => result.current.mover(ana, inventario))
    await waitFor(() => expect(pedidos).toHaveLength(1))
    expect(pedidos[0].corpo).toEqual({
      nome: 'Ana Souza',
      email: 'ana@empresa.com.br',
      cargo: 'Analista financeira',
      idade: 28,
      url_img: null,
      tarefas: { id: inventario.id },
    })
  })

  it('se o servidor recusar, a ficha volta na hora e um aviso explica', async () => {
    const { result, ana, inventario, fechamento, naTela } = await preparar()
    servidor.use(http.put('*/api/funcionarios/alterar/:id', () => HttpResponse.json({ status: 500 }, { status: 500 })))
    // Segura a recarga do quadro que vem depois do erro. Sem isso, a recarga
    // traria a tarefa antiga do servidor e o teste passaria mesmo sem o
    // "desfazer" (com o backend fora do ar, a recarga também falharia).
    let soltarRecarga!: () => void
    const recarga = new Promise<void>((r) => (soltarRecarga = r))
    servidor.use(http.get('*/api/funcionarios/listar', () => recarga.then(() => undefined)))

    act(() => result.current.mover(ana, inventario))
    expect(await screen.findByText(/^Ana Souza voltou para onde estava\./)).toBeInTheDocument()
    expect(naTela()).toBe(fechamento.id)
    soltarRecarga()
  })

  it('soltar na mesma tarefa não chama o servidor', async () => {
    const { result, ana, fechamento } = await preparar()
    act(() => result.current.mover(ana, fechamento))
    await new Promise((r) => setTimeout(r, 50))
    expect(pedidos).toHaveLength(0)
  })

  it('soltar na bandeja manda tarefas: null', async () => {
    const { result, ana, noServidor } = await preparar()
    act(() => result.current.mover(ana, null))
    await waitFor(() => expect(noServidor()).toBeNull())
    expect(await screen.findByText('Ana Souza agora está sem tarefa')).toBeInTheDocument()
  })
})
