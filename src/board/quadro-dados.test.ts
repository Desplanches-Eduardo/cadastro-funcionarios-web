import { describe, expect, it } from 'vitest'
import { comTarefa } from '../api/funcionarios'
import type { Funcionario, Tarefa } from '../api/types'
import { contarPessoas, montarQuadro } from './agrupar'
import { chaveDificuldade, infoDificuldade } from './dificuldade'

const tarefa = (id: number, nome: string): Tarefa => ({ id, nome, dificuldade: 'media', funcionarios: null })
const pessoa = (id: number, nome: string, tarefaId: number | null): Funcionario => ({
  id,
  nome,
  email: null,
  cargo: null,
  idade: 30,
  url_img: null,
  tarefas: tarefaId == null ? null : { id: tarefaId, nome: null, dificuldade: null },
})

describe('montarQuadro', () => {
  it('agrupa por tarefa, ordena por nome e separa quem está sem tarefa', () => {
    const { colunas, semTarefa } = montarQuadro(
      [tarefa(2, 'Inventário'), tarefa(1, 'Fechar o mês')],
      [pessoa(1, 'Rui', 2), pessoa(2, 'Ana', 2), pessoa(3, 'Lucas', null), pessoa(4, 'Bia', 1)],
    )
    expect(colunas.map((c) => c.tarefa.nome)).toEqual(['Fechar o mês', 'Inventário'])
    expect(colunas[1].pessoas.map((p) => p.nome)).toEqual(['Ana', 'Rui'])
    expect(semTarefa.map((p) => p.nome)).toEqual(['Lucas'])
  })

  it('mostra a tarefa mesmo sem ninguém nela', () => {
    expect(montarQuadro([tarefa(1, 'Auditoria')], []).colunas[0].pessoas).toEqual([])
  })
})

describe('contarPessoas', () => {
  it('escreve a contagem em português', () => {
    expect([0, 1, 3].map(contarPessoas)).toEqual(['ninguém', '1 pessoa', '3 pessoas'])
  })
})

describe('dificuldade', () => {
  it.each(['media', 'Média', ' MÉDIA '])('"%s" conta como média', (valor) => {
    expect(chaveDificuldade(valor)).toBe('media')
    expect(infoDificuldade(valor)).toEqual({ rotulo: 'média', cor: 'var(--media)' })
  })

  it('valor fora do padrão aparece como veio, com ímã cinza', () => {
    expect(chaveDificuldade('urgente')).toBeNull()
    expect(infoDificuldade('urgente')).toEqual({ rotulo: 'urgente', cor: 'var(--neutro)' })
  })
})

describe('comTarefa', () => {
  it('reenvia o registro como veio, trocando só a tarefa (nulls continuam nulls)', () => {
    const p = { ...pessoa(7, 'Rui', 2), url_img: 'https://exemplo.com/rui.png' }
    expect(comTarefa(p, 5)).toEqual({ nome: 'Rui', email: null, cargo: null, idade: 30, url_img: 'https://exemplo.com/rui.png', tarefas: { id: 5 } })
    expect(comTarefa(p, null).tarefas).toBeNull()
  })
})
