// FUNÇÕES DE LOCALSTORAGE
// Cada usuário salvo tem: nome, email e senha (em hash).

// Busca todos os usuários salvos no localStorage e, se não existir nenhum, retorna um array vazio
function obterUsuarios() {
    try {
        const usuarios = localStorage.getItem("usuarios");     // tenta pegar o item armazenado
        return JSON.parse(usuarios) || [];                     // converte o texto JSON em objeto; se for null, retorna array vazio
    } catch (error) {
        console.error("Erro ao ler usuários do localStorage", error);
        return [];
    }
}

// Salvar a lista de usuários
function salvarUsuarios(lista) {
    try {
        const json = JSON.stringify(lista);     // converte o objeto em texto JSON
        localStorage.setItem("usuarios", json);
        console.log("Usuários salvos com sucesso!");
    } catch (error) {
        console.error("Erro ao salvar usuários no localStorage", error);
    }
}

// Salvar um novo usuário
function salvarUsuario(novoUsuario) {
    try {
        const usuarios = obterUsuarios();    // pega todos os usuários salvos
        const existe = usuarios.some(u => u.email === novoUsuario.email);  // verifica se já existe um usuário com o mesmo e-mail

        if (existe) {
            return { sucesso: false, mensagem: "Este e-mail já está cadastrado." };
        }

        usuarios.push(novoUsuario);    // adiciona o novo usuário na lista
        salvarUsuarios(usuarios);
        return { sucesso: true, mensagem: "Usuário cadastrado com sucesso!" };
    } catch (erro) {
        console.error("Erro ao salvar novo usuário", erro);
        return { sucesso: false, mensagem: "Erro ao salvar usuário." };
    }
}

