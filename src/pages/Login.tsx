import { useState } from 'react'
import { Anchor, LogIn } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [entrando, setEntrando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEntrando(true)
    setErro(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) {
      setErro('E-mail ou senha incorretos.')
      setEntrando(false)
    }
    // sucesso: onAuthStateChange no App.tsx atualiza a sessão e redireciona
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-hull-900 px-4">
      <div className="w-full max-w-sm rounded-md bg-white p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <Anchor className="mb-2 h-7 w-7 text-brass-500" strokeWidth={1.75} />
          <p className="font-display text-xl text-hull-900">Estaleiro CRM</p>
          <p className="mt-1 text-xs text-slate-400">Acesso restrito à equipe</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-hull-900">E-mail</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              autoFocus
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-hull-900">Senha</span>
            <input
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="input"
            />
          </label>

          {erro && <p className="text-sm text-signal-red">{erro}</p>}

          <button
            type="submit"
            disabled={entrando}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-hull-900 px-4 py-2.5 text-sm font-medium text-foam-50 hover:bg-hull-800 disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" strokeWidth={1.75} />
            {entrando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
