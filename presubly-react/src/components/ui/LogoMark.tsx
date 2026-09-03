interface Props {
  size?: number
  inverted?: boolean
}

export default function LogoMark({ size = 34, inverted = false }: Props) {
  const pad = Math.round(size * 0.265)
  const gap = Math.round(size * 0.132)
  const bh = Math.round(size * 0.103)
  const br = Math.round(bh * 0.57)
  const w1 = Math.round(size * 0.56)
  const w2 = Math.round(size * 0.44)
  const w3 = Math.round(size * 0.29)
  const radius = Math.round(size * 0.235)

  return (
    <div
      className={`lmark${inverted ? ' inv' : ''}`}
      style={{
        width: size,
        height: size,
        padding: `${pad}px ${pad - 1}px`,
        gap: `${gap}px`,
        borderRadius: `${radius}px`,
        background: inverted ? 'rgba(242,247,245,.1)' : 'var(--t)',
        border: inverted ? '1px solid rgba(242,247,245,.15)' : undefined,
        boxShadow: inverted ? 'none' : '0 2px 8px rgba(10,61,61,.2)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: w1,
          height: bh,
          borderRadius: br,
          background: inverted ? 'rgba(242,247,245,.65)' : 'rgba(242,247,245,.88)',
        }}
      />
      <div
        style={{
          width: w2,
          height: bh,
          borderRadius: br,
          background: inverted ? 'rgba(242,247,245,.35)' : 'rgba(242,247,245,.5)',
        }}
      />
      <div
        style={{
          width: w3,
          height: bh,
          borderRadius: br,
          background: 'var(--a)',
          opacity: inverted ? 0.9 : 1,
        }}
      />
    </div>
  )
}
