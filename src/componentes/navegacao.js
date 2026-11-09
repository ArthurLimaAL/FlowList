// Navegação entre telas (usado por Tarefas, Calendário e Perfil).
// Ids válidos: 'tela-inicio' | 'tela-tarefas' | 'tela-calendario' | 'tela-perfil'
const CAMINHOS_TELAS = {
    'tela-inicio': '../principal/principal.html',
    'tela-tarefas': '../tarefas/tarefas.html',
    'tela-calendario': '../calendario/calendario.html',
    'tela-perfil': '../perfil/perfil.html'
};

function trocarTela(idTela) {
    const caminho = CAMINHOS_TELAS[idTela];
    if (caminho) window.location.href = caminho;
}
