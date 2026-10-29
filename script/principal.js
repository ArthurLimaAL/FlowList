let tasks = [], filter = 'todas', editingId = null;

// Declarar variáveis globais corretamente
const modalTitle = document.getElementById('modalTitle');
const inputTitulo = document.getElementById('inputTitulo');
const inputPrioridade = document.getElementById('inputPrioridade');
const taskModal = document.getElementById('taskModal');

function setFilter(f) {
    filter = f;
    document.querySelectorAll('.filters .btn').forEach(b => b.className = 'btn btn-filter-inactive');
    document.getElementById('f-' + f).className = 'btn btn-filter-active';
    render();
}

function render() {
    document.getElementById('contador').textContent = `${tasks.length} ${tasks.length === 1 ? 'tarefa' : 'tarefas'} · ${tasks.filter(t => t.done).length} concluídas`;

    let list = tasks;
    if (filter === 'pendentes') list = tasks.filter(t => !t.done);
    if (filter === 'concluidas') list = tasks.filter(t => t.done);

    const c = document.getElementById('taskContainer');

    if (!list.length) {
        c.innerHTML = `<div class="empty-state"><i class="bi bi-inbox"></i><div class="fw-semibold">Nenhuma tarefa por aqui</div><div style="color:var(--muted);font-size:14px">Clique em Nova tarefa para começar</div></div>`;
        return;
    }

    c.innerHTML = list.map(t => `<div class="task-item">
    <button class="check-circle ${t.done ? 'done' : ''}" onclick="toggle(${t.id})">${t.done ? '<i class="bi bi-check-lg"></i>' : ''}</button>
    <div class="flex-grow-1"><div class="task-title ${t.done ? 'done' : ''}">${t.titulo}</div></div>
    <span class="badge-prio badge-${t.prioridade === 'Alta' ? 'alta' : t.prioridade === 'Média' ? 'media' : 'baixa'}">${t.prioridade}</span>
    <button class="icon-btn" onclick="openEdit(${t.id})"><i class="bi bi-pencil"></i></button>
    <button class="icon-btn" onclick="removeTask(${t.id})"><i class="bi bi-trash"></i></button>
  </div>`).join('');
}

function openNew() {
    editingId = null;
    modalTitle.textContent = 'Nova tarefa';
    inputTitulo.value = '';
    inputPrioridade.value = 'Média';
    showModal();
}

function openEdit(id) {
    const t = tasks.find(x => x.id === id);
    if (!t) return;

    editingId = id;
    modalTitle.textContent = 'Editar tarefa';
    inputTitulo.value = t.titulo;
    inputPrioridade.value = t.prioridade;
    
    showModal();
}

function showModal() {
    taskModal.classList.add('show');
    // Focar no input automaticamente
    setTimeout(() => inputTitulo.focus(), 100);
}

function closeModal() {
    taskModal.classList.remove('show');
    editingId = null;
}

function saveTask() {
    const titulo = inputTitulo.value.trim();
    if (!titulo) return alert('Digite um título');
    const prioridade = inputPrioridade.value;

    if (editingId !== null) {
        const t = tasks.find(x => x.id === editingId);
        if (t) {
            t.titulo = titulo;
            t.prioridade = prioridade;
        }
    } else {
        tasks.unshift({ id: Date.now(), titulo, prioridade, done: false });
    }

    closeModal();
    render();
}

function toggle(id) {
    const t = tasks.find(x => x.id === id);
    if (t) {
        t.done = !t.done;
        render();
    }
}

function removeTask(id) {
    if (!confirm('Excluir?')) return;
    tasks = tasks.filter(x => x.id !== id);
    render();
}

// Fechar modal com tecla ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});

render();