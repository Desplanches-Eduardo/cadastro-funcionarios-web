import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { alterarFuncionario, comTarefa, criarFuncionario } from '../api/funcionarios'
import { alterarTarefa, criarTarefa } from '../api/tarefas'
import type { Funcionario, FuncionarioInput, TarefaInput, TarefaResumo } from '../api/types'
import { useAvisar } from '../ui/avisos-contexto'
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

interface Movimento {
  pessoa: Funcionario
  destino: TarefaResumo | null // null = bandeja (sem tarefa)
}

// Muda a pessoa de tarefa de forma otimista: a ficha vai para a coluna nova
// na hora, antes de o servidor responder. Se o PUT falhar, o quadro volta ao
// que era. No fim, recarrega do servidor de qualquer jeito, para não ficar
// com uma versão inventada.
export function useMoverFuncionario() {
  const qc = useQueryClient()
  const avisar = useAvisar()

  const mutacao = useMutation({
    mutationFn: ({ pessoa, destino }: Movimento) => alterarFuncionario(pessoa.id, comTarefa(pessoa, destino?.id ?? null)),
    onMutate: async ({ pessoa, destino }: Movimento) => {
      // Uma busca em andamento poderia chegar depois e desfazer a troca.
      await qc.cancelQueries({ queryKey: chaves.funcionarios })
      const anterior = qc.getQueryData<Funcionario[]>(chaves.funcionarios)
      qc.setQueryData<Funcionario[]>(chaves.funcionarios, (lista) =>
        lista?.map((f) => (f.id === pessoa.id ? { ...f, tarefas: destino } : f)),
      )
      return { anterior }
    },
    // Os avisos ficam aqui, e não no mutate(..., { onSuccess }) de quem chama:
    // com a troca otimista, a ficha muda de coluna e o botão que chamou é
    // desmontado, e o TanStack descarta os callbacks de um componente desmontado.
    onSuccess: (_resposta, { pessoa, destino }) => {
      const nome = pessoa.nome ?? 'A pessoa'
      avisar(destino ? `${nome} agora está em ${destino.nome ?? 'outra tarefa'}` : `${nome} agora está sem tarefa`)
    },
    onError: (erro, { pessoa }, contexto) => {
      if (contexto?.anterior) qc.setQueryData(chaves.funcionarios, contexto.anterior)
      avisar(`${pessoa.nome ?? 'A pessoa'} voltou para onde estava. ${erro.message}`)
    },
    onSettled: () => recarregarQuadro(qc),
  })

  const { mutate } = mutacao
  const mover = useCallback(
    (pessoa: Funcionario, destino: TarefaResumo | null) => {
      if ((pessoa.tarefas?.id ?? null) === (destino?.id ?? null)) return
      mutate({ pessoa, destino })
    },
    [mutate],
  )

  return mover
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
