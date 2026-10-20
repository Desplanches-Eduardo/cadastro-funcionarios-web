import { getJson, send } from './client'
import type { Funcionario, FuncionarioInput } from './types'

export const listarFuncionarios = () => getJson<Funcionario[]>('/funcionarios/listar')

export const buscarFuncionario = (id: number) => getJson<Funcionario>(`/funcionarios/listar/${id}`)

// O POST responde só uma frase ("Funcionário criado com sucesso: ..."),
// então não devolvemos nada: quem chama recarrega a lista.
export const criarFuncionario = async (dados: FuncionarioInput): Promise<void> => {
  await send('POST', '/funcionarios/criar', dados)
}

// O PUT grava o objeto inteiro: campo que não for enviado vira null no banco.
// Por isso o tipo exige o registro completo.
export const alterarFuncionario = async (id: number, dados: FuncionarioInput): Promise<Funcionario> =>
  JSON.parse(await send('PUT', `/funcionarios/alterar/${id}`, dados)) as Funcionario

// O registro completo de uma pessoa com outra tarefa (null = sem tarefa).
// É o corpo do PUT quando alguém é movido no quadro.
export const comTarefa = (f: Funcionario, tarefaId: number | null): FuncionarioInput => ({
  nome: f.nome,
  email: f.email,
  url_img: f.url_img,
  cargo: f.cargo,
  idade: f.idade,
  tarefas: tarefaId == null ? null : { id: tarefaId },
})

export const deletarFuncionario = async (id: number): Promise<void> => {
  await send('DELETE', `/funcionarios/deletar/${id}`)
}
