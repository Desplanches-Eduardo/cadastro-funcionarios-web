// Espelho dos DTOs do backend, no formato que o JSON chega de verdade.
// Os campos de texto podem vir null porque o banco não exige nenhum deles.

// Tarefa como aparece dentro de um funcionário (sem a lista de funcionários).
export interface TarefaResumo {
  id: number
  nome: string | null
  dificuldade: string | null
}

// Tarefa como vem de /tarefas/listar: inclui quem está nela.
export interface Tarefa extends TarefaResumo {
  funcionarios: Funcionario[] | null
}

export interface Funcionario {
  id: number
  nome: string | null
  email: string | null
  url_img: string | null
  cargo: string | null
  idade: number
  tarefas: TarefaResumo | null
}

// O que se envia no POST e no PUT. Sem id (no POST, id no corpo dá 500)
// e a tarefa vai só como referência pelo id.
export interface FuncionarioInput {
  nome: string
  email: string
  url_img: string | null
  cargo: string
  idade: number
  tarefas: { id: number } | null
}

export interface TarefaInput {
  nome: string
  dificuldade: string
}
