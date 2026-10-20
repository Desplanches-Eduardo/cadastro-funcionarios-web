import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import type { Funcionario, TarefaResumo } from '../api/types'
import { DO_QUADRO } from '../drawer/navegacao'
import { useMoverFuncionario } from '../hooks/mutations'
import { useFuncionarios, useTarefas } from '../hooks/queries'
import botoes from '../ui/botoes.module.css'
import { contarPessoas, montarQuadro } from './agrupar'
import { idAlvo, marcarFimDoArraste, resumoDe, type DadosAlvo, type DadosFicha } from './arrasto'
import { Coluna } from './Coluna'
import { infoDificuldade } from './dificuldade'
import { Ficha } from './Ficha'
import { FichaArrastavel } from './FichaArrastavel'
import styles from './Quadro.module.css'

const nomeDoAlvo = (dados: unknown) => {
  const destino = (dados as DadosAlvo | undefined)?.destino
  return destino ? destino.nome ?? 'a tarefa' : 'Sem tarefa'
}
const nomeDaFicha = (dados: unknown) => (dados as DadosFicha | undefined)?.pessoa.nome ?? 'A ficha'

// O que o leitor de tela anuncia durante um arraste (o padrão do dnd-kit é em inglês).
const anuncios: Announcements = {
  onDragStart: ({ active }) => `${nomeDaFicha(active.data.current)} foi pega.`,
  onDragOver: ({ active, over }) =>
    over ? `${nomeDaFicha(active.data.current)} está sobre ${nomeDoAlvo(over.data.current)}.` : undefined,
  onDragEnd: ({ active, over }) =>
    over ? `${nomeDaFicha(active.data.current)} foi solta em ${nomeDoAlvo(over.data.current)}.` : `${nomeDaFicha(active.data.current)} foi solta fora do quadro.`,
  onDragCancel: ({ active }) => `Arraste cancelado. ${nomeDaFicha(active.data.current)} ficou onde estava.`,
}

export function Quadro() {
  const funcionarios = useFuncionarios()
  const tarefas = useTarefas()
  const mover = useMoverFuncionario()

  // Mouse: o arraste começa depois de 6px, então um clique simples ainda abre a ficha.
  // Toque: é preciso segurar 250ms, para não brigar com a rolagem da página.
  const sensores = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
  )

  const [noAr, setNoAr] = useState<Funcionario | null>(null)
  // undefined = fora de qualquer coluna; null = sobre a bandeja.
  const [sobre, setSobre] = useState<TarefaResumo | null | undefined>(undefined)

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
  const destinos = colunas.map((c) => resumoDe(c.tarefa))

  function aoPegar(e: DragStartEvent) {
    setNoAr((e.active.data.current as DadosFicha).pessoa)
    setSobre(undefined)
  }

  function aoPassar(e: DragOverEvent) {
    setSobre(e.over ? (e.over.data.current as DadosAlvo).destino : undefined)
  }

  function aoSoltar(e: DragEndEvent) {
    setNoAr(null)
    marcarFimDoArraste()
    if (!e.over) return
    mover((e.active.data.current as DadosFicha).pessoa, (e.over.data.current as DadosAlvo).destino)
  }

  // O ímã da ficha no ar assume a cor da coluna em que ela está passando.
  const tarefaDoIma = sobre === undefined ? noAr?.tarefas ?? null : sobre
  const corNoAr = tarefaDoIma ? infoDificuldade(tarefaDoIma.dificuldade).cor : 'var(--neutro)'

  return (
    <Moldura>
      <DndContext
        sensors={sensores}
        onDragStart={aoPegar}
        onDragOver={aoPassar}
        onDragEnd={aoSoltar}
        onDragCancel={() => {
          setNoAr(null)
          marcarFimDoArraste()
        }}
        accessibility={{ announcements: anuncios }}
      >
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
              <Coluna key={c.tarefa.id} coluna={c} destinos={destinos} />
            ))}
          </div>
        )}

        <Bandeja pessoas={semTarefa} destinos={destinos} />

        {/* A cópia da ficha que acompanha o ponteiro. */}
        <DragOverlay dropAnimation={null}>
          {noAr ? (
            <div className={styles.noAr}>
              <Ficha pessoa={noAr} corIma={corNoAr} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </Moldura>
  )
}

// A calha de baixo do quadro: quem ainda não tem tarefa. Também é um alvo:
// soltar uma ficha aqui tira a pessoa da tarefa.
function Bandeja({ pessoas, destinos }: { pessoas: Funcionario[]; destinos: TarefaResumo[] }) {
  const dados: DadosAlvo = { destino: null }
  const { setNodeRef, isOver, active } = useDroppable({ id: idAlvo(null), data: dados })
  const veioDeFora = (active?.data.current as DadosFicha | undefined)?.pessoa.tarefas != null

  return (
    <section
      ref={setNodeRef}
      className={isOver && veioDeFora ? `${styles.bandeja} ${styles.alvo}` : styles.bandeja}
      aria-labelledby="sem-tarefa"
    >
      <h2 id="sem-tarefa" className={styles.bandejaTitulo}>
        Sem tarefa <span className={styles.contagem}>{contarPessoas(pessoas.length)}</span>
      </h2>
      {pessoas.length === 0 ? (
        <p className={styles.bandejaVazia}>Toda a equipe tem uma tarefa. Solte uma ficha aqui para tirar alguém da tarefa.</p>
      ) : (
        <ul className={styles.bandejaFichas}>
          {pessoas.map((p) => (
            <li key={p.id}>
              <FichaArrastavel pessoa={p} corIma="var(--neutro)" destinos={destinos} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Moldura({ children }: { children: ReactNode }) {
  return <div className={styles.moldura}>{children}</div>
}
