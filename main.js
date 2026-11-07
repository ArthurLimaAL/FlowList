const { app, BrowserWindow, ipcMain, dialog, Notification } = require("electron");
const path = require("node:path");

function registrarHandlersIpc() {
  // Informações da aplicação
  ipcMain.handle("app:obter-versao", () => app.getVersion());
  ipcMain.handle("app:obter-plataforma", () => process.platform);

  // Controle da janela
  ipcMain.on("janela:minimizar", (evento) => {
    const win = BrowserWindow.fromWebContents(evento.sender);
    if (win) win.minimize();
  });

  ipcMain.on("janela:maximizar", (evento) => {
    const win = BrowserWindow.fromWebContents(evento.sender);
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
    }
  });

  ipcMain.on("janela:fechar", (evento) => {
    const win = BrowserWindow.fromWebContents(evento.sender);
    if (win) win.close();
  });

  ipcMain.handle("janela:esta-maximizada", (evento) => {
    const win = BrowserWindow.fromWebContents(evento.sender);
    return win ? win.isMaximized() : false;
  });

  // Diálogos nativos
  ipcMain.handle("dialogo:confirmar", async (evento, opcoes = {}) => {
    const win = BrowserWindow.fromWebContents(evento.sender);
    const config = {
      type: "question",
      buttons: [opcoes.textoCancelar || "Cancelar", opcoes.textoConfirmar || "Confirmar"],
      defaultId: 1,
      cancelId: 0,
      title: opcoes.titulo || "FlowList",
      message: opcoes.mensagem || "",
    };

    const resultado = win ? await dialog.showMessageBox(win, config) : await dialog.showMessageBox(config);
    return resultado.response === 1;
  });

  ipcMain.handle("dialogo:alerta", async (evento, opcoes = {}) => {
    const win = BrowserWindow.fromWebContents(evento.sender);
    const config = {
      type: opcoes.tipo || "info",
      buttons: ["OK"],
      title: opcoes.titulo || "FlowList",
      message: opcoes.mensagem || "",
    };

    if (win) {
      await dialog.showMessageBox(win, config);
    } else {
      await dialog.showMessageBox(config);
    }
    return true;
  });

  // Notificações desktop
  ipcMain.handle("notificacao:exibir", (evento, { titulo, corpo } = {}) => {
    if (Notification.isSupported()) {
      new Notification({
        title: titulo || "FlowList",
        body: corpo || "",
        icon: path.join(__dirname, "assets", "images", "flowlist-icon.png"),
      }).show();
      return true;
    }
    return false;
  });
}

function criarJanelaPrincipal() {
  const janela = new BrowserWindow({
    title: "FlowList",
    width: 1100,
    height: 720,
    minWidth: 900,
    minHeight: 600,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "assets", "images", "flowlist-icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  janela.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  janela.webContents.on("will-navigate", (evento, destino) => {
    if (!destino.startsWith("file://")) evento.preventDefault();
  });

  // O fluxo começa no cadastro; dali o usuário pode ir ao login e, após autenticar, à tela principal.
  janela.loadFile(path.join(__dirname, "src", "pages", "cadastro", "index.html"));
}

app.whenReady().then(() => {
  registrarHandlersIpc();
  criarJanelaPrincipal();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) criarJanelaPrincipal();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
