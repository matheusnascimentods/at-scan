# CLAUDE.md — ATScan

> Guia de contexto para agentes de IA trabalhando neste repositório.
> Leia este arquivo inteiro antes de qualquer tarefa.

---

## Visão Geral do Projeto

Plataforma SaaS que analisa a compatibilidade entre currículos e descrições de vagas usando multi-agentes com Google ADK + Gemini. O usuário sobe um PDF, cola a descrição da vaga, recebe um score ATS detalhado e pode otimizar o currículo de forma interativa respondendo perguntas geradas pela IA.

Não há autenticação. A plataforma é pública e stateless — nenhuma sessão ou conta de usuário é necessária.

**Monorepo** com dois apps:
- `apps/api` — Backend NestJS (TypeScript)
- `apps/web` — Frontend Angular (TypeScript)

---

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | NestJS 11, TypeScript, `@google/adk` |
| Frontend | Angular 19, TypeScript, TailwindCSS |
| IA | Google Gemini via `@google/adk` |
| Banco | PostgreSQL + Prisma ORM |
| Validação | Zod (api e web) |
| Infra | Docker + Docker Compose |
| Package Manager | npm (workspaces) |

---

## Telas do Frontend

O frontend tem 6 telas que representam um fluxo linear de 4 steps. Os screenshots de referência ficam em `docs/screens/` e são usados também no README.

### Tela 1 — Landing Page (`/`)

> 📸 `docs/screens/01-landing.png`

Hero com headline, subtítulo e CTA "Analisar meu currículo →" que leva para `/analyzer`. Lado direito tem um mock card estático com score 78, progress bars por categoria e chips de keywords (verdes para encontradas, vermelhos para ausentes). Abaixo do hero, 3 feature cards: Análise de Keywords, Score por Seção, Otimização com IA. Header contém apenas logo — sem botão de ação, sem navegação.

### Tela 2 — Step 1: Upload do Currículo (`/analyzer`)

> 📸 `docs/screens/02-step1-upload.png`

Stepper horizontal com 4 steps no topo (Upload → Descrição → Resultado → Otimização). Dropzone com borda dashed `#003566`, ícone de documento, texto de instrução e nota sobre conversão para Markdown. Botão "Próximo →" desabilitado até o arquivo ser selecionado.

### Tela 3 — Step 2: Descrição da Vaga

> 📸 `docs/screens/03-step2-job-description.png`

Textarea full-width com contador de caracteres. Card de dica em azul claro abaixo. Botão "← Voltar" outline à esquerda, "Analisar agora" em `#FFC300` à direita. Ao clicar em analisar, botão entra em loading state com spinner.

### Tela 4 — Step 3: Resultado

> 📸 `docs/screens/04-step3-resultado.png`

Dois painéis lado a lado:

**Painel esquerdo — Score:** anel circular com o score (cor varia: vermelho < 50, amarelo 50–74, verde ≥ 75) e 4 progress bars abaixo (Keywords Match, Semântica, Formatação, Peso por Seção). Abaixo do anel, label do score e frase de contexto.

**Painel direito — Feedback:** 3 cards empilhados:
- Keywords encontradas — chips verdes
- Keywords ausentes — chips vermelhos com botão `+`
- Problemas de formatação — lista com bullets

Abaixo dos dois painéis, card full-width de Recomendações com lista ordenada por prioridade (Alta/Média/Baixa), texto da recomendação e badge de impacto estimado em pontos.

No final da página, botão centralizado "✨ Otimizar meu currículo com IA" que avança para o Step 4.

### Tela 5 — Step 4: Otimização Interativa

> 📸 `docs/screens/05-step4-otimizacao.png`

Banner de intro com fundo `#003566`. Abaixo, **todas as perguntas são exibidas de uma vez** — cada uma como um card independente com:
- Barra de acento azul na lateral esquerda
- Badge numerado (01, 02, 03, 04) e pill com o tema da pergunta
- Texto da pergunta
- Textarea com placeholder contextual

O usuário preenche as que quiser (respostas em branco são ignoradas) e clica em "✨ Gerar currículo otimizado" no rodapé. Tip em amarelo claro avisa que campos em branco são ignorados.

### Tela 6 — Step 4: Resultado da Otimização

> 📸 `docs/screens/06-step4-resultado-otimizacao.png`

Dois painéis lado a lado:

**Painel esquerdo — Comparativo:** dois anéis de score lado a lado (antes em cinza, depois em verde) com seta e badge "+X pts" entre eles.

**Painel direito — O que foi alterado:** lista de cards com seção alterada (ex: "Experiência Profissional") e descrição da mudança.

Banner de sucesso verde full-width. Dois botões: "⬇ Baixar currículo otimizado" (primário `#003566`) e "Analisar outra vaga" (outline).

---

## Estrutura de Pastas

```
.
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       ├── resumes/
│   │       │   ├── index.module.ts
│   │       │   ├── index.controller.ts
│   │       │   ├── index.controller.spec.ts   ← integração (Supertest)
│   │       │   ├── index.service.ts
│   │       │   ├── index.service.spec.ts      ← unitário
│   │       │   ├── index.schema.ts
│   │       │   └── index.schema.spec.ts       ← validação Zod isolada
│   │       ├── ats/
│   │       │   ├── index.module.ts
│   │       │   ├── index.controller.ts
│   │       │   ├── index.controller.spec.ts   ← integração (Supertest)
│   │       │   ├── index.service.ts
│   │       │   ├── index.service.spec.ts      ← unitário
│   │       │   ├── index.schema.ts
│   │       │   └── index.schema.spec.ts       ← validação Zod isolada
│   │       └── agents/
│   │           ├── index.module.ts
│   │           ├── orchestrator/
│   │           │   ├── index.agent.ts
│   │           │   ├── index.agent.spec.ts
│   │           │   └── index.prompt.md
│   │           ├── resume-parser/
│   │           │   ├── index.agent.ts
│   │           │   ├── index.agent.spec.ts
│   │           │   └── index.prompt.md
│   │           ├── job-parser/
│   │           │   ├── index.agent.ts
│   │           │   ├── index.agent.spec.ts
│   │           │   └── index.prompt.md
│   │           ├── semantic-match/
│   │           │   ├── index.agent.ts
│   │           │   ├── index.agent.spec.ts
│   │           │   └── index.prompt.md
│   │           ├── format-checker/
│   │           │   ├── index.agent.ts
│   │           │   ├── index.agent.spec.ts
│   │           │   └── index.prompt.md
│   │           ├── question-generator/
│   │           │   ├── index.agent.ts
│   │           │   ├── index.agent.spec.ts
│   │           │   └── index.prompt.md
│   │           ├── optimizer-orchestrator/
│   │           │   ├── index.agent.ts
│   │           │   ├── index.agent.spec.ts
│   │           │   └── index.prompt.md
│   │           └── resume-optimizer/
│   │               ├── index.agent.ts
│   │               ├── index.agent.spec.ts
│   │               └── index.prompt.md
│   └── web/
│       └── src/
│           ├── app/
│           │   ├── app.routes.ts
│           │   ├── app.config.ts
│           │   ├── core/
│           │   │   └── interceptors/
│           │   │       ├── index.interceptor.ts
│           │   │       └── index.interceptor.spec.ts
│           │   ├── shared/
│           │   │   └── components/
│           │   └── features/
│           │       ├── landing/
│           │       │   ├── index.component.ts
│           │       │   ├── index.component.html
│           │       │   └── index.component.spec.ts
│           │       └── analyzer/
│           │           ├── index.component.ts       ← stepper pai, controla o step ativo
│           │           ├── index.component.html
│           │           ├── index.component.spec.ts
│           │           ├── index.service.ts         ← chama a API
│           │           ├── index.service.spec.ts
│           │           ├── index.schema.ts          ← tipos do front
│           │           ├── upload/
│           │           │   ├── index.component.ts   ← step 1
│           │           │   ├── index.component.html
│           │           │   └── index.component.spec.ts
│           │           ├── job-description/
│           │           │   ├── index.component.ts   ← step 2
│           │           │   ├── index.component.html
│           │           │   └── index.component.spec.ts
│           │           ├── result/
│           │           │   ├── index.component.ts   ← step 3
│           │           │   ├── index.component.html
│           │           │   └── index.component.spec.ts
│           │           └── optimize/
│           │               ├── index.component.ts   ← step 4 (perguntas + resultado)
│           │               ├── index.component.html
│           │               └── index.component.spec.ts
│           └── environments/
│               ├── environment.ts
│               └── environment.prod.ts
├── cypress/
│   ├── e2e/
│   │   ├── full-flow.cy.ts
│   │   └── validations.cy.ts
│   └── fixtures/
│       ├── resume.pdf
│       ├── analyze-response.json
│       └── optimize-response.json
├── docs/
│   └── screens/
│       ├── 01-landing.png
│       ├── 02-step1-upload.png
│       ├── 03-step2-job-description.png
│       ├── 04-step3-resultado.png
│       ├── 05-step4-otimizacao.png
│       └── 06-step4-resultado-otimizacao.png
├── docker-compose.yml
├── package.json
├── CLAUDE.md
└── README.md
```

---

## Padrões de Código — OBRIGATÓRIOS

### 1. Convenção de nomes de arquivos: prefixo `index.`

Todo arquivo principal de um módulo ou feature começa com `index.` seguido do seu papel. O arquivo de teste **sempre acompanha o arquivo testado** com o mesmo nome + sufixo `.spec`:

```
✅ index.module.ts
✅ index.controller.ts       → index.controller.spec.ts
✅ index.service.ts          → index.service.spec.ts
✅ index.schema.ts           → index.schema.spec.ts
✅ index.component.ts        → index.component.spec.ts
✅ index.service.ts (web)    → index.service.spec.ts
✅ index.interceptor.ts      → index.interceptor.spec.ts

❌ ats.service.ts
❌ analyzer.component.ts
❌ resume.module.ts
❌ ats.service.test.ts       ← sufixo errado, use .spec.ts
❌ atsService.spec.ts        ← nome errado, use index.service.spec.ts
```

Exceção: agentes em `agents/` ficam cada um em sua própria subpasta nomeada com `kebab-case`, e os arquivos dentro seguem o padrão `index.`:

```
✅ agents/orchestrator/index.agent.ts
✅ agents/orchestrator/index.agent.spec.ts
✅ agents/orchestrator/index.prompt.md
✅ agents/resume-parser/index.agent.ts
✅ agents/resume-parser/index.prompt.md

❌ agents/orchestrator.agent.ts     ← arquivo solto, sem subpasta
❌ agents/orchestrator/prompt.md    ← nome errado, use index.prompt.md
❌ prompts/orchestrator.md          ← pasta separada de prompts não existe mais
```

### 2. Um único `index.schema.ts` por módulo

Cada módulo tem exatamente **um** `index.schema.ts` na raiz do módulo com todos os schemas Zod e todos os tipos. Nunca criar subpasta `schemas/` nem múltiplos arquivos de schema.

```typescript
// ats/index.schema.ts
import { z } from 'zod';

export const AnalyzeRequestSchema = z.object({
  resumeContent: z.string().min(100),
  jobDescription: z.string().min(50),
});

export type AnalyzeRequestDto = z.infer<typeof AnalyzeRequestSchema>;
```

### 3. Proibido criar interfaces ou types avulsos na API

Toda tipagem vem do `index.schema.ts` do módulo. Proibido declarar `interface`, `type` ou qualquer construção de tipo fora do `index.schema.ts`.

```typescript
// ❌ Proibido em qualquer arquivo da API
interface ResumePayload { content: string; }
type AnswerItem = { question: string; answer: string; };

// ✅ Correto
import { AnalyzeRequestDto } from './index.schema';
```

### 4. Funções com no máximo 30 linhas

Se ultrapassar 30 linhas, quebre em funções menores com nomes descritivos.

### 5. Convenção de nomes

| Contexto | Padrão | Exemplo |
|---|---|---|
| Arquivos de módulo/feature | `index.[papel].ts` | `index.service.ts` |
| Subpasta de agente | `kebab-case/` | `agents/resume-parser/` |
| Arquivos dentro da subpasta | `index.[papel].ts` | `index.agent.ts`, `index.prompt.md` |
| Classes | `PascalCase` | `ResumeParserAgent` |
| Funções e métodos | `camelCase` | `parseResume()` |
| Variáveis | `camelCase` | `jobDescription` |
| Constantes globais | `SCREAMING_SNAKE_CASE` | `MAX_SCORE` |
| Schemas Zod | `PascalCase` + sufixo `Schema` | `AnalyzeRequestSchema` |
| Types inferidos do Zod | `PascalCase` + sufixo `Dto` | `AnalyzeRequestDto` |
| Enums | `PascalCase` | `ScoreTier` |

### 6. Schemas Zod do projeto

| Módulo | Schema | Dto | Descrição |
|---|---|---|---|
| `resumes` | `ProcessResumeSchema` | `ProcessResumeDto` | PDF em base64 → Markdown |
| `resumes` | `ResumeResponseSchema` | `ResumeResponseDto` | Markdown processado |
| `ats` | `AnalyzeRequestSchema` | `AnalyzeRequestDto` | resumeContent + jobDescription |
| `ats` | `AnalyzeResponseSchema` | `AnalyzeResponseDto` | score + breakdown + keywords + questions[] |
| `ats` | `OptimizeRequestSchema` | `OptimizeRequestDto` | resumeContent + jobDescription + answers[] |
| `ats` | `OptimizeResponseSchema` | `OptimizeResponseDto` | optimizedContent + changes[] + scores |

---

## Banco de Dados

Sem tabela de usuários. O banco persiste apenas currículos processados pela IA, sem vínculo com conta.

### Tabela `resumes`

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `uuid` PK | Identificador único |
| `content` | `text` | Currículo em Markdown gerado pela IA |
| `createdAt` | `timestamp` | Data de criação |

> O usuário envia o PDF, a IA extrai e estrutura em Markdown. Esse Markdown é persistido e referenciado nas chamadas de análise e otimização.

### Prisma Schema

```prisma
model Resume {
  id        String   @id @default(uuid())
  content   String   @db.Text
  createdAt DateTime @default(now())
}
```

---

## Rotas da API

Base URL: `http://localhost:3000`

Nenhuma rota exige autenticação.

### Resumes

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/resumes` | Recebe PDF em base64, IA converte para Markdown e salva |
| `GET` | `/resumes/:id` | Retorna o Markdown de um currículo |

**POST /resumes**
```json
// Request
{ "fileBase64": "string — PDF codificado em base64", "fileName": "string" }

// Response 201
{ "id": "uuid", "content": "string — Markdown gerado pela IA", "createdAt": "ISO8601" }
```

**GET /resumes/:id**
```json
// Response 200
{ "id": "uuid", "content": "string", "createdAt": "ISO8601" }
```

### ATS

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/ats/analyze` | Analisa currículo vs vaga, retorna score e perguntas |
| `POST` | `/ats/optimize` | Otimiza currículo com base nas respostas do usuário |

**POST /ats/analyze**
```json
// Request
{
  "resumeContent": "string — Markdown do currículo (min 100 chars)",
  "jobDescription": "string — descrição da vaga (min 50 chars)"
}

// Response 201
{
  "score": 73,
  "breakdown": {
    "keywordsScore": 80,
    "semanticScore": 68,
    "formatScore": 90,
    "sectionScore": 55
  },
  "matchedKeywords": ["Python", "Docker", "PostgreSQL", "REST API", "Git"],
  "missingKeywords": ["Kubernetes", "Redis", "CI/CD", "AWS"],
  "formatIssues": [
    "Evite tabelas — parsers ATS não leem corretamente",
    "Informações de contato no rodapé — mova para o topo"
  ],
  "recommendations": [
    { "priority": "Alta", "text": "Adicione experiência com Kubernetes", "impact": "+6 pontos" },
    { "priority": "Alta", "text": "Inclua Redis ou caching na seção de habilidades", "impact": "+4 pontos" },
    { "priority": "Média", "text": "Mencione pipelines de CI/CD", "impact": "+3 pontos" },
    { "priority": "Baixa", "text": "Adicione TypeScript à lista de linguagens", "impact": "+2 pontos" }
  ],
  "questions": [
    {
      "tag": "Orquestração de Containers",
      "text": "Você tem experiência com Kubernetes ou orquestração de containers, mesmo que informal ou em projetos pessoais?"
    },
    {
      "tag": "Cache & Performance",
      "text": "Já utilizou Redis ou alguma solução de cache em produção? Em qual contexto?"
    },
    {
      "tag": "CI/CD & Automação",
      "text": "Você tem experiência com pipelines de CI/CD? Quais ferramentas utilizou?"
    },
    {
      "tag": "Conquistas com Números",
      "text": "Há alguma conquista mensurável que ainda não está no currículo?"
    }
  ]
}
```

> `questions[]` é gerado pelo `QuestionGeneratorAgent` com base nas `missingKeywords`. O front exibe todas de uma vez na tela de otimização. Respostas em branco são enviadas como string vazia e ignoradas pelo agente.

**POST /ats/optimize**
```json
// Request
{
  "resumeContent": "string — Markdown do currículo original",
  "jobDescription": "string — descrição da vaga",
  "answers": [
    { "tag": "Orquestração de Containers", "question": "string", "answer": "string" },
    { "tag": "Cache & Performance", "question": "string", "answer": "" }
  ]
}

// Response 201
{
  "previousScore": 73,
  "newScore": 91,
  "gain": 18,
  "optimizedContent": "string — currículo otimizado em Markdown",
  "changes": [
    {
      "section": "Experiência Profissional",
      "description": "Adicionada menção a orquestração de containers com Docker Swarm com base na resposta"
    },
    {
      "section": "Habilidades Técnicas",
      "description": "Adicionados: Redis, Kubernetes (familiar), GitHub Actions"
    }
  ]
}
```

---

## Agentes ADK

### Arquitetura

```
OrchestratorAgent
├── ResumeParserAgent       → extrai seções com peso por seção
├── JobParserAgent          → separa requisitos obrigatórios vs desejáveis
├── SemanticMatchAgent      → compara com variações semânticas
├── FormatCheckerAgent      → verifica compatibilidade com parsers ATS
└── QuestionGeneratorAgent  → gera perguntas baseadas nas missingKeywords

OptimizerOrchestratorAgent
└── ResumeOptimizerAgent    → reescreve o currículo com base na análise + respostas
```

### Regras dos agentes

- Cada agente carrega seu prompt do `index.prompt.md` que fica na **mesma subpasta** do agente (`agents/[nome]/index.prompt.md`)
- `ResumeParserAgent` e `JobParserAgent` rodam **em paralelo**
- `SemanticMatchAgent` e `FormatCheckerAgent` rodam **após** os parsers
- `QuestionGeneratorAgent` roda por último na análise — recebe `missingKeywords` e gera entre 3 e 5 perguntas com `tag` e `text`
- `ResumeOptimizerAgent` recebe: Markdown do currículo + jobDescription + `answers[]` filtrados (sem vazios) e reescreve sem inventar informações
- Nenhuma chamada ao Gemini ocorre fora de arquivos `*.agent.ts`

---

## Fluxo completo do usuário

```
[Tela 1] Landing
  → clica "Analisar meu currículo"
  → navega para /analyzer (Step 1)

[Tela 2] Step 1 — Upload
  → usuário dropa o PDF
  → front converte para base64 e chama POST /resumes
  → recebe { id, content } e armazena no estado do componente pai
  → botão "Próximo" habilita

[Tela 3] Step 2 — Descrição da Vaga
  → usuário cola a descrição
  → clica "Analisar agora"
  → front chama POST /ats/analyze com { resumeContent, jobDescription }
  → recebe AnalyzeResponseDto e armazena no estado
  → navega para Step 3

[Tela 4] Step 3 — Resultado
  → exibe score, breakdown, keywords, problemas e recomendações
  → clica "✨ Otimizar meu currículo com IA"
  → navega para Step 4

[Tela 5] Step 4 — Otimização (perguntas)
  → exibe todas as questions[] de uma vez, cada uma com textarea
  → usuário preenche as que quiser (campos em branco são válidos)
  → clica "✨ Gerar currículo otimizado"
  → front chama POST /ats/optimize com { resumeContent, jobDescription, answers[] }
  → exibe loading

[Tela 6] Step 4 — Resultado da Otimização
  → exibe score antes/depois, lista de mudanças e banner de sucesso
  → botão "⬇ Baixar currículo otimizado" faz download do optimizedContent como .md ou .docx
  → botão "Analisar outra vaga" reseta o estado e volta para Step 1
```

---

## Variáveis de Ambiente

### `apps/api/.env`

```env
DATABASE_URL="postgresql://user:password@localhost:5433/ats_db"
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-2.0-flash"
PORT=3000
NODE_ENV="development"
```

### `apps/web/src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
};
```

---

## Docker

| Profile | Serviço | Porta |
|---|---|---|
| `db` | PostgreSQL | 5433 |
| `api` | NestJS API | 3000 |
| `web` | Angular | 4200 |

```bash
# Stack completa
docker compose --profile db --profile api --profile web up -d --build

# Apenas banco (dev local)
docker compose --profile db up -d

# Derrubar e limpar volumes
docker compose --profile db --profile api --profile web down -v
```

---

## Comandos de Desenvolvimento

```bash
npm install                                          # raiz do monorepo
npm run dev:api                                      # API em modo watch
npm run dev:web                                      # Angular dev server
npm run dev                                          # ambos simultâneos
npm run --prefix apps/api prisma migrate dev         # nova migration
npm run --prefix apps/api prisma studio              # Prisma Studio
```

---

## Padrões de Projeto

- **Módulos NestJS**: cada feature é um módulo isolado (`index.module.ts`)
- **Injeção de dependência**: sempre via construtor, nunca instanciar serviços diretamente
- **Validação**: Zod na entrada de toda rota, antes de chegar ao service
- **Erros**: `HttpException` com mensagens descritivas em português
- **Async/Await**: sem `.then().catch()` encadeado — use `try/catch` explícito
- **Sem `any`**: TypeScript strict, tipos explícitos em tudo
- **Prompts**: cada agente carrega seu `index.prompt.md` via `fs.readFileSync` a partir da própria subpasta (`__dirname + '/index.prompt.md'`)
- **Estado do front**: o componente pai `analyzer/index.component.ts` é dono do estado — `resumeContent`, `jobDescription`, `analyzeResult`, `optimizeResult`. Os filhos recebem via `@Input()` e emitem via `@Output()`

---

## Testes

Ferramentas usadas:
- **API**: Jest + Supertest (integração) e Jest puro (unitário) — já vem com NestJS
- **Frontend**: Jest + Angular Testing Library para componentes; Cypress para E2E

Convenção de arquivos de teste: mesmo nome do arquivo testado com sufixo `.spec.ts`, sempre na mesma pasta.

```
resumes/index.service.ts            → resumes/index.service.spec.ts
ats/index.controller.ts             → ats/index.controller.spec.ts
agents/orchestrator/index.agent.ts  → agents/orchestrator/index.agent.spec.ts
upload/index.component.ts           → upload/index.component.spec.ts
```

Agentes **não são testados com chamadas reais ao Gemini**. Todo teste de agente usa mock do cliente ADK.

---

### API — Testes Unitários

#### `resumes/index.service.spec.ts`

| Caso | O que verificar |
|---|---|
| `processResume` — base64 válido | Chama o agente de extração, persiste no banco e retorna `{ id, content, createdAt }` |
| `processResume` — base64 inválido/corrompido | Lança `HttpException` 422 com mensagem descritiva |
| `processResume` — PDF vazio (0 bytes após decode) | Lança `HttpException` 422 |
| `processResume` — agente retorna string vazia | Lança `HttpException` 502 |
| `findById` — id existente | Retorna o resume correto do banco |
| `findById` — id inexistente | Lança `HttpException` 404 |
| `findById` — id com formato inválido (não-uuid) | Lança `HttpException` 400 |

#### `ats/index.service.spec.ts`

| Caso | O que verificar |
|---|---|
| `analyze` — inputs válidos | Chama o orquestrador, retorna AnalyzeResponseDto completo com todos os campos |
| `analyze` — `resumeContent` abaixo de 100 chars | Lança `HttpException` 400 antes de chamar agente |
| `analyze` — `jobDescription` abaixo de 50 chars | Lança `HttpException` 400 antes de chamar agente |
| `analyze` — agente retorna score 0 | Retorna normalmente (0 é score válido) com `matchedKeywords: []` |
| `analyze` — agente falha/timeout | Lança `HttpException` 502 |
| `optimize` — inputs válidos com todas as respostas preenchidas | Chama otimizador, retorna `optimizedContent` + `changes[]` + scores |
| `optimize` — `answers[]` com todos campos `answer` vazios | Chama otimizador normalmente; agente recebe array filtrado vazio e retorna currículo sem alterações significativas |
| `optimize` — mix de respostas preenchidas e vazias | Só as respostas não-vazias chegam ao agente |
| `optimize` — `newScore` menor que `previousScore` | Retorna normalmente (regressão de score é possível) |
| `optimize` — agente falha | Lança `HttpException` 502 |

---

### API — Testes de Integração (Supertest)

#### `resumes/index.controller.spec.ts`

| Endpoint | Caso | Status esperado |
|---|---|---|
| `POST /resumes` | payload válido com base64 real | 201 + body com `id`, `content`, `createdAt` |
| `POST /resumes` | sem campo `fileBase64` | 400 |
| `POST /resumes` | sem campo `fileName` | 400 |
| `POST /resumes` | `fileBase64` não é string base64 válida | 422 |
| `GET /resumes/:id` | id existente | 200 + body com `id`, `content`, `createdAt` |
| `GET /resumes/:id` | id inexistente | 404 |
| `GET /resumes/:id` | id mal formatado | 400 |

#### `ats/index.controller.spec.ts`

| Endpoint | Caso | Status esperado |
|---|---|---|
| `POST /ats/analyze` | payload válido | 201 + body com score, breakdown, keywords, questions |
| `POST /ats/analyze` | sem `resumeContent` | 400 |
| `POST /ats/analyze` | sem `jobDescription` | 400 |
| `POST /ats/analyze` | `resumeContent` com menos de 100 chars | 400 |
| `POST /ats/analyze` | `jobDescription` com menos de 50 chars | 400 |
| `POST /ats/analyze` | ambos os campos vazios | 400 |
| `POST /ats/optimize` | payload válido com answers[] preenchidos | 201 + body com previousScore, newScore, gain, optimizedContent, changes |
| `POST /ats/optimize` | payload válido com answers[] todos vazios | 201 (válido — agente decide o que fazer) |
| `POST /ats/optimize` | sem `resumeContent` | 400 |
| `POST /ats/optimize` | sem `jobDescription` | 400 |
| `POST /ats/optimize` | sem `answers` | 400 |
| `POST /ats/optimize` | `answers` não é array | 400 |
| `POST /ats/optimize` | item de `answers` sem campo `question` | 400 |

---

### API — Testes de Schema (Zod)

Testar os schemas de forma isolada, sem HTTP, para garantir que a validação funciona independente do controller.

#### `resumes/index.schema.spec.ts`

```typescript
// ProcessResumeSchema
✅ aceita { fileBase64: "abc", fileName: "cv.pdf" }
❌ rejeita sem fileBase64
❌ rejeita sem fileName
❌ rejeita fileBase64 que não é string
```

#### `ats/index.schema.spec.ts`

```typescript
// AnalyzeRequestSchema
✅ aceita resumeContent com 100+ chars e jobDescription com 50+ chars
❌ rejeita resumeContent com 99 chars
❌ rejeita jobDescription com 49 chars
❌ rejeita campos ausentes

// OptimizeRequestSchema
✅ aceita answers[] com objetos { tag, question, answer }
✅ aceita answers[] com answer vazio ("")
❌ rejeita answers que não é array
❌ rejeita item sem campo question
❌ rejeita item sem campo tag
```

---

### Frontend — Testes de Componente

#### `landing/index.component.spec.ts`

| Caso | O que verificar |
|---|---|
| Renderiza headline corretamente | Texto "Sua vaga. Seu currículo. Sua pontuação ATS." está no DOM |
| CTA navega para `/analyzer` | Click no botão dispara `router.navigate(['/analyzer'])` |
| Mock score card está visível | Elemento com score "78" renderizado |
| Header não tem botão de ação | Nenhum `<button>` dentro do `<header>` |
| 3 feature cards renderizados | `querySelectorAll('.feature-card')` retorna 3 elementos |

#### `analyzer/upload/index.component.spec.ts`

| Caso | O que verificar |
|---|---|
| Botão "Próximo" começa desabilitado | `button[disabled]` presente no DOM inicial |
| Ao selecionar arquivo, botão habilita | Simula `change` no input file → botão perde `disabled` |
| Arquivo não-PDF é rejeitado | Simula drop de `.docx` → botão permanece desabilitado e mensagem de erro aparece |
| Arquivo PDF válido emite `fileSelected` | `@Output fileSelected` emite com base64 do arquivo |
| Nome do arquivo aparece após seleção | Filename visível no DOM após seleção |
| Dropzone muda borda no dragover | Classe de highlight aplicada em `dragover`, removida em `dragleave` |

#### `analyzer/job-description/index.component.spec.ts`

| Caso | O que verificar |
|---|---|
| Contador começa em "0 caracteres" | Texto inicial do contador correto |
| Contador atualiza ao digitar | Após input com 120 chars → contador mostra "120 caracteres" |
| Botão "Analisar agora" desabilitado se textarea vazio | `button[disabled]` presente |
| Botão habilita com 50+ chars | Com texto suficiente, botão não tem `disabled` |
| Loading state ao clicar | Após click, botão exibe spinner e fica desabilitado |
| Botão "Voltar" emite `back` | Click em "← Voltar" emite `@Output back` |
| Emite `jobDescriptionSubmit` com o texto | `@Output jobDescriptionSubmit` emite o valor do textarea |

#### `analyzer/result/index.component.spec.ts`

| Caso | O que verificar |
|---|---|
| Score anel exibe valor correto | Score "73" visível no DOM via `@Input analyzeResult` |
| Cor do anel varia por threshold | score < 50 → classe `ring-red`; 50–74 → `ring-yellow`; ≥ 75 → `ring-green` |
| Progress bars renderizam com largura proporcional | `width` do fill de "Keywords" = `80%` quando keywordsScore = 80 |
| Keywords encontradas renderizam chips verdes | Chips de "Python", "Docker" com classe correta |
| Keywords ausentes renderizam chips vermelhos | Chips de "Kubernetes", "Redis" com classe correta |
| Recomendações ordenadas por prioridade | "Alta" antes de "Média", "Média" antes de "Baixa" |
| Badge de prioridade com cor correta | Alta → vermelho, Média → amarelo, Baixa → cinza |
| Botão "Otimizar" emite `optimize` | Click em "✨ Otimizar" emite `@Output optimize` |
| Problemas de formatação listados | `formatIssues[]` renderizados como bullets |

#### `analyzer/optimize/index.component.spec.ts`

| Caso | O que verificar |
|---|---|
| Todas as perguntas renderizadas de uma vez | `questions[]` via `@Input` → DOM tem N cards de perguntas |
| Badge numerado correto por card | Primeiro card tem badge "01", segundo "02" etc. |
| Pill de tag correto por card | Card de "Orquestração de Containers" exibe esse texto no pill |
| Placeholder correto por textarea | Cada textarea tem seu placeholder específico |
| Botão "Gerar currículo" habilitado mesmo com todas vazias | Não bloqueia submissão |
| Ao submeter, emite `answersSubmit` com array correto | Emite array com `{ tag, question, answer }` para cada card, incluindo vazios |
| Loading state após submit | Botão entra em estado de loading |
| Resultado renderiza score comparativo | Após `@Input optimizeResult`, painéis "Antes/Depois" visíveis |
| Gain badge exibe "+X pts" | "+18 pts" visível com cor verde |
| Changes[] listados corretamente | Cada `change` vira um card com section e description |
| Banner de sucesso visível | Elemento com classe de sucesso presente |
| Botão "Baixar" dispara download | Click em "⬇ Baixar" chama método `downloadResume()` |
| Botão "Analisar outra vaga" emite `restart` | `@Output restart` emitido, estado reseta |

#### `analyzer/index.component.spec.ts` (componente pai / stepper)

| Caso | O que verificar |
|---|---|
| Step inicial é 0 (Upload) | `activeStep === 0` no estado inicial |
| Stepper avança ao receber `fileSelected` | Após evento do filho upload, `activeStep === 1` |
| Stepper avança ao receber `jobDescriptionSubmit` | Após evento do filho job-description, `activeStep === 2` e chama `analyzeService.analyze()` |
| Stepper avança após resposta da análise | Com resultado mockado, `activeStep === 2` e `analyzeResult` preenchido |
| Stepper avança ao receber `optimize` | Após evento do filho result, `activeStep === 3` |
| `answersSubmit` chama `analyzeService.optimize()` | Método do service chamado com payload correto |
| `restart` reseta estado | `activeStep === 0`, todos os dados limpos |
| `resumeContent` propagado para filhos | Filho job-description recebe `resumeContent` via `@Input` |
| `analyzeResult` propagado para result | Filho result recebe dados via `@Input` |
| `optimizeResult` propagado para optimize | Filho optimize recebe resultado via `@Input` |

#### `analyzer/index.service.spec.ts`

| Caso | O que verificar |
|---|---|
| `uploadResume()` chama `POST /resumes` com base64 correto | HttpClient mock verifica URL e payload |
| `uploadResume()` retorna `ResumeResponseDto` | Retorno tipado corretamente |
| `analyze()` chama `POST /ats/analyze` com payload correto | URL e body corretos |
| `analyze()` retorna `AnalyzeResponseDto` | Todos os campos presentes |
| `optimize()` chama `POST /ats/optimize` com answers[] | Payload com answers incluídos |
| `optimize()` retorna `OptimizeResponseDto` | Todos os campos presentes |
| Erro HTTP 400 é relançado | Service propaga o erro sem engolir |
| Erro HTTP 502 é relançado | Service propaga o erro sem engolir |

---

### Frontend — Testes E2E (Cypress)

Os E2E cobrem o fluxo completo de ponta a ponta com a API mockada via `cy.intercept`.

#### `cypress/e2e/full-flow.cy.ts`

```
Fluxo feliz completo:
  ✅ Acessa / e vê headline
  ✅ Clica no CTA e vai para /analyzer
  ✅ Faz upload de PDF fixture
  ✅ Botão Próximo habilita
  ✅ Cola descrição de vaga
  ✅ Clica Analisar (intercept POST /ats/analyze → fixture de resposta)
  ✅ Resultado exibe score 73
  ✅ Keywords encontradas e ausentes visíveis
  ✅ Recomendações listadas com badges de prioridade
  ✅ Clica Otimizar e vai para Step 4
  ✅ 4 cards de perguntas visíveis
  ✅ Preenche 2 respostas, deixa 2 em branco
  ✅ Clica Gerar (intercept POST /ats/optimize → fixture de resposta)
  ✅ Resultado exibe score 73 → 91 e "+18 pts"
  ✅ 2 changes listados
  ✅ Clica Analisar outra vaga → volta para Step 1
```

#### `cypress/e2e/validations.cy.ts`

```
Validações e estados de erro:
  ✅ Botão Próximo desabilitado sem arquivo
  ✅ Botão Analisar desabilitado com textarea vazio
  ✅ API 400 em /ats/analyze → mensagem de erro visível no front
  ✅ API 502 em /ats/analyze → mensagem de erro genérica visível
  ✅ API 502 em /ats/optimize → mensagem de erro visível
  ✅ Score < 50 → anel vermelho
  ✅ Score 50–74 → anel amarelo
  ✅ Score ≥ 75 → anel verde
```

---

### Comandos de teste

```bash
# API — unitários e integração
npm run test --prefix apps/api

# API — com coverage
npm run test:cov --prefix apps/api

# Frontend — unitários
npm run test --prefix apps/web

# Frontend — E2E (requer API rodando ou mock)
npm run e2e --prefix apps/web
```

---

## O que NÃO fazer

- ❌ Criar módulo `auth/` ou `users/` — não há autenticação neste projeto
- ❌ Adicionar JWT, guards de rota ou qualquer middleware de auth
- ❌ Nomear arquivos sem o prefixo `index.`
- ❌ Criar arquivo de teste com sufixo `.test.ts` — use sempre `.spec.ts`
- ❌ Criar arquivo de teste com nome diferente do arquivo testado (ex: `ats.spec.ts` em vez de `index.service.spec.ts`)
- ❌ Criar arquivo de implementação sem o `.spec.ts` correspondente ao lado
- ❌ Chamar a API do Gemini em testes — sempre mockar o cliente ADK
- ❌ Criar subpasta `schemas/` dentro de módulos
- ❌ Criar mais de um `*.schema.ts` por módulo
- ❌ Declarar `interface` ou `type` fora do `index.schema.ts`
- ❌ Funções com mais de 30 linhas
- ❌ Usar `any` no TypeScript
- ❌ Lógica de negócio no controller
- ❌ Chamar o Gemini fora de um arquivo `index.agent.ts`
- ❌ Hardcodar strings de prompt — sempre carregar o `index.prompt.md` da própria subpasta via `__dirname`
- ❌ Criar pasta `prompts/` separada — o prompt mora junto do agente que o usa
- ❌ Commitar secrets ou API keys