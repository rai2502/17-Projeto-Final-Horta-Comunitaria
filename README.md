# Horta Comunitária — HortaViva 🌱

MVP de um aplicativo híbrido para voluntários de hortas escolares e comunitárias. O projeto permite registrar turnos de rega e outras atividades, acompanhar os canteiros por fotos e criar lembretes de cuidado.

## 1. Problema real

Voluntários de hortas escolares e comunitárias precisam registrar turnos de rega e acompanhar o crescimento dos canteiros por foto. Quando as informações ficam espalhadas em conversas ou dependem da memória de cada pessoa, a equipe pode perder o histórico dos cuidados e deixar de acompanhar a evolução das plantas.

## 2. Solução proposta

O **HortaViva** centraliza os registros da horta em uma interface simples, visual e adaptada para celular e computador. Cada voluntário pode entrar, consultar os canteiros, registrar uma atividade com observações e foto, e programar um lembrete de cuidado.

## 3. Escopo do MVP

### Funcionalidades incluídas
- **Login:** tela de entrada por e-mail e senha. Com Supabase configurado, utiliza autenticação real; sem configuração, funciona em modo demonstração local.
- **Visão geral:** indicadores, resumo dos canteiros, atividades recentes e dica de cultivo.
- **Canteiros:** listagem de canteiros com imagem, plantas, status e indicador visual de desenvolvimento; permite adicionar um canteiro durante a demonstração.
- **Diário (CRUD):** criação, listagem, busca, filtro e exclusão de registros.
- **Câmera/foto:** permite tirar ou selecionar uma foto do canteiro. No navegador, abre o seletor de arquivos/câmera do dispositivo; no app nativo, utiliza `@capacitor/camera`.
- **Notificações:** permite configurar lembrete de cuidado. No app nativo, utiliza `@capacitor/local-notifications`; no navegador, solicita permissão para notificação local.
- **Layout responsivo:** experiência mobile-first, com navegação adaptada para celular.

### Fora do MVP
- Previsão meteorológica real e sensores IoT.
- Compartilhamento público de fotos.
- Gestão avançada de permissões por equipe.
- Sincronização em tempo real e armazenamento definitivo de imagens em nuvem.

## 4. Tecnologias e recursos obrigatórios

- React + Vite
- Tailwind CSS (configurado no projeto) + CSS responsivo personalizado
- Capacitor para empacotamento híbrido
- `@capacitor/camera` — recurso nativo obrigatório de câmera
- `@capacitor/local-notifications` — recurso nativo obrigatório de notificações
- Supabase JS — autenticação e persistência opcional
- Supabase PostgreSQL com Row Level Security (RLS)
- Lucide React para ícones

## 5. Modelagem do banco de dados

Tabela: `diario_canteiros`

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | uuid | Chave primária, gerada automaticamente |
| `user_id` | uuid | Referência a `auth.users`, obrigatório |
| `canteiro` | text | Nome do canteiro, obrigatório |
| `atividade` | text | Tipo de atividade, obrigatório |
| `foto_base64` | text | Foto do registro (opcional) |
| `criado_em` | timestamptz | Data/hora automática |

O SQL completo e as políticas RLS estão em `supabase/schema.sql`.

## 6. Como executar localmente

### Pré-requisitos
- Node.js 20 ou superior
- npm
- Editor de código (ex.: VS Code)

### Instalação
1. Extraia a pasta/arquivo ZIP.
2. Abra a pasta `horta-comunitaria` no VS Code.
3. Abra o terminal na pasta do projeto.
4. Execute:

```bash
npm install
npm run dev
```

5. Acesse o endereço informado pelo Vite (normalmente `http://localhost:5173`).

**Modo demonstração:** sem configurar o Supabase, use qualquer e-mail e senha para entrar. Os registros ficam salvos no armazenamento local do navegador.

## 7. Configurar o Supabase

1. Crie um projeto no Supabase.
2. Abra o **SQL Editor** e execute todo o conteúdo de `supabase/schema.sql`.
3. Em **Project Settings → API**, copie a Project URL e a chave `anon`/publishable.
4. Faça uma cópia de `.env.example` com o nome `.env`.
5. Preencha:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLICA
```

6. No painel Supabase, habilite o provedor **Email** em Authentication e crie um usuário de teste em Authentication → Users.
7. Reinicie o Vite (`Ctrl + C` e `npm run dev`).

> A chave anon/publicável pode ser usada no front-end com RLS corretamente configurado. Nunca coloque a `service_role` no front-end. O MVP usa o modo local quando as variáveis não estão preenchidas.

## 8. Executar como aplicativo híbrido com Capacitor

Depois de instalar as dependências:

```bash
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

Para atualizar o projeto Android depois de alterar o site:

```bash
npm run build
npx cap sync android
```

A câmera e as notificações nativas são acionadas quando o app está rodando em uma plataforma Capacitor. No navegador, há alternativas web.

## 9. Jornada das telas

1. **Tela 01 — Login:** voluntário entra com e-mail e senha.
2. **Tela 02 — Evolução dos Canteiros:** painel com indicadores, fotos, progresso e atividades recentes.
3. **Tela 03 — Registrar Rega (Foto + Lembrete):** formulário para escolher canteiro e atividade, escrever observações, adicionar foto e programar notificação.

## 10. Estrutura do projeto

```text
horta-comunitaria/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── capacitor.config.json
├── .env.example
├── .gitignore
├── README.md
├── supabase/
│   └── schema.sql
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    └── lib/
        └── supabase.js
```

## 11. Repositório GitHub

Nome solicitado para o repositório:

`mvp-aluno30-hortacomunitaria`

Comandos para iniciar e enviar:

```bash
git init
git add .
git commit -m "feat: cria MVP HortaViva"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/mvp-aluno30-hortacomunitaria.git
git push -u origin main
```

Substitua `SEU-USUARIO` pelo usuário real do GitHub.

## 12. Observações para apresentação

- As fotos ilustrativas dos canteiros carregam de imagens públicas do Unsplash; é necessário estar conectado à internet para visualizá-las.
- O MVP vem com dados iniciais de demonstração para facilitar a apresentação.
- Para persistência real entre usuários, configure o Supabase e crie contas autenticadas.
- O lembrete no navegador depende da permissão de notificações e das restrições do próprio navegador; para uso mais confiável no celular, execute como app nativo com Capacitor.
