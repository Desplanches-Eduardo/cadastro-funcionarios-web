import { Link } from 'react-router'
import { DO_QUADRO } from '../drawer/navegacao'
import { Ima } from '../ui/Ima'
import { contarPessoas, type ColunaDoQuadro } from './agrupar'
import { infoDificuldade } from './dificuldade'
import { Ficha } from './Ficha'
import styles from './Coluna.module.css'
import fita from './Fita.module.css'

// Uma tarefa no quadro: a fita do rotulador no topo, a dificuldade e quem está nela.
export function Coluna({ coluna }: { coluna: ColunaDoQuadro }) {
  const { tarefa, pessoas } = coluna
  const dificuldade = infoDificuldade(tarefa.dificuldade)
  const tituloId = `tarefa-${tarefa.id}`

  // Cada fita sai um pouco torta, como coladas à mão; o ângulo vem do id
  // para não mudar a cada recarga.
  const inclinacao = ((tarefa.id % 3) - 1) * 0.6

  return (
    <section className={styles.coluna} aria-labelledby={tituloId}>
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
        <p className={styles.vazia}>Ninguém nesta tarefa ainda.</p>
      ) : (
        <ul className={styles.fichas}>
          {pessoas.map((p) => (
            <li key={p.id}>
              <Ficha pessoa={p} corIma={dificuldade.cor} para={`/pessoa/${p.id}`} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
