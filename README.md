# Teste Técnico Korp ERP — Sistema de Emissão de Notas Fiscais
**Stack:** Angular 17 · ASP.NET Core 10 (C#) · SQLite · Docker

---

## Sumário

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Estrutura do Repositório](#estrutura-do-repositório)
- [Pré-requisitos](#pré-requisitos)
- [Como Rodar](#como-rodar)
  - [Opção 1 — Docker (recomendado)](#opção-1--docker-recomendado)
  - [Opção 2 — Desenvolvimento local](#opção-2--desenvolvimento-local)
- [Endpoints das APIs](#endpoints-das-apis)
- [Detalhamento Técnico](#detalhamento-técnico)
- [Funcionalidades](#funcionalidades)
- [Requisitos Implementados](#requisitos-implementados)

---

## Visão Geral

Sistema completo de emissão de Notas Fiscais desenvolvido como teste técnico para a Korp ERP. A aplicação é composta por dois microsserviços C# independentes e um frontend Angular que os consome.

| Camada | Tecnologia | Porta |
|---|---|---|
| Frontend | Angular 17 + Angular Material | 4200 |
| Microsserviço de Estoque | ASP.NET Core 10 | 5106 |
| Microsserviço de Faturamento | ASP.NET Core 10 | 5000 |
| Banco de Dados | SQLite (um por serviço) | — |

---

## Arquitetura

```
┌──────────────────────────────────────────┐
│           Angular 17 (SPA)               │
│         http://localhost:4200            │
│  ┌──────────────┐  ┌───────────────────┐ │
│  │   Produtos   │  │   Notas Fiscais   │ │
│  └──────┬───────┘  └────────┬──────────┘ │
└─────────┼───────────────────┼────────────┘
          │ HTTP/REST          │ HTTP/REST
          ▼                    ▼
┌──────────────────┐  ┌──────────────────────────┐
│  EstoqueService  │◄─│    FaturamentoService     │
│  :5106           │  │    :5000                  │
│  estoque.db      │  │    faturamento.db         │
└──────────────────┘  └──────────────────────────┘
```

O **FaturamentoService** se comunica com o **EstoqueService** via HTTP para:
- Validar saldo antes de criar uma nota
- Debitar o estoque ao imprimir/fechar uma nota

Cada serviço tem seu próprio banco SQLite isolado (padrão *Database-per-Service*).

---

## Estrutura do Repositório

```
Korp_Teste_DaviCorreia/
│
├── backend/
│   ├── EstoqueService/          # Microsserviço de produtos e estoque
│   │   ├── Controllers/
│   │   ├── Data/                # DbContext (EF Core + SQLite)
│   │   ├── DTOs/
│   │   ├── Middleware/          # Tratamento global de exceções
│   │   ├── Models/
│   │   ├── Services/
│   │   ├── Dockerfile
│   │   ├── EstoqueService.csproj
│   │   ├── Program.cs
│   │   └── appsettings.json     # Porta: 5001
│   │
│   └── FaturamentoService/      # Microsserviço de notas fiscais
│       ├── Controllers/
│       ├── Data/
│       ├── DTOs/
│       ├── Middleware/          # Inclui tratamento de HTTP 503
│       ├── Models/
│       ├── Services/            # EstoqueClient com Polly (retry + circuit breaker)
│       ├── Dockerfile
│       ├── FaturamentoService.csproj
│       ├── Program.cs
       └── appsettings.json     # Porta: 5000
│
├── korp-nota-fiscal/
│   └── frontend/                # Aplicação Angular 17 (standalone)
│       ├── src/
│       │   ├── app/
│       │   │   ├── components/
│       │   │   │   ├── produtos/
│       │   │   │   └── notas-fiscais/
│       │   │   ├── interceptors/ # Tratamento global de erros HTTP
│       │   │   ├── models/
│       │   │   ├── services/    # BehaviorSubject + RxJS
│       │   │   ├── app.component.ts
│       │   │   ├── app.config.ts
│       │   │   └── app.routes.ts
│       │   ├── environments/
│       │   └── styles.scss
│       ├── angular.json
│       ├── package.json
│       └── tsconfig.json
│
├── MicroservicesKorp.sln        # Solution Visual Studio (EstoqueService + FaturamentoService)
├── docker-compose.yml           # Orquestração dos dois microsserviços
└── .gitignore
```

---

## Pré-requisitos

### Para rodar com Docker

| Ferramenta | Versão mínima |
|---|---|
| Docker | 24.x |
| Docker Compose | v2 (`docker compose`) |

### Para rodar localmente (sem Docker)

| Ferramenta | Versão mínima | Download |
|---|---|---|
| .NET SDK | **10.0** | https://dotnet.microsoft.com/download |
| Node.js | 20.x | https://nodejs.org |
| Angular CLI | 17.x | `npm i -g @angular/cli` |

---

## Como Rodar

### Opção 1 — Docker (recomendado)

Sobe os dois microsserviços automaticamente em containers isolados:

```bash
# 1. Clone o repositório
git clone https://github.com/davicorreia-dev/Korp_Teste_DaviCorreia.git
cd Korp_Teste_DaviCorreia

# 2. Sobe os serviços em background
docker compose up --build -d

# Verificar se os containers estão saudáveis
docker compose ps

# Ver logs em tempo real
docker compose logs -f
```

Os serviços estarão disponíveis em:
- EstoqueService: http://localhost:5106/swagger
- FaturamentoService: http://localhost:5000/swagger

```bash
# 3. Em outro terminal, sobe o frontend
cd korp-nota-fiscal/frontend
npm install
ng serve
```

Acesse: **http://localhost:4200**

```bash
# Parar os containers
docker compose down

# Parar e remover volumes (apaga os bancos de dados)
docker compose down -v
```

> **💡 Testar cenário de falha:** Para simular o EstoqueService indisponível:
> ```bash
> docker compose stop estoque-service
> ```
> Ao tentar imprimir uma nota, o Polly fará retry automático e, após esgotar as tentativas, retornará HTTP 503 com mensagem amigável no frontend.

---

### Opção 2 — Desenvolvimento local

Requer .NET 10 SDK, Node.js e Angular CLI instalados.

#### Backend — EstoqueService

```bash
cd backend/EstoqueService
dotnet run
```

Aguarde a mensagem `Now listening on: http://localhost:5106`.
O banco `estoque.db` é criado automaticamente na primeira execução.

Swagger UI: http://localhost:5106/swagger

#### Backend — FaturamentoService

Abra um **novo terminal**:

```bash
cd backend/FaturamentoService
dotnet run
```

Aguarde a mensagem `Now listening on: http://localhost:5000`.
O banco `faturamento.db` é criado automaticamente.

Swagger UI: http://localhost:5002/swagger

> **⚠️ Ordem importante:** O EstoqueService deve estar rodando antes do FaturamentoService, pois ele será consultado na inicialização de operações com notas fiscais.

#### Frontend — Angular

Abra um **terceiro terminal**:

```bash
cd korp-nota-fiscal/frontend
npm install
ng serve
```

Acesse: **http://localhost:4200**

#### Usando a Solution (.sln) no Visual Studio

O arquivo `MicroservicesKorp.sln` na raiz do repositório permite abrir ambos os projetos C# de uma vez no Visual Studio 2022:

```
Abrir Visual Studio → File → Open → Project/Solution → MicroservicesKorp.sln
```

Configure os projetos de inicialização múltipla:
> Botão direito na Solution → `Set Startup Projects` → `Multiple startup projects` → Definir **EstoqueService** e **FaturamentoService** como `Start`

---

## Endpoints das APIs

### EstoqueService — `http://localhost:5106`

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/produtos` | Lista todos os produtos |
| `GET` | `/api/produtos/{id}` | Obtém produto por ID |
| `POST` | `/api/produtos` | Cria novo produto |
| `PUT` | `/api/produtos/{id}` | Atualiza produto |
| `DELETE` | `/api/produtos/{id}` | Remove produto |
| `PATCH` | `/api/produtos/{id}/saldo` | Atualiza saldo (usado pelo FaturamentoService) |

### FaturamentoService — `http://localhost:5000`

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/notasfiscais` | Lista todas as notas |
| `GET` | `/api/notasfiscais/{id}` | Obtém nota por ID |
| `POST` | `/api/notasfiscais` | Cria nova nota (status: Aberta) |
| `POST` | `/api/notasfiscais/{id}/imprimir` | Imprime, debita estoque e fecha a nota |

---

## Detalhamento Técnico

### Ciclos de vida Angular utilizados

| Componente | Ciclos | Motivo |
|---|---|---|
| `ListaProdutosComponent` | `ngOnInit`, `ngAfterViewInit`, `ngOnDestroy` | Carga inicial; conectar `MatSort`/`MatPaginator` pós-render; cancelar subscriptions |
| `ListaNotasComponent` | `ngOnInit`, `ngAfterViewInit`, `ngOnDestroy` | Idem + controle do spinner por linha de impressão |
| `FormProdutoComponent` | `ngOnInit` | Inicializar formulário reativo e preencher campos no modo edição |
| `FormNotaComponent` | `ngOnInit`, `ngOnDestroy` | Carga de produtos e inicialização do `FormArray` dinâmico |

### Uso de RxJS

| Operator | Finalidade |
|---|---|
| `BehaviorSubject` | Estado reativo das listas; componentes recebem atualizações automáticas |
| `tap()` | Efeito colateral pós-HTTP: atualiza o `BehaviorSubject` sem quebrar o stream |
| `takeUntil(destroy$)` | Cancela subscrições no `ngOnDestroy` — evita memory leaks |
| `finalize()` | Desativa spinners independente de sucesso ou erro |
| `switchMap()` | Encadeamento de Observables; cancela requisição anterior se nova chegar |
| `catchError()` | Captura erros HTTP no interceptor global, exibe via `MatSnackBar` |
| `throwError()` | Re-emite o erro após tratamento para que componentes possam reagir |

### Frameworks e bibliotecas

#### Backend (C#)

| Biblioteca | Finalidade |
|---|---|
| **ASP.NET Core 10** | Framework principal: roteamento, DI nativa, middleware pipeline |
| **Entity Framework Core 10 + SQLite** | ORM com banco embarcado, sem servidor externo |
| **Microsoft.Extensions.Http.Resilience** | Polly integrado: retry, circuit breaker e timeout via `AddStandardResilienceHandler()` |
| **Swashbuckle (Swagger)** | Documentação e interface de teste interativa das APIs |

#### Frontend (Angular)

| Biblioteca | Finalidade |
|---|---|
| **Angular 17** | Framework SPA com standalone components (sem NgModule) |
| **Angular Material 17** | Componentes visuais: tabelas, dialogs, forms, chips, snackbars, etc. |
| **RxJS 7.8** | Programação reativa e gerenciamento de estado |

### Tratamento de erros no backend

Middleware centralizado (`ExceptionMiddleware`) em cada serviço. Respostas sempre em JSON padronizado: `{ error, statusCode, timestamp }`.

```
ServicoIndisponivelException  →  HTTP 503 Service Unavailable
ArgumentException             →  HTTP 400 Bad Request
InvalidOperationException     →  HTTP 400 Bad Request
KeyNotFoundException          →  HTTP 404 Not Found
Exception (genérica)          →  HTTP 500 Internal Server Error
```

### Uso de LINQ (C#)

LINQ é usado extensivamente via EF Core em todas as queries:

```csharp
// Projeção + ordenação
_context.Produtos.AsNoTracking().OrderBy(p => p.Codigo).Select(p => new ProdutoDto(...))

// Verificar duplicata sem carregar entidade
_context.Produtos.AnyAsync(p => p.Codigo == dto.Codigo)

// Numeração sequencial de notas
_context.NotasFiscais.MaxAsync(n => n.Numero) + 1

// Eager loading de relacionamentos
_context.NotasFiscais.Include(n => n.Itens).OrderByDescending(n => n.Numero)

// Detectar produtos duplicados na nota (em memória)
dto.Itens.GroupBy(i => i.ProdutoId).Where(g => g.Count() > 1)
```

---

## Funcionalidades

### ✅ Cadastro de Produtos
- Criar produto com **Código único** (convertido automaticamente para maiúsculas), **Descrição** e **Saldo**
- Editar descrição e saldo via dialog
- Excluir produto com confirmação
- Listagem ordenável por coluna com paginação
- Indicador visual de saldo baixo (≤ 5, em amarelo) e zerado (em vermelho)

### ✅ Cadastro de Notas Fiscais
- Criar nota com **numeração sequencial automática** e status inicial **Aberta**
- Adicionar múltiplos produtos com quantidades em um `FormArray` dinâmico
- Validação de saldo em tempo real (impede quantidade maior que o estoque)
- Prevenção de produtos duplicados na mesma nota (validator customizado a nível de `FormGroup`)
- Resumo com **saldo projetado** após emissão

### ✅ Impressão de Notas Fiscais
- Botão de impressão visível e intuitivo na listagem
- **Spinner individual** por linha durante o processamento
- Após impressão: status muda automaticamente para **Fechada**
- Notas com status `Fechada` não podem ser reimprimir (botão desabilitado com tooltip explicativo)
- Saldo dos produtos debitado automaticamente no EstoqueService
- Abertura do diálogo de impressão nativo do browser

---

## Requisitos Implementados

| Requisito | Status | Detalhe |
|---|---|---|
| Cadastro de Produtos | ✅ | CRUD completo com validações |
| Cadastro de Notas Fiscais | ✅ | Numeração sequencial, múltiplos itens |
| Impressão com spinner | ✅ | Spinner por botão de linha na tabela |
| Status Aberta → Fechada | ✅ | Atualizado após impressão bem-sucedida |
| Bloquear reimpressão | ✅ | Botão desabilitado para notas Fechadas |
| Débito de saldo | ✅ | Saldo atualizado no EstoqueService via HTTP |
| Microsserviços (mínimo 2) | ✅ | EstoqueService + FaturamentoService |
| Banco de dados real | ✅ | SQLite com EF Core (1 banco por serviço) |
| Tratamento de falhas | ✅ | Polly retry + circuit breaker + HTTP 503 com feedback ao usuário |
| LINQ no C# | ✅ | Extensivamente em todas as queries EF Core |

---