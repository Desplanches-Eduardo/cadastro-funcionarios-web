import { useCallback, useState } from 'react'

// Quais colunas a pessoa recolheu no celular. Fica no navegador dela
// (localStorage), só como conveniência: se o armazenamento falhar, tudo
// continua funcionando com as colunas abertas.
const CHAVE = 'quadro:colunas-recolhidas'

function ler(): number[] {
  try {
    const valor = JSON.parse(localStorage.getItem(CHAVE) ?? '[]')
    return Array.isArray(valor) ? valor.filter((n) => typeof n === 'number') : []
  } catch {
    return []
  }
}

function gravar(ids: number[]) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(ids))
  } catch {
    // Sem armazenamento (aba anônima, por exemplo): só não lembra.
  }
}

export function useColunaRecolhida(tarefaId: number) {
  const [recolhida, setRecolhida] = useState(() => ler().includes(tarefaId))

  const alternar = useCallback(() => {
    setRecolhida((atual) => {
      const ids = ler().filter((id) => id !== tarefaId)
      gravar(atual ? ids : [...ids, tarefaId])
      return !atual
    })
  }, [tarefaId])

  return [recolhida, alternar] as const
}
