import { useState } from 'react'
import Modal from '@/components/Modal'
import { CampoTexto } from '@/components/campos'
import { supabase } from '@/lib/supabase'
import { mensagemErro } from '@/lib/errors'

export default function AlterarSenhaModal({ onClose }: { onClose: () => void }) {
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  async function salvar() {
    setErro(null)
    if (novaSenha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (novaSenha !== confirmar) {
      setErro('As senhas não coincidem.')
      return
    }
    setSalvando(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: novaSenha })
      if (error) throw error
      setSucesso(true)
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao alterar senha'))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal
      title="Alterar senha"
      onClose={onClose}
      size="sm"
      footer={
        sucesso ? (
          <button
            onClick={onClose}
            className="rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50"
          >
            Fechar
          </button>
        ) : (
          <>
            <button onClick={onClose} className="rounded-md px-4 py-2 text-sm text-slate-500 hover:text-hull-900">
              Cancelar
            </button>
            <button
              onClick={salvar}
              disabled={salvando || !novaSenha || !confirmar}
              className="rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50 disabled:opacity-50"
            >
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
          </>
        )
      }
    >
      {sucesso ? (
        <p className="text-sm text-signal-green">Senha alterada com sucesso.</p>
      ) : (
        <div className="space-y-4">
          {erro && (
            <div className="rounded-md border border-signal-red/30 bg-signal-red/5 px-3 py-2 text-xs text-signal-red">
              {erro}
            </div>
          )}
          <CampoTexto label="Nova senha" value={novaSenha} onChange={setNovaSenha} type="password" />
          <CampoTexto label="Confirmar nova senha" value={confirmar} onChange={setConfirmar} type="password" />
        </div>
      )}
    </Modal>
  )
}
