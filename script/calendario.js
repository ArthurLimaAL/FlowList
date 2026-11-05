const STORAGE_KEY = 'flowlist_tasks';
const CONCLUIDAS_KEY = 'totalTarefasConcluidas';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

let tarefas = [];
let edicaoId = null;
let avisoTimer = null;

const hoje = new Date();
const chaveHoje = chaveLocal(hoje);
let visao = { ano: hoje.getFullYear(), mes: hoje.getMonth() };
let selecionada = chaveHoje;

const grade = document.getElementById('grade');
const modal = document.getElementById('taskModal');
const inputTitulo = document.getElementById('inputTitulo');
const inputPrioridade = document.getElementById('inputPrioridade');

function chaveLocal(d) {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${dia}`;
}

function paraData(chave) {
    const [a, m, d] = chave.split('-').map(Number);
    return new Date(a, m - 1, d);
}

function inicioDia(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function ehPassada(chave) {
    return paraData(chave) < inicioDia(hoje);
}

function formatarLonga(chave) {
    const d = paraData(chave);
    return `${DIAS_SEMANA[(d.getDay() + 6) % 7]}, ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function lerTarefas() {
    try {
        const salvas = localStorage.getItem(STORAGE_KEY);
        return salvas ? JSON.parse(salvas) : [];
    } catch (e) {
        return [];
    }
}

function salvarTarefas() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tarefas));
    } catch (e) {
        mostrarAviso('Não foi possível salvar as atividades neste navegador.');
    }
}

function doDia(chave) {
    return tarefas.filter(t => t.data === chave);
}

function marcarConcluida(nova) {
    let total = parseInt(localStorage.getItem(CONCLUIDAS_KEY), 10) || 0;
    total = Math.max(0, total + (nova ? 1 : -1));
    localStorage.setItem(CONCLUIDAS_KEY, total);
}

function mostrarAviso(texto) {
    const aviso = document.getElementById('aviso');
    aviso.textContent = texto;
    aviso.classList.add('visivel');
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(() => aviso.classList.remove('visivel'), 4000);
}

function renderCabecalho() {
    document.getElementById('tituloMes').textContent = `${MESES[visao.mes]} ${visao.ano}`;

    const doMes = tarefas.filter(t => {
        if (!t.data) return false;
        const d = paraData(t.data);
        return d.getFullYear() === visao.ano && d.getMonth() === visao.mes;
    });
    const pendentes = doMes.filter(t => !t.done).length;
    document.getElementById('resumoMes').textContent = doMes.length
        ? `${doMes.length} atividade${doMes.length === 1 ? '' : 's'} · ${pendentes} pendente${pendentes === 1 ? '' : 's'}`
        : 'Nenhuma atividade neste mês';

    const noMesAtual = visao.ano === hoje.getFullYear() && visao.mes === hoje.getMonth();
    document.getElementById('btnPrev').disabled = noMesAtual;
}

function renderDiasSemana() {
    document.getElementById('diasSemana').innerHTML =
        DIAS_SEMANA.map(d => `<div>${d}</div>`).join('');
}

function renderGrade() {
    const primeiroDia = new Date(visao.ano, visao.mes, 1);
    const deslocamento = (primeiroDia.getDay() + 6) % 7;
    const totalDias = new Date(visao.ano, visao.mes + 1, 0).getDate();
    const celulas = Math.ceil((deslocamento + totalDias) / 7) * 7;

    let html = '';
    for (let i = 0; i < celulas; i++) {
        const data = new Date(visao.ano, visao.mes, i - deslocamento + 1);
        const chave = chaveLocal(data);
        const atividades = doDia(chave);
        const pendentes = atividades.filter(t => !t.done);
        const passada = ehPassada(chave);
        const clases = ['celula'];

        if (data.getMonth() !== visao.mes) clases.push('fora');
        if (passada) clases.push('passado');
        if (chave === chaveHoje) clases.push('hoje');
        if (chave === selecionada) clases.push('selecionada');
        if (passada && pendentes.length) clases.push('atrasada');

        const marcas = atividades.slice(0, 3).map(t => {
            const cor = t.done ? 'feito' : (t.prioridade === 'Alta' ? 'alta' : t.prioridade === 'Média' ? 'media' : 'baixa');
            return `<i class="dot dot-${cor}"></i>`;
        }).join('');
        const extras = atividades.length > 3
            ? `<span class="rotulo-mais">+${atividades.length - 3}</span>` : '';

        html += `<button type="button" class="${clases.join(' ')}" data-chave="${chave}"
                    data-passado="${passada}" data-ocupo="${atividades.length > 0}">
                    <span class="numero">${data.getDate()}</span>
                    <span class="marcas">${marcas}${extras}</span>
                   </button>`;
    }
    grade.innerHTML = html;
}

function renderPainel() {
    document.getElementById('dataSelecionada').textContent = formatarLonga(selecionada);

    const atividades = doDia(selecionada);
    const pendentes = atividades.filter(t => !t.done).length;
    const contagem = document.getElementById('contagemDia');
    const lista = document.getElementById('listaDia');
    const botaoNova = document.getElementById('btnNovaDoDia');

    if (!atividades.length) {
        contagem.textContent = ehPassada(selecionada) ? 'Dia passado' : 'Nada agendado';
        lista.innerHTML = `<div class="vazio-dia"><i class="bi bi-calendar-x"></i>
            ${ehPassada(selecionada) ? 'Este dia já passou.' : 'Nenhuma atividade neste dia.'}</div>`;
    } else {
        contagem.textContent = `${atividades.length} atividade${atividades.length === 1 ? '' : 's'} · ${pendentes} pendente${pendentes === 1 ? '' : 's'}`;
        lista.innerHTML = atividades.map(t => `
            <div class="atv">
                <button class="check-circle ${t.done ? 'done' : ''}" data-acao="toggle" data-id="${t.id}">
                    ${t.done ? '<i class="bi bi-check-lg"></i>' : ''}
                </button>
                <div class="txt ${t.done ? 'done' : ''}">${esc(t.titulo)}</div>
                <span class="badge-prio badge-${t.prioridade === 'Alta' ? 'alta' : t.prioridade === 'Média' ? 'media' : 'baixa'}">${t.prioridade}</span>
                <button class="icon-btn" data-acao="editar" data-id="${t.id}" title="Editar"><i class="bi bi-pencil"></i></button>
                <button class="icon-btn" data-acao="excluir" data-id="${t.id}" title="Excluir"><i class="bi bi-trash"></i></button>
            </div>`).join('');
    }

    botaoNova.disabled = ehPassada(selecionada);
    botaoNova.style.opacity = botaoNova.disabled ? '.45' : '';
    botaoNova.style.cursor = botaoNova.disabled ? 'not-allowed' : '';
    botaoNova.innerHTML = botaoNova.disabled
        ? '<i class="bi bi-lock"></i> Dias passados não recebem atividades'
        : '<i class="bi bi-plus-lg"></i> Nova atividade neste dia';
}

function render() {
    renderCabecalho();
    renderGrade();
    renderPainel();
}

function abrirModal(id) {
    edicaoId = id ?? null;
    document.getElementById('modalTitle').textContent = edicaoId === null ? 'Nova atividade' : 'Editar atividade';
    document.getElementById('erroModal').textContent = '';

    if (edicaoId === null) {
        inputTitulo.value = '';
        inputPrioridade.value = 'Média';
    } else {
        const t = tarefas.find(x => x.id === edicaoId);
        if (!t) return;
        inputTitulo.value = t.titulo;
        inputPrioridade.value = t.prioridade;
    }

    document.getElementById('dataModal').textContent = formatarLonga(selecionada);
    bootstrap.Modal.getOrCreateInstance(modal).show();
    setTimeout(() => inputTitulo.focus(), 300);
}

function salvar() {
    const titulo = inputTitulo.value.trim();
    const erro = document.getElementById('erroModal');

    if (!titulo) {
        erro.textContent = 'Digite o nome da atividade.';
        return;
    }
    if (ehPassada(selecionada)) {
        erro.textContent = 'Não é possível agendar em um dia passado.';
        return;
    }

    if (edicaoId === null) {
        tarefas.unshift({ id: Date.now(), titulo, prioridade: inputPrioridade.value, data: selecionada, done: false });
    } else {
        const t = tarefas.find(x => x.id === edicaoId);
        if (t) {
            t.titulo = titulo;
            t.prioridade = inputPrioridade.value;
            t.data = selecionada;
        }
    }

    salvarTarefas();
    bootstrap.Modal.getInstance(modal)?.hide();
    render();
}

grade.addEventListener('click', (e) => {
    const celula = e.target.closest('.celula');
    if (!celula) return;

    const chave = celula.dataset.chave;
    if (celula.dataset.passado === 'true' && celula.dataset.ocupo === 'false') {
        mostrarAviso('Dias passados não podem receber atividades. Escolha hoje ou um dia futuro.');
        return;
    }

    selecionada = chave;
    const data = paraData(chave);
    if (data.getMonth() !== visao.mes || data.getFullYear() !== visao.ano) {
        visao = { ano: data.getFullYear(), mes: data.getMonth() };
    }
    render();
});

document.getElementById('btnPrev').addEventListener('click', () => {
    visao.mes--;
    if (visao.mes < 0) { visao.mes = 11; visao.ano--; }
    render();
});

document.getElementById('btnNext').addEventListener('click', () => {
    visao.mes++;
    if (visao.mes > 11) { visao.mes = 0; visao.ano++; }
    render();
});

document.getElementById('btnHoje').addEventListener('click', () => {
    visao = { ano: hoje.getFullYear(), mes: hoje.getMonth() };
    selecionada = chaveHoje;
    render();
});

document.getElementById('listaDia').addEventListener('click', (e) => {
    const botao = e.target.closest('[data-acao]');
    if (!botao) return;

    const id = Number(botao.dataset.id);
    const t = tarefas.find(x => x.id === id);
    if (!t) return;

    if (botao.dataset.acao === 'toggle') {
        t.done = !t.done;
        marcarConcluida(t.done);
        salvarTarefas();
        render();
    }
    if (botao.dataset.acao === 'editar') abrirModal(id);
    if (botao.dataset.acao === 'excluir') {
        if (!confirm('Excluir esta atividade?')) return;
        tarefas = tarefas.filter(x => x.id !== id);
        salvarTarefas();
        render();
    }
});

document.getElementById('btnNovaDoDia').addEventListener('click', () => abrirModal(null));
document.getElementById('btnSalvar').addEventListener('click', salvar);
inputTitulo.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') salvar();
});

function irParaTarefas() {
    window.location.href = 'principal.html';
}

tarefas = lerTarefas();
renderDiasSemana();
render();
