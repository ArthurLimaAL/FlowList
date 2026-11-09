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
        return true;
    } catch (error) {
        console.error("Erro ao salvar usuários no localStorage", error);
        return false;
    }
}

// Salvar um novo usuário
function salvarUsuario(novoUsuario) {
    try {
        const usuarios = obterUsuarios();    // pega todos os usuários salvos
        const existe = usuarios.some(u => u.email.toLowerCase() === novoUsuario.email.toLowerCase());  // verifica se já existe um usuário com o mesmo e-mail

        if (existe) {
            return { sucesso: false, mensagem: "Este e-mail já está cadastrado." };
        }

        usuarios.push(novoUsuario);    // adiciona o novo usuário na lista
        if (!salvarUsuarios(usuarios)) {
            return { sucesso: false, mensagem: "Não foi possível salvar o usuário neste navegador." };
        }
        return { sucesso: true, mensagem: "Usuário cadastrado com sucesso!" };
    } catch (erro) {
        console.error("Erro ao salvar novo usuário", erro);
        return { sucesso: false, mensagem: "Erro ao salvar usuário." };
    }
}

const ALGORITMO_SENHA = "PBKDF2-SHA-256";
const ITERACOES_HASH_SENHA = 310000;

function bytesParaBase64(bytes) {
    return btoa(String.fromCharCode(...bytes));
}

function base64ParaBytes(valor) {
    try {
        return Uint8Array.from(atob(valor), caractere => caractere.charCodeAt(0));
    } catch {
        return null;
    }
}

function compararBytes(a, b) {
    if (a.length !== b.length) return false;
    let diferenca = 0;
    for (let i = 0; i < a.length; i++) diferenca |= a[i] ^ b[i];
    return diferenca === 0;
}

async function calcularHashSenha(senha, salt, iteracoes) {
    const material = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(senha),
        "PBKDF2",
        false,
        ["deriveBits"]
    );
    const bits = await crypto.subtle.deriveBits(
        { name: "PBKDF2", salt, iterations: iteracoes, hash: "SHA-256" },
        material,
        256
    );
    return new Uint8Array(bits);
}

async function gerarHash(senha) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await calcularHashSenha(senha, salt, ITERACOES_HASH_SENHA);
    return {
        algoritmo: ALGORITMO_SENHA,
        iteracoes: ITERACOES_HASH_SENHA,
        salt: bytesParaBase64(salt),
        hash: bytesParaBase64(hash)
    };
}

async function gerarHashLegado(senha) {
    const bits = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(senha));
    return Array.from(new Uint8Array(bits), byte => byte.toString(16).padStart(2, "0")).join("");
}

async function verificarSenha(senha, armazenada) {
    if (typeof armazenada === "string") {
        if (!/^[a-f\d]{64}$/i.test(armazenada)) return false;
        const hash = await gerarHashLegado(senha);
        return compararBytes(
            new TextEncoder().encode(hash.toLowerCase()),
            new TextEncoder().encode(armazenada.toLowerCase())
        );
    }

    if (
        !armazenada ||
        armazenada.algoritmo !== ALGORITMO_SENHA ||
        armazenada.iteracoes !== ITERACOES_HASH_SENHA
    ) {
        return false;
    }

    const salt = base64ParaBytes(armazenada.salt);
    const hashSalvo = base64ParaBytes(armazenada.hash);
    if (!salt || salt.length !== 16 || !hashSalvo || hashSalvo.length !== 32) return false;

    const hashDigitado = await calcularHashSenha(senha, salt, armazenada.iteracoes);
    return compararBytes(hashDigitado, hashSalvo);
}

// AUTENTICAR USUÁRIO e-mail e senha
async function autenticarUsuario(email, senhaDigitada) {
    const usuarios = obterUsuarios();
    const usuario = usuarios.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (!usuario || !(await verificarSenha(senhaDigitada, usuario.senha))) return null;

    if (typeof usuario.senha === "string") {
        usuario.senha = await gerarHash(senhaDigitada);
        if (!salvarUsuarios(usuarios)) {
            console.error("Não foi possível atualizar o hash da senha deste usuário.");
        }
    }
    return usuario;
}
// Guarda quem acabou de fazer login
function salvarUsuarioLogado(usuario) {
    const dados = { nome: usuario.nome, email: usuario.email };
    localStorage.setItem("usuarioLogado", JSON.stringify(dados));
}

function obterUsuarioLogado() {
    try {
        return JSON.parse(localStorage.getItem("usuarioLogado"));
    } catch (error) {
        return null;
    }
}


// Apaga o usuário logado (usado no botão Sair)
function removerUsuarioLogado() {
    localStorage.removeItem("usuarioLogado");
}

// ---------- TAREFAS ----------

// Busca as tarefas de TODOS os usuários 
function obterTodasTarefas() {
    try {
        return JSON.parse(localStorage.getItem("tarefas")) || [];
    } catch (error) {
        console.error("Erro ao ler tarefas do localStorage", error);
        return [];
    }
}

// Busca só as tarefas de quem está logado
function obterTarefas() {
    const usuario = obterUsuarioLogado();
    if (!usuario) return [];

    return obterTodasTarefas().filter((t) => t.email === usuario.email);
}

// Salva uma nova tarefa para quem está logado
function salvarTarefa(dados) {
    const usuario = obterUsuarioLogado();
    if (!usuario) {
        return { sucesso: false, mensagem: "Nenhum usuário logado." };
    }

    try {
        const tarefas = obterTodasTarefas();

        tarefas.push({
            id: Date.now(),              // número único para identificar a tarefa
            email: usuario.email,        
            titulo: dados.titulo,
            prazo: dados.prazo,          
            prioridade: dados.prioridade,
            concluida: false
        });

        localStorage.setItem("tarefas", JSON.stringify(tarefas));
        return { sucesso: true, mensagem: "Tarefa criada!" };
    } catch (error) {
        console.error("Erro ao salvar tarefa", error);
        return { sucesso: false, mensagem: "Erro ao salvar tarefa." };
    }
}

// Marca ou desmarca uma tarefa como concluída
function alternarConclusaoTarefa(id) {
    const usuario = obterUsuarioLogado();
    if (!usuario) return false;

    try {
        const tarefas = obterTodasTarefas();
        const tarefa = tarefas.find((t) => t.id === id && t.email === usuario.email);
        if (!tarefa) return false;

        tarefa.concluida = !tarefa.concluida;
        localStorage.setItem("tarefas", JSON.stringify(tarefas));
        return true;
    } catch (error) {
        console.error("Erro ao atualizar tarefa", error);
        return false;
    }
}

const PRIORIDADE_PARA_TELA = { alta: "Alta", media: "Média", baixa: "Baixa" };
const PRIORIDADE_PARA_STORAGE = { "Alta": "alta", "Média": "media", "Baixa": "baixa" };

// Tarefas de quem está logado, no formato das telas
function obterTarefasParaTela() {
    return obterTarefas().map((t) => ({
        id: t.id,
        titulo: t.titulo,
        prioridade: PRIORIDADE_PARA_TELA[t.prioridade] || "Média",
        data: t.prazo || null,
        done: !!t.concluida
    }));
}

// Salva a lista de quem está logado sem mexer nas tarefas dos outros usuários
function gravarTarefasDaTela(lista) {
    const usuario = obterUsuarioLogado();
    if (!usuario) return false;

    try {
        const dasOutrasPessoas = obterTodasTarefas().filter((t) => t.email !== usuario.email);
        const minhas = lista.map((t) => ({
            id: t.id,
            email: usuario.email,
            titulo: t.titulo,
            prazo: t.data || null,
            prioridade: PRIORIDADE_PARA_STORAGE[t.prioridade] || "media",
            concluida: !!t.done
        }));

        localStorage.setItem("tarefas", JSON.stringify([...minhas, ...dasOutrasPessoas]));
        return true;
    } catch (error) {
        console.error("Erro ao salvar tarefas", error);
        return false;
    }
}

// histórico de tarefas concluídas, separado por usuário
function obterTotalConcluidas() {
    const usuario = obterUsuarioLogado();
    if (!usuario) return 0;

    const salvo = localStorage.getItem("totalConcluidas:" + usuario.email);
    if (salvo !== null) return parseInt(salvo, 10) || 0;

    // primeira vez: começa com as que já estão concluídas
    return obterTarefas().filter((t) => t.concluida).length;
}

function definirTotalConcluidas(total) {
    const usuario = obterUsuarioLogado();
    if (!usuario) return;

    try {
        localStorage.setItem("totalConcluidas:" + usuario.email, Math.max(0, total));
    } catch (error) {
        console.error("Erro ao salvar o total de concluídas", error);
    }
}


//  CONTA DO USUÁRIO LOGADO (usado pelo Perfil)

// Mesmas regras do cadastro
const REGRA_NOME_COMPLETO = /^[A-Za-zÀ-ÖØ-öø-ÿ]{2,}(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ]{2,})+$/;
const REGRA_SENHA_FORTE = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function obterDadosUsuarioLogado() {
    const logado = obterUsuarioLogado();
    if (!logado) return null;

    const registro = obterUsuarios().find(
        (u) => u.email.toLowerCase() === logado.email.toLowerCase()
    );

    return {
        nome: registro ? registro.nome : logado.nome,
        email: logado.email,
        criadoEm: registro && registro.criadoEm ? registro.criadoEm : null
    };
}

// Troca o nome de quem está logado
function atualizarNomeUsuario(novoNome) {
    const logado = obterUsuarioLogado();
    if (!logado) return { sucesso: false, mensagem: "Nenhum usuário logado." };

    const nome = String(novoNome).trim();
    if (!REGRA_NOME_COMPLETO.test(nome)) {
        return { sucesso: false, mensagem: "Digite seu nome completo (ex: João Silva)." };
    }

    const usuarios = obterUsuarios();
    const registro = usuarios.find((u) => u.email.toLowerCase() === logado.email.toLowerCase());
    if (!registro) return { sucesso: false, mensagem: "Usuário não encontrado." };

    registro.nome = nome;
    if (!salvarUsuarios(usuarios)) {
        return { sucesso: false, mensagem: "Não foi possível salvar as alterações neste navegador." };
    }
    salvarUsuarioLogado({ nome, email: logado.email });
    return { sucesso: true, mensagem: "Nome atualizado." };
}

// Troca a senha de quem está logado (confere a senha atual primeiro)
async function alterarSenhaUsuario(senhaAtual, senhaNova) {
    const logado = obterUsuarioLogado();
    if (!logado) return { sucesso: false, mensagem: "Nenhum usuário logado." };

    const usuarios = obterUsuarios();
    const registro = usuarios.find((u) => u.email.toLowerCase() === logado.email.toLowerCase());
    if (!registro) return { sucesso: false, mensagem: "Usuário não encontrado." };

    const atual = String(senhaAtual).trim();
    if (!(await verificarSenha(atual, registro.senha))) {
        return { sucesso: false, mensagem: "A senha atual está incorreta." };
    }

    const nova = String(senhaNova).trim();
    if (!REGRA_SENHA_FORTE.test(nova)) {
        return { sucesso: false, mensagem: "A nova senha deve ter no mínimo 8 caracteres, uma letra maiúscula, um número e um símbolo." };
    }

    if (nova === atual) {
        return { sucesso: false, mensagem: "A nova senha deve ser diferente da atual." };
    }

    registro.senha = await gerarHash(nova);
    if (!salvarUsuarios(usuarios)) {
        return { sucesso: false, mensagem: "Não foi possível salvar a nova senha neste navegador." };
    }
    return { sucesso: true, mensagem: "Senha alterada." };
}
