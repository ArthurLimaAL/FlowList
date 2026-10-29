
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
