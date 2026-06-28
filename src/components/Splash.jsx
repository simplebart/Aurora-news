import { useEffect, useState } from 'react'
import './Splash.css'

export default function Splash({ onDone }) {
  const [phase, setPhase] = useState('in') // 'in' | 'hold' | 'out'

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 600)
    const t2 = setTimeout(() => setPhase('out'),  1800)
    const t3 = setTimeout(() => onDone(),         2400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  return (
    <div className={`splash splash-${phase}`}>
      <div className="splash-inner">
        <div className="splash-mark">✦</div>
        <div className="splash-name">Aurora</div>
      </div>
    </div>
  )
}
