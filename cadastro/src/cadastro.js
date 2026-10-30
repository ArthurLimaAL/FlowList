
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
  const regras = "A senha deve ter no mínimo 8 caracteres, uma letra maiúscula, um número e um símbolo.";

  if (valor === "") {
    erro.textContent = "O campo senha é obrigatório. " + regras;
    return false;
  }
  
  if (!regraSenha.test(valor)) {
    erro.textContent = regras;
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

// Verifica se o campo está vazio antes de executar sua validação.
function validarSeVazio(campo, funcaoValidar) {
  if (campo.value.trim() === "") {
    funcaoValidar();
  }
}

nome.addEventListener("blur", () => validarSeVazio(nome, validarNome));


email.addEventListener("blur", validarEmail);
senha.addEventListener("blur", () => validarSeVazio(senha, validarSenha));
confirmarSenha.addEventListener("blur", () =>
  validarSeVazio(confirmarSenha, validarConfirmarSenha)
);

// Apaga o erro do campo enquanto a pessoa digita nele.
[nome, email, senha, confirmarSenha].forEach((campo) => {
  campo.addEventListener("input", () => {
    pegarErro(campo).textContent = "";
  });
});

const CAMINHO_LOGIN = "../login/login.html";

const form = document.getElementById("form");
const mensagemSucesso = document.getElementById("mensagemSucesso");
const mensagemErro = document.getElementById("mensagemErro");

document.getElementById("linkEntrar").href = CAMINHO_LOGIN;

// Mostra uma mensagem e a esconde depois.
function mostrarMensagem(elemento, texto, duracao) {
  elemento.textContent = texto;
  elemento.style.display = "block";
  setTimeout(() => {
    elemento.style.display = "none";
  }, duracao);
}

// Envio do formulário e validação dos campos
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const resultados = [
    validarNome(),
    validarEmail(),
    validarSenha(),
    validarConfirmarSenha(),
  ];

  // Verifica se todos os campos são válidos
  const tudoCerto = resultados.every((resultado) => resultado === true);

  // Interrompe o cadastro se houver algum erro
  if (!tudoCerto) {
    return;
  }

  const senhaHash = await gerarHash(senha.value.trim());

  const novoUsuario = {
    nome: nome.value.trim(),
    email: email.value.trim(),
    senha: senhaHash,
  };

  const resultado = salvarUsuario(novoUsuario);

  if (resultado.sucesso) {
    mostrarMensagem(mensagemSucesso, "Usuário cadastrado com sucesso!", 2500);
    form.reset();

    // Oculta as senhas
    botoesOlho.forEach((botao) => {
      const campo = document.getElementById(botao.dataset.alvo);
      if (campo.type === "text") {
        botao.click();
      }
    });

    // Redireciona para a página de login
    setTimeout(() => {
      window.location.href = CAMINHO_LOGIN;
    }, 2500);

  } else {
    mostrarMensagem(mensagemErro, resultado.mensagem, 3000);
  }
});

// Enter passa para o próximo campo
const camposEmOrdem = [nome, email, senha, confirmarSenha];

camposEmOrdem.forEach((campo, indice) => {

  campo.addEventListener("keydown", (e) => {

    if (e.key !== "Enter") {
      return;
    }

    const proximo = camposEmOrdem[indice + 1];

    if (proximo) {
      e.preventDefault();
      proximo.focus();
    }

  });
});

