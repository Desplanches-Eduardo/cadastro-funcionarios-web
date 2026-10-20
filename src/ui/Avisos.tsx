import { useCallback, useState, type ReactNode } from 'react'
import { AvisosContexto } from './avisos-contexto'
import styles from './Avisos.module.css'

interface Aviso {
  id: number
  texto: string
}

const DURACAO_MS = 4000

let proximoId = 1

// Os avisos aparecem como tiras de rotulador no canto de baixo e somem sozinhos.
// A região é aria-live, então leitores de tela anunciam o texto.
export function AvisosProvider({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([])

  const avisar = useCallback((texto: string) => {
    const id = proximoId++
    setAvisos((lista) => [...lista, { id, texto }])
    setTimeout(() => setAvisos((lista) => lista.filter((a) => a.id !== id)), DURACAO_MS)
  }, [])

  return (
    <AvisosContexto.Provider value={avisar}>
      {children}
      <div className={styles.avisos} role="status" aria-live="polite">
        {avisos.map((a) => (
          <p key={a.id} className={styles.aviso}>
            {a.texto}
          </p>
        ))}
      </div>
    </AvisosContexto.Provider>
  )
}
