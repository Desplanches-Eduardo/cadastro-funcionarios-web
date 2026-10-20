import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { banco, criarPessoaNoBanco, criarTarefaNoBanco, pedidos, popularBanco, servidor } from './test/api-falsa'
import { renderizarApp } from './test/renderizar'

// Testes de tela: o app inteiro montado, conversando com o backend falso.
// O arraste com o mouse não entra aqui (o jsdom não simula ponteiro com
// posição); a lógica dele é a mesma do menu "Mover para", testado abaixo, e
// a mutação tem os próprios testes em hooks/mover.test.tsx.

const coluna = (nome: string) => screen.getByRole('region', { name: nome })
// Acha a gaveta e espera os dados chegarem (antes disso ela mostra "Carregando…").
async function gaveta(nome: string) {
  const g = await screen.findByRole('dialog', { name: nome })
  await waitFor(() => expect(within(g).queryByText('Carregando…')).not.toBeInTheDocument())
  return g
}

describe('quadro', () => {
  it('mostra uma coluna por tarefa e quem está sem tarefa na bandeja', async () => {
    popularBanco()
    renderizarApp()
    expect(await screen.findByRole('link', { name: /Ana Souza/ })).toBeInTheDocument()
    expect(within(coluna('Fechar o mês')).getByText('1 pessoa')).toBeInTheDocument()
    expect(within(coluna('Inventário')).getByRole('link', { name: /Rui Lima/ })).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: /^Sem tarefa/ })).getByRole('link', { name: /Lucas Batista/ })).toBeInTheDocument()
  })

  it('com o backend fora, explica e deixa tentar de novo', async () => {
    popularBanco()
    servidor.use(http.get('*/api/funcionarios/listar', () => HttpResponse.error()))
    const { usuario } = renderizarApp()
    expect(await screen.findByRole('alert')).toHaveTextContent('Ele está rodando?')

    servidor.resetHandlers() // o backend "voltou"
    await usuario.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(await screen.findByRole('link', { name: /Ana Souza/ })).toBeInTheDocument()
  })

  it('o menu "Mover para" muda a pessoa de coluna', async () => {
    const { lucas } = popularBanco()
    const { usuario } = renderizarApp()
    await screen.findByRole('link', { name: /Lucas Batista/ })

    await usuario.click(screen.getByRole('button', { name: 'Mover Lucas Batista para outra tarefa' }))
    const menu = document.getElementById(`mover-${lucas.id}`)!
    await usuario.click(within(menu).getByRole('button', { name: 'Fechar o mês' }))

    expect(await within(coluna('Fechar o mês')).findByRole('link', { name: /Lucas Batista/ })).toBeInTheDocument()
    expect(await screen.findByText('Lucas Batista agora está em Fechar o mês')).toBeInTheDocument()
  })
})

describe('cadastrar e editar pessoa', () => {
  it('valida antes de enviar e barra email repetido sem chamar o servidor', async () => {
    popularBanco()
    const { usuario } = renderizarApp('/pessoa/nova')
    const g = await gaveta('Cadastrar pessoa')

    await usuario.click(within(g).getByRole('button', { name: 'Cadastrar pessoa' }))
    expect(within(g).getByText('Informe o nome.')).toBeInTheDocument()
    expect(within(g).getByLabelText('Nome')).toHaveFocus()

    await usuario.type(within(g).getByLabelText('Nome'), 'Bia Rocha')
    await usuario.type(within(g).getByLabelText('Email'), 'ANA@empresa.com.br')
    await usuario.type(within(g).getByLabelText('Cargo'), 'Designer')
    await usuario.type(within(g).getByLabelText('Idade'), '27')
    await usuario.click(within(g).getByRole('button', { name: 'Cadastrar pessoa' }))
    expect(within(g).getByText('Esse email já é de Ana Souza.')).toBeInTheDocument()
    expect(pedidos).toHaveLength(0)
  })

  it('cadastra, fecha a gaveta e põe a ficha na coluna escolhida', async () => {
    const { inventario } = popularBanco()
    const { usuario } = renderizarApp('/pessoa/nova')
    const g = await gaveta('Cadastrar pessoa')

    await usuario.type(within(g).getByLabelText('Nome'), 'Bia Rocha')
    await usuario.type(within(g).getByLabelText('Email'), 'bia@empresa.com.br')
    await usuario.type(within(g).getByLabelText('Cargo'), 'Designer')
    await usuario.type(within(g).getByLabelText('Idade'), '27')
    await usuario.selectOptions(within(g).getByLabelText('Tarefa'), 'Inventário')
    await usuario.click(within(g).getByRole('button', { name: 'Cadastrar pessoa' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(pedidos[0].corpo).toEqual({
      nome: 'Bia Rocha',
      email: 'bia@empresa.com.br',
      cargo: 'Designer',
      idade: 27,
      url_img: null,
      tarefas: { id: inventario.id },
    })
    expect(await screen.findByText('Pessoa cadastrada: Bia Rocha')).toBeInTheDocument()
    expect(await within(coluna('Inventário')).findByRole('link', { name: /Bia Rocha/ })).toBeInTheDocument()
  })

  it('editar manda o registro completo, sem perder foto, idade e tarefa', async () => {
    const { rui, inventario } = popularBanco()
    const { usuario } = renderizarApp(`/pessoa/${rui.id}`)
    const g = await gaveta('Editar pessoa')
    await waitFor(() => expect(document.title).toBe('Rui Lima — Quadro de turno'))

    const cargo = within(g).getByLabelText('Cargo')
    await usuario.clear(cargo)
    await usuario.type(cargo, 'Estoquista líder')
    await usuario.click(within(g).getByRole('button', { name: 'Salvar alterações' }))

    await waitFor(() => expect(pedidos).toHaveLength(1))
    expect(pedidos[0].corpo).toEqual({
      nome: 'Rui Lima',
      email: 'rui@empresa.com.br',
      cargo: 'Estoquista líder',
      idade: 35,
      url_img: 'https://exemplo.com/rui.png',
      tarefas: { id: inventario.id },
    })
  })

  it('link para uma pessoa que não existe explica e volta ao quadro', async () => {
    popularBanco()
    const { usuario } = renderizarApp('/pessoa/999')
    const g = await gaveta('Pessoa não encontrada')
    await usuario.click(within(g).getByRole('button', { name: 'Voltar ao quadro' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})

describe('excluir', () => {
  it('pessoa: pergunta antes, com o foco em "Manter", e exclui de vez', async () => {
    const { lucas } = popularBanco()
    const { usuario } = renderizarApp(`/pessoa/${lucas.id}`)
    const g = await gaveta('Editar pessoa')

    await usuario.click(within(g).getByRole('button', { name: 'Excluir pessoa' }))
    expect(within(g).getByText('Excluir Lucas Batista do quadro?')).toBeInTheDocument()
    expect(within(g).getByRole('button', { name: 'Manter' })).toHaveFocus()

    await usuario.click(within(g).getByRole('button', { name: 'Excluir de vez' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findByText('Lucas Batista foi excluída do quadro')).toBeInTheDocument()
    expect(banco.funcionarios.some((f) => f.id === lucas.id)).toBe(false)
    await waitFor(() => expect(screen.queryByRole('link', { name: /Lucas Batista/ })).not.toBeInTheDocument())
  })

  it('tarefa com gente: botão desativado, com o motivo', async () => {
    const { fechamento } = popularBanco()
    renderizarApp(`/tarefa/${fechamento.id}`)
    const g = await gaveta('Editar tarefa')
    expect(await within(g).findByRole('button', { name: 'Excluir tarefa' })).toBeDisabled()
    expect(within(g).getByText(/Mova a pessoa que está nela para outra tarefa antes/)).toBeInTheDocument()
  })

  it('tarefa vazia: exclui e a coluna some', async () => {
    popularBanco()
    const auditoria = criarTarefaNoBanco('Auditoria', 'alta')
    const { usuario } = renderizarApp(`/tarefa/${auditoria.id}`)
    const g = await gaveta('Editar tarefa')

    await usuario.click(await within(g).findByRole('button', { name: 'Excluir tarefa' }))
    await usuario.click(within(g).getByRole('button', { name: 'Excluir de vez' }))
    expect(await screen.findByText('Tarefa excluída: Auditoria')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Auditoria' })).not.toBeInTheDocument())
  })

  it('tarefa que ganhou gente depois de a tela abrir: 409 explicado e botão bloqueado', async () => {
    popularBanco()
    const auditoria = criarTarefaNoBanco('Auditoria', 'alta')
    const { usuario } = renderizarApp(`/tarefa/${auditoria.id}`)
    const g = await gaveta('Editar tarefa')
    await usuario.click(await within(g).findByRole('button', { name: 'Excluir tarefa' }))

    criarPessoaNoBanco({ nome: 'Zeca Dias', tarefaId: auditoria.id }) // "outro usuário"
    await usuario.click(within(g).getByRole('button', { name: 'Excluir de vez' }))

    // A mensagem aparece na confirmação e é recriada embaixo do botão quando o
    // quadro recarrega; por isso procuramos de novo a cada tentativa.
    await waitFor(() => expect(within(g).getByText(/^Esta tarefa ainda tem pessoas/)).toBeInTheDocument())
    await waitFor(() => expect(within(g).getByRole('button', { name: 'Excluir tarefa' })).toBeDisabled())
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
