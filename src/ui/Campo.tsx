import type { ReactNode } from 'react'
import styles from './Campo.module.css'

export interface PropsControle {
  id: string
  className: string
  'aria-invalid': boolean
  'aria-describedby': string | undefined
}

interface Props {
  id: string
  rotulo: string
  erro?: string
  dica?: string
  // Recebe as props de acessibilidade já ligadas ao rótulo, à dica e ao erro,
  // e devolve o controle (input ou select).
  children: (props: PropsControle) => ReactNode
}

export function Campo({ id, rotulo, erro, dica, children }: Props) {
  const idDica = dica ? `${id}-dica` : undefined
  const idErro = erro ? `${id}-erro` : undefined
  const descricao = [idDica, idErro].filter(Boolean).join(' ') || undefined

  return (
    <div className={styles.campo}>
      <label htmlFor={id} className={styles.rotulo}>
        {rotulo}
      </label>
      {children({ id, className: styles.controle, 'aria-invalid': Boolean(erro), 'aria-describedby': descricao })}
      {dica && (
        <p id={idDica} className={styles.dica}>
          {dica}
        </p>
      )}
      {erro && (
        <p id={idErro} className={styles.erro}>
          {erro}
        </p>
      )}
    </div>
  )
}
