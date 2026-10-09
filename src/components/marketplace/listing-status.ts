/**
 * Rótulos de status de um anúncio.
 *
 * Antes cada componente da conta tinha o seu: a carteira mostrava "Publicado"
 * enquanto a atividade e o desempenho ao lado mostravam "Ativo" para o MESMO
 * anúncio, na mesma tela. Um mapa só, importado pelos três, e o rótulo não
 * volta a divergir.
 */
export const LISTING_STATUS_LABELS: Record<string, string> = {
  active: 'Ativo',
  paused: 'Pausado',
  sold: 'Vendido',
  archived: 'Arquivado',
  draft: 'Rascunho',
  pending: 'Em análise',
}
