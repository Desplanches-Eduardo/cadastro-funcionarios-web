import { Barra } from './board/Barra'
import { Quadro } from './board/Quadro'

function App() {
  return (
    <>
      <Barra />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Quadro />
      </main>
    </>
  )
}

export default App
