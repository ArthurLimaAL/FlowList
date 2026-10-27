
const { app, BrowserWindow } = require('electron');

function criarJanela() {
    const janela = new BrowserWindow({
        width: 1000,
        height: 700
    });
    
    janela.loadFile('telas/index.html');
}

app.whenReady().then(criarJanela);
