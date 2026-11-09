// MENU LATERAL E BARRA DO TOPO (compartilhados por todas as telas)

async function montarMenu() {
  const menu = document.getElementById("menuLateral");
  if (!menu) return;

  // Faixa do topo 
  if (!document.querySelector(".barra-topo")) {
    document.body.insertAdjacentHTML("afterbegin", '<div class="barra-topo"></div>');
  }

  // Pede o menu.html ao main.js
  try {
    const texto = await window.api.menu.html();
    const documento = new DOMParser().parseFromString(texto, "text/html");
    menu.innerHTML = documento.body.innerHTML;
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
