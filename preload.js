const { contextBridge, ipcRenderer } = require("electron");

/**
 * Script de Pré-carregamento (Preload) do FlowList
 *
 * Funcionalidade:
 * Executa em um contexto isolado antes do carregamento das páginas web.
 * Utiliza o `contextBridge` para expor uma API segura no objeto global `window`,
 * permitindo que a interface se comunique com o processo principal do Electron
 * respeitando as diretrizes de segurança (`contextIsolation: true` e `sandbox: true`).
 */

const flowlistAPI = {
  // Informações do aplicativo e do ambiente de execução
  ambiente: {
    plataforma: process.platform,
    versoes: {
      node: process.versions.node,
      chrome: process.versions.chrome,
      electron: process.versions.electron,
    },
    obterVersaoApp: () => ipcRenderer.invoke("app:obter-versao"),
    obterPlataforma: () => ipcRenderer.invoke("app:obter-plataforma"),
  },

  // Controle da janela da aplicação
  janela: {
    minimizar: () => ipcRenderer.send("janela:minimizar"),
    maximizar: () => ipcRenderer.send("janela:maximizar"),
    fechar: () => ipcRenderer.send("janela:fechar"),
    estaMaximizada: () => ipcRenderer.invoke("janela:esta-maximizada"),
  },

  // Diálogos nativos do sistema operacional
  dialogo: {
    /**
     * Exibe caixa de confirmação nativa (OK / Cancelar)
     * @param {{ mensagem: string, titulo?: string, textoConfirmar?: string, textoCancelar?: string }} opcoes
     * @returns {Promise<boolean>}
     */
    confirmar: (opcoes) => ipcRenderer.invoke("dialogo:confirmar", opcoes),

    /**
     * Exibe caixa de alerta nativa
     * @param {{ mensagem: string, titulo?: string, tipo?: 'info' | 'warning' | 'error' }} opcoes
     * @returns {Promise<boolean>}
     */
    alerta: (opcoes) => ipcRenderer.invoke("dialogo:alerta", opcoes),
  },

  // Notificações desktop nativas
  notificacao: {
    /**
     * Emite uma notificação nativa no sistema operacional
     * @param {{ titulo: string, corpo: string }} dados
     * @returns {Promise<boolean>}
     */
    exibir: (dados) => ipcRenderer.invoke("notificacao:exibir", dados),
  },
};

// Expõe a API segura no objeto global `window`
contextBridge.exposeInMainWorld("flowlistAPI", flowlistAPI);
contextBridge.exposeInMainWorld("electronAPI", flowlistAPI);

