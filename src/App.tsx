import { useFuncionarios, useTarefas } from './hooks/queries'

// Fase 1: página crua, só para provar que o frontend conversa com a API.
// Na fase 2 ela vira o quadro de turno.
function App() {
  const funcionarios = useFuncionarios()
  const tarefas = useTarefas()

  return (
    <main style={{ padding: 16, fontFamily: 'system-ui', maxWidth: 720 }}>
      <h1>Conexão com a API</h1>

      <h2>Tarefas</h2>
      {tarefas.isPending && <p>Carregando…</p>}
      {tarefas.isError && <p role="alert">{tarefas.error.message}</p>}
      {tarefas.data && (
        <ul>
          {tarefas.data.map((t) => (
            <li key={t.id}>
              {t.nome} ({t.dificuldade}) · {t.funcionarios?.length ?? 0} pessoa(s)
            </li>
          ))}
        </ul>
      )}

      <h2>Funcionários</h2>
      {funcionarios.isPending && <p>Carregando…</p>}
      {funcionarios.isError && <p role="alert">{funcionarios.error.message}</p>}
      {funcionarios.data && (
        <ul>
          {funcionarios.data.map((f) => (
            <li key={f.id}>
              {f.nome}, {f.cargo}: {f.tarefas?.nome ?? 'sem tarefa'}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

export default App
