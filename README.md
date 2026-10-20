# cadastro-funcionarios-web

Frontend do [CadastroDeFuncionarios](../CadastroDeFuncionarios), em React + Vite + TypeScript.
A ideia é um quadro de turno: cada tarefa é uma coluna e cada funcionário é uma ficha presa
nela.

## Autoria

O backend foi escrito à mão pelo autor, sem ajuda do Claude nem de outra ferramenta de IA.
Este frontend foi feito com o Claude Code, em fases revisadas pelo autor, e não alterou nada
do backend: as particularidades da API são tratadas deste lado.

## Como rodar

Precisa do Node 22+ e do Java 21. O repositório do backend fica em
`~/projetos/CadastroDeFuncionarios` (outro caminho: `BACKEND_DIR=... npm run api`).

    npm install
    npm run api:fundo     # sobe o backend em segundo plano, com o banco gravado em disco
    npm run popular       # só na primeira vez: grava tarefas e funcionários de exemplo
    npm run dev           # frontend em http://localhost:5173

`npm run api` sobe o backend no terminal atual e `npm run api:parar` para o que estiver na
porta 8080.

## Banco de dados

O backend lê a URL do banco da variável `DATABASE_URL`. O `scripts/backend.sh` aponta para um
H2 em arquivo, `~/projetos/dados-cadastro-funcionarios/cadastro.mv.db`, então os dados ficam
gravados entre uma execução e outra. Apagar esse arquivo zera o banco; a migração do Flyway
recria as tabelas na próxima subida.

O console do H2 fica em `http://localhost:8080/h2-console`. A JDBC URL a usar ali é a mesma
do script: `jdbc:h2:file:~/projetos/dados-cadastro-funcionarios/cadastro;AUTO_SERVER=TRUE`,
usuário `sa`, senha vazia.

O backend em segundo plano sobrevive ao fechamento do terminal, mas não a um reinício do
computador: depois de ligar o PC, rode `npm run api:fundo` de novo.

## Como o frontend fala com a API

O backend não libera CORS. O Vite tem um proxy (`vite.config.ts`): o navegador chama
`/api/...` na porta 5173 e o Vite repassa para `localhost:8080`, tirando o `/api`. Para
apontar para outro backend (um de teste, por exemplo): `API_URL=http://localhost:8081 npm run dev`.

Todas as chamadas passam por `src/api/client.ts`, que trata as respostas da API:

- o `POST` responde uma frase, não JSON, então depois de criar a tela recarrega a lista;
- o `PUT` grava o objeto inteiro, então toda edição envia o registro completo;
- `404` e `409` trazem uma frase em português, mostrada como está;
- `500` (email repetido, por exemplo) e backend desligado viram mensagens próprias.

## Telas

O quadro fica sempre na tela; cadastrar e editar acontecem numa gaveta lateral por cima dele.
Cada gaveta tem endereço próprio, então o voltar do navegador fecha a gaveta e um link pode
abrir uma ficha direto:

| Endereço | Gaveta |
| --- | --- |
| `/pessoa/nova` | Cadastrar pessoa |
| `/pessoa/:id` | Editar pessoa (clique na ficha) |
| `/tarefa/nova` | Criar tarefa |
| `/tarefa/:id` | Editar tarefa (clique na fita da coluna) |

O email repetido é barrado no formulário, comparando com a lista já carregada, porque o
backend responderia `500`.

## Mudar alguém de tarefa

Arrastando a ficha para outra coluna, ou para a bandeja "Sem tarefa" embaixo do quadro. O
arraste começa depois de 6px com o mouse, ou segurando a ficha por um instante no celular,
então um clique simples continua abrindo a ficha. Pelo teclado (ou sem arrastar), o botão no
canto da ficha abre a lista de tarefas; as setas andam pela lista.

A troca é otimista: a ficha muda de coluna na hora e o `PUT` vai em seguida, com o registro
completo. Se o servidor recusar, a ficha volta para onde estava e um aviso explica.

## Celular e acessibilidade

No celular as colunas ficam empilhadas e cada uma pode ser recolhida pela seta ao lado da
fita; o navegador lembra quais ficaram recolhidas (localStorage). No computador elas ficam
lado a lado, e uma sombra na borda indica que há mais colunas para rolar.

O título da aba acompanha a gaveta aberta ("Ana Souza — Quadro de turno"). A gaveta e a ficha
arrastada respeitam a preferência de movimento reduzido do sistema. As cores de texto passam no
contraste mínimo da WCAG AA, e o quadro, as gavetas e o menu passaram sem violações na
varredura do axe-core.

## Excluir

No pé da gaveta de edição. O botão vira uma pergunta dentro da própria gaveta, com o foco em
"Manter", para um Enter distraído não apagar nada. Uma tarefa só pode ser excluída vazia
(o backend responde `409` se houver alguém nela): com gente, o botão fica desativado e diz
quantas pessoas mover antes. Se o `409` vier mesmo assim, porque alguém entrou na tarefa
depois que a tela carregou, a gaveta explica e o quadro recarrega.
