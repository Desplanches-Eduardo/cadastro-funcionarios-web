import { useEffect, useRef, useState } from 'react'
import botoes from '../ui/botoes.module.css'
import styles from './Exclusao.module.css'

interface Props {
  id: string
  rotulo: string // "Excluir pessoa"
  pergunta: string // "Excluir Ana Souza do quadro?"
  consequencia: string // "A ficha e os dados dela somem de vez."
  bloqueio?: string // se houver, o botão fica desativado e o texto explica por quê
  pendente: boolean
  erro?: string
  onConfirmar: () => void
}

// O fim da gaveta de edição. O botão vira uma pergunta, em vez de usar o
// confirm() do navegador, e o foco vai para "Manter": um Enter distraído
// não apaga nada.
export function Exclusao({ id, rotulo, pergunta, consequencia, bloqueio, pendente, erro, onConfirmar }: Props) {
  const [confirmando, setConfirmando] = useState(false)
  const manterRef = useRef<HTMLButtonElement>(null)
  const excluirRef = useRef<HTMLButtonElement>(null)
  const idBloqueio = `${id}-bloqueio`
  const idPergunta = `${id}-pergunta`

  useEffect(() => {
    if (confirmando) manterRef.current?.focus()
  }, [confirmando])

  function manter() {
    setConfirmando(false)
    // Devolve o foco ao botão que abriu a pergunta.
    requestAnimationFrame(() => excluirRef.current?.focus())
  }

  return (
    <section className={styles.exclusao} aria-label={rotulo}>
      {confirmando && !bloqueio ? (
        <div className={styles.confirmacao} role="group" aria-labelledby={idPergunta}>
          <p id={idPergunta} className={styles.pergunta}>
            {pergunta}
          </p>
          <p className={styles.consequencia}>{consequencia}</p>
          {erro && (
            <p className={styles.erro} role="alert">
              {erro}
            </p>
          )}
          <div className={styles.acoes}>
            <button type="button" className={botoes.perigoForte} onClick={onConfirmar} disabled={pendente}>
              {pendente ? 'Excluindo…' : 'Excluir de vez'}
            </button>
            <button ref={manterRef} type="button" className={botoes.secundario} onClick={manter}>
              Manter
            </button>
          </div>
        </div>
      ) : (
        <>
          <button
            ref={excluirRef}
            type="button"
            className={botoes.perigo}
            disabled={Boolean(bloqueio)}
            aria-describedby={bloqueio ? idBloqueio : undefined}
            onClick={() => setConfirmando(true)}
          >
            {rotulo}
          </button>
          {bloqueio && (
            <p id={idBloqueio} className={styles.bloqueio}>
              {bloqueio}
            </p>
          )}
          {erro && (
            <p className={styles.erro} role="alert">
              {erro}
            </p>
          )}
        </>
      )}
    </section>
  )
}
