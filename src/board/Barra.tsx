import styles from './Barra.module.css'

function hoje(): string {
  const texto = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

// O topo da página, acima do quadro: o nome e o dia, como no alto de uma escala.
export function Barra() {
  return (
    <header className={styles.barra}>
      <h1 className={styles.titulo}>Quadro de turno</h1>
      <p className={styles.data}>{hoje()}</p>
    </header>
  )
}
