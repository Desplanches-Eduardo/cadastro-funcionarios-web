// Cliente HTTP único da aplicação. Todas as chamadas passam por aqui, então
// é aqui que mora o conhecimento sobre as manias da API:
// - GET responde JSON; POST, DELETE e os erros respondem texto puro.
// - 404 e 409 trazem no corpo uma frase em português que pode ser mostrada.
// - 500 traz um JSON genérico do Spring, sem nada útil para o usuário.

const BASE = '/api'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request(method: string, path: string, body?: unknown): Promise<Response> {
  let res: Response
  try {
    res = await fetch(BASE + path, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'Não foi possível falar com o servidor em localhost:8080. Ele está rodando?')
  }

  if (res.ok) return res

  // Com o backend desligado, o proxy do Vite responde 500 sem corpo (ou 502/504).
  const texto = await res.text()
  if (res.status >= 500) {
    const backendFora = texto === '' || res.status === 502 || res.status === 504
    throw new ApiError(
      res.status,
      backendFora
        ? 'Não foi possível falar com o servidor em localhost:8080. Ele está rodando?'
        : 'O servidor recusou a operação. Confira se o email já não está cadastrado.',
    )
  }
  throw new ApiError(res.status, texto || `Erro ${res.status}`)
}

export async function getJson<T>(path: string): Promise<T> {
  const res = await request('GET', path)
  return (await res.json()) as T
}

// Para POST, PUT e DELETE. Devolve o corpo como texto; quem chama decide
// se interpreta (o PUT devolve JSON, os outros devolvem uma frase).
export async function send(method: 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown): Promise<string> {
  const res = await request(method, path, body)
  return res.text()
}
