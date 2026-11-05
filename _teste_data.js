const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const OUT = path.join(app.getPath('temp'), 'flowlist_test_' + Date.now());
app.setPath('userData', path.join(OUT, 'userdata'));
const sleep = ms => new Promise(r => setTimeout(r, ms));

setTimeout(() => { console.log('WATCHDOG'); app.exit(3); }, 75000);

app.whenReady().then(async () => {
    fs.mkdirSync(OUT, { recursive: true });
    const win = new BrowserWindow({ width: 1000, height: 600, show: true, webPreferences: { nodeIntegration: true, contextIsolation: false } });
    const exec = js => win.webContents.executeJavaScript(js, true);
    const foto = async n => fs.writeFileSync(path.join(OUT, n + '.png'), (await win.webContents.capturePage()).toPNG());
    const log = [];

    const f = dias => {
        const d = new Date();
        d.setDate(d.getDate() + dias);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    const ontem = f(-1), em3 = f(3), em12 = f(12);

    const carregado = new Promise(r => win.webContents.once('did-finish-load', r));
    await win.loadFile('principal.html');
    await carregado;
    await exec(`localStorage.setItem('flowlist_tasks', JSON.stringify([
        {id: 10, titulo: 'Ler capítulo 4', prioridade: 'Média', data: '${em3}', done: false},
        {id: 11, titulo: 'Atividade antiga', prioridade: 'Alta', data: '${ontem}', done: false},
        {id: 12, titulo: 'Sem data', prioridade: 'Baixa', data: null, done: false}
    ])); location.reload()`);
    await sleep(1200);

    log.push('modal novo: ' + await exec(`(() => {
        openNew();
        bootstrap.Modal.getOrCreateInstance(document.getElementById('taskModal')).show();
        return document.getElementById('textoData').textContent +
            ' | celulas=' + document.querySelectorAll('.mini-celula').length +
            ' | ocupadas=' + document.querySelectorAll('.mini-marca').length +
            ' | prev=' + document.getElementById('miniPrev').disabled;
    })()`));
    await sleep(900);
    await foto('20-modal-novo');

    log.push('atalho amanha: ' + await exec(`(() => {
        document.querySelector('[data-atalho="amanha"]').click();
        return document.getElementById('textoData').textContent + ' | valor=' + MiniCal.valor();
    })()`));

    log.push('celula passada: ' + await exec(`(() => {
        const c = document.querySelector('.mini-celula[data-chave="${ontem}"]');
        c.click();
        return 'disabled=' + c.disabled + ' | title=' + c.title + ' | valor continua=' + MiniCal.valor();
    })()`));

    log.push('clique dia futuro: ' + await exec(`(() => {
        document.querySelector('.mini-celula[data-chave="${em12}"]').click();
        return document.getElementById('textoData').textContent + ' | valor=' + MiniCal.valor() +
            ' | selecionada=' + !!document.querySelector('.mini-celula.selecionada');
    })()`));
    await sleep(300);
    await foto('21-modal-com-data');

    log.push('ir para proximo mes: ' + await exec(`(() => {
        document.getElementById('miniNext').click();
        const t = document.getElementById('miniTitulo').textContent;
        document.getElementById('miniPrev').click();
        document.getElementById('miniPrev').click();
        return t + ' | volta=' + document.getElementById('miniTitulo').textContent + ' | prev desabilitado=' + document.getElementById('miniPrev').disabled;
    })()`));

    log.push('salvar: ' + await exec(`(() => {
        document.getElementById('inputTitulo').value = 'Prova simulada';
        saveTask();
        const t = JSON.parse(localStorage.getItem('flowlist_tasks')).find(x => x.titulo === 'Prova simulada');
        return 'data=' + (t && t.data) + ' | lista=' + document.getElementById('taskContainer').textContent.replace(/\\s+/g, ' ').slice(0, 110);
    })()`));

    log.push('editar atrasada: ' + await exec(`(() => {
        openEdit(11);
        return document.getElementById('textoData').textContent + ' | mes=' + document.getElementById('miniTitulo').textContent +
            ' | prev=' + document.getElementById('miniPrev').disabled +
            ' | selecionada=' + (document.querySelector('.mini-celula.selecionada') || {}).textContent;
    })()`));
    await sleep(400);
    await foto('22-editando-atrasada');

    log.push('salvar atrasada sem mudar: ' + await exec(`(() => {
        saveTask();
        return 'erro=[' + document.getElementById('erroTarefa').textContent + ']';
    })()`));

    log.push('chip nenhum: ' + await exec(`(() => {
        document.getElementById('miniSemData').click();
        return document.getElementById('textoData').textContent + ' | valor=' + MiniCal.valor();
    })()`));

    await exec(`openNew(); bootstrap.Modal.getOrCreateInstance(document.getElementById('taskModal')).show(); document.querySelector('[data-atalho="semana"]').click();`);
    await sleep(900);
    log.push('medidas modal: ' + await exec(`(() => {
        const corpo = document.querySelector('.modal-body');
        const conteudo = document.querySelector('.modal-content');
        const cabecalho = document.querySelector('.modal-header');
        const rodape = document.querySelector('.modal-footer');
        const col = document.querySelector('.coluna-calendario');
        return JSON.stringify({
            innerH: window.innerHeight,
            altura: Math.round(conteudo.getBoundingClientRect().height),
            maxHeight: getComputedStyle(conteudo).maxHeight,
            cabecalho: Math.round(cabecalho.getBoundingClientRect().height),
            rodape: Math.round(rodape.getBoundingClientRect().height),
            corpoScroll: corpo.scrollHeight,
            corpoClient: corpo.clientHeight,
            corpoPadding: getComputedStyle(corpo).padding,
            colunaCalendario: Math.round(col.getBoundingClientRect().height)
        });
    })()`));
    await foto('23-modal-ajustado');

    console.log(log.join('\n'));
    fs.writeFileSync(path.join(OUT, 'log.txt'), log.join('\n'));
    win.destroy();
    app.quit();
}).catch(e => { console.error('ERRO', e); app.exit(1); });
