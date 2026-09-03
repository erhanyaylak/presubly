/**
 * Browser-direct call to Anthropic's Messages API.
 * NOTE: ships the user's personal API key from localStorage. This is the
 * existing pattern from the Astro/single-file versions; production deploys
 * should move this to a server-side proxy when company setup completes.
 */
export async function callClaude(
  apiKey: string,
  system: string,
  user: string,
  maxTokens: number = 4096,
): Promise<string> {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  })

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}))
    throw new Error(err.error?.message || `API Error ${resp.status}`)
  }

  const data = await resp.json()
  return data.content?.[0]?.text || ''
}
