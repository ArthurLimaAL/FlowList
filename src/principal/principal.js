const usuario = obterUsuarioLogado();

if (usuario) {
  // pega só o primeiro nome (ex.: "Ana Souza" vira "Ana")
  document.getElementById("nomeUsuario").textContent = usuario.nome.split(" ")[0];
} else {
  // ninguém logado: volta para o login
  window.location.href = "../login/login.html";
}