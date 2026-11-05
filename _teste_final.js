const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const OUT = path.join(app.getPath('temp'), 'flowlist_final_' + Date.now());
app.setPath('userData', path.join(OUT, 'userdata'));
const sleep = ms => new Promise(r => setTimeout(r, ms));
setTimeout(() => { console.log('WATCHDOG'); app.exit(3); }, 90000);

app.whenReady().then(async () => {
    fs.mkdirSync(OUT, { recursive: true });
    const win = new BrowserWindow({ width: 1000, height: 600, show: true, webPreferences: { nodeIntegration: true, contextIsolation: false } });
    const exec = js => win.webContents.executeJavaScript(`(() => { try { return (${js}); } catch (e) { return 'PAGE-ERROR: ' + e.message; } })()`, true);
    const passo = async (nome, js) => { log.push(nome + ': ' + await exec(js)); };
    const abrir = async arquivo => {
        const p = new Promise(r => win.webContents.once('did-finish-load', r));
        await win.loadFile(arquivo);
        await p;
        await sleep(900);
    };
    const log = [];
    const f = dias => {
        const d = new Date();
        d.setDate(d.getDate() + dias);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    await abrir('principal.html');
    await exec(`localStorage.setItem('flowlist_tasks', '[]')`);

    log.push('lista: cria tarefa pelo mini-calendario: ' + await exec(`(() => {
        openNew();
        document.querySelector('[data-atalho="amanha"]').click();
        document.getElementById('inputTitulo').value = 'Estudar regex';
        saveTask();
        return 'valor=' + JSON.parse(localStorage.getItem('flowlist_tasks'))[0].data +
            ' | lista=' + document.getElementById('taskContainer').textContent.replace(/\\s+/g, ' ').trim().slice(0, 60);
    })()`));

    log.push('lista: fundos dos chips: ' + await exec(`(() => {
        openNew();
        return [...document.querySelectorAll('.mini-atalhos .chip')].map(c => c.textContent + ':' + getComputedStyle(c).backgroundColor).join(' ');
    })()`));

    await abrir('calendario.html');
    log.push('calendario ve a tarefa criada: ' + await exec(`(() => {
        const c = document.querySelector('.celula[data-chave="${f(1)}"]');
        if (!c) return 'NULL celula';
        c.click();
        return 'celula=' + c.className + ' | pontos=' + c.querySelectorAll('.dot').length +
            ' | painel=' + document.getElementById('listaDia').textContent.replace(/\\s+/g, ' ').trim().slice(0, 50);
    })()`));

    log.push('calendario: dia passado bloqueado: ' + await exec(`(() => {
        const c = [...document.querySelectorAll('.celula')].find(x => x.dataset.passado === 'true' && x.dataset.ocupo === 'false');
        c.click();
        return document.getElementById('aviso').classList.contains('visivel') + ' | ' + document.getElementById('aviso').textContent;
    })()`));

    log.push('calendario: criar no dia selecionado: ' + await exec(`(() => {
        document.querySelector('.celula[data-chave="${f(1)}"]').click();
        document.getElementById('btnNovaDoDia').click();
        document.getElementById('inputTitulo').value = 'Revisar a matéria';
        document.getElementById('btnSalvar').click();
        return 'tarefas=' + JSON.parse(localStorage.getItem('flowlist_tasks')).map(t => t.titulo + '@' + t.data).join(', ') +
            ' | painel=' + document.querySelectorAll('.atv').length + ' itens';
    })()`));

    log.push('calendario: concluir atividade: ' + await exec(`(() => {
        document.querySelector('[data-acao="toggle"]').click();
        return 'concluidas=' + JSON.parse(localStorage.getItem('flowlist_tasks')).filter(t => t.done).length +
            ' | contador=' + localStorage.getItem('totalTarefasConcluidas');
    })()`));

    log.push('calendario: navegacao e hoje: ' + await exec(`(() => {
        document.getElementById('btnNext').click();
        const proximo = document.getElementById('tituloMes').textContent;
        document.getElementById('btnPrev').click();
        document.getElementById('btnHoje').click();
        return proximo + ' | volta=' + document.getElementById('tituloMes').textContent + ' | selecionada=' + document.getElementById('dataSelecionada').textContent;
    })()`));

    console.log(log.join('\n'));
    try {
        win.focus();
        win.moveTop();
        await sleep(600);
        fs.writeFileSync(path.join(OUT, '40-calendario-final.png'), (await win.webContents.capturePage()).toPNG());
        console.log('OUT=' + OUT);
    } catch (e) {
        console.log('foto falhou: ' + e.message);
    }
    win.destroy();
    app.quit();
}).catch(e => { console.error('ERRO', e); app.exit(1); });
