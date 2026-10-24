let tarefas = [];

const inputTarefa = document.getElementById('input-tarefa');
const btnAdicionar = document.getElementById('btn-adicionar');
const dataAtual = document.getElementById('data-atual');
const mensagemVazia = document.getElementById('mensagem-vazia');

const countAll = document.getElementById('count-all');
const countTodo = document.getElementById('count-todo');
const countDone = document.getElementById('count-done');

function configurarData() {
    const hoje = new Date().toLocaleDateString('pt-BR');
    dataAtual.textContent = hoje;
}

function gerarId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function adicionarTarefa() {
    const texto = inputTarefa.value.trim();

    if (texto === '') {
        inputTarefa.classList.add('is-invalid');
        setTimeout(() => inputTarefa.classList.remove('is-invalid'), 2000);
        return;
    }

    const tarefa = {
        id: gerarId(),
        texto: texto,
        concluida: false,
        dataCriacao: new Date()
    };

    tarefas.push(tarefa);
    inputTarefa.value = '';
    renderizarTarefas();
    salvarTarefas();
}

function alternarTarefa(id) {
    const tarefa = tarefas.find(t => t.id === id);
    if (tarefa) {
        tarefa.concluida = !tarefa.concluida;
        renderizarTarefas();
        salvarTarefas();
    }
}

function deletarTarefa(id) {
    if (confirm('Deseja realmente excluir esta tarefa?')) {
        tarefas = tarefas.filter(t => t.id !== id);
        renderizarTarefas();
        salvarTarefas();
    }
}

function criarElementoTarefa(tarefa) {
    const div = document.createElement('div');
    div.className = `list-group-item list-group-item-action d-flex align-items-center ${tarefa.concluida ? 'task-concluida' : ''}`;

    div.innerHTML = `
        <div class="form-check flex-grow-1">
            <input class="form-check-input" type="checkbox" 
                   ${tarefa.concluida ? 'checked' : ''} 
                   onchange="alternarTarefa('${tarefa.id}')"
                   id="check-${tarefa.id}">
            <label class="form-check-label ms-2 flex-grow-1" for="check-${tarefa.id}">
                ${tarefa.texto}
            </label>
        </div>
        <button class="btn btn-sm btn-outline-danger ms-2" onclick="deletarTarefa('${tarefa.id}')">
           <p>x</p>
        </button>
    `;

    return div;
}

function renderizarTarefas() {
    const listaAll = document.getElementById('lista-all');
    const listaTodo = document.getElementById('lista-todo');
    const listaDone = document.getElementById('lista-done');

    listaAll.innerHTML = '';
    listaTodo.innerHTML = '';
    listaDone.innerHTML = '';

    let countAllValue = 0;
    let countTodoValue = 0;
    let countDoneValue = 0;

    tarefas.forEach(tarefa => {
        countAllValue++;

        if (tarefa.concluida) {
            countDoneValue++;
            listaDone.appendChild(criarElementoTarefa(tarefa));
        } else {
            countTodoValue++;
            listaTodo.appendChild(criarElementoTarefa(tarefa));
        }

        listaAll.appendChild(criarElementoTarefa(tarefa));
    });

    countAll.textContent = countAllValue;
    countTodo.textContent = countTodoValue;
    countDone.textContent = countDoneValue;

    if (tarefas.length === 0) {
        mensagemVazia.classList.add('mostrar');
    } else {
        mensagemVazia.classList.remove('mostrar');
    }
}

function salvarTarefas() {
    localStorage.setItem('tarefas', JSON.stringify(tarefas));
}

function carregarTarefas() {
    const tarefasSalvas = localStorage.getItem('tarefas');
    if (tarefasSalvas) {
        tarefas = JSON.parse(tarefasSalvas);
        renderizarTarefas();
    }
}

btnAdicionar.addEventListener('click', adicionarTarefa);

inputTarefa.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        adicionarTarefa();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    configurarData();
    carregarTarefas();

    inputTarefa.focus();
});

window.alternarTarefa = alternarTarefa;
window.deletarTarefa = deletarTarefa;