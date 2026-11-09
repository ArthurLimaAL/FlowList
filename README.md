# FlowList

Aplicativo desktop feito com Electron para organizar tarefas, calendário e perfil.

## Fluxo do aplicativo

1. O aplicativo abre em **Cadastro**.
2. Após o cadastro, o usuário é encaminhado ao **Login**.
3. Um login válido abre a tela **Principal**; se não houver sessão, a tela principal encaminha de volta ao login.

# Fluxograma
![alt text](fluxograma.png)

## Armazenamento e senhas

Os dados da conta e das tarefas ficam no `localStorage` do aplicativo. As senhas novas são armazenadas com PBKDF2-SHA-256, salt aleatório e 310.000 iterações. Contas criadas com a versão anterior são atualizadas para esse formato no próximo login bem-sucedido.

Como o armazenamento é local, esta é uma proteção para um aplicativo didático, não um sistema de autenticação para dados sensíveis: alguém com acesso ao dispositivo e ao perfil local do aplicativo ainda pode inspecionar ou alterar os dados.

## Executar

```bash
npm install
npm start
```

## Requisitos

- Node.js e npm

## Alunos

- Arthur Lima
- Karollayne Correia
