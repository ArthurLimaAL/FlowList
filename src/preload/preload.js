
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  menu: {
    html: () => ipcRenderer.invoke("menu:html")
  },
  app: {
    versao: () => ipcRenderer.invoke("app:versao"),
    fechar: () => ipcRenderer.invoke("app:fechar")
  }
});