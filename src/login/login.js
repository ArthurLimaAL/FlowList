const form = document.getElementById("form");
const email = document.getElementById("email");
const senha = document.getElementById("senha");
const mensagemSucesso = document.getElementById("mensagemSucesso");
const mensagemErro = document.getElementById("mensagemErro");

const CAMINHO_PRINCIPAL = "../principal/principal.html";

// icones de olhos 
const botoesOlho = document.querySelectorAll(".botao-olho");

botoesOlho.forEach((botao) => {
  botao.addEventListener("click", () => {
    
    const campo = document.getElementById(botao.dataset.alvo);

    // Alterna o tipo do campo 
    campo.type = campo.type === "password" ? "text" : "password";
    const visivel = campo.type === "text";

    
    botao.querySelector(".olho-aberto").classList.toggle("oculto", !visivel);
    botao.querySelector(".olho-fechado").classList.toggle("oculto", visivel);

    botao.setAttribute("aria-label", visivel ? "Ocultar senha" : "Mostrar senha");
  });
});

// erro
function pegarErro(input) {
  return input.closest(".campo").querySelector(".error");
}

const regraEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const erro = pegarErro(senha);

  if (senha.value.trim() === "") {
    erro.textContent = "O campo senha é obrigatório.";
    return false;
  }

  erro.textContent = "";
  return true;
}

email.addEventListener("blur", validarEmail);

// avisa se a senha estiver vazia
senha.addEventListener("blur", () => {
  if (senha.value.trim() === "") {
    validarSenha();
  }
});

[email, senha].forEach((campo) => {
  campo.addEventListener("focus", () => {
    pegarErro(campo).textContent = "";
  });
  campo.addEventListener("input", () => {
    pegarErro(campo).textContent = "";
  });
});

//Mensagem flutuante
function mostrarMensagem(elemento, texto, duracao) {
  elemento.textContent = texto;
  elemento.style.display = "block";
  setTimeout(() => {
    elemento.style.display = "none";
  }, duracao);
}


form.addEventListener("submit", async (e) => {
  // Impede o navegador de recarregar a página
  e.preventDefault();

  const resultados = [validarEmail(), validarSenha()];
  const tudoCerto = resultados.every((resultado) => resultado === true);

  if (!tudoCerto) {
    return;
  }

  // Confere e-mail e senha no storage.js.
  const usuario = await autenticarUsuario(email.value.trim(), senha.value.trim());

   if (usuario) {
    mostrarMensagem(mensagemSucesso, "Login realizado com sucesso!", 1000);

    setTimeout(() => {
      window.location.href = CAMINHO_PRINCIPAL;
    }, 1000);
  } else {
    
    mostrarMensagem(mensagemErro, "E-mail ou senha incorretos.", 3000);
  }
});

email.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();   // impede o Enter de enviar o formulário
    senha.focus();        // leva o cursor para a senha
  }
});