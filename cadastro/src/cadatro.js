
 // Responsável por mostrar ou ocultar a senha.
const botoesOlho = document.querySelectorAll(".botao-olho");

botoesOlho.forEach((botao) => {
 
  botao.addEventListener("click", () => {

    // Identifica o campo de senha que será controlado pelo botão.
    const campo = document.getElementById(botao.dataset.alvo);

    // Alterna o tipo do campo entre "password" e "text".
    campo.type = campo.type === "password" ? "text" : "password";

    // Verifica se a senha está visível após a alteração.
    const visivel = campo.type === "text";

    // Seleciona os ícones de olho aberto e olho fechado dentro do botão.
    const olhoAberto = botao.querySelector(".olho-aberto");
    const olhoFechado = botao.querySelector(".olho-fechado");

    // Atualiza a exibição dos ícones de acordo com o estado da senha.
    olhoAberto.classList.toggle("oculto", !visivel);
    olhoFechado.classList.toggle("oculto", visivel);

    botao.setAttribute(
      "aria-label",
      visivel ? "Ocultar senha" : "Mostrar senha"
    );
  });
});


// Localiza o elemento responsável por exibir a mensagem de erro
function pegarErro(input) {
  return input.closest(".campo").querySelector(".error");
}


const regraNome = /^[A-Za-zÀ-ÖØ-öø-ÿ]{2,}(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ]{2,})+$/;
const regraEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const regraSenha = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;


const nome = document.getElementById("nome");
const email = document.getElementById("email");
const senha = document.getElementById("senha");
const confirmarSenha = document.getElementById("confirmSenha");



function validarNome() {
  const valor = nome.value.trim();
  const erro = pegarErro(nome);

  if (valor === "") {
    erro.textContent = "O campo nome é obrigatório.";
    return false;
  }

  // Verifica se o nome segue o padrão definido na expressão regular.
  if (!regraNome.test(valor)) {
    erro.textContent = "Digite seu nome completo (ex: João Silva).";
    return false;
  }

  // Se todas as verificações forem aprovadas, limpa o erro anterior.
  erro.textContent = "";
  return true;
}



function validarEmail() {
 
  const valor = email.value.trim();
  const erro = pegarErro(email);

  if (valor === "") {
    erro.textContent = "O campo e-mail é obrigatório.";
    return false;
  }

  if (!regraEmail.test(valor)) {
    erro.textContent = "Digite um e-mail válido (ex: exemplo@dominio.com).";
    return false;
  }

  erro.textContent = "";
  return true;
}


function validarSenha() {

  const valor = senha.value.trim();
  const erro = pegarErro(senha);

  if (valor === "") {
    erro.textContent = "O campo senha é obrigatório.";
    return false;
  }

  if (valor.length < 8) {
    erro.textContent = "A senha deve ter no mínimo 8 caracteres.";
    return false;
  }

  // Verifica se a senha atende a todos os requisitos de segurança.
  if (!regraSenha.test(valor)) {
    erro.textContent = "A senha deve ter uma letra maiúscula, um número e um símbolo.";
    return false;
  }

  erro.textContent = "";
  return true;
}



function validarConfirmarSenha() {
  const valorSenha = senha.value.trim();
  const valorConfirmar = confirmarSenha.value.trim();
  const erro = pegarErro(confirmarSenha);

  if (valorConfirmar === "") {
    erro.textContent = "Confirme sua senha.";
    return false;
  }
  if (valorConfirmar !== valorSenha) {
    erro.textContent = "As senhas não coincidem.";
    return false;
  }

  erro.textContent = "";
  return true;
}

