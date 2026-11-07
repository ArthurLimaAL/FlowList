const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function chaveLocal(d) {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${dia}`;
}

function paraData(chave) {
    const [a, m, d] = chave.split('-').map(Number);
    return new Date(a, m - 1, d);
}

function inicioDia(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function ehPassada(chave) {
    if (!chave) return false;
    return paraData(chave) < inicioDia(new Date());
}

function somarDias(dias) {
    const d = inicioDia(new Date());
    d.setDate(d.getDate() + dias);
    return d;
}

function formatarLonga(chave) {
    const d = paraData(chave);
    return `${DIAS_SEMANA[(d.getDay() + 6) % 7]}, ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

function formatarCurta(chave) {
    const [a, m, d] = chave.split('-');
    return `${d}/${m}/${a}`;
}

const HOJE = inicioDia(new Date());
const CHAVE_HOJE = chaveLocal(HOJE);
