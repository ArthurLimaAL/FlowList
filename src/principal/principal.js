const usuario = obterUsuarioLogado();

if (!usuario) {
  // ninguém logado: volta para o login
  window.location.replace("../login/login.html");
  throw new Error("Nenhum usuário logado.");   // interrompe o resto do arquivo
}

// pega só o primeiro nome
document.getElementById("nomeUsuario").textContent = usuario.nome.split(" ")[0];

//  PRAZO 
const botaoPrazo = document.getElementById("botaoPrazo");
const campoPrazo = document.getElementById("campoPrazo");
const textoPrazo = document.getElementById("textoPrazo");

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

// Transforma "2026-11-12" em "12 nov"
function formatarPrazo(valor) {
  const [, mes, dia] = valor.split("-");
  return `${Number(dia)} ${MESES[Number(mes) - 1]}`;
}

// Devolve a data de hoje no formato "2026-11-06"
function dataDeHoje() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

// Clicar no botão abre o calendário escondido embaixo dele
botaoPrazo.addEventListener("click", () => {
  campoPrazo.min = dataDeHoje();   
  campoPrazo.showPicker();
});

// Quando o usuário escolhe uma data, o botão passa a mostrar ela
campoPrazo.addEventListener("change", () => {
  textoPrazo.textContent = campoPrazo.value ? formatarPrazo(campoPrazo.value) : "Prazo";
});

// CRIAR TAREFA
const formTarefa = document.getElementById("formTarefa");
const campoTarefa = document.getElementById("campoTarefa");
const mensagemTarefa = document.getElementById("mensagemTarefa");

function mostrarMensagemTarefa(texto, sucesso) {
  mensagemTarefa.textContent = texto;
  mensagemTarefa.classList.toggle("sucesso", sucesso);

  setTimeout(() => {
    mensagemTarefa.textContent = "";
  }, 3000);
}

formTarefa.addEventListener("submit", (e) => {
  e.preventDefault();   // impede a página de recarregar

  const titulo = campoTarefa.value.trim();
  if (titulo === "") {
    mostrarMensagemTarefa("Digite o nome da tarefa.", false);
    campoTarefa.focus();
    return;
  }

  const prazo = campoPrazo.value || dataDeHoje();
  const escolhida = formTarefa.querySelector('input[name="prioridade"]:checked');
  const prioridade = escolhida ? escolhida.value : "media";

  //não aceita data que já passou
  if (prazo < dataDeHoje()) {
    mostrarMensagemTarefa("Escolha uma data de hoje em diante.", false);
    return;
  }

  const resultado = salvarTarefa({ titulo, prazo, prioridade });

  if (resultado.sucesso) {
    formTarefa.reset();                 // limpa campo, data e prioridade
    textoPrazo.textContent = "Prazo";   // o reset não mexe no texto do botão
    mostrarMensagemTarefa("Tarefa criada!", true);
    carregarInicio();                   // atualiza a tela com a tarefa nova
  } else {
    mostrarMensagemTarefa(resultado.mensagem, false);
  }
});

//  LISTA DE TAREFAS

const estadoVazio = document.getElementById("estadoVazio");
const areaTarefas = document.getElementById("areaTarefas");
const slotFormulario = document.getElementById("slotFormulario");
const blocoAtrasadas = document.getElementById("blocoAtrasadas");
const listaAtrasadas = document.getElementById("listaAtrasadas");
const listaHoje = document.getElementById("listaHoje");
const semTarefasHoje = document.getElementById("semTarefasHoje");
const textoBotaoCriar = document.getElementById("textoBotaoCriar");
const subtitulo = document.querySelector(".subtitulo-boas-vindas");
const modeloTarefa = document.getElementById("modeloTarefa");

const ORDEM_PRIORIDADE = { alta: 0, media: 1, baixa: 2 };
const NOMES_PRIORIDADE = { alta: "Alta", media: "Média", baixa: "Baixa" };


function criarLinhaTarefa(tarefa, atrasada) {
  const li = modeloTarefa.content.firstElementChild.cloneNode(true);
  li.classList.toggle("concluida", tarefa.concluida);

  const check = li.querySelector(".tarefa-check");
  check.setAttribute("aria-label", tarefa.concluida ? "Marcar como pendente" : "Marcar como concluída");
  check.addEventListener("click", () => {
    if (!alternarConclusaoTarefa(tarefa.id)) {
      mostrarMensagemTarefa("Não foi possível salvar a alteração. Tente novamente.", false);
      return;
    }
    carregarInicio();
  });

  li.querySelector(".tarefa-titulo").textContent = tarefa.titulo;

  const etiqueta = li.querySelector(".etiqueta");
  etiqueta.classList.add("etiqueta-" + tarefa.prioridade);
  etiqueta.textContent = NOMES_PRIORIDADE[tarefa.prioridade];

  const prazo = li.querySelector(".tarefa-prazo");
  prazo.classList.toggle("atrasada", atrasada);
  prazo.textContent = tarefa.prazo === dataDeHoje() ? "Hoje" : formatarPrazo(tarefa.prazo);

  return li;
}

// Decide o que mostrar no Início
function carregarInicio() {
  const tarefas = obterTarefas();
  const hoje = dataDeHoje();

  // Nenhuma tarefa criada ainda: mostra o cartão de boas-vindas
  if (tarefas.length === 0) {
    areaTarefas.hidden = true;
    estadoVazio.hidden = false;
    estadoVazio.appendChild(formTarefa);   // o formulário volta para dentro do cartão
    textoBotaoCriar.textContent = "Criar primeira tarefa";
    subtitulo.textContent = "Vamos deixar tudo pronto em poucos passos.";
    return;
  }

  // Já tem tarefas: mostra a lista
  estadoVazio.hidden = true;
  areaTarefas.hidden = false;
  slotFormulario.appendChild(formTarefa);   // o formulário vai para cima da lista
  textoBotaoCriar.textContent = "Adicionar";

  const atrasadas = tarefas
    .filter((t) => !t.concluida && t.prazo < hoje)
    .sort((a, b) => a.prazo.localeCompare(b.prazo));

  const deHoje = tarefas
    .filter((t) => t.prazo === hoje)
    .sort((a, b) =>
      Number(a.concluida) - Number(b.concluida) ||
      ORDEM_PRIORIDADE[a.prioridade] - ORDEM_PRIORIDADE[b.prioridade]
    );

  listaAtrasadas.replaceChildren(...atrasadas.map((t) => criarLinhaTarefa(t, true)));
  listaHoje.replaceChildren(...deHoje.map((t) => criarLinhaTarefa(t, false)));

  blocoAtrasadas.hidden = atrasadas.length === 0;
  listaHoje.hidden = deHoje.length === 0;
  semTarefasHoje.hidden = deHoje.length !== 0;

  const pendentes = atrasadas.length + deHoje.filter((t) => !t.concluida).length;
  if (pendentes === 0) {
    subtitulo.textContent = "Tudo em dia por enquanto.";
  } else if (pendentes === 1) {
    subtitulo.textContent = "Você tem 1 tarefa pendente.";
  } else {
    subtitulo.textContent = `Você tem ${pendentes} tarefas pendentes.`;
  }
}

carregarInicio();   