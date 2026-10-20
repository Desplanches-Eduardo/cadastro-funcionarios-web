import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { popularBanco, servidor } from '../test/api-falsa'
import { ApiError } from './client'
import { buscarFuncionario, criarFuncionario, listarFuncionarios } from './funcionarios'
import { deletarTarefa } from './tarefas'

const BACKEND_FORA = 'Não foi possível falar com o servidor em localhost:8080. Ele está rodando?'

// Espera que a promessa falhe com um ApiError e devolve o erro.
async function falha(promessa: Promise<unknown>): Promise<ApiError> {
  const erro = await promessa.then(
    () => null,
    (e: unknown) => e,
  )
  expect(erro).toBeInstanceOf(ApiError)
  return erro as ApiError
}

describe('cliente da API', () => {
  it('lê o JSON das listagens', async () => {
    popularBanco()
    const lista = await listarFuncionarios()
    expect(lista.map((f) => f.nome)).toContain('Ana Souza')
  })

  it('aceita o POST que responde texto, não JSON', async () => {
    await expect(
      criarFuncionario({ nome: 'Bia', email: 'bia@e.com', cargo: 'x', idade: 20, url_img: null, tarefas: null }),
    ).resolves.toBeUndefined()
  })

  it('404: usa a frase em português que o backend manda', async () => {
    const erro = await falha(buscarFuncionario(99))
    expect(erro.status).toBe(404)
    expect(erro.message).toMatch(/^Funcionário não encontrado/)
  })

  it('409: mantém o status para quem chama decidir o que mostrar', async () => {
    const { fechamento } = popularBanco()
    const erro = await falha(deletarTarefa(fechamento.id))
    expect(erro.status).toBe(409)
  })

  it('500 com o JSON do Spring vira uma mensagem própria', async () => {
    servidor.use(http.get('*/api/funcionarios/listar', () => HttpResponse.json({ status: 500 }, { status: 500 })))
    const erro = await falha(listarFuncionarios())
    expect(erro.message).toMatch(/^O servidor recusou a gravação \(erro 500\)/)
  })

  it('backend desligado (502 do proxy, sem corpo) avisa para conferir o servidor', async () => {
    servidor.use(http.get('*/api/funcionarios/listar', () => new HttpResponse(null, { status: 502 })))
    expect((await falha(listarFuncionarios())).message).toBe(BACKEND_FORA)
  })

  it('falha de rede também avisa para conferir o servidor', async () => {
    servidor.use(http.get('*/api/funcionarios/listar', () => HttpResponse.error()))
    const erro = await falha(listarFuncionarios())
    expect(erro.status).toBe(0)
    expect(erro.message).toBe(BACKEND_FORA)
  })
})
