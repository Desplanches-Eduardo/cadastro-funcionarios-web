import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { alterarFuncionario, criarFuncionario } from '../api/funcionarios'
import { alterarTarefa, criarTarefa } from '../api/tarefas'
import type { FuncionarioInput, TarefaInput } from '../api/types'
import { chaves } from './queries'

// As duas listas dependem uma da outra (a tarefa traz quem está nela e o
// funcionário traz a tarefa), então qualquer gravação recarrega as duas.
// O await faz a mutação só terminar quando o quadro já está atualizado.
async function recarregarQuadro(qc: QueryClient) {
  await Promise.all([
    qc.invalidateQueries({ queryKey: chaves.funcionarios }),
    qc.invalidateQueries({ queryKey: chaves.tarefas }),
  ])
}

// Sem id cria; com id altera.
export function useSalvarFuncionario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, dados }: { id?: number; dados: FuncionarioInput }) => {
      if (id == null) await criarFuncionario(dados)
      else await alterarFuncionario(id, dados)
    },
    onSuccess: () => recarregarQuadro(qc),
  })
}

export function useSalvarTarefa() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, dados }: { id?: number; dados: TarefaInput }) => {
      if (id == null) await criarTarefa(dados)
      else await alterarTarefa(id, dados)
    },
    onSuccess: () => recarregarQuadro(qc),
  })
}
