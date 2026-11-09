const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const { fileURLToPath } = require("url");

function normalizarCaminho(caminho) {
  const resolvido = path.resolve(caminho);
  return process.platform === "win32" ? resolvido.toLowerCase() : resolvido;
}

const telasPermitidas = new Set(
  [
    "login/login.html",
    "cadastro/cadastro.html",
    "principal/principal.html",
    "tarefas/tarefas.html",
    "calendario/calendario.html",
    "perfil/perfil.html"
  ].map((tela) => normalizarCaminho(path.resolve(__dirname, "src", tela)))
);

function urlDaTelaPermitida(url) {
  try {
    return telasPermitidas.has(normalizarCaminho(fileURLToPath(url)));
  } catch {
    return false;
  }
}

function validarOrigemIPC(evento) {
  const quadro = evento.senderFrame;
  if (
    !quadro ||
    quadro !== evento.sender.mainFrame ||
    !urlDaTelaPermitida(quadro.url)
  ) {
    throw new Error("Origem IPC não autorizada.");
  }
}

function criarJanela() {
  const janela = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#0a0b0f",
    icon: path.join(__dirname, "src", "imagens", "icon.png"),
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

  // Impede janelas adicionais e navegação para páginas fora do app.
  janela.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  const bloquearNavegacaoExterna = (evento, url) => {
    if (!urlDaTelaPermitida(url)) evento.preventDefault();
  };
  janela.webContents.on("will-navigate", bloquearNavegacaoExterna);
  janela.webContents.on("will-redirect", bloquearNavegacaoExterna);

  janela.loadFile(path.join(__dirname, "src", "login", "login.html"));
}

// Devolve a versão do app
ipcMain.handle("app:versao", (evento) => {
  validarOrigemIPC(evento);
  return app.getVersion();
});

// Devolve o HTML do menu lateral 
ipcMain.handle("menu:html", (evento) => {
  validarOrigemIPC(evento);
  return fs.readFileSync(path.join(__dirname, "src", "componentes", "menu.html"), "utf8");
});

// Fecha o aplicativo inteiro
ipcMain.handle("app:fechar", (evento) => {
  validarOrigemIPC(evento);
  app.quit();
});

// Quando o Electron terminar de iniciar, abre a janela
app.whenReady().then(() => {
  
  if (process.platform === "darwin") {
    app.dock.setIcon(path.join(__dirname, "src", "imagens", "icon.png"));
  }
  criarJanela();
});

// Fecha o app quando todas as janelas forem fechadas
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) criarJanela();
});