#!/usr/bin/env bash
# Sobe o backend (Spring) com o H2 gravando em arquivo, sem alterar nada no
# repositório do backend: o application.properties lê a URL do banco da
# variável DATABASE_URL, então basta apontar para jdbc:h2:file em vez de mem.
#
# Uso:
#   scripts/backend.sh          roda neste terminal (Ctrl+C para parar)
#   scripts/backend.sh fundo    roda desligado do terminal; continua vivo
#                               quando o terminal ou a sessão fecham
#   scripts/backend.sh parar    para o backend que estiver na porta 8080
#
# O banco fica em $DADOS_DIR/cadastro.mv.db. Apagar esse arquivo zera os dados.
# AUTO_SERVER=TRUE deixa o console do H2 (ou outro programa) abrir o mesmo
# arquivo enquanto o backend está rodando.

set -euo pipefail

BACKEND_DIR="${BACKEND_DIR:-$HOME/projetos/CadastroDeFuncionarios}"
DADOS_DIR="${DADOS_DIR:-$HOME/projetos/dados-cadastro-funcionarios}"
LOG="$DADOS_DIR/backend.log"

pid_na_porta() {
  ss -ltnp 2>/dev/null | grep ':8080 ' | grep -o 'pid=[0-9]*' | cut -d= -f2 | head -1
}

case "${1:-}" in
  fundo)
    if [ -n "$(pid_na_porta)" ]; then
      echo "Já tem algo rodando na porta 8080."
      exit 0
    fi
    mkdir -p "$DADOS_DIR"
    setsid nohup "$0" > "$LOG" 2>&1 < /dev/null &
    echo "Backend subindo em segundo plano. Log em $LOG"
    for _ in $(seq 1 60); do
      if curl -s -o /dev/null http://localhost:8080/tarefas/listar; then
        echo "Pronto em http://localhost:8080"
        exit 0
      fi
      sleep 2
    done
    echo "Não respondeu em 2 minutos. Veja o log: $LOG"
    exit 1
    ;;
  parar)
    PID="$(pid_na_porta)"
    if [ -z "$PID" ]; then
      echo "Nada rodando na porta 8080."
    else
      kill "$PID"
      echo "Backend parado (pid $PID)."
    fi
    exit 0
    ;;
  "")
    ;;
  *)
    echo "Uso: $0 [fundo|parar]"
    exit 2
    ;;
esac

mkdir -p "$DADOS_DIR"
export DATABASE_URL="jdbc:h2:file:$DADOS_DIR/cadastro;AUTO_SERVER=TRUE"
export DATABASE_USERNAME=sa
export DATABASE_PASSWORD=''

cd "$BACKEND_DIR"
exec ./mvnw -q spring-boot:run
