import type { Funcionario, FuncionarioInput, TarefaInput } from '../api/types'

// Regras dos formulários, fora dos componentes para poderem ser testadas.
// Os dados do formulário são sempre texto; a conversão para o formato da API
// acontece só na hora de enviar.

export type Erros<K extends string> = Partial<Record<K, string>>

export interface DadosPessoa {
  nome: string
  email: string
  cargo: string
  idade: string
  url_img: string
  tarefaId: string // '' quando a pessoa fica sem tarefa
}

export const CAMPOS_PESSOA: (keyof DadosPessoa)[] = ['nome', 'email', 'cargo', 'idade', 'url_img', 'tarefaId']

export const PESSOA_VAZIA: DadosPessoa = { nome: '', email: '', cargo: '', idade: '', url_img: '', tarefaId: '' }

export function dePessoa(f: Funcionario): DadosPessoa {
  return {
    nome: f.nome ?? '',
    email: f.email ?? '',
    cargo: f.cargo ?? '',
    idade: String(f.idade),
    url_img: f.url_img ?? '',
    tarefaId: f.tarefas ? String(f.tarefas.id) : '',
  }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const URL_FOTO = /^https?:\/\/\S+$/

// `todos` é a lista atual de funcionários, para barrar email repetido antes
// de enviar (o backend responde 500 nesse caso). `idAtual` é quem está sendo
// editado, que pode manter o próprio email.
export function validarPessoa(d: DadosPessoa, todos: Funcionario[], idAtual?: number): Erros<keyof DadosPessoa> {
  const erros: Erros<keyof DadosPessoa> = {}

  if (!d.nome.trim()) erros.nome = 'Informe o nome.'

  const email = d.email.trim().toLowerCase()
  if (!email) {
    erros.email = 'Informe o email.'
  } else if (!EMAIL.test(email)) {
    erros.email = 'Esse email não parece completo. Exemplo: ana@empresa.com.br'
  } else {
    const dono = todos.find((f) => f.id !== idAtual && f.email?.trim().toLowerCase() === email)
    if (dono) erros.email = `Esse email já é de ${dono.nome ?? 'outra pessoa'}.`
  }

  if (!d.cargo.trim()) erros.cargo = 'Informe o cargo.'

  const idade = Number(d.idade)
  if (!/^\d+$/.test(d.idade.trim()) || idade < 14 || idade > 100) {
    erros.idade = 'Informe a idade em anos, entre 14 e 100.'
  }

  if (d.url_img.trim() && !URL_FOTO.test(d.url_img.trim())) {
    erros.url_img = 'O endereço da foto precisa começar com http:// ou https://.'
  }

  return erros
}

// O PUT grava o objeto inteiro, então mandamos sempre todos os campos.
export function paraFuncionarioInput(d: DadosPessoa): FuncionarioInput {
  return {
    nome: d.nome.trim(),
    email: d.email.trim(),
    cargo: d.cargo.trim(),
    idade: Number(d.idade),
    url_img: d.url_img.trim() || null,
    tarefas: d.tarefaId ? { id: Number(d.tarefaId) } : null,
  }
}

export interface DadosTarefa {
  nome: string
  dificuldade: string
}

export function validarTarefa(d: DadosTarefa): Erros<keyof DadosTarefa> {
  const erros: Erros<keyof DadosTarefa> = {}
  if (!d.nome.trim()) erros.nome = 'Informe o nome da tarefa.'
  if (!d.dificuldade) erros.dificuldade = 'Escolha a dificuldade.'
  return erros
}

export function paraTarefaInput(d: DadosTarefa): TarefaInput {
  return { nome: d.nome.trim(), dificuldade: d.dificuldade }
}
