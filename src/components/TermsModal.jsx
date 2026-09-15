import { useEffect, useRef, useState } from 'react'
import { Lock } from './Icons'

export default function TermsModal({ onAccept, onClose }) {
  const acceptRef = useRef(null)
  const [declinado, setDeclinado] = useState(false)

  useEffect(() => {
    if (declinado) return
    acceptRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, declinado])

  // Cancelar (a diferencia de cerrar con Escape/click afuera, que solo
  // oculta el modal y deja reconsiderar) es una decisión explícita de no
  // participar. La mayoría abre esto desde el navegador integrado de
  // WhatsApp, que ignora window.close() por venir de una pestaña que no
  // abrió un script — así que no hay redirect: se agradece y se la invita
  // a cerrar la pestaña ella misma con la X.
  function cancelar() {
    setDeclinado(true)
    window.close()
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (!declinado && e.target === e.currentTarget) onClose() }}>
      <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="terms-title">
        {declinado ? (
          <>
            <div className="modal-icon">🙏</div>
            <h2 id="terms-title">Gracias por tu tiempo</h2>
            <p className="intro">Entendemos que prefieras no participar. Ya podés cerrar esta pestaña.</p>
          </>
        ) : (
          <>
            <div className="modal-icon"><Lock/></div>
            <h2 id="terms-title">Antes de empezar</h2>
            <ul className="modal-list">
              <li>Tu respuesta es <strong>anónima</strong>: no te pedimos nombre ni datos de contacto.</li>
              <li>Para evitar que la misma persona responda dos veces, guardamos tu IP aproximada y un identificador de tu navegador. No se usan para identificarte.</li>
              <li>Tus respuestas se usan únicamente para generar estadísticas agregadas sobre esta encuesta.</li>
            </ul>
            <div className="modal-actions">
              <button className="ghost" onClick={cancelar}>Cancelar</button>
              <button className="primary" ref={acceptRef} onClick={onAccept}>Acepto, continuar</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
