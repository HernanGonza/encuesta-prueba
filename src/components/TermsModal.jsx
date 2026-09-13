import { useEffect, useRef } from 'react'
import { Lock } from './Icons'

export default function TermsModal({ onAccept, onClose }) {
  const acceptRef = useRef(null)

  useEffect(() => {
    acceptRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="terms-title">
        <div className="modal-icon"><Lock/></div>
        <h2 id="terms-title">Antes de empezar</h2>
        <ul className="modal-list">
          <li>Tu respuesta es <strong>anónima</strong>: no te pedimos nombre ni datos de contacto.</li>
          <li>Para evitar que la misma persona responda dos veces, guardamos tu IP aproximada y un identificador de tu navegador. No se usan para identificarte.</li>
          <li>Tus respuestas se usan únicamente para generar estadísticas agregadas sobre esta encuesta.</li>
        </ul>
        <div className="modal-actions">
          <button className="ghost" onClick={onClose}>Cancelar</button>
          <button className="primary" ref={acceptRef} onClick={onAccept}>Acepto, continuar</button>
        </div>
      </div>
    </div>
  )
}
