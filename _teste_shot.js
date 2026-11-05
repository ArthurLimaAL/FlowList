const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const OUT = path.join(app.getPath('temp'), 'flowlist_shot_' + Date.now());
app.setPath('userData', path.join(OUT, 'userdata'));
const sleep = ms => new Promise(r => setTimeout(r, ms));

setTimeout(() => { console.log('WATCHDOG'); app.exit(3); }, 60000);

app.whenReady().then(async () => {
    fs.mkdirSync(OUT, { recursive: true });
    const win = new BrowserWindow({
        width: 1000, height: 600, show: true, focusable: true,
        webPreferences: { nodeIntegration: true, contextIsolation: false, backgroundThrottling: false }
    });
    const exec = js => win.webContents.executeJavaScript(js, true);

    async function foto(n) {
        win.focus();
        win.moveTop();
        await sleep(500);
        fs.writeFileSync(path.join(OUT, n + '.png'), (await win.webContents.capturePage()).toPNG());
    }

    const carregado = new Promise(r => win.webContents.once('did-finish-load', r));
    await win.loadFile('principal.html');
    await carregado;
    await exec(`localStorage.setItem('flowlist_tasks', JSON.stringify([
        {id: 10, titulo: 'Ler capítulo 4', prioridade: 'Média', data: '2026-11-08', done: false},
        {id: 11, titulo: 'Prova simulada', prioridade: 'Alta', data: '2026-11-17', done: false},
        {id: 12, titulo: 'Sem data', prioridade: 'Baixa', data: null, done: false}
    ])); location.reload()`);
    await sleep(1200);

    await exec(`openNew(); bootstrap.Modal.getOrCreateInstance(document.getElementById('taskModal')).show();`);
    await sleep(900);
    await foto('30-modal-novo');

    await exec(`document.querySelector('.mini-celula[data-chave="2026-11-17"]').click()`);
    await sleep(600);
    await foto('31-modal-data-escolhida');

    console.log('OUT=' + OUT);
    console.log('estado: ' + await exec(`JSON.stringify({
        texto: document.getElementById('textoData').textContent,
        valor: MiniCal.valor(),
        classe: document.getElementById('taskModal').className,
        display: getComputedStyle(document.getElementById('taskModal')).display,
        opacidade: getComputedStyle(document.getElementById('taskModal')).opacity
    })`));

    win.destroy();
    app.quit();
}).catch(e => { console.error('ERRO', e); app.exit(1); });
