// VERIFICAÇÃO DE SESSÃO DO USUÁRIO
const usuarioLogado = obterUsuarioLogado();

if (!usuarioLogado) {
  window.location.href = "../login/index.html";
}

// CONSTANTES E UTILITÁRIOS DE DATA E PRIORIDADE
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MESES_COMPLETOS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];
const DIAS_SEMANA_COMPLETOS = [
  "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
  "Quinta-feira", "Sexta-feira", "Sábado"
];

const ORDEM_PRIORIDADE = { alta: 0, media: 1, baixa: 2 };
const NOMES_PRIORIDADE = { alta: "Alta", media: "Média", baixa: "Baixa" };

// Retorna a data de hoje no formato "AAAA-MM-DD"
function dataDeHoje() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

// Transforma "2026-11-12" em "12 nov", "Hoje" ou "Amanhã"
function formatarPrazo(valor) {
  if (!valor) return "Sem data";
  const hoje = dataDeHoje();
  if (valor === hoje) return "Hoje";

  const dataAlvo = new Date(valor + "T00:00:00");
  const dataHoje = new Date(hoje + "T00:00:00");
  const diffDias = Math.round((dataAlvo - dataHoje) / (1000 * 60 * 60 * 24));

  if (diffDias === 1) return "Amanhã";
  if (diffDias === -1) return "Ontem";

  const [, mes, dia] = valor.split("-");
  return `${Number(dia)} ${MESES[Number(mes) - 1]}`;
}

// Formatação amigável para cabeçalho do calendário: "Quinta-feira, 12 de novembro"
function formatarDataCompleta(valor) {
  if (!valor) return "";
  const [ano, mes, dia] = valor.split("-");
  const data = new Date(Number(ano), Number(mes) - 1, Number(dia));
  const diaSemana = DIAS_SEMANA_COMPLETOS[data.getDay()];
  const nomeMes = MESES_COMPLETOS[Number(mes) - 1];
  return `${diaSemana}, ${Number(dia)} de ${nomeMes.toLowerCase()}`;
}

// ==========================================
// NAVEGAÇÃO ENTRE ABAS DA BARRA LATERAL
// ==========================================
let abaAtual = "inicio";

const botoesMenu = document.querySelectorAll(".menu-item[data-aba]");
const paineis = {
  inicio: document.getElementById("painelInicio"),
  tarefas: document.getElementById("painelTarefas"),
  calendario: document.getElementById("painelCalendario"),
  perfil: document.getElementById("painelPerfil")
};

function alternarAba(nomeAba) {
  abaAtual = nomeAba;

  // Atualiza destaque no menu lateral
  botoesMenu.forEach((btn) => {
    btn.classList.toggle("ativo", btn.dataset.aba === nomeAba);
  });

  // Mostra apenas o painel correspondente
  Object.keys(paineis).forEach((chave) => {
    if (paineis[chave]) {
      paineis[chave].hidden = chave !== nomeAba;
    }
  });

  // Atualiza a visualização do painel ativo
  if (nomeAba === "inicio") {
    carregarInicio();
  } else if (nomeAba === "tarefas") {
    carregarMinhasTarefas();
  } else if (nomeAba === "calendario") {
    carregarCalendario();
  } else if (nomeAba === "perfil") {
    carregarPerfil();
  }
}

botoesMenu.forEach((btn) => {
  btn.addEventListener("click", () => {
    alternarAba(btn.dataset.aba);
  });
});

// Sair da conta
document.getElementById("botaoSair").addEventListener("click", () => {
  removerUsuarioLogado();
});

// ==========================================
// RENDERIZADOR UNIVERSAL DE LINHA DE TAREFA
// ==========================================
const modeloTarefa = document.getElementById("modeloTarefa");

function criarLinhaTarefa(tarefa, atrasada, onAlteracao) {
  const li = modeloTarefa.content.firstElementChild.cloneNode(true);
  li.classList.toggle("concluida", tarefa.concluida);

  // Checkbox de conclusão
  const check = li.querySelector(".tarefa-check");
  check.setAttribute("aria-label", tarefa.concluida ? "Marcar como pendente" : "Marcar como concluída");
  check.addEventListener("click", (e) => {
    e.stopPropagation();
    alternarConclusaoTarefa(tarefa.id);
    if (typeof onAlteracao === "function") {
      onAlteracao();
    } else {
      sincronizarTelas();
    }
  });

  // Título
  li.querySelector(".tarefa-titulo").textContent = tarefa.titulo;

  // Etiqueta de prioridade
  const etiqueta = li.querySelector(".etiqueta");
  etiqueta.classList.add("etiqueta-" + tarefa.prioridade);
  etiqueta.textContent = NOMES_PRIORIDADE[tarefa.prioridade] || "Média";

  // Prazo
  const prazo = li.querySelector(".tarefa-prazo");
  prazo.classList.toggle("atrasada", atrasada);
  prazo.textContent = formatarPrazo(tarefa.prazo);

  // Botão de exclusão
  const btnExcluir = li.querySelector(".tarefa-btn-excluir");
  if (btnExcluir) {
    btnExcluir.addEventListener("click", (e) => {
      e.stopPropagation();
      excluirTarefa(tarefa.id);
      if (typeof onAlteracao === "function") {
        onAlteracao();
      } else {
        sincronizarTelas();
      }
    });
  }

  return li;
}

// Sincroniza dados entre todas as telas
function sincronizarTelas() {
  carregarInicio();
  if (abaAtual === "tarefas") carregarMinhasTarefas();
  if (abaAtual === "calendario") carregarCalendario();
  if (abaAtual === "perfil") carregarPerfil();
}

// ==========================================
// ABA 1: INÍCIO
// ==========================================
const nomeUsuarioEl = document.getElementById("nomeUsuario");
const estadoVazio = document.getElementById("estadoVazio");
const areaTarefas = document.getElementById("areaTarefas");
const slotFormulario = document.getElementById("slotFormulario");
const blocoAtrasadas = document.getElementById("blocoAtrasadas");
const listaAtrasadas = document.getElementById("listaAtrasadas");
const listaHoje = document.getElementById("listaHoje");
const semTarefasHoje = document.getElementById("semTarefasHoje");
const textoBotaoCriar = document.getElementById("textoBotaoCriar");
const subtituloInicio = document.querySelector(".subtitulo-boas-vindas");

// Formulário do Início
const formTarefa = document.getElementById("formTarefa");
const campoTarefa = document.getElementById("campoTarefa");
const botaoPrazo = document.getElementById("botaoPrazo");
const campoPrazo = document.getElementById("campoPrazo");
const textoPrazo = document.getElementById("textoPrazo");
const mensagemTarefa = document.getElementById("mensagemTarefa");

function mostrarMensagem(el, texto, sucesso) {
  el.textContent = texto;
  el.className = "mensagem-tarefa " + (sucesso ? "sucesso" : "erro");
  setTimeout(() => {
    el.textContent = "";
    el.className = "mensagem-tarefa";
  }, 3500);
}

// Prazo no Início
botaoPrazo.addEventListener("click", () => {
  campoPrazo.min = dataDeHoje();
  if (typeof campoPrazo.showPicker === "function") {
    campoPrazo.showPicker();
  } else {
    campoPrazo.focus();
  }
});

campoPrazo.addEventListener("change", () => {
  textoPrazo.textContent = campoPrazo.value ? formatarPrazo(campoPrazo.value) : "Prazo";
});

// Criação de tarefa no Início
formTarefa.addEventListener("submit", (e) => {
  e.preventDefault();
  const titulo = campoTarefa.value.trim();

  if (titulo === "") {
    mostrarMensagem(mensagemTarefa, "Digite o nome da tarefa.", false);
    campoTarefa.focus();
    return;
  }

  const prazo = campoPrazo.value || dataDeHoje();
  const escolhida = formTarefa.querySelector('input[name="prioridade"]:checked');
  const prioridade = escolhida ? escolhida.value : "media";

  if (prazo < dataDeHoje()) {
    mostrarMensagem(mensagemTarefa, "Escolha uma data de hoje em diante.", false);
    return;
  }

  const resultado = salvarTarefa({ titulo, prazo, prioridade });
  if (resultado.sucesso) {
    formTarefa.reset();
    textoPrazo.textContent = "Prazo";
    mostrarMensagem(mensagemTarefa, "Tarefa criada com sucesso!", true);
    sincronizarTelas();
  } else {
    mostrarMensagem(mensagemTarefa, resultado.mensagem, false);
  }
});

function carregarInicio() {
  const usuario = obterUsuarioLogado();
  if (usuario && nomeUsuarioEl) {
    nomeUsuarioEl.textContent = usuario.nome.split(" ")[0];
  }

  const tarefas = obterTarefas();
  const hoje = dataDeHoje();

  if (tarefas.length === 0) {
    areaTarefas.hidden = true;
    estadoVazio.hidden = false;
    estadoVazio.appendChild(formTarefa);
    textoBotaoCriar.textContent = "Criar primeira tarefa";
    subtituloInicio.textContent = "Vamos deixar tudo pronto em poucos passos.";
    return;
  }

  estadoVazio.hidden = true;
  areaTarefas.hidden = false;
  slotFormulario.appendChild(formTarefa);
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

  listaAtrasadas.replaceChildren(...atrasadas.map((t) => criarLinhaTarefa(t, true, sincronizarTelas)));
  listaHoje.replaceChildren(...deHoje.map((t) => criarLinhaTarefa(t, false, sincronizarTelas)));

  blocoAtrasadas.hidden = atrasadas.length === 0;
  listaHoje.hidden = deHoje.length === 0;
  semTarefasHoje.hidden = deHoje.length !== 0;

  const pendentes = atrasadas.length + deHoje.filter((t) => !t.concluida).length;
  if (pendentes === 0) {
    subtituloInicio.textContent = "Tudo em dia por enquanto.";
  } else if (pendentes === 1) {
    subtituloInicio.textContent = "Você tem 1 tarefa pendente para hoje.";
  } else {
    subtituloInicio.textContent = `Você tem ${pendentes} tarefas pendentes.`;
  }
}

// ==========================================
// ABA 2: MINHAS TAREFAS
// ==========================================
let filtroTarefasAtual = "todas";
const campoBuscaTarefas = document.getElementById("campoBuscaTarefas");
const listaMinhasTarefas = document.getElementById("listaMinhasTarefas");
const semTarefasMinhas = document.getElementById("semTarefasMinhas");
const textoSemTarefasMinhas = document.getElementById("textoSemTarefasMinhas");

const botoesFiltro = document.querySelectorAll(".filtro-btn[data-filtro]");
const badgeTodas = document.getElementById("badgeFiltroTodas");
const badgePendentes = document.getElementById("badgeFiltroPendentes");
const badgeConcluidas = document.getElementById("badgeFiltroConcluidas");
const badgeAtrasadas = document.getElementById("badgeFiltroAtrasadas");

// Gaveta de nova tarefa rápida
const btnToggleNovaTarefa = document.getElementById("btnToggleNovaTarefa");
const textoBtnToggle = document.getElementById("textoBtnToggle");
const boxNovaTarefaMinhas = document.getElementById("boxNovaTarefaMinhas");
const btnCancelarNovaTarefaMinhas = document.getElementById("btnCancelarNovaTarefaMinhas");
const formTarefaMinhas = document.getElementById("formTarefaMinhas");
const campoTarefaMinhas = document.getElementById("campoTarefaMinhas");
const botaoPrazoMinhas = document.getElementById("botaoPrazoMinhas");
const campoPrazoMinhas = document.getElementById("campoPrazoMinhas");
const textoPrazoMinhas = document.getElementById("textoPrazoMinhas");
const mensagemTarefaMinhas = document.getElementById("mensagemTarefaMinhas");

btnToggleNovaTarefa.addEventListener("click", () => {
  const aberto = !boxNovaTarefaMinhas.hidden;
  boxNovaTarefaMinhas.hidden = aberto;
  textoBtnToggle.textContent = aberto ? "Nova tarefa" : "Fechar formulário";
  if (!aberto) {
    campoTarefaMinhas.focus();
  }
});

btnCancelarNovaTarefaMinhas.addEventListener("click", () => {
  boxNovaTarefaMinhas.hidden = true;
  textoBtnToggle.textContent = "Nova tarefa";
  formTarefaMinhas.reset();
  textoPrazoMinhas.textContent = "Prazo";
});

botaoPrazoMinhas.addEventListener("click", () => {
  campoPrazoMinhas.min = dataDeHoje();
  if (typeof campoPrazoMinhas.showPicker === "function") {
    campoPrazoMinhas.showPicker();
  } else {
    campoPrazoMinhas.focus();
  }
});

campoPrazoMinhas.addEventListener("change", () => {
  textoPrazoMinhas.textContent = campoPrazoMinhas.value ? formatarPrazo(campoPrazoMinhas.value) : "Prazo";
});

formTarefaMinhas.addEventListener("submit", (e) => {
  e.preventDefault();
  const titulo = campoTarefaMinhas.value.trim();

  if (titulo === "") {
    mostrarMensagem(mensagemTarefaMinhas, "Digite o nome da tarefa.", false);
    campoTarefaMinhas.focus();
    return;
  }

  const prazo = campoPrazoMinhas.value || dataDeHoje();
  const escolhida = formTarefaMinhas.querySelector('input[name="prioridadeMinhas"]:checked');
  const prioridade = escolhida ? escolhida.value : "media";

  if (prazo < dataDeHoje()) {
    mostrarMensagem(mensagemTarefaMinhas, "Escolha uma data de hoje em diante.", false);
    return;
  }

  const resultado = salvarTarefa({ titulo, prazo, prioridade });
  if (resultado.sucesso) {
    formTarefaMinhas.reset();
    textoPrazoMinhas.textContent = "Prazo";
    boxNovaTarefaMinhas.hidden = true;
    textoBtnToggle.textContent = "Nova tarefa";
    sincronizarTelas();
  } else {
    mostrarMensagem(mensagemTarefaMinhas, resultado.mensagem, false);
  }
});

botoesFiltro.forEach((btn) => {
  btn.addEventListener("click", () => {
    botoesFiltro.forEach((b) => b.classList.remove("ativo"));
    btn.classList.add("ativo");
    filtroTarefasAtual = btn.dataset.filtro;
    carregarMinhasTarefas();
  });
});

campoBuscaTarefas.addEventListener("input", () => {
  carregarMinhasTarefas();
});

function carregarMinhasTarefas() {
  const tarefas = obterTarefas();
  const hoje = dataDeHoje();

  // Contagens dos filtros
  const contTodas = tarefas.length;
  const contPendentes = tarefas.filter((t) => !t.concluida).length;
  const contConcluidas = tarefas.filter((t) => t.concluida).length;
  const contAtrasadas = tarefas.filter((t) => !t.concluida && t.prazo < hoje).length;

  badgeTodas.textContent = contTodas;
  badgePendentes.textContent = contPendentes;
  badgeConcluidas.textContent = contConcluidas;
  badgeAtrasadas.textContent = contAtrasadas;

  // Filtragem por status
  let filtradas = tarefas.slice();
  if (filtroTarefasAtual === "pendentes") {
    filtradas = filtradas.filter((t) => !t.concluida);
  } else if (filtroTarefasAtual === "concluidas") {
    filtradas = filtradas.filter((t) => t.concluida);
  } else if (filtroTarefasAtual === "atrasadas") {
    filtradas = filtradas.filter((t) => !t.concluida && t.prazo < hoje);
  }

  // Filtragem por termo de busca
  const termo = campoBuscaTarefas.value.trim().toLowerCase();
  if (termo !== "") {
    filtradas = filtradas.filter((t) => t.titulo.toLowerCase().includes(termo));
  }

  // Ordenação inteligente: Pendentes primeiro, depois prazo mais próximo, depois prioridade
  filtradas.sort((a, b) => {
    if (a.concluida !== b.concluida) {
      return Number(a.concluida) - Number(b.concluida);
    }
    if (a.prazo !== b.prazo) {
      return a.prazo.localeCompare(b.prazo);
    }
    return ORDEM_PRIORIDADE[a.prioridade] - ORDEM_PRIORIDADE[b.prioridade];
  });

  if (filtradas.length === 0) {
    listaMinhasTarefas.innerHTML = "";
    listaMinhasTarefas.hidden = true;
    semTarefasMinhas.hidden = false;

    if (termo !== "") {
      textoSemTarefasMinhas.textContent = `Nenhuma tarefa encontrada para "${campoBuscaTarefas.value}".`;
    } else if (filtroTarefasAtual === "atrasadas") {
      textoSemTarefasMinhas.textContent = "Parabéns! Nenhuma tarefa atrasada.";
    } else if (filtroTarefasAtual === "concluidas") {
      textoSemTarefasMinhas.textContent = "Você ainda não concluiu nenhuma tarefa.";
    } else if (filtroTarefasAtual === "pendentes") {
      textoSemTarefasMinhas.textContent = "Nenhuma tarefa pendente no momento.";
    } else {
      textoSemTarefasMinhas.textContent = "Você ainda não criou nenhuma tarefa.";
    }
  } else {
    semTarefasMinhas.hidden = true;
    listaMinhasTarefas.hidden = false;
    listaMinhasTarefas.replaceChildren(
      ...filtradas.map((t) => {
        const estaAtrasada = !t.concluida && t.prazo < hoje;
        return criarLinhaTarefa(t, estaAtrasada, sincronizarTelas);
      })
    );
  }
}

// ==========================================
// ABA 3: CALENDÁRIO
// ==========================================
const hojeObj = new Date();
let calAno = hojeObj.getFullYear();
let calMes = hojeObj.getMonth();
let calDataSelecionada = dataDeHoje();

const calMesAnoTexto = document.getElementById("calMesAnoTexto");
const calBtnAnterior = document.getElementById("calBtnAnterior");
const calBtnHoje = document.getElementById("calBtnHoje");
const calBtnProximo = document.getElementById("calBtnProximo");
const calGradeDias = document.getElementById("calGradeDias");

const calDataSelecionadaTitulo = document.getElementById("calDataSelecionadaTitulo");
const calDataSelecionadaSubtitulo = document.getElementById("calDataSelecionadaSubtitulo");
const calListaTarefasDia = document.getElementById("calListaTarefasDia");
const calSemTarefasDia = document.getElementById("calSemTarefasDia");
const calFormTarefaDia = document.getElementById("calFormTarefaDia");
const calInputTarefaDia = document.getElementById("calInputTarefaDia");

calBtnAnterior.addEventListener("click", () => {
  calMes--;
  if (calMes < 0) {
    calMes = 11;
    calAno--;
  }
  carregarCalendario();
});

calBtnProximo.addEventListener("click", () => {
  calMes++;
  if (calMes > 11) {
    calMes = 0;
    calAno++;
  }
  carregarCalendario();
});

calBtnHoje.addEventListener("click", () => {
  const agora = new Date();
  calAno = agora.getFullYear();
  calMes = agora.getMonth();
  calDataSelecionada = dataDeHoje();
  carregarCalendario();
});

// Adicionar tarefa direto no dia selecionado
calFormTarefaDia.addEventListener("submit", (e) => {
  e.preventDefault();
  const titulo = calInputTarefaDia.value.trim();
  if (titulo === "") return;

  const resultado = salvarTarefa({
    titulo,
    prazo: calDataSelecionada,
    prioridade: "media"
  });

  if (resultado.sucesso) {
    calInputTarefaDia.value = "";
    sincronizarTelas();
  }
});

function carregarCalendario() {
  calMesAnoTexto.textContent = `${MESES_COMPLETOS[calMes]} ${calAno}`;

  const tarefas = obterTarefas();
  const hoje = dataDeHoje();

  // Mapeia tarefas por data (YYYY-MM-DD)
  const tarefasPorData = {};
  tarefas.forEach((t) => {
    if (!tarefasPorData[t.prazo]) tarefasPorData[t.prazo] = [];
    tarefasPorData[t.prazo].push(t);
  });

  // Dias do mês atual
  const primeiroDiaSemana = new Date(calAno, calMes, 1).getDay(); // 0 = Dom, 1 = Seg...
  const totalDiasMes = new Date(calAno, calMes + 1, 0).getDate();
  const totalDiasMesAnterior = new Date(calAno, calMes, 0).getDate();

  calGradeDias.innerHTML = "";

  // 1. Dias do mês anterior para completar o início da grade
  for (let i = primeiroDiaSemana - 1; i >= 0; i--) {
    const diaNum = totalDiasMesAnterior - i;
    const mesAnt = calMes === 0 ? 11 : calMes - 1;
    const anoAnt = calMes === 0 ? calAno - 1 : calAno;
    const dataStr = `${anoAnt}-${String(mesAnt + 1).padStart(2, "0")}-${String(diaNum).padStart(2, "0")}`;

    const cell = criarCelulaDia(diaNum, dataStr, true, tarefasPorData[dataStr]);
    calGradeDias.appendChild(cell);
  }

  // 2. Dias do mês atual
  for (let d = 1; d <= totalDiasMes; d++) {
    const dataStr = `${calAno}-${String(calMes + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const cell = criarCelulaDia(d, dataStr, false, tarefasPorData[dataStr]);
    calGradeDias.appendChild(cell);
  }

  // 3. Dias do mês seguinte para completar linhas de 7
  const totalCelulas = calGradeDias.children.length;
  const celulasRestantes = (7 - (totalCelulas % 7)) % 7;
  for (let d = 1; d <= celulasRestantes; d++) {
    const mesProx = calMes === 11 ? 0 : calMes + 1;
    const anoProx = calMes === 11 ? calAno + 1 : calAno;
    const dataStr = `${anoProx}-${String(mesProx + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

    const cell = criarCelulaDia(d, dataStr, true, tarefasPorData[dataStr]);
    calGradeDias.appendChild(cell);
  }

  renderizarTarefasDiaSelecionado();
}

function criarCelulaDia(numero, dataStr, outroMes, tarefasDoDia) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "cal-dia";
  if (outroMes) btn.classList.add("cal-dia-outro-mes");
  if (dataStr === dataDeHoje()) btn.classList.add("cal-dia-hoje");
  if (dataStr === calDataSelecionada) btn.classList.add("cal-dia-selecionado");

  const spanNum = document.createElement("span");
  spanNum.className = "cal-dia-numero";
  spanNum.textContent = numero;
  btn.appendChild(spanNum);

  // Pontinhos indicadores de tarefas
  if (tarefasDoDia && tarefasDoDia.length > 0) {
    const containerPontos = document.createElement("div");
    containerPontos.className = "cal-pontos-tarefas";

    // Mostra até 3 bolinhas coloridas
    const visiveis = tarefasDoDia.slice(0, 3);
    visiveis.forEach((t) => {
      const ponto = document.createElement("span");
      ponto.className = "cal-ponto prio-" + t.prioridade;
      containerPontos.appendChild(ponto);
    });

    btn.appendChild(containerPontos);
  }

  btn.addEventListener("click", () => {
    calDataSelecionada = dataStr;
    document.querySelectorAll(".cal-dia").forEach((el) => el.classList.remove("cal-dia-selecionado"));
    btn.classList.add("cal-dia-selecionado");
    renderizarTarefasDiaSelecionado();
  });

  return btn;
}

function renderizarTarefasDiaSelecionado() {
  const hoje = dataDeHoje();
  const tarefas = obterTarefas().filter((t) => t.prazo === calDataSelecionada);

  if (calDataSelecionada === hoje) {
    calDataSelecionadaTitulo.textContent = "Hoje, " + formatarDataCompleta(calDataSelecionada);
  } else {
    calDataSelecionadaTitulo.textContent = formatarDataCompleta(calDataSelecionada);
  }

  if (tarefas.length === 0) {
    calDataSelecionadaSubtitulo.textContent = "Nenhuma tarefa para esta data";
    calListaTarefasDia.innerHTML = "";
    calListaTarefasDia.hidden = true;
    calSemTarefasDia.hidden = false;
  } else {
    const total = tarefas.length;
    const concluidas = tarefas.filter((t) => t.concluida).length;
    calDataSelecionadaSubtitulo.textContent = `${total} ${total === 1 ? "tarefa" : "tarefas"} (${concluidas} concluída${concluidas === 1 ? "" : "s"})`;

    calSemTarefasDia.hidden = true;
    calListaTarefasDia.hidden = false;
    calListaTarefasDia.replaceChildren(
      ...tarefas.map((t) => {
        const estaAtrasada = !t.concluida && t.prazo < hoje;
        return criarLinhaTarefa(t, estaAtrasada, sincronizarTelas);
      })
    );
  }
}

// ==========================================
// ABA 4: PERFIL
// ==========================================
const perfilAvatar = document.getElementById("perfilAvatar");
const perfilIniciais = document.getElementById("perfilIniciais");
const perfilNomeExibicao = document.getElementById("perfilNomeExibicao");
const perfilEmailExibicao = document.getElementById("perfilEmailExibicao");

const statTotalTarefas = document.getElementById("statTotalTarefas");
const statConcluidas = document.getElementById("statConcluidas");
const statPendentes = document.getElementById("statPendentes");
const statAtrasadas = document.getElementById("statAtrasadas");
const statPorcentagemConclusao = document.getElementById("statPorcentagemConclusao");
const statBarraProgresso = document.getElementById("statBarraProgresso");

const formPerfilNome = document.getElementById("formPerfilNome");
const campoPerfilNome = document.getElementById("campoPerfilNome");
const campoPerfilEmail = document.getElementById("campoPerfilEmail");
const msgPerfilNome = document.getElementById("msgPerfilNome");

const formPerfilSenha = document.getElementById("formPerfilSenha");
const campoPerfilSenhaAtual = document.getElementById("campoPerfilSenhaAtual");
const campoPerfilNovaSenha = document.getElementById("campoPerfilNovaSenha");
const msgPerfilSenha = document.getElementById("msgPerfilSenha");

function gerarIniciais(nome) {
  if (!nome) return "FL";
  const partes = nome.trim().split(" ").filter(Boolean);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function carregarPerfil() {
  const usuario = obterUsuarioLogado();
  if (!usuario) return;

  perfilNomeExibicao.textContent = usuario.nome;
  perfilEmailExibicao.textContent = usuario.email;
  perfilIniciais.textContent = gerarIniciais(usuario.nome);

  campoPerfilNome.value = usuario.nome;
  campoPerfilEmail.value = usuario.email;

  // Estatísticas
  const tarefas = obterTarefas();
  const hoje = dataDeHoje();

  const total = tarefas.length;
  const concluidas = tarefas.filter((t) => t.concluida).length;
  const pendentes = tarefas.filter((t) => !t.concluida).length;
  const atrasadas = tarefas.filter((t) => !t.concluida && t.prazo < hoje).length;

  statTotalTarefas.textContent = total;
  statConcluidas.textContent = concluidas;
  statPendentes.textContent = pendentes;
  statAtrasadas.textContent = atrasadas;

  const porcentagem = total === 0 ? 0 : Math.round((concluidas / total) * 100);
  statPorcentagemConclusao.textContent = porcentagem + "%";
  statBarraProgresso.style.width = porcentagem + "%";
}

// Salvar nome atualizado
formPerfilNome.addEventListener("submit", (e) => {
  e.preventDefault();
  const novoNome = campoPerfilNome.value.trim();

  if (novoNome === "") {
    mostrarMensagem(msgPerfilNome, "Informe seu nome completo.", false);
    return;
  }

  const res = atualizarNomeUsuario(novoNome);
  mostrarMensagem(msgPerfilNome, res.mensagem, res.sucesso);

  if (res.sucesso) {
    carregarPerfil();
    carregarInicio();
  }
});

// Alterar senha
formPerfilSenha.addEventListener("submit", async (e) => {
  e.preventDefault();
  const senhaAtual = campoPerfilSenhaAtual.value;
  const novaSenha = campoPerfilNovaSenha.value;

  if (!senhaAtual) {
    mostrarMensagem(msgPerfilSenha, "Digite sua senha atual.", false);
    return;
  }

  if (novaSenha.length < 6) {
    mostrarMensagem(msgPerfilSenha, "A nova senha deve ter no mínimo 6 caracteres.", false);
    return;
  }

  const res = await alterarSenhaUsuario(senhaAtual, novaSenha);
  mostrarMensagem(msgPerfilSenha, res.mensagem, res.sucesso);

  if (res.sucesso) {
    formPerfilSenha.reset();
  }
});

// ==========================================
// INICIALIZAÇÃO
// ==========================================
carregarInicio();
