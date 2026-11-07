let tasks = [];
try {
    const saved = localStorage.getItem('flowlist_tasks');
    if (saved) {
        tasks = JSON.parse(saved);
    }
} catch (e) {
    tasks = [];
}

let filter = 'todas', editingId = null;

// Contador cumulativo de tarefas concluídas (mantido no localStorage)
let totalConcluidasAcumuladas = 0;
try {
    const savedCount = localStorage.getItem('totalTarefasConcluidas');
    if (savedCount !== null) {
        totalConcluidasAcumuladas = parseInt(savedCount, 10) || 0;
    } else {
        totalConcluidasAcumuladas = tasks.filter(t => t.done).length;
        localStorage.setItem('totalTarefasConcluidas', totalConcluidasAcumuladas);
    }
} catch (e) {
    totalConcluidasAcumuladas = 0;
}

function updateTotalConcluidas(val) {
    totalConcluidasAcumuladas = Math.max(0, val);
    try {
        localStorage.setItem('totalTarefasConcluidas', totalConcluidasAcumuladas);
    } catch (e) {
        console.error('Erro ao salvar tarefas concluídas acumuladas:', e);
    }
}

function saveTasksToStorage() {
    try {
        localStorage.setItem('flowlist_tasks', JSON.stringify(tasks));
    } catch (e) {
        console.error('Erro ao salvar tarefas:', e);
    }
}

const modalTitle = document.getElementById('modalTitle');
const inputTitulo = document.getElementById('inputTitulo');
const inputPrioridade = document.getElementById('inputPrioridade');
const erroTarefa = document.getElementById('erroTarefa');
const taskModal = document.getElementById('taskModal');
const buttonVoltar = document.getElementById('btn-voltar');
const botaoSair = document.getElementById('botaoSair');

// =========================================================
// NAVEGAÇÃO ENTRE TELAS (BARRA LATERAL)
// =========================================================
function trocarTela(idTela) {
    // 1. Atualizar classe ativa nos itens do menu
    document.querySelectorAll('.menu-itens .menu-item').forEach(item => {
        item.classList.remove('ativo');
        if (item.getAttribute('data-target') === idTela) {
            item.classList.add('ativo');
        }
    });

    // 2. Esconder todas as seções e mostrar apenas a selecionada
    document.querySelectorAll('.tela-secao').forEach(tela => {
        tela.style.display = 'none';
    });

    const destino = document.getElementById(idTela);
    if (destino) {
        destino.style.display = 'block';
    }

    // 3. Atualizar dados da tela aberta
    if (idTela === 'tela-tarefas') {
        render();
    } else if (idTela === 'tela-calendario') {
        if (window.FlowCalendario && typeof window.FlowCalendario.recarregar === 'function') {
            window.FlowCalendario.recarregar();
        }
    } else if (idTela === 'tela-perfil') {
        atualizarPerfil();
    } else if (idTela === 'tela-inicio') {
        atualizarInicio();
    }

    try {
        sessionStorage.setItem('flowlist_aba_ativa', idTela);
    } catch (e) { }
}

// Configura cliques nos itens da barra lateral
document.querySelectorAll('.menu-itens .menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = item.getAttribute('data-target');
        if (targetId) {
            trocarTela(targetId);
        }
    });
});

// Ação do botão Sair (volta para tela.html)
if (botaoSair) {
    botaoSair.addEventListener('click', (e) => {
        e.preventDefault();
        voltar();
    });
}

// =========================================================
// ATUALIZAÇÃO DAS TELAS INÍCIO E PERFIL
// =========================================================
function atualizarInicio() {
    const pendentes = tasks.filter(t => !t.done).length;
    const elPendentes = document.getElementById('inicioQtdPendentes');
    if (elPendentes) elPendentes.textContent = `${pendentes}`;

    const elConcluidas = document.getElementById('inicioQtdConcluidas');
    if (elConcluidas) elConcluidas.textContent = `${totalConcluidasAcumuladas}`;

    // Atividades cadastradas no mês atual
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    const doMes = tasks.filter(t => {
        if (!t.data) return false;
        const d = paraData(t.data);
        return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
    }).length;

    const elMes = document.getElementById('inicioQtdMes');
    if (elMes) elMes.textContent = `${doMes}`;
}

function atualizarPerfil() {
    const total = tasks.length;
    const concluidasAtuais = tasks.filter(t => t.done).length;
    const pendentes = total - concluidasAtuais;
    const taxa = total > 0 ? Math.round((concluidasAtuais / total) * 100) : 0;

    const elTotal = document.getElementById('statTotalTarefas');
    if (elTotal) elTotal.textContent = total;

    const elPendentes = document.getElementById('statTarefasPendentes');
    if (elPendentes) elPendentes.textContent = pendentes;

    const elConcluidas = document.getElementById('statTarefasConcluidas');
    if (elConcluidas) elConcluidas.textContent = totalConcluidasAcumuladas;

    const elTaxa = document.getElementById('statTaxaConclusao');
    if (elTaxa) elTaxa.textContent = `${taxa}%`;

    const profileConcluidas = document.getElementById('profileConcluidas');
    if (profileConcluidas) {
        profileConcluidas.innerHTML = `<i class="bi bi-check2-circle me-1"></i>${totalConcluidasAcumuladas} ${totalConcluidasAcumuladas === 1 ? 'tarefa concluída' : 'tarefas concluídas'}`;
    }
}

// =========================================================
// MINHAS TAREFAS: FILTROS E RENDERIZAÇÃO
// =========================================================
function setFilter(f) {
    filter = f;
    document.querySelectorAll('.filters .btn').forEach(b => b.className = 'btn btn-filter-inactive');
    const btnAtivo = document.getElementById('f-' + f);
    if (btnAtivo) btnAtivo.className = 'btn btn-filter-active';
    render();
}

function render() {
    const totalConcluidasAtuais = tasks.filter(t => t.done).length;

    const contador = document.getElementById('contador');
    if (contador) {
        contador.textContent = `${tasks.length} ${tasks.length === 1 ? 'tarefa' : 'tarefas'} · ${totalConcluidasAtuais} concluídas`;
    }

    atualizarPerfil();
    atualizarInicio();

    let list = tasks;
    if (filter === 'pendentes') list = tasks.filter(t => !t.done);
    if (filter === 'concluidas') list = tasks.filter(t => t.done);

    const c = document.getElementById('taskContainer');
    if (!c) return;

    if (!list.length) {
        c.innerHTML = `<div class="empty-state"><i class="bi bi-inbox"></i><div class="fw-semibold">Nenhuma tarefa por aqui</div><div style="color:var(--muted);font-size:14px">Clique em Nova tarefa para começar</div></div>`;
        return;
    }

    c.innerHTML = list.map(t => `<div class="task-item">
    <button class="check-circle ${t.done ? 'done' : ''}" onclick="toggle(${t.id})">${t.done ? '<i class="bi bi-check-lg"></i>' : ''}</button>
    <div class="flex-grow-1">
      <div class="task-title ${t.done ? 'done' : ''}">${t.titulo}</div>
      ${t.data ? `<div class="chip-data ${ehPassada(t.data) && !t.done ? 'atrasada' : ''}">
        <i class="bi bi-calendar-event me-1"></i>${formatarCurta(t.data)}${ehPassada(t.data) && !t.done ? ' · atrasada' : ''}
      </div>` : ''}
    </div>
    <span class="badge-prio badge-${t.prioridade === 'Alta' ? 'alta' : t.prioridade === 'Média' ? 'media' : 'baixa'}">${t.prioridade}</span>
    <button class="icon-btn" onclick="openEdit(${t.id})"><i class="bi bi-pencil"></i></button>
    <button class="icon-btn" onclick="removeTask(${t.id})"><i class="bi bi-trash"></i></button>
  </div>`).join('');
}

function recarregarTarefas() {
    try {
        const saved = localStorage.getItem('flowlist_tasks');
        tasks = saved ? JSON.parse(saved) : [];
        const savedCount = localStorage.getItem('totalTarefasConcluidas');
        if (savedCount !== null) {
            totalConcluidasAcumuladas = parseInt(savedCount, 10) || 0;
        }
    } catch (e) {
        tasks = [];
    }
    render();
}

function openNew() {
    trocarTela('tela-tarefas');
    editingId = null;
    if (modalTitle) modalTitle.textContent = 'Nova tarefa';
    if (inputTitulo) inputTitulo.value = '';
    if (inputPrioridade) inputPrioridade.value = 'Média';
    if (typeof MiniCal !== 'undefined' && MiniCal.abrir) {
        MiniCal.abrir(null);
    }
    if (erroTarefa) erroTarefa.textContent = '';

    if (taskModal) {
        const modal = bootstrap.Modal.getOrCreateInstance(taskModal);
        modal.show();
    }
}

function openEdit(id) {
    trocarTela('tela-tarefas');
    const t = tasks.find(x => x.id === id);
    if (!t) return;

    editingId = id;
    if (modalTitle) modalTitle.textContent = 'Editar tarefa';
    if (inputTitulo) inputTitulo.value = t.titulo;
    if (inputPrioridade) inputPrioridade.value = t.prioridade;
    if (typeof MiniCal !== 'undefined' && MiniCal.abrir) {
        MiniCal.abrir(t.data || null);
    }
    if (erroTarefa) erroTarefa.textContent = '';

    if (taskModal) {
        const modal = bootstrap.Modal.getOrCreateInstance(taskModal);
        modal.show();
    }
}

function saveTask() {
    const titulo = inputTitulo ? inputTitulo.value.trim() : '';
    if (!titulo) {
        if (erroTarefa) erroTarefa.textContent = 'Digite um título.';
        return;
    }

    const prioridade = inputPrioridade ? inputPrioridade.value : 'Média';
    const data = (typeof MiniCal !== 'undefined' && MiniCal.valor) ? MiniCal.valor() : null;
    if (data && ehPassada(data)) {
        const original = editingId === null ? null : tasks.find(x => x.id === editingId);
        if (!original || original.data !== data) {
            if (erroTarefa) erroTarefa.textContent = 'Não é possível agendar em dias passados. Escolha hoje ou um dia futuro.';
            return;
        }
    }

    if (editingId !== null) {
        const t = tasks.find(x => x.id === editingId);
        if (t) {
            t.titulo = titulo;
            t.prioridade = prioridade;
            t.data = data;
        }
    } else {
        tasks.unshift({ id: Date.now(), titulo, prioridade, data, done: false });
    }

    saveTasksToStorage();

    if (taskModal) {
        const modal = bootstrap.Modal.getInstance(taskModal);
        if (modal) {
            modal.hide();
        }
    }

    render();

    // Sincroniza calendário se estiver instanciado
    if (window.FlowCalendario && typeof window.FlowCalendario.recarregar === 'function') {
        window.FlowCalendario.recarregar();
    }
}

function toggle(id) {
    const t = tasks.find(x => x.id === id);
    if (t) {
        t.done = !t.done;
        if (t.done) {
            updateTotalConcluidas(totalConcluidasAcumuladas + 1);
        } else {
            updateTotalConcluidas(totalConcluidasAcumuladas - 1);
        }
        saveTasksToStorage();
        render();

        if (window.FlowCalendario && typeof window.FlowCalendario.recarregar === 'function') {
            window.FlowCalendario.recarregar();
        }
    }
}

function removeTask(id) {
    if (!confirm('Excluir?')) return;
    tasks = tasks.filter(x => x.id !== id);
    saveTasksToStorage();
    render();

    if (window.FlowCalendario && typeof window.FlowCalendario.recarregar === 'function') {
        window.FlowCalendario.recarregar();
    }
}

// Botão de voltar para tela.html
function voltar() {
    window.location.href = 'tela.html';
}

function irParaCalendario() {
    trocarTela('tela-calendario');
}

if (buttonVoltar) {
    buttonVoltar.addEventListener('click', voltar);
}

if (typeof MiniCal !== 'undefined' && MiniCal.iniciar) {
    MiniCal.iniciar({
        obterOcupadas: () => tasks.filter(t => t.data && !t.done).map(t => t.data)
    });
}

// Inicializa renderização dos dados
render();

// Restaura aba salva ou abre tela inicial
const abaSalva = sessionStorage.getItem('flowlist_aba_ativa');
if (abaSalva && document.getElementById(abaSalva)) {
    trocarTela(abaSalva);
} else {
    trocarTela('tela-inicio');
}
