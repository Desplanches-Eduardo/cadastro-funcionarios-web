import { useState, type FormEvent } from 'react'
import { useParams } from 'react-router'
import type { Tarefa } from '../api/types'
import { chaveDificuldade, infoDificuldade } from '../board/dificuldade'
import fita from '../board/Fita.module.css'
import { useSalvarTarefa } from '../hooks/mutations'
import { useTarefas } from '../hooks/queries'
import { useAvisar } from '../ui/avisos-contexto'
import botoes from '../ui/botoes.module.css'
import { Campo } from '../ui/Campo'
import { Ima } from '../ui/Ima'
import { Gaveta } from './Gaveta'
import { useFecharGaveta } from './navegacao'
import { paraTarefaInput, validarTarefa, type DadosTarefa, type Erros } from './validar'
import styles from './Form.module.css'

const DIFICULDADES = ['baixa', 'media', 'alta']

// Rota /tarefa/nova (criar) e /tarefa/:id (editar).
export function GavetaTarefa() {
  const { id } = useParams()
  const tarefas = useTarefas()
  const fechar = useFecharGaveta()

  if (tarefas.isPending) {
    return (
      <Gaveta titulo={id ? 'Editar tarefa' : 'Criar tarefa'}>
        <p className={styles.aviso}>Carregando…</p>
      </Gaveta>
    )
  }

  if (tarefas.isError) {
    return (
      <Gaveta titulo="Não foi possível abrir">
        <p className={styles.aviso} role="alert">
          {tarefas.error.message}
        </p>
      </Gaveta>
    )
  }

  const atual = id ? tarefas.data.find((t) => t.id === Number(id)) : undefined

  if (id && !atual) {
    return (
      <Gaveta titulo="Tarefa não encontrada">
        <div className={styles.aviso}>
          <p>Não há tarefa com o número {id} no quadro. Ela pode ter sido excluída.</p>
          <button type="button" className={botoes.secundario} onClick={fechar}>
            Voltar ao quadro
          </button>
        </div>
      </Gaveta>
    )
  }

  return (
    <Gaveta titulo={atual ? 'Editar tarefa' : 'Criar tarefa'}>
      <FormTarefa key={id ?? 'nova'} atual={atual} />
    </Gaveta>
  )
}

function FormTarefa({ atual }: { atual?: Tarefa }) {
  const [dados, setDados] = useState<DadosTarefa>({
    nome: atual?.nome ?? '',
    dificuldade: chaveDificuldade(atual?.dificuldade ?? null) ?? atual?.dificuldade ?? '',
  })
  const [erros, setErros] = useState<Erros<keyof DadosTarefa>>({})
  const [tentou, setTentou] = useState(false)

  const salvar = useSalvarTarefa()
  const avisar = useAvisar()
  const fechar = useFecharGaveta()

  // Uma tarefa antiga pode ter uma dificuldade fora das três conhecidas
  // (o backend aceita qualquer texto). Ela entra como opção para não se perder.
  const opcoes =
    atual?.dificuldade && !chaveDificuldade(atual.dificuldade) ? [...DIFICULDADES, atual.dificuldade] : DIFICULDADES

  function mudar(campo: keyof DadosTarefa, valor: string) {
    const novo = { ...dados, [campo]: valor }
    setDados(novo)
    if (tentou) setErros(validarTarefa(novo))
  }

  function enviar(e: FormEvent) {
    e.preventDefault()
    setTentou(true)
    const encontrados = validarTarefa(dados)
    setErros(encontrados)
    if (encontrados.nome) {
      document.getElementById('tarefa-nome')?.focus()
      return
    }
    if (encontrados.dificuldade) {
      document.querySelector<HTMLInputElement>('input[name="dificuldade"]')?.focus()
      return
    }
    salvar.mutate(
      { id: atual?.id, dados: paraTarefaInput(dados) },
      {
        onSuccess: () => {
          avisar(atual ? 'Alterações salvas' : `Tarefa criada: ${dados.nome.trim()}`)
          fechar()
        },
      },
    )
  }

  const previaDificuldade = dados.dificuldade ? infoDificuldade(dados.dificuldade) : null

  return (
    <form className={styles.form} onSubmit={enviar} noValidate>
      <div className={`${styles.previa} ${styles.previaTarefa}`} aria-hidden="true">
        <span className={fita.fita}>{dados.nome.trim() || 'Nome da tarefa'}</span>
        {previaDificuldade && (
          <span className={styles.previaDificuldade}>
            <Ima cor={previaDificuldade.cor} />
            {previaDificuldade.rotulo}
          </span>
        )}
      </div>

      <Campo id="tarefa-nome" rotulo="Nome da tarefa" erro={erros.nome}>
        {(p) => <input {...p} value={dados.nome} onChange={(e) => mudar('nome', e.target.value)} autoComplete="off" />}
      </Campo>

      <fieldset className={styles.grupo} aria-describedby={erros.dificuldade ? 'tarefa-dificuldade-erro' : undefined}>
        <legend className={styles.legenda}>Dificuldade</legend>
        <div className={styles.opcoes}>
          {opcoes.map((valor) => {
            const info = infoDificuldade(valor)
            return (
              <label key={valor} className={styles.opcao}>
                <input
                  type="radio"
                  name="dificuldade"
                  value={valor}
                  className={styles.oculto}
                  checked={dados.dificuldade === valor}
                  onChange={() => mudar('dificuldade', valor)}
                />
                <Ima cor={info.cor} />
                {info.rotulo}
              </label>
            )
          })}
        </div>
        {erros.dificuldade && (
          <p id="tarefa-dificuldade-erro" className={styles.erroGrupo}>
            {erros.dificuldade}
          </p>
        )}
      </fieldset>

      {salvar.isError && (
        <p className={styles.erroGeral} role="alert">
          {salvar.error.message}
        </p>
      )}

      <div className={styles.acoes}>
        <button type="submit" className={botoes.primario} disabled={salvar.isPending}>
          {salvar.isPending ? 'Salvando…' : atual ? 'Salvar alterações' : 'Criar tarefa'}
        </button>
        <button type="button" className={botoes.secundario} onClick={fechar}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
