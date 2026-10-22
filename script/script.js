const button = document.getElementById("bnt");
const itens = document.getElementById("Inicial");

button.addEventListener("click", () => {
    itens.style.visibility = "hidden";
    window.location.href = "principal.html";
});