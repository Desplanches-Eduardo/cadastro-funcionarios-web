import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router'

// Os links que abrem uma gaveta a partir do quadro mandam este estado.
// Assim, ao fechar, dá para voltar no histórico (o "voltar" do navegador
// fica coerente). Se a gaveta foi aberta por um link colado na barra de
// endereço, não há para onde voltar: vai para o quadro.
export const DO_QUADRO = { doQuadro: true }

export function useFecharGaveta() {
  const navigate = useNavigate()
  const location = useLocation()
  const veioDoQuadro = (location.state as typeof DO_QUADRO | null)?.doQuadro === true

  return useCallback(() => {
    if (veioDoQuadro) navigate(-1)
    else navigate('/', { replace: true })
  }, [navigate, veioDoQuadro])
}
