# FlowList

Aplicativo desktop de organização de tarefas, feito com Electron, HTML, CSS e JavaScript.

## Requisitos

- Node.js e npm

## Instalação e execução

Na pasta do projeto, instale as dependências e inicie o aplicativo:

```bash
npm install
npm start
```

Para verificar a sintaxe dos scripts JavaScript:

```bash
npm test
```

## Fluxo do aplicativo

1. O aplicativo abre em **Cadastro**.
2. Após o cadastro, o usuário é encaminhado ao **Login**.
3. Um login válido abre a tela **Principal**; se não houver sessão, a tela principal encaminha de volta ao login.

Os dados de usuários, sessão e tarefas são armazenados localmente no `localStorage` do aplicativo.

## Estrutura

```text
assets/images/                 Ícone do aplicativo
src/
  pages/
    cadastro/                   Página e lógica de cadastro
    login/                      Página e lógica de login
    principal/                  Tela principal e tarefas
  scripts/storage.js            Persistência local de usuários e tarefas
  styles/auth.css               Estilos compartilhados por cadastro e login
main.js                         Inicialização do Electron
preload.js                      Ponte segura (contextBridge) entre Electron e o navegador
package.json                    Dependências e comandos únicos do projeto
```

## Créditos

- Arthur Lima
- Karollayne Correia
