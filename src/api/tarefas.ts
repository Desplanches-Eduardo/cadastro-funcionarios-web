import { getJson, send } from './client'
import type { Tarefa, TarefaInput } from './types'

export const listarTarefas = () => getJson<Tarefa[]>('/tarefas/listar')

export const buscarTarefa = (id: number) => getJson<Tarefa>(`/tarefas/listar/${id}`)

export const criarTarefa = async (dados: TarefaInput): Promise<void> => {
  await send('POST', '/tarefas/criar', dados)
}

export const alterarTarefa = async (id: number, dados: TarefaInput): Promise<Tarefa> =>
  JSON.parse(await send('PUT', `/tarefas/alterar/${id}`, dados)) as Tarefa

// Responde 409 (ApiError com status 409) se ainda houver funcionários na tarefa.
export const deletarTarefa = async (id: number): Promise<void> => {
  await send('DELETE', `/tarefas/deletar/${id}`)
}
