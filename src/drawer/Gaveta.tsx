import { useEffect, useRef, type ReactNode } from 'react'
import { useFecharGaveta } from './navegacao'
import styles from './Gaveta.module.css'

// Painel lateral feito com o <dialog> nativo. O showModal() já dá de graça:
// Esc para fechar, foco preso dentro do painel e o quadro atrás inativo.
// Qualquer forma de fechar (Esc, botão, clique fora) dispara o evento
// "close", e ele leva de volta ao quadro.
export function Gaveta({ titulo, children }: { titulo: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  const fechar = useFecharGaveta()

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      className={styles.gaveta}
      aria-labelledby="gaveta-titulo"
      onClose={fechar}
      onClick={(e) => {
        // O clique no fundo escurecido cai no próprio <dialog>.
        if (e.target === e.currentTarget) e.currentTarget.close()
      }}
    >
      <div className={styles.conteudo}>
        <header className={styles.topo}>
          <h2 id="gaveta-titulo" className={styles.titulo}>
            {titulo}
          </h2>
          <button type="button" className={styles.fechar} onClick={() => ref.current?.close()} aria-label="Fechar">
            ×
          </button>
        </header>
        {children}
      </div>
    </dialog>
  )
}
