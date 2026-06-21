# ATScan

![Node.js](https://img.shields.io/badge/Node.js-20+-68A063?style=for-the-badge&logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs)
![Angular](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-8E75C2?style=for-the-badge&logo=google-gemini)
![License MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge)

Analise e otimize seu currículo para vagas com IA — sem cadastro, sem fricção.

## Fluxo do Usuário

```mermaid
sequenceDiagram
    actor User
    participant Web
    participant API
    participant OrchestratorAgent
    participant ResumeParserAgent
    participant JobParserAgent
    participant SemanticMatchAgent
    participant FormatCheckerAgent
    participant QuestionGeneratorAgent
    participant OptimizerOrchestratorAgent
    participant ResumeOptimizerAgent
    participant Gemini

    %% Fluxo 1: Upload do PDF
    User->>Web: Upload PDF
    Web->>API: POST /resumes (fileBase64)
    API->>ResumeParserAgent: extrai Markdown do PDF
    ResumeParserAgent->>Gemini: processa PDF
    Gemini-->>ResumeParserAgent: Markdown estruturado
    ResumeParserAgent-->>API: { id, content }
    API-->>Web: { id, content }

    %% Fluxo 2: Análise da Vaga
    User->>Web: cola descrição da vaga + clica Analisar
    Web->>API: POST /ats/analyze (resumeContent, jobDescription)
    API->>OrchestratorAgent: inicia análise
    par Em paralelo
        OrchestratorAgent->>ResumeParserAgent: extrai seções
        OrchestratorAgent->>JobParserAgent: extrai requisitos
        ResumeParserAgent->>Gemini: processa
        JobParserAgent->>Gemini: processa
    end
    Gemini-->>OrchestratorAgent: contextos
    OrchestratorAgent->>SemanticMatchAgent: match
    OrchestratorAgent->>FormatCheckerAgent: format check
    OrchestratorAgent->>QuestionGeneratorAgent: gera perguntas
    OrchestratorAgent-->>API: AnalyzeResponseDto (score + questions[])
    API-->>Web: resultado
    Web-->>User: score, keywords, recomendações, perguntas

    %% Fluxo 3: Otimização
    User->>Web: responde perguntas + clica Gerar
    Web->>API: POST /ats/optimize (resumeContent, jobDescription, answers[])
    API->>OptimizerOrchestratorAgent: otimiza
    OptimizerOrchestratorAgent->>ResumeOptimizerAgent: reescreve currículo
    ResumeOptimizerAgent->>Gemini: gera versão otimizada
    Gemini-->>ResumeOptimizerAgent: currículo otimizado
    ResumeOptimizerAgent-->>API: OptimizeResponseDto
    API-->>Web: { newScore, optimizedContent, changes[] }
    Web-->>User: comparativo + download
```

## O Problema

Candidatos perdem oportunidades não por falta de qualificação, mas porque seus currículos não passam pelos filtros automáticos dos sistemas ATS (Applicant Tracking Systems). Esses sistemas fazem keyword matching cego e rejeitam currículos bem escritos que simplesmente não usam os termos exatos da vaga. O candidato nunca sabe o motivo da rejeição.

## A Solução

O ATScan processa o currículo em PDF e a descrição da vaga, roda uma análise ATS real com score por categoria, identifica exatamente o que está faltando e — se o usuário quiser — otimiza o currículo automaticamente com base em perguntas contextuais geradas pela IA. Tudo sem cadastro.

## Diferenciais

- **Zero fricção**: sem cadastro, sem login, sem conta
- **Score detalhado**: 4 dimensões (Keywords, Semântica, Formatação, Peso por Seção)
- **Otimização interativa**: a IA faz perguntas sobre os gaps e reescreve o currículo com base nas respostas
- **Multi-agentes especializados**: cada etapa da análise tem um agente dedicado com prompt próprio
- **ATS-safe por padrão**: o currículo gerado segue as regras de formatação que os parsers reais respeitam

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

## Telas

![Landing page com mock de score ATS](docs/screens/01-landing.png)
*Landing page com mock de score ATS*

![Step 1: upload do currículo em PDF](docs/screens/02-step1-upload.png)
*Step 1: upload do currículo em PDF*

![Step 2: descrição da vaga](docs/screens/03-step2-job-description.png)
*Step 2: descrição da vaga*

![Step 3: resultado detalhado com score e recomendações](docs/screens/04-step3-resultado.png)
*Step 3: resultado detalhado com score e recomendações*

![Step 4: perguntas de otimização geradas pela IA](docs/screens/05-step4-otimizacao.png)
*Step 4: perguntas de otimização geradas pela IA*

![Step 4: comparativo de score antes e depois](docs/screens/06-step4-resultado-otimizacao.png)
*Step 4: comparativo de score antes e depois*

## Arquitetura de Agentes

```
OrchestratorAgent
├── ResumeParserAgent       → extrai seções com peso por seção
├── JobParserAgent          → separa requisitos obrigatórios vs desejáveis
├── SemanticMatchAgent      → compara com variações semânticas
├── FormatCheckerAgent      → verifica compatibilidade com parsers ATS
└── QuestionGeneratorAgent  → gera perguntas baseadas nas keywords ausentes

OptimizerOrchestratorAgent
└── ResumeOptimizerAgent    → reescreve o currículo com base na análise + respostas
```

- Cada agente tem seu próprio `index.prompt.md` colocado na mesma subpasta do agente.
- Os agentes `ResumeParserAgent` e `JobParserAgent` rodam em paralelo.
- O `ResumeOptimizerAgent` nunca inventa informações — só reescreve com base no que o candidato confirmou nas respostas.

## Estrutura do Monorepo

```
.
├── apps/
│   ├── api/                  # Backend NestJS
│   │   ├── prisma/           # Schema e migrations
│   │   └── src/              # Módulos: resumes, ats, agents
│   └── web/                  # Frontend Angular
│       └── src/              # Features: landing, analyzer
├── cypress/                  # Testes E2E
├── docs/
│   └── screens/              # Screenshots das telas
├── docker-compose.yml
└── package.json
```

## Quick Start (Docker)

Pré-requisitos: Docker e Docker Compose v2+, Google Gemini API Key

```bash
git clone https://github.com/matheusnascimentods/atscan.git
cd atscan
cp apps/api/.env.example apps/api/.env
# edite apps/api/.env e insira sua GEMINI_API_KEY
docker compose --profile db --profile api --profile web up -d --build
```

| Serviço | URL | Porta |
|---|---|---|
| Frontend | http://localhost:4200 | 4200 |
| Backend API | http://localhost:3000 | 3000 |
| PostgreSQL | localhost:5433 | 5433 |

Para derrubar mantendo dados:
```bash
docker compose --profile db --profile api --profile web down
```

Para derrubar e limpar volumes:
```bash
docker compose --profile db --profile api --profile web down -v
```

## Rodando Localmente (sem Docker)

Pré-requisitos: Node.js v20+, PostgreSQL local (ou usar profile `db` do Docker)

```bash
npm install
# configure DATABASE_URL no apps/api/.env
npm run --prefix apps/api prisma migrate deploy
npm run dev:api   # Terminal 1
npm run dev:web   # Terminal 2
```

## API Reference

### Resumes

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/resumes` | Recebe PDF em base64, IA converte para Markdown e salva |
| `GET` | `/resumes/:id` | Retorna o Markdown de um currículo |

#### POST /resumes — Request
```json
{ "fileBase64": "string", "fileName": "string" }
```

#### POST /resumes — Response 201
```json
{ "id": "uuid", "content": "string — Markdown gerado pela IA", "createdAt": "ISO8601" }
```

### ATS

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/ats/analyze` | Analisa currículo vs vaga, retorna score e perguntas |
| `POST` | `/ats/optimize` | Otimiza currículo com base nas respostas do usuário |

#### POST /ats/analyze — Request
```json
{
  "resumeContent": "string (min 100 chars)",
  "jobDescription": "string (min 50 chars)"
}
```

#### POST /ats/analyze — Response 201
```json
{
  "score": 73,
  "breakdown": {
    "keywordsScore": 80,
    "semanticScore": 68,
    "formatScore": 90,
    "sectionScore": 55
  },
  "matchedKeywords": ["Python", "Docker", "PostgreSQL"],
  "missingKeywords": ["Kubernetes", "Redis", "CI/CD"],
  "formatIssues": ["Evite tabelas — parsers ATS não leem corretamente"],
  "recommendations": [
    { "priority": "Alta", "text": "Adicione experiência com Kubernetes", "impact": "+6 pontos" }
  ],
  "questions": [
    { "tag": "Orquestração de Containers", "text": "Você tem experiência com Kubernetes?" }
  ]
}
```

#### POST /ats/optimize — Request
```json
{
  "resumeContent": "string",
  "jobDescription": "string",
  "answers": [
    { "tag": "Orquestração de Containers", "question": "string", "answer": "string" }
  ]
}
```

#### POST /ats/optimize — Response 201
```json
{
  "previousScore": 73,
  "newScore": 91,
  "gain": 18,
  "optimizedContent": "string — currículo otimizado em Markdown",
  "changes": [
    { "section": "Habilidades Técnicas", "description": "Adicionados: Redis, Kubernetes (familiar)" }
  ]
}
```

## Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|---|---|---|
| `DATABASE_URL` | String de conexão PostgreSQL | Sim |
| `GEMINI_API_KEY` | Chave do Google AI Studio | Sim |
| `GEMINI_MODEL` | Modelo utilizado | Não (default: `gemini-2.0-flash`) |
| `PORT` | Porta da API | Não (default: `3000`) |