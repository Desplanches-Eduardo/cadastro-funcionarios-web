#!/usr/bin/env bash
# Grava tarefas e funcionários de exemplo pela própria API, do jeito que o
# frontend faria. Só roda com o banco vazio, para não duplicar nada.
# Uso: scripts/popular.sh   (com o backend rodando na 8080)

set -euo pipefail

API="${API:-http://localhost:8080}"
JSON='Content-Type: application/json'

if ! curl -s -o /dev/null "$API/tarefas/listar"; then
  echo "Backend não está respondendo em $API. Suba com: npm run api:fundo"
  exit 1
fi

if [ "$(curl -s "$API/tarefas/listar")" != "[]" ]; then
  echo "O banco já tem tarefas. Nada foi gravado."
  exit 0
fi

# O POST responde "Tarefa criada com sucesso: Nome(ID): 3"; pegamos o número.
criar_tarefa() {
  curl -s -X POST "$API/tarefas/criar" -H "$JSON" \
    -d "{\"nome\":\"$1\",\"dificuldade\":\"$2\"}" | sed -E 's/.*\(ID\): ([0-9]+).*/\1/'
}

# Argumentos: nome, email, cargo, idade, id da tarefa (vazio = sem tarefa)
criar_funcionario() {
  local tarefa='null'
  [ -n "$5" ] && tarefa="{\"id\":$5}"
  curl -s -X POST "$API/funcionarios/criar" -H "$JSON" \
    -d "{\"nome\":\"$1\",\"email\":\"$2\",\"cargo\":\"$3\",\"idade\":$4,\"url_img\":null,\"tarefas\":$tarefa}"
  echo
}

FECHAMENTO=$(criar_tarefa "Fechar o mês" "media")
INVENTARIO=$(criar_tarefa "Inventário do estoque" "alta")
ATENDIMENTO=$(criar_tarefa "Atendimento ao cliente" "baixa")
FOLHA=$(criar_tarefa "Folha de pagamento" "alta")
INTEGRACAO=$(criar_tarefa "Integração de novatos" "baixa")
AUDITORIA=$(criar_tarefa "Auditoria fiscal" "alta")
echo "Tarefas criadas: $FECHAMENTO $INVENTARIO $ATENDIMENTO $FOLHA $INTEGRACAO $AUDITORIA"
# A auditoria fica sem ninguém de propósito, para o quadro mostrar uma coluna vazia.

criar_funcionario "Ana Souza"       "ana.souza@empresa.com.br"       "Analista financeira"                 28 "$FECHAMENTO"
criar_funcionario "Bruno Teixeira"  "bruno.teixeira@empresa.com.br"  "Contador"                            41 "$FECHAMENTO"
criar_funcionario "Rui Lima"        "rui.lima@empresa.com.br"        "Estoquista"                          35 "$INVENTARIO"
criar_funcionario "Carla Menezes"   "carla.menezes@empresa.com.br"   "Supervisora de estoque"              39 "$INVENTARIO"
criar_funcionario "Diego Fonseca"   "diego.fonseca@empresa.com.br"   "Auxiliar de logística"               24 "$INVENTARIO"
criar_funcionario "Juliana Prado"   "juliana.prado@empresa.com.br"   "Atendente"                           23 "$ATENDIMENTO"
criar_funcionario "Felipe Arantes"  "felipe.arantes@empresa.com.br"  "Atendente"                           27 "$ATENDIMENTO"
criar_funcionario "Patrícia Moura"  "patricia.moura@empresa.com.br"  "Coordenadora de atendimento"         34 "$ATENDIMENTO"
criar_funcionario "Helena Castro"   "helena.castro@empresa.com.br"   "Analista de RH"                      31 "$FOLHA"
criar_funcionario "Otávio Reis"     "otavio.reis@empresa.com.br"     "Assistente de departamento pessoal"  26 "$FOLHA"
criar_funcionario "Mara Pires"      "mara.pires@empresa.com.br"      "Auxiliar administrativa"             22 "$INTEGRACAO"
criar_funcionario "Lucas Batista"   "lucas.batista@empresa.com.br"   "Estagiário"                          20 ""
criar_funcionario "Sofia Nakamura"  "sofia.nakamura@empresa.com.br"  "Designer"                            29 ""
