let tasks = [];
try {
    const saved = localStorage.getItem('flowlist_tasks');
    if (saved) {
        tasks = JSON.parse(saved);
    }
} catch (e) {
    tasks = [];
}

let filter = 'todas';
let editingId = null;
let filtroData = null;
let sideCalVisao = { ano: HOJE.getFullYear(), mes: HOJE.getMonth() };

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
const mainTasksTitle = document.getElementById('mainTasksTitle');
const filtroDataContainer = document.getElementById('filtroDataContainer');

function setFilter(f) {
    filter = f;
    document.querySelectorAll('.filters .btn').forEach(b => b.className = 'btn btn-filter-inactive');
    const ativo = document.getElementById('f-' + f);
    if (ativo) ativo.className = 'btn btn-filter-active';
    render();
}

function limparFiltroData() {
    filtroData = null;
    render();
}

function initSidebarCal() {
    const elDias = document.getElementById('sideCalDiasSemana');
    if (elDias) {
        elDias.innerHTML = DIAS_SEMANA.map(d => `<div>${d}</div>`).join('');
    }

    const prevBtn = document.getElementById('sideCalPrev');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            sideCalVisao.mes--;
            if (sideCalVisao.mes < 0) {
                sideCalVisao.mes = 11;
                sideCalVisao.ano--;
            }
            renderSidebarCal();
        });
    }

    const nextBtn = document.getElementById('sideCalNext');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            sideCalVisao.mes++;
            if (sideCalVisao.mes > 11) {
                sideCalVisao.mes = 0;
                sideCalVisao.ano++;
            }
            renderSidebarCal();
        });
    }

    const hojeBtn = document.getElementById('sideCalHoje');
    if (hojeBtn) {
        hojeBtn.addEventListener('click', () => {
            sideCalVisao = { ano: HOJE.getFullYear(), mes: HOJE.getMonth() };
            filtroData = CHAVE_HOJE;
            render();
        });
    }

    const grade = document.getElementById('sideCalGrade');
    if (grade) {
        grade.addEventListener('click', (e) => {
            const celula = e.target.closest('.side-cal-cell');
            if (!celula) return;
            const chave = celula.dataset.chave;
            if (filtroData === chave) {
                filtroData = null;
            } else {
                filtroData = chave;
            }
            render();
        });
    }
}

function renderSidebarCal() {
    const titulo = document.getElementById('sideCalTitulo');
    const grade = document.getElementById('sideCalGrade');
    if (!titulo || !grade) return;

    titulo.textContent = `${MESES[sideCalVisao.mes]} ${sideCalVisao.ano}`;

    const primeiroDia = new Date(sideCalVisao.ano, sideCalVisao.mes, 1);
    const deslocamento = (primeiroDia.getDay() + 6) % 7;
    const totalDias = new Date(sideCalVisao.ano, sideCalVisao.mes + 1, 0).getDate();
    const celulas = Math.ceil((deslocamento + totalDias) / 7) * 7;

    let html = '';
    for (let i = 0; i < celulas; i++) {
        const data = new Date(sideCalVisao.ano, sideCalVisao.mes, i - deslocamento + 1);
        const k = chaveLocal(data);
        const tarefasDoDia = tasks.filter(t => t.data === k);
        const passada = ehPassada(k);
        const clases = ['side-cal-cell'];

        if (data.getMonth() !== sideCalVisao.mes) clases.push('fora');
        if (passada) clases.push('passado');
        if (k === CHAVE_HOJE) clases.push('hoje');
        if (k === filtroData) clases.push('selecionada');

        const marcas = tarefasDoDia.slice(0, 3).map(t => {
            const cor = t.done ? 'feito' : (t.prioridade === 'Alta' ? 'alta' : t.prioridade === 'Média' ? 'media' : 'baixa');
            return `<i class="dot dot-${cor}"></i>`;
        }).join('');
        const extras = tarefasDoDia.length > 3
            ? `<span class="rotulo-mais">+${tarefasDoDia.length - 3}</span>` : '';

        html += `<button type="button" class="${clases.join(' ')}" data-chave="${k}" title="${data.getDate()} de ${MESES[data.getMonth()]} (${tarefasDoDia.length} tarefa${tarefasDoDia.length === 1 ? '' : 's'})">
                    <span class="numero">${data.getDate()}</span>
                    <span class="marcas">${marcas}${extras}</span>
                </button>`;
    }
    grade.innerHTML = html;
}

function render() {
    const totalConcluidasAtuais = tasks.filter(t => t.done).length;

    // Atualiza estatística do perfil na barra lateral
    const profileConcluidas = document.getElementById('profileConcluidas');
    if (profileConcluidas) {
        profileConcluidas.innerHTML = `<i class="bi bi-check2-circle me-1"></i>${totalConcluidasAcumuladas} ${totalConcluidasAcumuladas === 1 ? 'tarefa concluída' : 'tarefas concluídas'}`;
    }

    // Filtragem por status
    let list = tasks;
    if (filter === 'pendentes') list = tasks.filter(t => !t.done);
    if (filter === 'concluidas') list = tasks.filter(t => t.done);

    // Filtragem por data selecionada no calendário
    if (filtroData) {
        list = list.filter(t => t.data === filtroData);
    }

    // Atualiza título da seção de tarefas
    if (mainTasksTitle) {
        if (filtroData) {
            mainTasksTitle.textContent = `Tarefas de ${formatarLonga(filtroData)}`;
        } else {
            mainTasksTitle.textContent = 'Minhas tarefas';
        }
    }

    // Atualiza contador
    const contador = document.getElementById('contador');
    if (contador) {
        if (filtroData) {
            const concluidasDia = list.filter(t => t.done).length;
            contador.textContent = `${list.length} ${list.length === 1 ? 'tarefa' : 'tarefas'} neste dia · ${concluidasDia} concluída${concluidasDia === 1 ? '' : 's'}`;
        } else {
            contador.textContent = `${tasks.length} ${tasks.length === 1 ? 'tarefa' : 'tarefas'} · ${totalConcluidasAtuais} concluídas`;
        }
    }

    // Atualiza indicador do filtro de data ativo
    if (filtroDataContainer) {
        if (filtroData) {
            filtroDataContainer.innerHTML = `
                <div class="filtro-data-pill">
                    <i class="bi bi-calendar-event"></i>
                    <span>${formatarCurta(filtroData)}</span>
                    <button type="button" onclick="limparFiltroData()" title="Limpar filtro de data">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
            `;
        } else {
            filtroDataContainer.innerHTML = '';
        }
    }

    const c = document.getElementById('taskContainer');
    if (!c) return;

    if (!list.length) {
        if (filtroData) {
            c.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-calendar-x"></i>
                    <div class="fw-semibold">Nenhuma tarefa para este dia</div>
                    <div style="color:var(--muted);font-size:14px">Clique em Nova tarefa para agendar ou selecione outro dia</div>
                </div>
            `;
        } else {
            c.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-inbox"></i>
                    <div class="fw-semibold">Nenhuma tarefa por aqui</div>
                    <div style="color:var(--muted);font-size:14px">Clique em Nova tarefa para começar</div>
                </div>
            `;
        }
        renderSidebarCal();
        return;
    }

    c.innerHTML = list.map(t => `<div class="task-item">
    <button class="check-circle ${t.done ? 'done' : ''}" onclick="toggle(${t.id})" aria-label="Marcar como concluída">${t.done ? '<i class="bi bi-check-lg"></i>' : ''}</button>
    <div class="flex-grow-1">
      <div class="task-title ${t.done ? 'done' : ''}">${t.titulo}</div>
      ${t.data ? `<div class="chip-data ${ehPassada(t.data) && !t.done ? 'atrasada' : ''}">
        <i class="bi bi-calendar-event me-1"></i>${formatarCurta(t.data)}${ehPassada(t.data) && !t.done ? ' · atrasada' : ''}
      </div>` : ''}
    </div>
    <span class="badge-prio badge-${t.prioridade === 'Alta' ? 'alta' : t.prioridade === 'Média' ? 'media' : 'baixa'}">${t.prioridade}</span>
    <button class="icon-btn" onclick="openEdit(${t.id})" title="Editar"><i class="bi bi-pencil"></i></button>
    <button class="icon-btn" onclick="removeTask(${t.id})" title="Excluir"><i class="bi bi-trash"></i></button>
  </div>`).join('');

    renderSidebarCal();
}

function openNew() {
    editingId = null;
    modalTitle.textContent = 'Nova tarefa';
    inputTitulo.value = '';
    inputPrioridade.value = 'Média';
    const dataInicial = (filtroData && !ehPassada(filtroData)) ? filtroData : null;
    MiniCal.abrir(dataInicial);
    erroTarefa.textContent = '';
}

function openEdit(id) {
    const t = tasks.find(x => x.id === id);
    if (!t) return;

    editingId = id;
    modalTitle.textContent = 'Editar tarefa';
    inputTitulo.value = t.titulo;
    inputPrioridade.value = t.prioridade;
    MiniCal.abrir(t.data || null);
    erroTarefa.textContent = '';

    const modal = bootstrap.Modal.getOrCreateInstance(taskModal);
    modal.show();
}

function saveTask() {
    const titulo = inputTitulo.value.trim();
    if (!titulo) {
        erroTarefa.textContent = 'Digite um título.';
        return;
    }

    const prioridade = inputPrioridade.value;
    const data = MiniCal.valor();
    if (data && ehPassada(data)) {
        const original = editingId === null ? null : tasks.find(x => x.id === editingId);
        if (!original || original.data !== data) {
            erroTarefa.textContent = 'Não é possível agendar em dias passados. Escolha hoje ou um dia futuro.';
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

    const modal = bootstrap.Modal.getInstance(taskModal);
    if (modal) {
        modal.hide();
    }
    render();
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
    }
}

function removeTask(id) {
    if (!confirm('Excluir?')) return;
    tasks = tasks.filter(x => x.id !== id);
    saveTasksToStorage();
    render();
}

function voltar() {
    window.location.href = 'tela.html';
}

function irParaCalendario() {
    window.location.href = 'calendario.html';
}

if (buttonVoltar) {
    buttonVoltar.addEventListener('click', voltar);
}

MiniCal.iniciar({
    obterOcupadas: () => tasks.filter(t => t.data && !t.done).map(t => t.data)
});

initSidebarCal();
render();
