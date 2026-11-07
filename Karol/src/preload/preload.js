
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  app: {
    versao: () => ipcRenderer.invoke("app:versao"),
    fechar: () => ipcRenderer.invoke("app:fechar")
  }
});