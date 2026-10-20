import { useDroppable } from '@dnd-kit/core'
import { Link } from 'react-router'
import type { TarefaResumo } from '../api/types'
import { DO_QUADRO } from '../drawer/navegacao'
import { Ima } from '../ui/Ima'
import { contarPessoas, type ColunaDoQuadro } from './agrupar'
import { idAlvo, resumoDe, type DadosAlvo, type DadosFicha } from './arrasto'
import { infoDificuldade } from './dificuldade'
import { FichaArrastavel } from './FichaArrastavel'
import styles from './Coluna.module.css'
import fita from './Fita.module.css'

interface Props {
  coluna: ColunaDoQuadro
  destinos: TarefaResumo[]
}

// Uma tarefa no quadro: a fita do rotulador no topo, a dificuldade e quem está nela.
// A coluna inteira é um alvo onde se pode soltar uma ficha.
export function Coluna({ coluna, destinos }: Props) {
  const { tarefa, pessoas } = coluna
  const dificuldade = infoDificuldade(tarefa.dificuldade)
  const tituloId = `tarefa-${tarefa.id}`

  const dados: DadosAlvo = { destino: resumoDe(tarefa) }
  const { setNodeRef, isOver, active } = useDroppable({ id: idAlvo(tarefa.id), data: dados })
  // Só destaca se a ficha vier de outra coluna; soltar na própria não muda nada.
  const veioDeFora = (active?.data.current as DadosFicha | undefined)?.pessoa.tarefas?.id !== tarefa.id

  // Cada fita sai um pouco torta, como coladas à mão; o ângulo vem do id
  // para não mudar a cada recarga.
  const inclinacao = ((tarefa.id % 3) - 1) * 0.6

  return (
    <section
      ref={setNodeRef}
      className={isOver && veioDeFora ? `${styles.coluna} ${styles.alvo}` : styles.coluna}
      aria-labelledby={tituloId}
    >
      <header className={styles.cabecalho}>
        <h2 id={tituloId} className={styles.titulo}>
          <Link
            to={`/tarefa/${tarefa.id}`}
            state={DO_QUADRO}
            className={fita.fita}
            style={{ rotate: `${inclinacao}deg` }}
            title="Editar tarefa"
          >
            {tarefa.nome || 'Tarefa sem nome'}
          </Link>
        </h2>
        <p className={styles.resumo}>
          <span className={styles.dificuldade}>
            <Ima cor={dificuldade.cor} />
            {dificuldade.rotulo}
          </span>
          <span>{contarPessoas(pessoas.length)}</span>
        </p>
      </header>

      {pessoas.length === 0 ? (
        <p className={styles.vazia}>Ninguém nesta tarefa. Arraste uma ficha para cá.</p>
      ) : (
        <ul className={styles.fichas}>
          {pessoas.map((p) => (
            <li key={p.id}>
              <FichaArrastavel pessoa={p} corIma={dificuldade.cor} destinos={destinos} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
