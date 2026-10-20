import type { Funcionario, TarefaResumo } from '../api/types'

// Identificadores do dnd-kit. Cada coluna (e a bandeja) é um alvo; cada ficha
// é algo que pode ser arrastado.
export const idAlvo = (tarefaId: number | null) => (tarefaId == null ? 'sem-tarefa' : `tarefa-${tarefaId}`)
export const idFicha = (pessoaId: number) => `pessoa-${pessoaId}`

// O que viaja junto com cada item no dnd-kit.
export interface DadosFicha {
  pessoa: Funcionario
}
export interface DadosAlvo {
  destino: TarefaResumo | null // null = bandeja
}

export const resumoDe = (t: TarefaResumo): TarefaResumo => ({ id: t.id, nome: t.nome, dificuldade: t.dificuldade })

// A ficha é também um link. Ao soltar uma ficha arrastada, o navegador
// dispara um clique nela, o que abriria a gaveta. Guardamos a hora em que o
// último arraste terminou para ignorar esse clique.
let fimDoUltimoArraste = 0
export const marcarFimDoArraste = () => {
  fimDoUltimoArraste = Date.now()
}
export const acabouDeArrastar = () => Date.now() - fimDoUltimoArraste < 250
