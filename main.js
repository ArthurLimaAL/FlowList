const { app, BrowserWindow } = require("electron");
const path = require("node:path");

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
  criarJanelaPrincipal();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) criarJanelaPrincipal();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
