const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

function criarJanela() {
  const janela = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#0a0b0f",
    autoHideMenuBar: true,

    // Esconde a barra de título nativa.
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#232733",
      symbolColor: "#ffffff",
      height: 32
    },

    webPreferences: {
      preload: path.join(__dirname, "src", "preload", "preload.js"), 
      contextIsolation: true,   
      nodeIntegration: false,   
      sandbox: true             
    }
  });

  // Nunca abre janelas novas, nem navega para sites externos
  janela.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  janela.webContents.on("will-navigate", (evento, url) => {
    if (!url.startsWith("file://")) evento.preventDefault();
  });


  janela.loadFile(path.join(__dirname, "src", "login", "login.html"));
}

// Devolve a versão do app
ipcMain.handle("app:versao", () => {
  return app.getVersion();
});

// Fecha o aplicativo inteiro
ipcMain.handle("app:fechar", () => {
  app.quit();
});

// Quando o Electron terminar de iniciar, abre a janela
app.whenReady().then(criarJanela);

// Fecha o app quando todas as janelas forem fechadas
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});