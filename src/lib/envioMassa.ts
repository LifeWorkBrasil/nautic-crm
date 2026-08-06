export interface ProvedorEnvio {
  id: 'assistido' | 'api_oficial'
  nome: string
  descricao: string
  disponivel: boolean
}

// "assistido" abre o link do WhatsApp de cada contato, um por vez, no intervalo configurado — mas
// quem aperta "enviar" dentro do WhatsApp é sempre uma pessoa, então não é envio automatizado de
// fato (fica dentro dos termos de uso do WhatsApp). "api_oficial" é o espaço já reservado pra
// plugar a Cloud API do WhatsApp Business no futuro (exige verificação da empresa na Meta e
// aprovação de modelo de mensagem) — só fica disponível quando essa integração existir.
export const PROVEDORES_ENVIO: ProvedorEnvio[] = [
  {
    id: 'assistido',
    nome: 'Fila assistida (abre o WhatsApp, você clica em enviar)',
    descricao: 'Abre a conversa de cada contato já com a mensagem escrita, no intervalo configurado.',
    disponivel: true,
  },
  {
    id: 'api_oficial',
    nome: 'API oficial do WhatsApp Business (em breve)',
    descricao: 'Envio automático de verdade, sem clique manual — exige verificar a empresa na Meta e aprovar um modelo de mensagem antes de usar.',
    disponivel: false,
  },
]

// Substitui variáveis simples no texto da mensagem pelo dado de cada contato.
export function montarMensagemPersonalizada(
  template: string,
  contato: { nome: string }
): string {
  const primeiroNome = contato.nome.trim().split(/\s+/)[0] || contato.nome
  return template
    .split('{{nome}}').join(contato.nome || '')
    .split('{{primeiro_nome}}').join(primeiroNome)
}
