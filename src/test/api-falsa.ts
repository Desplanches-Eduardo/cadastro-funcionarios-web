import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import type { Funcionario, Tarefa, TarefaResumo } from '../api/types'

// Um backend falso, em memória, que imita o comportamento do Spring de
// verdade, inclusive as manias que o frontend precisa tratar:
// - POST responde texto ("... criado com sucesso: Nome(ID): 3");
// - PUT substitui o registro inteiro (campo ausente vira null);
// - 404 e 409 respondem uma frase; email repetido responde 500 em JSON;
// - excluir tarefa com gente responde 409.
// Assim os testes rodam sem o backend ligado.

interface LinhaFuncionario extends Omit<Funcionario, 'tarefas'> {
  tarefaId: number | null
}

export const banco = {
  tarefas: [] as TarefaResumo[],
  funcionarios: [] as LinhaFuncionario[],
  proximoId: 1,
}

// Todas as gravações que chegaram, para os testes conferirem o corpo enviado.
export const pedidos: { metodo: string; caminho: string; corpo: unknown }[] = []

export function zerarBanco() {
  banco.tarefas = []
  banco.funcionarios = []
  banco.proximoId = 1
  pedidos.length = 0
}

export function criarTarefaNoBanco(nome: string, dificuldade: string): TarefaResumo {
  const t = { id: banco.proximoId++, nome, dificuldade }
  banco.tarefas.push(t)
  return t
}

export function criarPessoaNoBanco(dados: Partial<LinhaFuncionario> & { nome: string }): LinhaFuncionario {
  const f: LinhaFuncionario = {
    id: banco.proximoId++,
    email: `${dados.nome.split(' ')[0].toLowerCase()}@empresa.com.br`,
    cargo: 'Analista',
    idade: 30,
    url_img: null,
    tarefaId: null,
    ...dados,
  }
  banco.funcionarios.push(f)
  return f
}

// O mesmo cenário em todo teste de tela: duas tarefas, três pessoas.
export function popularBanco() {
  const fechamento = criarTarefaNoBanco('Fechar o mês', 'media')
  const inventario = criarTarefaNoBanco('Inventário', 'alta')
  const ana = criarPessoaNoBanco({ nome: 'Ana Souza', cargo: 'Analista financeira', idade: 28, tarefaId: fechamento.id })
  const rui = criarPessoaNoBanco({ nome: 'Rui Lima', cargo: 'Estoquista', idade: 35, url_img: 'https://exemplo.com/rui.png', tarefaId: inventario.id })
  const lucas = criarPessoaNoBanco({ nome: 'Lucas Batista', cargo: 'Estagiário', idade: 20 })
  return { fechamento, inventario, ana, rui, lucas }
}

const resumo = (id: number | null) => banco.tarefas.find((t) => t.id === id) ?? null
const comTarefa = (f: LinhaFuncionario): Funcionario => {
  const { tarefaId, ...resto } = f
  return { ...resto, tarefas: resumo(tarefaId) }
}
const naTarefa = (id: number) => banco.funcionarios.filter((f) => f.tarefaId === id)
const erro500 = (caminho: string) =>
  HttpResponse.json({ status: 500, error: 'Internal Server Error', path: caminho }, { status: 500 })

type CorpoFuncionario = Partial<Omit<Funcionario, 'tarefas'>> & { tarefas?: { id: number } | null }

export const handlers = [
  http.get('*/api/funcionarios/listar', () => HttpResponse.json(banco.funcionarios.map(comTarefa))),

  http.get('*/api/funcionarios/listar/:id', ({ params }) => {
    const f = banco.funcionarios.find((x) => x.id === Number(params.id))
    return f
      ? HttpResponse.json(comTarefa(f))
      : HttpResponse.text(`Funcionário não encontrado. Funcionário com o ID: ${params.id} não existe em nossos registros`, { status: 404 })
  }),

  http.post('*/api/funcionarios/criar', async ({ request }) => {
    const corpo = (await request.json()) as CorpoFuncionario
    pedidos.push({ metodo: 'POST', caminho: '/funcionarios/criar', corpo })
    if (banco.funcionarios.some((f) => f.email === corpo.email)) return erro500('/funcionarios/criar')
    if (corpo.tarefas && !resumo(corpo.tarefas.id)) return erro500('/funcionarios/criar')
    const f = criarPessoaNoBanco({
      nome: corpo.nome ?? '',
      email: corpo.email ?? null,
      cargo: corpo.cargo ?? null,
      idade: corpo.idade ?? 0,
      url_img: corpo.url_img ?? null,
      tarefaId: corpo.tarefas?.id ?? null,
    })
    return HttpResponse.text(`Funcionário criado com sucesso: ${f.nome}(ID): ${f.id}`, { status: 201 })
  }),

  http.put('*/api/funcionarios/alterar/:id', async ({ request, params }) => {
    const corpo = (await request.json()) as CorpoFuncionario
    pedidos.push({ metodo: 'PUT', caminho: `/funcionarios/alterar/${params.id}`, corpo })
    const i = banco.funcionarios.findIndex((x) => x.id === Number(params.id))
    if (i < 0) return HttpResponse.text('Funcionário não encontrado.', { status: 404 })
    // Como o backend: grava o objeto inteiro, o que não veio vira null.
    banco.funcionarios[i] = {
      id: Number(params.id),
      nome: corpo.nome ?? null,
      email: corpo.email ?? null,
      cargo: corpo.cargo ?? null,
      idade: corpo.idade ?? 0,
      url_img: corpo.url_img ?? null,
      tarefaId: corpo.tarefas?.id ?? null,
    }
    return HttpResponse.json(comTarefa(banco.funcionarios[i]))
  }),

  http.delete('*/api/funcionarios/deletar/:id', ({ params }) => {
    pedidos.push({ metodo: 'DELETE', caminho: `/funcionarios/deletar/${params.id}`, corpo: null })
    const antes = banco.funcionarios.length
    banco.funcionarios = banco.funcionarios.filter((f) => f.id !== Number(params.id))
    return banco.funcionarios.length < antes
      ? HttpResponse.text(`Funcionário com ID ${params.id} deletado com sucesso`)
      : HttpResponse.text('Funcionário não encontrado.', { status: 404 })
  }),

  http.get('*/api/tarefas/listar', () =>
    HttpResponse.json(banco.tarefas.map((t): Tarefa => ({ ...t, funcionarios: naTarefa(t.id).map(comTarefa) }))),
  ),

  http.post('*/api/tarefas/criar', async ({ request }) => {
    const corpo = (await request.json()) as { nome: string; dificuldade: string }
    pedidos.push({ metodo: 'POST', caminho: '/tarefas/criar', corpo })
    const t = criarTarefaNoBanco(corpo.nome, corpo.dificuldade)
    return HttpResponse.text(`Tarefa criada com sucesso: ${t.nome}(ID): ${t.id}`, { status: 201 })
  }),

  http.put('*/api/tarefas/alterar/:id', async ({ request, params }) => {
    const corpo = (await request.json()) as { nome: string; dificuldade: string }
    pedidos.push({ metodo: 'PUT', caminho: `/tarefas/alterar/${params.id}`, corpo })
    const t = banco.tarefas.find((x) => x.id === Number(params.id))
    if (!t) return HttpResponse.text('Tarefa não encontrada.', { status: 404 })
    t.nome = corpo.nome
    t.dificuldade = corpo.dificuldade
    return HttpResponse.json({ ...t, funcionarios: null })
  }),

  http.delete('*/api/tarefas/deletar/:id', ({ params }) => {
    pedidos.push({ metodo: 'DELETE', caminho: `/tarefas/deletar/${params.id}`, corpo: null })
    const id = Number(params.id)
    if (!banco.tarefas.some((t) => t.id === id)) return HttpResponse.text('Tarefa não encontrada.', { status: 404 })
    const ocupantes = naTarefa(id).length
    if (ocupantes > 0) {
      return HttpResponse.text(`Tarefa não deletada: ${ocupantes} funcionários(s) ainda estão vinculados a ela`, { status: 409 })
    }
    banco.tarefas = banco.tarefas.filter((t) => t.id !== id)
    return HttpResponse.text(`A tarefa com ID ${id} foi deletada com sucesso`)
  }),
]

export const servidor = setupServer(...handlers)
