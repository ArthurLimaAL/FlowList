const { app, BrowserWindow, nativeTheme } = require('electron');
const url = require('url');
const path = require('path');

function createMainWindow() {

    nativeTheme.themeSource = 'dark'

    const mainWindow = new BrowserWindow({
        title: 'Electron',
        width: 1000,
        height: 600,
        resizable: false,
        autoHideMenuBar: true
    });

    const startUrl = url.format({

        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file',
    })

    mainWindow.loadURL(startUrl);

}

app.whenReady().then(createMainWindow);