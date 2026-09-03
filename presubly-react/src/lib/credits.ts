import { sbFetch } from './supabase'
import { $user, $credits, $isAdmin } from '@/stores/auth-store'
import { TOOL_COSTS } from './constants'

export async function deductCredits(toolKey: string, lang: 'tr' | 'en' = 'tr') {
  const user = $user.get()
  if (!user) throw new Error(lang === 'tr' ? 'Lütfen giriş yapın.' : 'Please sign in first.')
  if ($isAdmin.get()) return

  const cost = TOOL_COSTS[toolKey] || 1
  const cur = $credits.get()
  if (cur < cost) {
    throw new Error(
      lang === 'tr'
        ? `Yetersiz kredi. ${cost} kredi gerekli.`
        : `Insufficient credits. ${cost} credits needed.`,
    )
  }

  $credits.set(cur - cost)
  try {
    await sbFetch('/rest/v1/rpc/psb_deduct_credits', {
      method: 'POST',
      body: JSON.stringify({ p_user_id: user.id, p_amount: cost, p_tool: toolKey }),
    })
  } catch {
    // ignore — credit will be reconciled on next page load via loadUserCredits
  }
}
