import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { DO_QUADRO } from '../drawer/navegacao'
import { useFuncionarios, useTarefas } from '../hooks/queries'
import botoes from '../ui/botoes.module.css'
import { contarPessoas, montarQuadro } from './agrupar'
import { Coluna } from './Coluna'
import { Ficha } from './Ficha'
import styles from './Quadro.module.css'

export function Quadro() {
  const funcionarios = useFuncionarios()
  const tarefas = useTarefas()

  if (funcionarios.isPending || tarefas.isPending) {
    return (
      <Moldura>
        <p className={styles.aviso}>Carregando o quadro…</p>
      </Moldura>
    )
  }

  if (funcionarios.isError || tarefas.isError) {
    const erro = funcionarios.error ?? tarefas.error
    return (
      <Moldura>
        <div className={styles.aviso} role="alert">
          <p>{erro?.message}</p>
          <button
            type="button"
            className={botoes.primario}
            onClick={() => {
              void funcionarios.refetch()
              void tarefas.refetch()
            }}
          >
            Tentar de novo
          </button>
        </div>
      </Moldura>
    )
  }

  const { colunas, semTarefa } = montarQuadro(tarefas.data, funcionarios.data)

  return (
    <Moldura>
      {colunas.length === 0 ? (
        <div className={styles.aviso}>
          <p>Nenhuma tarefa no quadro. Crie a primeira para começar a escalar a equipe.</p>
          <Link to="/tarefa/nova" state={DO_QUADRO} className={botoes.primario}>
            Criar tarefa
          </Link>
        </div>
      ) : (
        <div className={styles.colunas}>
          {colunas.map((c) => (
            <Coluna key={c.tarefa.id} coluna={c} />
          ))}
        </div>
      )}

      {/* A calha de baixo do quadro: quem ainda não tem tarefa. */}
      <section className={styles.bandeja} aria-labelledby="sem-tarefa">
        <h2 id="sem-tarefa" className={styles.bandejaTitulo}>
          Sem tarefa <span className={styles.contagem}>{contarPessoas(semTarefa.length)}</span>
        </h2>
        {semTarefa.length === 0 ? (
          <p className={styles.bandejaVazia}>Toda a equipe tem uma tarefa.</p>
        ) : (
          <ul className={styles.bandejaFichas}>
            {semTarefa.map((p) => (
              <li key={p.id}>
                <Ficha pessoa={p} corIma="var(--neutro)" para={`/pessoa/${p.id}`} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </Moldura>
  )
}

function Moldura({ children }: { children: ReactNode }) {
  return <div className={styles.moldura}>{children}</div>
}
