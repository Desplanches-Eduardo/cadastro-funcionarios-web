import { useDraggable } from '@dnd-kit/core'
import type { Funcionario, TarefaResumo } from '../api/types'
import { idFicha, type DadosFicha } from './arrasto'
import { Ficha } from './Ficha'
import { MoverPara } from './MoverPara'
import styles from './FichaArrastavel.module.css'

interface Props {
  pessoa: Funcionario
  corIma: string
  destinos: TarefaResumo[] // todas as tarefas, para o menu "Mover para"
}

// A ficha no quadro: pode ser arrastada para outra coluna, clicada para
// editar, ou movida pelo botão do canto (teclado e celular).
export function FichaArrastavel({ pessoa, corIma, destinos }: Props) {
  const dados: DadosFicha = { pessoa }
  // Só os listeners de ponteiro; os "attributes" do dnd-kit tornariam a ficha
  // um botão focável a mais, e o teclado já tem o link e o "Mover para".
  const { setNodeRef, listeners, isDragging } = useDraggable({ id: idFicha(pessoa.id), data: dados })

  return (
    <div ref={setNodeRef} {...listeners} className={isDragging ? `${styles.arrastavel} ${styles.origem}` : styles.arrastavel}>
      <Ficha pessoa={pessoa} corIma={corIma} para={`/pessoa/${pessoa.id}`} />
      <MoverPara pessoa={pessoa} destinos={destinos} />
    </div>
  )
}
