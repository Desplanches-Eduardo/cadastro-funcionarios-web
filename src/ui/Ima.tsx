import styles from './Ima.module.css'

// O ímã redondo que segura a ficha no quadro. A cor diz a dificuldade.
export function Ima({ cor, className }: { cor: string; className?: string }) {
  return (
    <span
      className={className ? `${styles.ima} ${className}` : styles.ima}
      style={{ backgroundColor: cor }}
      aria-hidden="true"
    />
  )
}
