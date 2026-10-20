import { Navigate, Route, Routes } from 'react-router'
import { Barra } from './board/Barra'
import { Quadro } from './board/Quadro'
import { GavetaPessoa } from './drawer/GavetaPessoa'
import { GavetaTarefa } from './drawer/GavetaTarefa'

// O quadro está sempre na tela. As rotas só decidem qual gaveta abre por cima.
function App() {
  return (
    <>
      <Barra />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Quadro />
      </main>
      <Routes>
        <Route path="/" element={null} />
        <Route path="/pessoa/nova" element={<GavetaPessoa />} />
        <Route path="/pessoa/:id" element={<GavetaPessoa />} />
        <Route path="/tarefa/nova" element={<GavetaTarefa />} />
        <Route path="/tarefa/:id" element={<GavetaTarefa />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
