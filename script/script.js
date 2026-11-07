const button = document.getElementById("bnt");
const itens = document.getElementById("Inicial");

if (button) {
    button.addEventListener("click", () => {
        if (itens) itens.style.visibility = "hidden";
        try {
            sessionStorage.setItem('flowlist_aba_ativa', 'tela-inicio');
        } catch (e) { }
        window.location.href = "principal.html";
    });
}
