
async function montarMenu() {
  const menu = document.getElementById("menuLateral");
  if (!menu) return;

  // Faixa do topo (usada para arrastar a janela)
  if (!document.querySelector(".barra-topo")) {
    document.body.insertAdjacentHTML("afterbegin", '<div class="barra-topo"></div>');
  }

  // Pede o HTML do menu ao main.js 
  try {
    menu.innerHTML = await window.api.menu.html();
  } catch (erro) {
    console.error("Não foi possível carregar o menu", erro);
    return;
  }

  // Destaca o item da tela atual
  const itemAtivo = menu.querySelector(`[data-pagina="${menu.dataset.ativo}"]`);
  if (itemAtivo) itemAtivo.classList.add("ativo");

  // Sair: apaga o usuário logado e o link leva para o login
  document.getElementById("botaoSair").addEventListener("click", () => {
    removerUsuarioLogado();
  });
}

montarMenu();
