const FlowCalendario = (() => {
    let tarefas = [];
    let edicaoId = null;
    let avisoTimer = null;

    let visao = { ano: HOJE.getFullYear(), mes: HOJE.getMonth() };
    let selecionada = CHAVE_HOJE;

    function getGrade() { return document.getElementById('grade'); }
    function getModal() { return document.getElementById('modalCalendario'); }
    function getInputTitulo() { return document.getElementById('calInputTitulo'); }
    function getInputPrioridade() { return document.getElementById('calInputPrioridade'); }
    function getErroModal() { return document.getElementById('erroModal'); }
    function getDataModal() { return document.getElementById('dataModal'); }
    function getBtnSalvar() { return document.getElementById('btnSalvar'); }

    function esc(s) {
        return String(s).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    // As tarefas vêm do storage
    function lerTarefas() {
        return obterTarefasParaTela();
    }

    function salvarTarefas(lista = tarefas) {
        if (!gravarTarefasDaTela(lista)) {
            mostrarAviso('Não foi possível salvar as atividades neste navegador.');
            return false;
        }
        return true;
    }

    function doDia(chave) {
        return tarefas.filter(t => t.data === chave);
    }

    function marcarConcluida(nova) {
        const total = Math.max(0, obterTotalConcluidas() + (nova ? 1 : -1));
        definirTotalConcluidas(total);
    }

    function mostrarAviso(texto) {
        const aviso = document.getElementById('aviso');
        if (!aviso) return;
        aviso.textContent = texto;
        aviso.classList.add('visivel');
        clearTimeout(avisoTimer);
        avisoTimer = setTimeout(() => aviso.classList.remove('visivel'), 4000);
    }

    function renderCabecalho() {
        const elTitulo = document.getElementById('tituloMes');
        if (!elTitulo) return;
        elTitulo.textContent = `${MESES[visao.mes]} ${visao.ano}`;

        const doMes = tarefas.filter(t => {
            if (!t.data) return false;
            const d = paraData(t.data);
            return d.getFullYear() === visao.ano && d.getMonth() === visao.mes;
        });
        const pendentes = doMes.filter(t => !t.done).length;
        const elResumo = document.getElementById('resumoMes');
        if (elResumo) {
            elResumo.textContent = doMes.length
                ? `${doMes.length} atividade${doMes.length === 1 ? '' : 's'} · ${pendentes} pendente${pendentes === 1 ? '' : 's'}`
                : 'Nenhuma atividade neste mês';
        }

        const noMesAtual = visao.ano === HOJE.getFullYear() && visao.mes === HOJE.getMonth();
        const btnPrev = document.getElementById('btnPrev');
        if (btnPrev) btnPrev.disabled = noMesAtual;
    }

    function renderDiasSemana() {
        const elDias = document.getElementById('diasSemana');
        if (!elDias) return;
        elDias.innerHTML = DIAS_SEMANA.map(d => `<div>${d}</div>`).join('');
    }

    function renderGrade() {
        const grade = getGrade();
        if (!grade) return;

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
            if (chave === CHAVE_HOJE) clases.push('hoje');
            if (chave === selecionada) clases.push('selecionada');
            if (passada && pendentes.length) clases.push('atrasada');

            // Mostra o nome das tarefas dentro do dia 
            const LIMITE = 2;
            const itens = atividades.slice(0, LIMITE).map(t => {
                const cor = t.prioridade === 'Alta' ? 'alta' : t.prioridade === 'Média' ? 'media' : 'baixa';
                return `<span class="cel-tarefa cel-${cor} ${t.done ? 'feito' : ''}" title="${esc(t.titulo)}">
                            <span class="cel-tarefa-txt">${esc(t.titulo)}</span>
                        </span>`;
            }).join('');
            const extras = atividades.length > LIMITE
                ? `<span class="rotulo-mais">+${atividades.length - LIMITE} mais</span>` : '';

            html += `<button type="button" class="${clases.join(' ')}" data-chave="${chave}"
                        data-passado="${passada}" data-ocupo="${atividades.length > 0}">
                        <span class="numero">${data.getDate()}</span>
                        <span class="cel-tarefas">${itens}${extras}</span>
                       </button>`;
        }
        grade.innerHTML = html;
    }

    function renderPainel() {
        const elData = document.getElementById('dataSelecionada');
        if (elData) elData.textContent = formatarLonga(selecionada);

        const atividades = doDia(selecionada);
        const pendentes = atividades.filter(t => !t.done).length;
        const contagem = document.getElementById('contagemDia');
        const lista = document.getElementById('listaDia');
        const botaoNova = document.getElementById('btnNovaDoDia');

        if (!lista) return;

        if (!atividades.length) {
            if (contagem) contagem.textContent = ehPassada(selecionada) ? 'Dia passado' : 'Nada agendado';
            lista.innerHTML = `<div class="vazio-dia"><i class="bi bi-calendar-x"></i>
                ${ehPassada(selecionada) ? 'Este dia já passou.' : 'Nenhuma atividade neste dia.'}</div>`;
        } else {
            if (contagem) contagem.textContent = `${atividades.length} atividade${atividades.length === 1 ? '' : 's'} · ${pendentes} pendente${pendentes === 1 ? '' : 's'}`;
            lista.innerHTML = atividades.map(t => `
                <div class="atv">
                    <button class="check-circle ${t.done ? 'done' : ''}" data-acao="toggle" data-id="${esc(t.id)}">
                        ${t.done ? '<i class="bi bi-check-lg"></i>' : ''}
                    </button>
                    <div class="txt ${t.done ? 'done' : ''}">${esc(t.titulo)}</div>
                    <span class="badge-prio badge-${t.prioridade === 'Alta' ? 'alta' : t.prioridade === 'Média' ? 'media' : 'baixa'}">${esc(t.prioridade)}</span>
                    <button class="icon-btn" data-acao="editar" data-id="${esc(t.id)}" title="Editar"><i class="bi bi-pencil"></i></button>
                    <button class="icon-btn" data-acao="excluir" data-id="${esc(t.id)}" title="Excluir"><i class="bi bi-trash"></i></button>
                </div>`).join('');
        }

        if (botaoNova) {
            botaoNova.disabled = ehPassada(selecionada);
            botaoNova.style.opacity = botaoNova.disabled ? '.45' : '';
            botaoNova.style.cursor = botaoNova.disabled ? 'not-allowed' : '';
            botaoNova.innerHTML = botaoNova.disabled
                ? '<i class="bi bi-lock"></i> Dias passados não recebem atividades'
                : '<i class="bi bi-plus-lg"></i> Nova atividade neste dia';
        }
    }

    function render() {
        renderCabecalho();
        renderGrade();
        renderPainel();
    }

    function recarregar() {
        tarefas = lerTarefas();
        render();
    }

    function abrirModal(id) {
        edicaoId = id ?? null;
        const modalTitle = document.getElementById('modalCalendarioTitle');
        if (modalTitle) {
            modalTitle.textContent = edicaoId === null ? 'Nova atividade' : 'Editar atividade';
        }
        const erro = getErroModal();
        if (erro) erro.textContent = '';

        const inputTitulo = getInputTitulo();
        const inputPrioridade = getInputPrioridade();

        if (edicaoId === null) {
            if (inputTitulo) inputTitulo.value = '';
            if (inputPrioridade) inputPrioridade.value = 'Média';
        } else {
            const t = tarefas.find(x => x.id === edicaoId);
            if (!t) return;
            if (inputTitulo) inputTitulo.value = t.titulo;
            if (inputPrioridade) inputPrioridade.value = t.prioridade;
        }

        const dataModal = getDataModal();
        if (dataModal) dataModal.textContent = formatarLonga(selecionada);

        const modal = getModal();
        if (modal) {
            bootstrap.Modal.getOrCreateInstance(modal).show();
            setTimeout(() => { if (inputTitulo) inputTitulo.focus(); }, 300);
        }
    }

    function salvar() {
        const inputTitulo = getInputTitulo();
        const titulo = inputTitulo ? inputTitulo.value.trim() : '';
        const erro = getErroModal();

        if (!titulo) {
            if (erro) erro.textContent = 'Digite o nome da atividade.';
            return;
        }
        if (ehPassada(selecionada)) {
            if (erro) erro.textContent = 'Não é possível agendar em um dia passado.';
            return;
        }

        const inputPrioridade = getInputPrioridade();
        const prioridade = inputPrioridade ? inputPrioridade.value : 'Média';

        const proximasTarefas = tarefas.map(t => ({ ...t }));
        if (edicaoId === null) {
            proximasTarefas.unshift({ id: Date.now(), titulo, prioridade, data: selecionada, done: false });
        } else {
            const t = proximasTarefas.find(x => x.id === edicaoId);
            if (t) {
                t.titulo = titulo;
                t.prioridade = prioridade;
                t.data = selecionada;
            }
        }

        if (!salvarTarefas(proximasTarefas)) {
            if (erro) erro.textContent = 'Não foi possível salvar. Verifique o espaço disponível e tente novamente.';
            return;
        }
        tarefas = proximasTarefas;
        const modal = getModal();
        if (modal) {
            bootstrap.Modal.getInstance(modal)?.hide();
        }
        render();

        if (typeof recarregarTarefas === 'function') {
            recarregarTarefas();
        }
    }

    function init() {
        const grade = getGrade();
        if (grade) {
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
        }

        const btnPrev = document.getElementById('btnPrev');
        if (btnPrev) {
            btnPrev.addEventListener('click', () => {
                visao.mes--;
                if (visao.mes < 0) { visao.mes = 11; visao.ano--; }
                render();
            });
        }

        const btnNext = document.getElementById('btnNext');
        if (btnNext) {
            btnNext.addEventListener('click', () => {
                visao.mes++;
                if (visao.mes > 11) { visao.mes = 0; visao.ano++; }
                render();
            });
        }

        const btnHoje = document.getElementById('btnHoje');
        if (btnHoje) {
            btnHoje.addEventListener('click', () => {
                visao = { ano: HOJE.getFullYear(), mes: HOJE.getMonth() };
                selecionada = CHAVE_HOJE;
                render();
            });
        }

        const btnIrTarefas = document.getElementById('btnIrTarefas');
        if (btnIrTarefas) {
            btnIrTarefas.addEventListener('click', () => trocarTela('tela-tarefas'));
        }

        const listaDia = document.getElementById('listaDia');
        if (listaDia) {
            listaDia.addEventListener('click', (e) => {
                const botao = e.target.closest('[data-acao]');
                if (!botao) return;

                const id = Number(botao.dataset.id);
                const t = tarefas.find(x => x.id === id);
                if (!t) return;

                if (botao.dataset.acao === 'toggle') {
                    const concluida = !t.done;
                    const proximasTarefas = tarefas.map(tarefa =>
                        tarefa.id === id ? { ...tarefa, done: concluida } : tarefa
                    );
                    if (!salvarTarefas(proximasTarefas)) return;
                    tarefas = proximasTarefas;
                    marcarConcluida(concluida);
                    render();
                    if (typeof recarregarTarefas === 'function') {
                        recarregarTarefas();
                    }
                }
                if (botao.dataset.acao === 'editar') abrirModal(id);
                if (botao.dataset.acao === 'excluir') {
                    if (!confirm('Excluir esta atividade?')) return;
                    const proximasTarefas = tarefas.filter(x => x.id !== id);
                    if (!salvarTarefas(proximasTarefas)) return;
                    tarefas = proximasTarefas;
                    render();
                    if (typeof recarregarTarefas === 'function') {
                        recarregarTarefas();
                    }
                }
            });
        }

        const btnNovaDoDia = document.getElementById('btnNovaDoDia');
        if (btnNovaDoDia) btnNovaDoDia.addEventListener('click', () => abrirModal(null));

        const btnSalvar = getBtnSalvar();
        if (btnSalvar) btnSalvar.addEventListener('click', salvar);

        const inputTitulo = getInputTitulo();
        if (inputTitulo) {
            inputTitulo.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') salvar();
            });
        }

        tarefas = lerTarefas();
        renderDiasSemana();
        render();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return {
        render,
        recarregar,
        abrirModal,
        salvar,
        obterTarefas: () => tarefas
    };
})();

// Compatibilidade global
window.FlowCalendario = FlowCalendario;