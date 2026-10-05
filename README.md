# ❤️ LoveNote

> Um espaço digital privado e colaborativo para casais organizarem juntos suas tarefas, listas, anotações e planejamentos.

O **LoveNote** é um web app desenvolvido para facilitar a organização de atividades e informações compartilhadas entre duas pessoas.

A proposta é oferecer um ambiente privado onde ambos os usuários possam **criar, editar e acompanhar informações simultaneamente**, com sincronização em tempo real.

---

## 📌 Sobre o projeto

Muitas ferramentas de produtividade são projetadas para uso individual ou para equipes grandes. O LoveNote busca oferecer uma experiência mais simples e personalizada para **duas pessoas que compartilham rotina, compromissos e planos**.

O aplicativo permite que os usuários mantenham um workspace compartilhado para:

* 📝 Anotações
* ✅ Tarefas
* 🛒 Listas de compras
* 📋 Listas personalizadas
* ✈️ Planejamento de viagens
* 🎯 Metas
* 📅 Planejamentos
* 💡 Ideias
* 🔔 Atividades recentes

O principal diferencial do projeto é a **colaboração em tempo real**.

Se um usuário realizar uma alteração, o outro recebe a atualização automaticamente, sem precisar recarregar a página.

---

## ✨ Funcionalidades

### 👤 Autenticação

* Cadastro de usuários
* Login
* Logout
* Recuperação de senha
* Persistência da sessão
* Autenticação utilizando Supabase Auth

### 💑 Workspace compartilhado

Cada casal possui um workspace privado.

O acesso é restrito aos membros vinculados ao workspace.

O segundo usuário pode entrar utilizando um **código de convite**.

### 🔄 Sincronização em tempo real

As alterações são sincronizadas utilizando **Supabase Realtime**.

Eventos suportados:

* `INSERT`
* `UPDATE`
* `DELETE`

Exemplo:

```text
Usuário A
    ↓
Cria uma tarefa
    ↓
Supabase
    ↓
Realtime
    ↓
Usuário B
    ↓
Tarefa aparece automaticamente
```

### 📝 Anotações

Permite criar e editar anotações compartilhadas.

Cada anotação possui informações como:

* Título
* Conteúdo
* Autor
* Data de criação
* Data de atualização
* Último usuário que realizou uma alteração

### ✅ Tarefas

As tarefas podem possuir:

* Título
* Descrição
* Status
* Prioridade
* Data de vencimento
* Responsável

Exemplo:

```text
☐ Reservar restaurante
☐ Comprar presente
☑ Comprar ingressos
```

### 🛒 Listas colaborativas

Permite criar listas personalizadas, como:

* Lista de compras
* Lista de viagem
* Lista de filmes
* Lista de tarefas
* Lista de desejos

Os itens podem ser adicionados, editados, concluídos ou removidos.

### 📅 Planejamentos

Área destinada à organização de eventos e planos.

Exemplos:

* Viagens
* Planejamento semanal
* Eventos
* Compromissos
* Metas

### 📊 Dashboard

O dashboard apresenta uma visão geral do workspace:

* Tarefas pendentes
* Tarefas concluídas
* Listas recentes
* Anotações recentes
* Próximos planejamentos
* Atividades recentes

### 🕒 Histórico de atividades

Registra ações importantes realizadas pelos usuários.

Exemplo:

```text
Artur criou a lista "Compras".

Maria adicionou "Leite" à lista.

Artur marcou "Comprar ingresso" como concluído.
```

### 🟢 Presença online

Quando disponível, o sistema pode indicar quando o outro usuário está conectado ao workspace.

---

# 🏗️ Arquitetura

O projeto utiliza uma arquitetura baseada em frontend React conectado aos serviços do Supabase.

```text
┌──────────────────────┐
│      Usuário A       │
│      Navegador       │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│      React App       │
│    TypeScript        │
│      Tailwind        │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│       Supabase       │
├──────────────────────┤
│ Authentication       │
│ PostgreSQL           │
│ Realtime             │
│ Row Level Security   │
└──────────┬───────────┘
           │
           │ Realtime
           ▼
┌──────────────────────┐
│      Usuário B       │
│      Navegador       │
└──────────────────────┘
```

---

# 🛠️ Tecnologias

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS

## Backend / BaaS

* Supabase
* PostgreSQL
* Supabase Auth
* Supabase Realtime

## Segurança

* Row Level Security (RLS)
* Políticas de acesso por workspace
* Autenticação baseada em sessão

## Deploy

* Vercel
* Supabase

---

# 🗄️ Estrutura do banco

A estrutura principal do banco é organizada em entidades relacionadas ao workspace.

```text
profiles
   │
   ▼
workspace_members
   │
   ▼
workspaces
   │
   ├──────────────┐
   │              │
   ▼              ▼
lists           tasks
   │
   ▼
list_items

workspaces
   │
   ├── notes
   ├── plans
   ├── activities
   └── invite_codes
```

### Principais tabelas

| Tabela              | Descrição                                          |
| ------------------- | -------------------------------------------------- |
| `profiles`          | Informações públicas dos usuários                  |
| `workspaces`        | Espaços compartilhados dos casais                  |
| `workspace_members` | Relação entre usuários e workspaces                |
| `invite_codes`      | Códigos utilizados para convidar o segundo usuário |
| `lists`             | Listas compartilhadas                              |
| `list_items`        | Itens pertencentes às listas                       |
| `tasks`             | Tarefas                                            |
| `notes`             | Anotações                                          |
| `plans`             | Planejamentos                                      |
| `activities`        | Histórico de atividades                            |

---

# 🔐 Segurança

A segurança é aplicada diretamente no banco de dados através do **Row Level Security (RLS)**.

O frontend não é responsável por garantir sozinho o isolamento dos dados.

As políticas garantem que:

```text
Usuário
   ↓
É membro do workspace?
   ↓
SIM ──► Pode acessar os dados
   │
   NÃO
   ↓
Acesso negado
```

Dessa forma, um usuário não consegue acessar informações pertencentes a outro workspace apenas manipulando requisições no frontend.

---

# ⚡ Realtime

O LoveNote utiliza o **Supabase Realtime** para sincronização entre os usuários.

Quando ocorre uma alteração no banco:

```text
INSERT
UPDATE
DELETE
```

o Supabase transmite o evento para os clientes conectados.

Isso permite experiências como:

```text
Artur adiciona:
"Comprar leite"

          ↓

Banco de dados

          ↓

Supabase Realtime

          ↓

Celular da namorada

          ↓

"Comprar leite" aparece
automaticamente
```

Não é necessário atualizar a página.

---

# 📱 Responsividade

O projeto foi pensado para funcionar em diferentes dispositivos:

* 💻 Desktop
* 💻 Notebook
* 📱 Smartphone
* 📲 Tablet

A interface utiliza uma abordagem **mobile-first**, adaptando a navegação e os componentes para telas menores.

---

# 📲 PWA

O projeto possui suporte à arquitetura **Progressive Web App (PWA)**.

A proposta é permitir que o aplicativo possa ser instalado diretamente no dispositivo, proporcionando uma experiência semelhante à de um aplicativo nativo.

Recursos planejados:

* Manifest
* Ícone do aplicativo
* Instalação no dispositivo
* Tela standalone
* Configurações específicas para mobile

---

# 🚀 Como executar o projeto

## Pré-requisitos

Antes de começar, tenha instalado:

* Node.js
* npm
* Git

Verifique as versões:

```bash
node --version
npm --version
git --version
```

---

## 1. Clonar o repositório

```bash
git clone https://github.com/SEU-USUARIO/LOVENOTE.git
```

Entre na pasta:

```bash
cd LOVENOTE
```

---

## 2. Instalar dependências

```bash
npm install
```

---

## 3. Configurar o Supabase

Crie um projeto no Supabase e obtenha:

```text
Project URL
Anon/Public Key
```

Crie um arquivo:

```text
.env
```

Adicione:

```env
VITE_SUPABASE_URL=sua_url
VITE_SUPABASE_ANON_KEY=sua_chave
```

### ⚠️ Importante

Nunca coloque chaves privadas ou secrets do Supabase no frontend.

O arquivo `.env` deve estar incluído no `.gitignore`.

---

# 🗃️ Configuração do banco

Os scripts SQL necessários estão disponíveis no diretório:

```text
supabase/
└── migrations/
```

Execute as migrations no projeto Supabase.

As migrations são responsáveis por criar:

* tabelas;
* relacionamentos;
* índices;
* constraints;
* funções;
* triggers;
* políticas RLS.

---

# ▶️ Executando localmente

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

O Vite disponibilizará a aplicação em um endereço semelhante a:

```text
http://localhost:5173
```

---

# 🧪 Testando o Realtime

Para verificar a colaboração em tempo real:

### 1. Abra o aplicativo em uma janela

Faça login com o primeiro usuário.

### 2. Abra o aplicativo em outra janela ou dispositivo

Faça login com o segundo usuário.

### 3. Entre no mesmo workspace

Crie uma lista em um dispositivo.

### 4. Verifique o outro dispositivo

A alteração deverá aparecer automaticamente.

Teste:

* criação;
* edição;
* conclusão;
* exclusão.

---

# 📁 Estrutura do projeto

Uma estrutura aproximada:

```text
lovenote/
│
├── public/
│
├── src/
│   ├── components/
│   ├── contexts/
│   ├── hooks/
│   ├── layouts/
│   ├── lib/
│   ├── pages/
│   ├── services/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
│
├── supabase/
│   └── migrations/
│
├── .env.example
├── .gitignore
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

# 🌐 Deploy

## Frontend

O frontend pode ser hospedado utilizando a **Vercel**.

Fluxo:

```text
GitHub
   ↓
Vercel
   ↓
Build
   ↓
Aplicação online
```

Configure na Vercel as mesmas variáveis de ambiente utilizadas localmente:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

---

## Backend

O backend e banco de dados permanecem hospedados no:

**Supabase**

Isso permite que o frontend hospedado na Vercel continue utilizando:

* PostgreSQL;
* Authentication;
* Realtime;
* RLS.

---

# 🗺️ Roadmap

## MVP

* [x] Estrutura inicial
* [x] React + TypeScript
* [x] Supabase
* [ ] Autenticação
* [ ] Workspace
* [ ] Sistema de convite
* [ ] Listas
* [ ] Itens de listas
* [ ] Realtime
* [ ] RLS

## Versão 1.0

* [ ] Tarefas
* [ ] Anotações
* [ ] Planejamentos
* [ ] Dashboard
* [ ] Histórico de atividades
* [ ] Modo escuro
* [ ] PWA
* [ ] Presença online

## Futuras versões

* [ ] Calendário compartilhado
* [ ] Notificações
* [ ] Upload de imagens
* [ ] Anexos
* [ ] Comentários
* [ ] Lembretes
* [ ] Metas compartilhadas
* [ ] Orçamento do casal
* [ ] Estatísticas
* [ ] Aplicativo mobile dedicado

---

# 💡 Possíveis evoluções

O projeto foi pensado para ser extensível.

Algumas funcionalidades que podem ser adicionadas futuramente:

### 📅 Calendário

Permitir que os dois usuários compartilhem eventos e compromissos.

### 🔔 Notificações

Notificar o usuário quando:

* uma tarefa for atribuída;
* uma atividade importante acontecer;
* um prazo estiver próximo.

### 💰 Finanças

Criar um espaço para planejamento financeiro compartilhado:

* despesas;
* receitas;
* orçamento;
* metas financeiras.

### 📸 Memórias

Permitir armazenar:

* fotos;
* momentos especiais;
* datas importantes;
* viagens.

### 🤖 Inteligência artificial

Futuramente, o projeto poderá utilizar IA para:

* organizar tarefas;
* gerar planejamentos;
* resumir anotações;
* sugerir divisão de tarefas;
* auxiliar no planejamento de viagens.

---

# 🎯 Objetivos técnicos

Além de ser uma ferramenta de uso pessoal, o projeto tem como objetivo servir como estudo e prática de conceitos de desenvolvimento de software, incluindo:

* Desenvolvimento frontend moderno
* TypeScript
* Arquitetura de aplicações web
* Bancos de dados relacionais
* Autenticação
* Autorização
* Row Level Security
* Comunicação em tempo real
* APIs
* Desenvolvimento responsivo
* PWA
* Deploy
* Git e GitHub

---

# 🤝 Contribuição

Este é inicialmente um projeto pessoal.

Sugestões e melhorias são bem-vindas.

Para contribuir:

```bash
git clone https://github.com/SEU-USUARIO/LOVENOTE.git
```

Crie uma branch:

```bash
git checkout -b feature/minha-feature
```

Faça suas alterações e envie um Pull Request.

---

# 👨‍💻 Desenvolvedor

Desenvolvido por **Artur Machado**.

Projeto criado com o objetivo de desenvolver uma ferramenta de organização colaborativa e, ao mesmo tempo, explorar tecnologias modernas de desenvolvimento web.

---

## ❤️ LoveNote

**Duas pessoas. Um espaço. Tudo organizado em conjunto.**
