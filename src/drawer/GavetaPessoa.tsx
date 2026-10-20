import { useState, type FormEvent } from 'react'
import { useParams } from 'react-router'
import type { Funcionario, Tarefa } from '../api/types'
import { infoDificuldade } from '../board/dificuldade'
import { Ficha } from '../board/Ficha'
import { useExcluirFuncionario, useSalvarFuncionario } from '../hooks/mutations'
import { useFuncionarios, useTarefas } from '../hooks/queries'
import { useAvisar } from '../ui/avisos-contexto'
import botoes from '../ui/botoes.module.css'
import { Campo } from '../ui/Campo'
import { Exclusao } from './Exclusao'
import { Gaveta } from './Gaveta'
import { useFecharGaveta } from './navegacao'
import {
  CAMPOS_PESSOA,
  dePessoa,
  paraFuncionarioInput,
  PESSOA_VAZIA,
  validarPessoa,
  type DadosPessoa,
  type Erros,
} from './validar'
import styles from './Form.module.css'

// Rota /pessoa/nova (cadastrar) e /pessoa/:id (editar).
export function GavetaPessoa() {
  const { id } = useParams()
  const funcionarios = useFuncionarios()
  const tarefas = useTarefas()
  const fechar = useFecharGaveta()

  if (funcionarios.isPending || tarefas.isPending) {
    return (
      <Gaveta titulo={id ? 'Editar pessoa' : 'Cadastrar pessoa'}>
        <p className={styles.aviso}>Carregando…</p>
      </Gaveta>
    )
  }

  if (funcionarios.isError || tarefas.isError) {
    return (
      <Gaveta titulo="Não foi possível abrir">
        <p className={styles.aviso} role="alert">
          {(funcionarios.error ?? tarefas.error)?.message}
        </p>
      </Gaveta>
    )
  }

  const atual = id ? funcionarios.data.find((f) => f.id === Number(id)) : undefined

  if (id && !atual) {
    return (
      <Gaveta titulo="Pessoa não encontrada">
        <div className={styles.aviso}>
          <p>Ninguém com o número {id} está no quadro. A ficha pode ter sido excluída.</p>
          <button type="button" className={botoes.secundario} onClick={fechar}>
            Voltar ao quadro
          </button>
        </div>
      </Gaveta>
    )
  }

  return (
    <Gaveta titulo={atual ? 'Editar pessoa' : 'Cadastrar pessoa'} aba={atual?.nome ?? undefined}>
      <FormPessoa key={id ?? 'nova'} atual={atual} todos={funcionarios.data} tarefas={tarefas.data} />
      {/* A chave zera a confirmação ao trocar de pessoa; o prefixo evita
          repetir a chave do formulário, que é irmão deste componente. */}
      {atual && <ExcluirPessoa key={`excluir-${atual.id}`} pessoa={atual} />}
    </Gaveta>
  )
}

function ExcluirPessoa({ pessoa }: { pessoa: Funcionario }) {
  const excluir = useExcluirFuncionario()
  const fechar = useFecharGaveta()
  const nome = pessoa.nome || 'esta pessoa'

  return (
    <Exclusao
      id="excluir-pessoa"
      rotulo="Excluir pessoa"
      pergunta={`Excluir ${nome} do quadro?`}
      consequencia="A ficha e os dados dela somem de vez. Não dá para desfazer."
      pendente={excluir.isPending}
      erro={excluir.error?.message}
      onConfirmar={() => excluir.mutate(pessoa, { onSuccess: fechar })}
    />
  )
}

interface Props {
  atual?: Funcionario
  todos: Funcionario[]
  tarefas: Tarefa[]
}

function FormPessoa({ atual, todos, tarefas }: Props) {
  const [dados, setDados] = useState<DadosPessoa>(() => (atual ? dePessoa(atual) : PESSOA_VAZIA))
  const [erros, setErros] = useState<Erros<keyof DadosPessoa>>({})
  // Os erros só aparecem depois da primeira tentativa de salvar; a partir
  // daí, são recalculados a cada tecla para sumirem assim que corrigidos.
  const [tentou, setTentou] = useState(false)

  const salvar = useSalvarFuncionario()
  const avisar = useAvisar()
  const fechar = useFecharGaveta()

  const tarefasOrdenadas = [...tarefas].sort((a, b) => a.id - b.id)
  const tarefaEscolhida = tarefas.find((t) => String(t.id) === dados.tarefaId)

  function mudar(campo: keyof DadosPessoa, valor: string) {
    const novo = { ...dados, [campo]: valor }
    setDados(novo)
    if (tentou) setErros(validarPessoa(novo, todos, atual?.id))
  }

  function enviar(e: FormEvent) {
    e.preventDefault()
    setTentou(true)
    const encontrados = validarPessoa(dados, todos, atual?.id)
    setErros(encontrados)
    const primeiro = CAMPOS_PESSOA.find((c) => encontrados[c])
    if (primeiro) {
      document.getElementById(`pessoa-${primeiro}`)?.focus()
      return
    }
    salvar.mutate(
      { id: atual?.id, dados: paraFuncionarioInput(dados) },
      {
        onSuccess: () => {
          avisar(atual ? 'Alterações salvas' : `Pessoa cadastrada: ${dados.nome.trim()}`)
          fechar()
        },
      },
    )
  }

  // A ficha da prévia é montada com o que está digitado agora.
  const previa: Funcionario = {
    id: atual?.id ?? 0,
    nome: dados.nome.trim() || null,
    email: null,
    cargo: dados.cargo.trim() || null,
    idade: Number(dados.idade) || 0,
    url_img: dados.url_img.trim() || null,
    tarefas: null,
  }
  const corIma = tarefaEscolhida ? infoDificuldade(tarefaEscolhida.dificuldade).cor : 'var(--neutro)'

  return (
    <form className={styles.form} onSubmit={enviar} noValidate>
      <div className={styles.previa} aria-hidden="true">
        {/* key: se a foto mudar, a ficha tenta carregar de novo */}
        <Ficha key={previa.url_img ?? ''} pessoa={previa} corIma={corIma} />
      </div>

      <Campo id="pessoa-nome" rotulo="Nome" erro={erros.nome}>
        {(p) => (
          <input {...p} value={dados.nome} onChange={(e) => mudar('nome', e.target.value)} autoComplete="off" />
        )}
      </Campo>

      <Campo id="pessoa-email" rotulo="Email" erro={erros.email}>
        {(p) => (
          <input
            {...p}
            type="email"
            value={dados.email}
            onChange={(e) => mudar('email', e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        )}
      </Campo>

      <Campo id="pessoa-cargo" rotulo="Cargo" erro={erros.cargo}>
        {(p) => <input {...p} value={dados.cargo} onChange={(e) => mudar('cargo', e.target.value)} />}
      </Campo>

      <Campo id="pessoa-idade" rotulo="Idade" erro={erros.idade}>
        {(p) => (
          <input
            {...p}
            inputMode="numeric"
            value={dados.idade}
            onChange={(e) => mudar('idade', e.target.value)}
            style={{ maxWidth: '8ch' }}
          />
        )}
      </Campo>

      <Campo id="pessoa-tarefaId" rotulo="Tarefa">
        {(p) => (
          <select {...p} value={dados.tarefaId} onChange={(e) => mudar('tarefaId', e.target.value)}>
            <option value="">Sem tarefa</option>
            {tarefasOrdenadas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome || `Tarefa ${t.id}`}
              </option>
            ))}
          </select>
        )}
      </Campo>

      <Campo
        id="pessoa-url_img"
        rotulo="Foto (opcional)"
        dica="Endereço de uma imagem na internet. Sem foto, a ficha mostra as iniciais."
        erro={erros.url_img}
      >
        {(p) => (
          <input
            {...p}
            type="url"
            value={dados.url_img}
            onChange={(e) => mudar('url_img', e.target.value)}
            placeholder="https://"
            spellCheck={false}
          />
        )}
      </Campo>

      {salvar.isError && (
        <p className={styles.erroGeral} role="alert">
          {salvar.error.message}
        </p>
      )}

      <div className={styles.acoes}>
        <button type="submit" className={botoes.primario} disabled={salvar.isPending}>
          {salvar.isPending ? 'Salvando…' : atual ? 'Salvar alterações' : 'Cadastrar pessoa'}
        </button>
        <button type="button" className={botoes.secundario} onClick={fechar}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
