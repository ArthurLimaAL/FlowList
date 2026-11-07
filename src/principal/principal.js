const usuario = obterUsuarioLogado();

if (usuario) {
  // pega só o primeiro nome (ex.: "Ana Souza" vira "Ana")
  document.getElementById("nomeUsuario").textContent = usuario.nome.split(" ")[0];
} else {
  // ninguém logado: volta para o login
  window.location.href = "../login/login.html";
}

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
  campoPrazo.min = dataDeHoje();   // dias anteriores a hoje ficam bloqueados
  campoPrazo.showPicker();
});

// Quando o usuário escolhe uma data, o botão passa a mostrar ela
campoPrazo.addEventListener("change", () => {
  textoPrazo.textContent = campoPrazo.value ? formatarPrazo(campoPrazo.value) : "Prazo";
});