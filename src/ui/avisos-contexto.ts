import { createContext, useContext } from 'react'

// Função para mostrar um aviso curto no canto da tela ("Alterações salvas").
export const AvisosContexto = createContext<(texto: string) => void>(() => {})

export const useAvisar = () => useContext(AvisosContexto)
