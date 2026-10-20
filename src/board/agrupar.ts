import type { Funcionario, Tarefa } from '../api/types'

export interface ColunaDoQuadro {
  tarefa: Tarefa
  pessoas: Funcionario[]
}

export interface QuadroMontado {
  colunas: ColunaDoQuadro[]
  semTarefa: Funcionario[]
}

const porNome = (a: Funcionario, b: Funcionario) =>
  (a.nome ?? '').localeCompare(b.nome ?? '', 'pt-BR')

// Monta o quadro a partir das duas listas da API. As colunas vêm das tarefas
// (assim uma tarefa sem ninguém também aparece) e as pessoas vêm da lista de
// funcionários, agrupadas pelo id da tarefa de cada um.
export function montarQuadro(tarefas: Tarefa[], funcionarios: Funcionario[]): QuadroMontado {
  const porTarefa = new Map<number, Funcionario[]>()
  const semTarefa: Funcionario[] = []

  for (const f of funcionarios) {
    const id = f.tarefas?.id
    if (id == null) {
      semTarefa.push(f)
      continue
    }
    const lista = porTarefa.get(id) ?? []
    lista.push(f)
    porTarefa.set(id, lista)
  }

  const colunas = [...tarefas]
    .sort((a, b) => a.id - b.id)
    .map((tarefa) => ({ tarefa, pessoas: (porTarefa.get(tarefa.id) ?? []).sort(porNome) }))

  return { colunas, semTarefa: semTarefa.sort(porNome) }
}

export function contarPessoas(n: number): string {
  if (n === 0) return 'ninguém'
  return n === 1 ? '1 pessoa' : `${n} pessoas`
}
