import { useEffect, useRef, useState } from 'react'
import type { Funcionario, TarefaResumo } from '../api/types'
import { useMoverFuncionario } from '../hooks/mutations'
import { Ima } from '../ui/Ima'
import { infoDificuldade } from './dificuldade'
import styles from './MoverPara.module.css'

const LARGURA_MENU = 232 // igual ao CSS; usado para posicionar antes de abrir

// Botão no canto da ficha que abre a lista de tarefas. É o jeito de mover
// alguém sem arrastar: pelo teclado, por leitor de tela ou no celular.
// O menu usa o Popover nativo: fecha com Esc ou clique fora, sozinho.
export function MoverPara({ pessoa, destinos }: { pessoa: Funcionario; destinos: TarefaResumo[] }) {
  const mover = useMoverFuncionario()
  const botaoRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [aberto, setAberto] = useState(false)
  const idMenu = `mover-${pessoa.id}`
  const nome = pessoa.nome ?? 'esta pessoa'
  const atual = pessoa.tarefas?.id ?? null

  // O Popover abre no meio da tela por padrão; colocamos embaixo do botão.
  useEffect(() => {
    const menu = menuRef.current
    if (!menu) return
    const antesDeAbrir = (e: Event) => {
      const estado = (e as ToggleEvent).newState
      setAberto(estado === 'open')
      if (estado !== 'open' || !botaoRef.current) return
      const r = botaoRef.current.getBoundingClientRect()
      const esquerda = Math.min(r.right - LARGURA_MENU, window.innerWidth - LARGURA_MENU - 8)
      menu.style.left = `${Math.max(8, esquerda)}px`
      // Abre para o lado com mais espaço (perto do rodapé, abre para cima)
      // e nunca passa da borda da tela; se faltar altura, a lista rola.
      const espacoAbaixo = window.innerHeight - r.bottom - 12
      const espacoAcima = r.top - 12
      if (espacoAbaixo >= 220 || espacoAbaixo >= espacoAcima) {
        menu.style.top = `${r.bottom + 4}px`
        menu.style.bottom = 'auto'
        menu.style.maxHeight = `${Math.min(360, espacoAbaixo)}px`
      } else {
        menu.style.top = 'auto'
        menu.style.bottom = `${window.innerHeight - r.top + 4}px`
        menu.style.maxHeight = `${Math.min(360, espacoAcima)}px`
      }
    }
    menu.addEventListener('beforetoggle', antesDeAbrir)
    return () => menu.removeEventListener('beforetoggle', antesDeAbrir)
  }, [])

  const opcoes: { chave: string; destino: TarefaResumo | null }[] = [
    ...destinos.filter((t) => t.id !== atual).map((t) => ({ chave: String(t.id), destino: t })),
    ...(atual == null ? [] : [{ chave: 'sem', destino: null }]),
  ]

  return (
    <>
      <button
        ref={botaoRef}
        type="button"
        className={aberto ? `${styles.botao} ${styles.aberto}` : styles.botao}
        popoverTarget={idMenu}
        aria-label={`Mover ${nome} para outra tarefa`}
        title="Mover para outra tarefa"
      >
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
          <path d="M4 7h11m0 0-3-3m3 3-3 3M16 13H5m0 0 3-3m-3 3 3 3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div ref={menuRef} id={idMenu} popover="auto" className={styles.menu}>
        <p className={styles.titulo}>Mover {nome} para</p>
        {/* Setas e Home/End andam pelas opções, além do Tab. */}
        <ul
          className={styles.lista}
          onKeyDown={(e) => {
            const botoes = [...e.currentTarget.querySelectorAll('button')]
            const atualIdx = botoes.indexOf(document.activeElement as HTMLButtonElement)
            const alvo = {
              ArrowDown: botoes[(atualIdx + 1) % botoes.length],
              ArrowUp: botoes[(atualIdx - 1 + botoes.length) % botoes.length],
              Home: botoes[0],
              End: botoes[botoes.length - 1],
            }[e.key]
            if (alvo) {
              e.preventDefault()
              alvo.focus()
            }
          }}
        >
          {opcoes.map(({ chave, destino }) => (
            <li key={chave}>
              <button
                type="button"
                className={styles.opcao}
                onClick={() => {
                  menuRef.current?.hidePopover()
                  mover(pessoa, destino)
                }}
              >
                <Ima cor={destino ? infoDificuldade(destino.dificuldade).cor : 'var(--neutro)'} />
                {destino ? destino.nome || `Tarefa ${destino.id}` : 'Sem tarefa'}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
