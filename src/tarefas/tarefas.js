// As tarefas vêm do storage.js (separadas por usuário logado)
let tasks = obterTarefasParaTela();

let filter = 'pendentes', editingId = null;

// Contador cumulativo de tarefas concluídas 
let totalConcluidasAcumuladas = obterTotalConcluidas();

function updateTotalConcluidas(val) {
    totalConcluidasAcumuladas = Math.max(0, val);
    definirTotalConcluidas(totalConcluidasAcumuladas);
}

function saveTasksToStorage() {
    const salvo = gravarTarefasDaTela(tasks);
    const aviso = document.getElementById('avisoTarefas');

    if (aviso) {
        aviso.hidden = salvo;
        aviso.textContent = salvo ? '' : 'Não foi possível salvar as alterações. Verifique o espaço disponível e tente novamente.';
    }

    return salvo;
}

const modalTitle = document.getElementById('modalTitle');
const inputTitulo = document.getElementById('inputTitulo');
const inputPrioridade = document.getElementById('inputPrioridade');
const erroTarefa = document.getElementById('erroTarefa');
const taskModal = document.getElementById('taskModal');
const taskContainer = document.getElementById('taskContainer');

document.getElementById('btnCalendario').addEventListener('click', () => trocarTela('tela-calendario'));
document.getElementById('btnNovaTarefa').addEventListener('click', openNew);
document.getElementById('btnSaveTask').addEventListener('click', saveTask);

document.querySelectorAll('[data-filtro]').forEach((botao) => {
    botao.addEventListener('click', () => setFilter(botao.dataset.filtro));
});

taskContainer.addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-acao]');
    if (!botao || !taskContainer.contains(botao)) return;

    const id = Number(botao.dataset.id);
    if (!Number.isSafeInteger(id)) return;

    if (botao.dataset.acao === 'toggle') toggle(id);
    if (botao.dataset.acao === 'edit') openEdit(id);
    if (botao.dataset.acao === 'delete') removeTask(id);
});


function setFilter(f) {
    filter = f;
    document.querySelectorAll('.filters .btn').forEach(b => {
        const ativo = b.id === 'f-' + f;
        b.className = ativo ? 'btn btn-filter-active' : 'btn btn-filter-inactive';
        b.setAttribute('aria-pressed', String(ativo));
    });
    render();
}

function escaparTexto(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function tarefaAtrasada(t) {
    return !t.done && Boolean(t.data) && ehPassada(t.data);
}

function render() {
    const totalConcluidasAtuais = tasks.filter(t => t.done).length;
    const totalAtrasadas = tasks.filter(tarefaAtrasada).length;

    const contador = document.getElementById('contador');
    if (contador) {
        const pendentes = tasks.length - totalConcluidasAtuais;
        contador.innerHTML = `<span>${tasks.length} ${tasks.length === 1 ? 'tarefa' : 'tarefas'}</span><span>${pendentes} ${pendentes === 1 ? 'pendente' : 'pendentes'}</span><span class="${totalAtrasadas ? 'tasks-count-overdue' : ''}">${totalAtrasadas} ${totalAtrasadas === 1 ? 'atrasada' : 'atrasadas'}</span><span>${totalConcluidasAtuais} ${totalConcluidasAtuais === 1 ? 'concluída' : 'concluídas'}</span>`;
    }

    const progressoTexto = document.getElementById('progressoTexto');
    const progresso = document.getElementById('progressoTarefas');
    if (progressoTexto) progressoTexto.textContent = `${totalConcluidasAtuais} de ${tasks.length} ${tasks.length === 1 ? 'tarefa concluída' : 'tarefas concluídas'}`;
    if (progresso) {
        progresso.max = Math.max(1, tasks.length);
        progresso.value = totalConcluidasAtuais;
    }

    let list = [...tasks].sort((a, b) => Number(a.done) - Number(b.done));
    if (filter === 'pendentes') list = tasks.filter(t => !t.done);
    if (filter === 'atrasadas') list = tasks.filter(tarefaAtrasada);
    if (filter === 'concluidas') list = tasks.filter(t => t.done);

    const c = taskContainer;
    if (!c) return;

    if (!list.length) {
        if (filter === 'atrasadas') {
            c.innerHTML = '<div class="empty-state"><i class="bi bi-check-circle"></i><div class="fw-semibold">Nenhuma tarefa atrasada</div></div>';
            return;
        }
        c.innerHTML = '<div class="empty-state"><i class="bi bi-inbox"></i><div class="fw-semibold">Nenhuma tarefa por aqui</div><div class="task-empty-hint">Clique em Nova tarefa para começar</div></div>';
        return;
    }

    c.innerHTML = list.map(t => `<div class="task-item">
    <button class="check-circle ${t.done ? 'done' : ''}" data-acao="toggle" data-id="${escaparTexto(t.id)}" aria-label="${t.done ? 'Marcar como pendente' : 'Concluir tarefa'}" aria-pressed="${Boolean(t.done)}">${t.done ? '<i class="bi bi-check-lg"></i>' : ''}</button>
    <div class="task-content">
      <div class="task-title ${t.done ? 'done' : ''}">${escaparTexto(t.titulo)}</div>
      ${t.data ? `<div class="chip-data ${tarefaAtrasada(t) ? 'atrasada' : ''}">
        <i class="bi bi-calendar-event me-1"></i>${formatarCurta(t.data)}${tarefaAtrasada(t) ? ' · atrasada' : ''}
      </div>` : ''}
    </div>
    <span class="badge-prio badge-${t.prioridade === 'Alta' ? 'alta' : t.prioridade === 'Média' ? 'media' : 'baixa'}">${escaparTexto(t.prioridade)}</span>
    <button class="icon-btn" data-acao="edit" data-id="${escaparTexto(t.id)}" title="${t.done ? 'Tarefa concluída não pode ser editada' : 'Editar tarefa'}" aria-label="Editar tarefa" ${t.done ? 'disabled' : ''}><i class="bi bi-pencil"></i></button>
    <button class="icon-btn" data-acao="delete" data-id="${escaparTexto(t.id)}" title="Excluir tarefa" aria-label="Excluir tarefa"><i class="bi bi-trash"></i></button>
  </div>`).join('');
}

function recarregarTarefas() {
    tasks = obterTarefasParaTela();
    totalConcluidasAcumuladas = obterTotalConcluidas();
    render();
}

function openNew() {
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
    const t = tasks.find(x => x.id === id);
    if (!t || t.done) return;

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
    if (editingId !== null) {
        const original = tasks.find(x => x.id === editingId);
        if (!original || original.done) {
            if (erroTarefa) erroTarefa.textContent = 'Tarefas concluídas não podem ser editadas.';
            return;
        }
    }
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

    const tarefasAnteriores = tasks.map(t => ({ ...t }));

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

    if (!saveTasksToStorage()) {
        tasks = tarefasAnteriores;
        if (erroTarefa) erroTarefa.textContent = 'Não foi possível salvar. Verifique o espaço disponível e tente novamente.';
        render();
        return;
    }

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
        if (!saveTasksToStorage()) {
            t.done = !t.done;
            render();
            return;
        }
        if (t.done) {
            updateTotalConcluidas(totalConcluidasAcumuladas + 1);
        } else {
            updateTotalConcluidas(totalConcluidasAcumuladas - 1);
        }
        render();

        if (window.FlowCalendario && typeof window.FlowCalendario.recarregar === 'function') {
            window.FlowCalendario.recarregar();
        }
    }
}

function removeTask(id) {
    if (!confirm('Excluir?')) return;
    const tarefasAnteriores = tasks;
    tasks = tasks.filter(x => x.id !== id);
    if (!saveTasksToStorage()) {
        tasks = tarefasAnteriores;
        render();
        return;
    }
    render();

    if (window.FlowCalendario && typeof window.FlowCalendario.recarregar === 'function') {
        window.FlowCalendario.recarregar();
    }
}

if (typeof MiniCal !== 'undefined' && MiniCal.iniciar) {
    MiniCal.iniciar({
        obterOcupadas: () => tasks.filter(t => t.data && !t.done).map(t => t.data)
    });
}

// Inicializa renderização dos dados
render();
