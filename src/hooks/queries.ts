import { useQuery } from '@tanstack/react-query'
import { listarFuncionarios } from '../api/funcionarios'
import { listarTarefas } from '../api/tarefas'

// Chaves do cache do TanStack Query. Depois de criar, editar ou excluir,
// basta invalidar a chave certa para a tela buscar de novo.
export const chaves = {
  funcionarios: ['funcionarios'] as const,
  tarefas: ['tarefas'] as const,
}

export const useFuncionarios = () =>
  useQuery({ queryKey: chaves.funcionarios, queryFn: listarFuncionarios })

export const useTarefas = () => useQuery({ queryKey: chaves.tarefas, queryFn: listarTarefas })
