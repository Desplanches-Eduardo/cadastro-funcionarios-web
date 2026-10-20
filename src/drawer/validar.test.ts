import { describe, expect, it } from 'vitest'
import type { Funcionario } from '../api/types'
import { paraFuncionarioInput, validarPessoa, validarTarefa, type DadosPessoa } from './validar'

const ana: Funcionario = {
  id: 1,
  nome: 'Ana Souza',
  email: 'ana@empresa.com.br',
  cargo: 'Analista',
  idade: 28,
  url_img: null,
  tarefas: null,
}

const valido: DadosPessoa = {
  nome: 'Rui Lima',
  email: 'rui@empresa.com.br',
  cargo: 'Estoquista',
  idade: '35',
  url_img: '',
  tarefaId: '',
}

describe('validarPessoa', () => {
  it('aceita um cadastro completo', () => {
    expect(validarPessoa(valido, [ana])).toEqual({})
  })

  it('exige nome, email, cargo e idade', () => {
    const erros = validarPessoa({ nome: ' ', email: '', cargo: '', idade: '', url_img: '', tarefaId: '' }, [])
    expect(Object.keys(erros).sort()).toEqual(['cargo', 'email', 'idade', 'nome'])
  })

  it('recusa email incompleto', () => {
    expect(validarPessoa({ ...valido, email: 'rui@empresa' }, []).email).toMatch(/não parece completo/)
  })

  it('barra email repetido, sem diferenciar maiúsculas', () => {
    expect(validarPessoa({ ...valido, email: ' ANA@Empresa.com.br ' }, [ana]).email).toBe('Esse email já é de Ana Souza.')
  })

  it('deixa a própria pessoa manter o email ao editar', () => {
    expect(validarPessoa({ ...valido, email: 'ana@empresa.com.br' }, [ana], ana.id).email).toBeUndefined()
  })

  it.each(['13', '101', '30.5', 'trinta', '-20'])('recusa a idade "%s"', (idade) => {
    expect(validarPessoa({ ...valido, idade }, []).idade).toBeDefined()
  })

  it.each(['14', '100'])('aceita a idade-limite %s', (idade) => {
    expect(validarPessoa({ ...valido, idade }, []).idade).toBeUndefined()
  })

  it('foto é opcional, mas precisa ser http(s) quando informada', () => {
    expect(validarPessoa({ ...valido, url_img: 'foto.png' }, []).url_img).toBeDefined()
    expect(validarPessoa({ ...valido, url_img: 'https://exemplo.com/a.png' }, []).url_img).toBeUndefined()
  })
})

describe('paraFuncionarioInput', () => {
  it('monta o corpo completo do PUT, com a tarefa por id', () => {
    expect(paraFuncionarioInput({ ...valido, nome: '  Rui Lima ', tarefaId: '3' })).toEqual({
      nome: 'Rui Lima',
      email: 'rui@empresa.com.br',
      cargo: 'Estoquista',
      idade: 35,
      url_img: null,
      tarefas: { id: 3 },
    })
  })

  it('sem tarefa escolhida manda tarefas: null', () => {
    expect(paraFuncionarioInput(valido).tarefas).toBeNull()
  })
})

describe('validarTarefa', () => {
  it('exige nome e dificuldade', () => {
    expect(validarTarefa({ nome: '', dificuldade: '' })).toEqual({
      nome: 'Informe o nome da tarefa.',
      dificuldade: 'Escolha a dificuldade.',
    })
    expect(validarTarefa({ nome: 'Inventário', dificuldade: 'alta' })).toEqual({})
  })
})
