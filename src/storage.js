// FUNÇÕES DE LOCALSTORAGE

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

// Gera um hash (embaralha) de uma senha usando SHA-256
async function gerarHash(senha) {
    const encoder = new TextEncoder();   // transforma o texto da senha em bytes
    const data = encoder.encode(senha);

    const hashBuffer = await crypto.subtle.digest("SHA-256", data);  // cria o hash usando o algoritmo SHA-256

    // transforma o resultado (bytes) em texto
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
}

// AUTENTICAR USUÁRIO (só por e-mail) + senha

async function autenticarUsuario(email, senhaDigitada) {
    const usuarios = obterUsuarios();                      // pega os usuários salvos
    const senhaHash = await gerarHash(senhaDigitada);      // gera o hash da senha digitada


    const usuario = usuarios.find(
        (u) => u.email === email && u.senha === senhaHash
    );

   
    return usuario || null;
}