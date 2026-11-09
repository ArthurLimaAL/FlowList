
// Mostra os dados e o desempenho de quem está logado. 
(function () {
    const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

    const el = (id) => document.getElementById(id);

    // "2026-11-08" de hoje, no horário local
    function dataDeHoje() {
        const h = new Date();
        const mes = String(h.getMonth() + 1).padStart(2, '0');
        const dia = String(h.getDate()).padStart(2, '0');
        return `${h.getFullYear()}-${mes}-${dia}`;
    }


    function iniciais(nome) {
        const partes = nome.trim().split(/\s+/).filter(Boolean);
        if (partes.length === 0) return '?';
        const primeira = partes[0][0];
        const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
        return (primeira + ultima).toUpperCase();
    }

    // Mostra uma mensagem e a apaga depois de um tempo
    function mostrarMensagem(elemento, texto, tempo) {
        elemento.textContent = texto;
        if (tempo) {
            setTimeout(() => {
                if (elemento.textContent === texto) elemento.textContent = '';
            }, tempo);
        }
    }

    // --- desenho da tela ---

    function desenhar() {
        const usuario = obterDadosUsuarioLogado();
        if (!usuario) return;

        // Cabeçalho
        el('pfAvatar').textContent = iniciais(usuario.nome);
        el('pfNome').textContent = usuario.nome;
        el('pfEmail').textContent = usuario.email;

        //só aparece se a data de criação da conta foi guardada
        const chipMembro = el('pfChipMembro');
        if (usuario.criadoEm) {
            const d = new Date(usuario.criadoEm);
            if (!isNaN(d)) {
                el('pfMembroDesde').textContent = `Membro desde ${MESES_CURTOS[d.getMonth()]}/${d.getFullYear()}`;
                chipMembro.hidden = false;
            }
        } else {
            chipMembro.hidden = true;
        }

        // Números das tarefas
        const tarefas = obterTarefas();
        const hoje = dataDeHoje();
        const total = tarefas.length;
        const pendentes = tarefas.filter((t) => !t.concluida);
        const concluidas = total - pendentes.length;
        const atrasadas = pendentes.filter((t) => t.prazo && t.prazo < hoje).length;
        const taxa = total > 0 ? Math.round((concluidas / total) * 100) : null;

        // Etiqueta de atrasadas / tudo em dia
        el('pfChipAtrasada').hidden = atrasadas === 0;
        el('pfChipEmDia').hidden = !(total > 0 && atrasadas === 0);
        if (atrasadas > 0) {
            el('pfTextoAtrasada').textContent = atrasadas === 1 ? '1 tarefa atrasada' : `${atrasadas} tarefas atrasadas`;
        }

        // Aviso de quem ainda não tem tarefas
        el('pfVazio').hidden = total !== 0;

        // Cartões
        el('statTotal').textContent = total;
        el('statPendentes').textContent = pendentes.length;
        el('statConcluidas').textContent = concluidas;
        el('statConcluidasDesc').textContent = total === 0
            ? 'nenhuma ainda'
            : `das ${total} ${total === 1 ? 'tarefa' : 'tarefas'}`;
        el('statTaxa').textContent = taxa === null ? '—' : `${taxa}%`;
        el('statTaxaBarra').style.width = `${taxa === null ? 0 : taxa}%`;

        // Pendentes por prioridade
        const porPrioridade = { alta: 0, media: 0, baixa: 0 };
        pendentes.forEach((t) => {
            if (porPrioridade[t.prioridade] !== undefined) porPrioridade[t.prioridade]++;
        });
        [['alta', 'Alta'], ['media', 'Media'], ['baixa', 'Baixa']].forEach(([chave, nome]) => {
            el('num' + nome).textContent = porPrioridade[chave];
            const largura = pendentes.length > 0 ? (porPrioridade[chave] / pendentes.length) * 100 : 0;
            el('barra' + nome).style.width = `${largura}%`;
        });

        if (pendentes.length === 0) {
            el('pfDica').textContent = total === 0
                ? 'Quando você criar tarefas, elas aparecem aqui.'
                : 'Tudo em dia. Nenhuma tarefa pendente.';
        } else if (porPrioridade.alta > 0) {
            el('pfDica').textContent = 'Dica: comece pelas de prioridade alta.';
        } else {
            el('pfDica').textContent = 'Nenhuma tarefa de prioridade alta pendente.';
        }
    }

    // --- editar nome ---

    const formNome = el('pfFormNome');
    const inputNome = el('pfInputNome');
    const msgNome = el('pfMsgNome');

    function abrirEdicaoNome() {
        const usuario = obterDadosUsuarioLogado();
        if (!usuario) return;
        inputNome.value = usuario.nome;
        msgNome.textContent = '';
        el('pfNome').hidden = true;
        el('pfBtnEditarNome').hidden = true;
        formNome.hidden = false;
        inputNome.focus();
        inputNome.select();
    }

    function fecharEdicaoNome() {
        formNome.hidden = true;
        el('pfNome').hidden = false;
        el('pfBtnEditarNome').hidden = false;
    }

    el('pfBtnEditarNome').addEventListener('click', abrirEdicaoNome);
    el('pfCancelarNome').addEventListener('click', () => {
        msgNome.textContent = '';
        fecharEdicaoNome();
    });
    inputNome.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            msgNome.textContent = '';
            fecharEdicaoNome();
        }
    });

    formNome.addEventListener('submit', (e) => {
        e.preventDefault();
        const resultado = atualizarNomeUsuario(inputNome.value);
        if (!resultado.sucesso) {
            msgNome.classList.add('pf-msg-erro');
            mostrarMensagem(msgNome, resultado.mensagem);
            return;
        }
        fecharEdicaoNome();
        desenhar();
        msgNome.classList.remove('pf-msg-erro');
        mostrarMensagem(msgNome, resultado.mensagem, 3000);
    });

    // ---alterar senha ---

    const modalSenha = el('pfModalSenha');
    const formSenha = el('pfFormSenha');
    const btnSenha = el('pfBtnSenha');
    const msgSenha = el('pfMsgSenha');
    const msgSenhaOk = el('pfMsgSenhaOk');

    // Ícones do botão de mostrar/esconder senha
    const ICONE_OLHO = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
    const ICONE_OLHO_FECHADO = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"></path><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';

    const botoesOlho = modalSenha.querySelectorAll('.pf-olho');

    function esconderSenhas() {
        botoesOlho.forEach((botao) => {
            el(botao.dataset.alvo).type = 'password';
            botao.innerHTML = ICONE_OLHO;
            botao.setAttribute('aria-label', 'Mostrar senha');
        });
    }

    botoesOlho.forEach((botao) => {
        botao.addEventListener('click', () => {
            const campo = el(botao.dataset.alvo);
            const mostrar = campo.type === 'password';
            campo.type = mostrar ? 'text' : 'password';
            botao.innerHTML = mostrar ? ICONE_OLHO_FECHADO : ICONE_OLHO;
            botao.setAttribute('aria-label', mostrar ? 'Esconder senha' : 'Mostrar senha');
        });
    });

    function abrirSenha() {
        formSenha.reset();
        esconderSenhas();
        msgSenha.textContent = '';
        msgSenhaOk.textContent = '';
        modalSenha.hidden = false;
        el('senhaAtual').focus();
    }

    function fecharSenha() {
        formSenha.reset();
        esconderSenhas();
        msgSenha.textContent = '';
        modalSenha.hidden = true;
        btnSenha.focus();
    }

    btnSenha.addEventListener('click', abrirSenha);
    el('pfCancelarSenha').addEventListener('click', fecharSenha);
    el('pfFecharSenha').addEventListener('click', fecharSenha);

    // Clicar fora da janela (na parte escura) também fecha
    modalSenha.addEventListener('click', (e) => {
        if (e.target === modalSenha) fecharSenha();
    });

    // Tecla Esc fecha a janela
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modalSenha.hidden) fecharSenha();
    });

    formSenha.addEventListener('submit', async (e) => {
        e.preventDefault();

        const atual = el('senhaAtual').value;
        const nova = el('senhaNova').value;
        const confirma = el('senhaConfirma').value;

        if (!atual || !nova || !confirma) {
            msgSenha.textContent = 'Preencha os três campos.';
            return;
        }
        if (nova.trim() !== confirma.trim()) {
            msgSenha.textContent = 'A confirmação não é igual à nova senha.';
            return;
        }

        let resultado;
        try {
            resultado = await alterarSenhaUsuario(atual, nova);
        } catch (erro) {
            console.error('Erro ao alterar a senha do usuário', erro);
            msgSenha.textContent = 'Não foi possível alterar a senha neste momento.';
            return;
        }
        if (!resultado.sucesso) {
            msgSenha.textContent = resultado.mensagem;
            return;
        }

        fecharSenha();
        mostrarMensagem(msgSenhaOk, resultado.mensagem, 3000);
    });

    

    el('pfIrTarefas').addEventListener('click', () => trocarTela('tela-tarefas'));

    desenhar();
})();