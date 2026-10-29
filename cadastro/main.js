const { app, BrowserWindow } = require("electron");
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
      contextIsolation: true, 
      nodeIntegration: false  
    }
  });

  // Carrega a tela de cadastro dentro da janela
  janela.loadFile(path.join(__dirname, "src", "cadastro", "cadastro.html"));
}

// Quando o Electron terminar de iniciar, abre a janela
app.whenReady().then(criarJanela);

// fecha o app quando todas as janelas forem fechadas
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});