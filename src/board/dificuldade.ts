// A dificuldade é texto livre no backend. O frontend reconhece três valores
// e dá uma cor de ímã a cada um; qualquer outro aparece como veio, em cinza.

export interface InfoDificuldade {
  rotulo: string
  cor: string // variável CSS do ímã
}

const CONHECIDAS: Record<string, InfoDificuldade> = {
  baixa: { rotulo: 'baixa', cor: 'var(--baixa)' },
  media: { rotulo: 'média', cor: 'var(--media)' },
  alta: { rotulo: 'alta', cor: 'var(--alta)' },
}

export function infoDificuldade(valor: string | null): InfoDificuldade {
  if (!valor) return { rotulo: 'sem dificuldade', cor: 'var(--neutro)' }
  // "Média", "media" e "MÉDIA" contam como o mesmo valor.
  const chave = valor
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
  return CONHECIDAS[chave] ?? { rotulo: valor, cor: 'var(--neutro)' }
}
