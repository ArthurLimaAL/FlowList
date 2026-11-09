const MiniCal = (() => {
    let chave = null;
    let visao = { ano: HOJE.getFullYear(), mes: HOJE.getMonth() };
    let obterOcupadas = () => [];

    const leitura = document.getElementById('textoData');
    const grade = document.getElementById('miniGrade');
    const titulo = document.getElementById('miniTitulo');
    const btnPrev = document.getElementById('miniPrev');
    const btnNext = document.getElementById('miniNext');

    function indiceMes(v) {
        return v.ano * 12 + v.mes;
    }

    function mesLimite() {
        const base = chave && paraData(chave) < HOJE ? paraData(chave) : HOJE;
        return base.getFullYear() * 12 + base.getMonth();
    }

    function desenharLeitura() {
        leitura.textContent = chave ? formatarLonga(chave) : 'Sem dia marcado';
        leitura.classList.toggle('com-data', !!chave);
    }

    function desenharGrade() {
        titulo.textContent = `${MESES[visao.mes]} ${visao.ano}`;
        btnPrev.disabled = indiceMes(visao) <= mesLimite();

        const primeiroDia = new Date(visao.ano, visao.mes, 1);
        const deslocamento = (primeiroDia.getDay() + 6) % 7;
        const totalDias = new Date(visao.ano, visao.mes + 1, 0).getDate();
        const celulas = Math.ceil((deslocamento + totalDias) / 7) * 7;
        const ocupadas = new Set(obterOcupadas());

        let html = '';
        for (let i = 0; i < celulas; i++) {
            const data = new Date(visao.ano, visao.mes, i - deslocamento + 1);
            const k = chaveLocal(data);
            const passada = ehPassada(k);
            const clases = ['mini-celula'];

            if (data.getMonth() !== visao.mes) clases.push('fora');
            if (passada) clases.push('passado');
            if (k === CHAVE_HOJE) clases.push('hoje');
            if (k === chave) clases.push('selecionada');

            html += `<button type="button" class="${clases.join(' ')}" data-chave="${k}"
                        data-passado="${passada}" ${passada ? 'disabled title="Dia passado"' : ''}>
                        <span class="mini-num">${data.getDate()}</span>
                        ${ocupadas.has(k) ? '<span class="mini-marca"></span>' : ''}
                     </button>`;
        }
        grade.innerHTML = html;
    }

    function desenhar() {
        desenharLeitura();
        desenharGrade();
    }

    function irPara(k) {
        chave = k;
        if (k) visao = { ano: paraData(k).getFullYear(), mes: paraData(k).getMonth() };
        desenhar();
    }

    function iniciar(config) {
        if (config && config.obterOcupadas) obterOcupadas = config.obterOcupadas;

        document.getElementById('miniDiasSemana').innerHTML =
            DIAS_SEMANA.map(d => `<div>${d}</div>`).join('');

        btnPrev.addEventListener('click', () => {
            if (--visao.mes < 0) { visao.mes = 11; visao.ano--; }
            desenhar();
        });

        btnNext.addEventListener('click', () => {
            if (++visao.mes > 11) { visao.mes = 0; visao.ano++; }
            desenhar();
        });

        grade.addEventListener('click', (e) => {
            const celula = e.target.closest('.mini-celula');
            if (!celula || celula.dataset.passado === 'true') return;
            irPara(celula.dataset.chave);
        });

        document.querySelectorAll('[data-atalho]').forEach(botao => {
            botao.addEventListener('click', () => {
                const dias = { hoje: 0, amanha: 1, semana: 7 }[botao.dataset.atalho];
                irPara(chaveLocal(somarDias(dias)));
            });
        });

        document.getElementById('miniSemData').addEventListener('click', () => {
            visao = { ano: HOJE.getFullYear(), mes: HOJE.getMonth() };
            irPara(null);
        });

        desenhar();
    }

    function abrir(chaveInicial) {
        chave = chaveInicial || null;
        visao = chave
            ? { ano: paraData(chave).getFullYear(), mes: paraData(chave).getMonth() }
            : { ano: HOJE.getFullYear(), mes: HOJE.getMonth() };
        desenhar();
    }

    return { iniciar, abrir, valor: () => chave };
})();
