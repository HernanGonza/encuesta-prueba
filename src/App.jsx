import { useState, useEffect, useRef } from 'react'
import Logo from './components/Logo'
import { Arrow, Lock } from './components/Icons'
import { supabase } from './lib/supabase'
import { resolverSubdominio } from './lib/subdominio'
import { obtenerTokenNavegador, obtenerFingerprint, yaRespondio, marcarRespondida } from './lib/antifraude'
import { resolverTema } from './lib/temas'

function estaVacio(valor) {
  if (valor === undefined || valor === null || valor === '') return true
  if (Array.isArray(valor)) return valor.length === 0
  if (typeof valor === 'object') return Object.keys(valor).length === 0
  return false
}

// Arma el jsonb que espera guardar_respuesta_online: una fila por opción
// marcada (checkbox puede generar varias para la misma pregunta).
function construirPayloadRespuestas(preguntas, respuestas) {
  const filas = []
  for (const p of preguntas) {
    const valor = respuestas[p.id]
    if (estaVacio(valor)) continue

    if (p.tipo === 'opcion_multiple' || p.tipo === 'desplegable') {
      filas.push({ pregunta_id: p.id, opcion_id: valor.id })
    } else if (p.tipo === 'checkbox') {
      for (const opcion of valor) filas.push({ pregunta_id: p.id, opcion_id: opcion.id })
    } else if (p.tipo === 'si_no') {
      filas.push({ pregunta_id: p.id, valor_texto: valor })
    } else if (p.tipo === 'escala') {
      filas.push({ pregunta_id: p.id, valor_numero: valor })
    } else if (p.tipo === 'texto_libre') {
      filas.push({ pregunta_id: p.id, valor_texto: valor })
    } else if (p.tipo === 'matriz') {
      for (const [fila, columna] of Object.entries(valor)) {
        filas.push({ pregunta_id: p.id, valor_texto: `${fila}: ${columna}` })
      }
    }
  }
  return filas
}

function Survey({ preguntas, onFinish, enviando, errorEnvio, titulo, bajada }) {
  const [step, setStep] = useState(-1)
  const [respuestas, setRespuestas] = useState({})
  const [error, setError] = useState('')
  const heading = useRef(null)

  const q = preguntas[step]
  const done = step === preguntas.length
  const value = q ? respuestas[q.id] : undefined
  const progress = done ? 100 : Math.max(0, step) / preguntas.length * 100

  useEffect(() => {
    heading.current?.focus()
    window.scrollTo(0, 0)
    setError('')
  }, [step])

  const choose = (v) => {
    setError('')
    if (q.tipo === 'checkbox') {
      const old = value || []
      const yaEsta = old.some(o => o.id === v.id)
      setRespuestas({ ...respuestas, [q.id]: yaEsta ? old.filter(o => o.id !== v.id) : [...old, v] })
    } else {
      setRespuestas({ ...respuestas, [q.id]: v })
    }
  }

  const elegirMatriz = (filaTexto, columnaTexto) => {
    setError('')
    const actual = respuestas[q.id] || {}
    setRespuestas({ ...respuestas, [q.id]: { ...actual, [filaTexto]: columnaTexto } })
  }

  const next = () => {
    if (q && q.requerida) {
      const val = respuestas[q.id]
      const incompleto = q.tipo === 'matriz'
        ? (q.config_matriz?.filas || []).some(f => !val?.[f.texto])
        : estaVacio(val)
      if (incompleto) { setError('Esta pregunta es obligatoria.'); return }
    }
    if (step === preguntas.length - 1) {
      onFinish(construirPayloadRespuestas(preguntas, respuestas))
    }
    setStep(s => s + 1)
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return
      const tag = e.target.tagName
      if (['TEXTAREA', 'INPUT', 'SELECT', 'BUTTON', 'A'].includes(tag)) return
      if (e.key === 'Enter' && !done) { e.preventDefault(); next() }
      if (q && (q.tipo === 'opcion_multiple' || q.tipo === 'checkbox' || q.tipo === 'si_no')) {
        const opciones = opcionesDe(q)
        const index = e.key.toUpperCase().charCodeAt(0) - 65
        if (opciones[index]) choose(opciones[index])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step, respuestas]) // eslint-disable-line

  function opcionesDe(pregunta) {
    if (pregunta.tipo === 'si_no') return [{ id: 'si', texto: 'Sí' }, { id: 'no', texto: 'No' }].map(o => o.texto)
    return (pregunta.opciones || []).map(o => o.texto)
  }

  const etiquetaTipo = {
    checkbox: 'SELECCIÓN MÚLTIPLE',
    texto_libre: 'RESPUESTA ABIERTA',
    escala: 'VALORACIÓN',
    matriz: 'MATRIZ',
    desplegable: 'UNA SOLA OPCIÓN',
    si_no: 'SÍ / NO',
    opcion_multiple: 'UNA SOLA OPCIÓN',
  }

  return (
    <div className="survey-area">
      <div className="survey-top">
        <span>TU OPINIÓN CUENTA</span>
        <span className="demo"><i/> Respuesta anónima</span>
      </div>
      <main id="main" className={'main ' + (step < 0 ? 'welcome' : '')}>
        <div className="screen" key={step}>
          {step < 0 ? (
            <>
              <div className="tag">TU OPINIÓN ES EL PUNTO DE PARTIDA</div>
              <h1 ref={heading} tabIndex={-1}>{titulo}</h1>
              <p className="intro">{bajada}</p>
              <div className="facts">
                <span>◷ &nbsp; 2 minutos</span>
                <span>☷ &nbsp; {preguntas.length} pregunta{preguntas.length !== 1 ? 's' : ''}</span>
                <span>↗ &nbsp; Sin registro</span>
              </div>
              <div className="actions">
                <button className="primary" onClick={next}>Empezar encuesta <Arrow/></button>
                <span className="keyboard">presioná <kbd>Enter ↵</kbd></span>
              </div>
              <p className="privacy"><Lock/> Es anónima. Para evitar respuestas duplicadas guardamos tu IP aproximada y un identificador de tu navegador, nada más.</p>
            </>
          ) : done ? (
            <>
              <div className="complete-icon">{errorEnvio ? '⚠️' : '✓'}</div>
              <div className="tag">{errorEnvio ? 'ALGO NO SALIÓ BIEN' : 'CADA MIRADA SUMA'}</div>
              <h1 ref={heading} tabIndex={-1}>
                {errorEnvio === 'respuesta_duplicada'
                  ? <>Ya habías<br/><span>respondido esta encuesta.</span></>
                  : errorEnvio
                  ? <>No se pudo<br/><span>guardar tu respuesta.</span></>
                  : <>Gracias por<br/><span>sumar tu voz.</span></>}
              </h1>
              <p className="intro">
                {errorEnvio === 'respuesta_duplicada'
                  ? 'Cada persona puede responder esta encuesta una sola vez.'
                  : errorEnvio
                  ? 'Probá de nuevo en un momento.'
                  : 'Tu respuesta ya quedó registrada.'}
              </p>
              {enviando && <p className="intro">Enviando...</p>}
            </>
          ) : (
            <>
              <div className="question-label">
                <span>{String(step + 1).padStart(2, '0')}</span> / {String(preguntas.length).padStart(2, '0')}
                <span className="question-kind">{etiquetaTipo[q.tipo] || ''}</span>
              </div>
              <h1 className="question-title" ref={heading} tabIndex={-1}>{q.texto}</h1>

              {(q.tipo === 'opcion_multiple' || q.tipo === 'checkbox') && (
                <div className={'options ' + (q.tipo === 'checkbox' ? 'grid' : '')} role="group" aria-label={q.texto}>
                  {(q.opciones || []).map((opcion, i) => {
                    const selected = q.tipo === 'checkbox' ? (value || []).some(o => o.id === opcion.id) : value?.id === opcion.id
                    return (
                      <button key={opcion.id} className={'option ' + (selected ? 'selected' : '')} aria-pressed={selected} onClick={() => choose(opcion)}>
                        <span className="letter">{String.fromCharCode(65 + i)}</span>
                        <span>{opcion.texto}</span>
                        <span className="option-end" aria-hidden="true">{selected ? '✓' : '+'}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {q.tipo === 'si_no' && (
                <div className="options" role="group" aria-label={q.texto}>
                  {['Sí', 'No'].map((texto, i) => (
                    <button key={texto} className={'option ' + (value === texto ? 'selected' : '')} aria-pressed={value === texto} onClick={() => choose(texto)}>
                      <span className="letter">{String.fromCharCode(65 + i)}</span>
                      <span>{texto}</span>
                      <span className="option-end" aria-hidden="true">{value === texto ? '✓' : '+'}</span>
                    </button>
                  ))}
                </div>
              )}

              {q.tipo === 'desplegable' && (
                <select className="select-native" value={value?.id || ''} onChange={e => choose((q.opciones || []).find(o => o.id === e.target.value))}>
                  <option value="" disabled>Elegí una opción</option>
                  {(q.opciones || []).map(o => <option key={o.id} value={o.id}>{o.texto}</option>)}
                </select>
              )}

              {q.tipo === 'escala' && (
                <div className="rating-wrap">
                  <div className="ratings ratings-10">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                      <button key={n} aria-label={`${n} de 10`} aria-pressed={value === n} className={'rating ' + (value === n ? 'selected' : '')} onClick={() => choose(n)}>{n}</button>
                    ))}
                  </div>
                  <div className="scale"><span>Nada satisfecho/a</span><span>Muy satisfecho/a</span></div>
                </div>
              )}

              {q.tipo === 'texto_libre' && (
                <>
                  <textarea aria-label={q.texto} maxLength={500} value={value || ''} onChange={e => choose(e.target.value)} placeholder="Escribí acá…" rows={5}/>
                  <div className="character-count">{(value || '').length} / 500</div>
                </>
              )}

              {q.tipo === 'matriz' && (
                <div className="matrix-wrap">
                  <table className="matrix">
                    <thead>
                      <tr>
                        <th/>
                        {(q.config_matriz?.columnas || []).map(c => <th key={c.texto}>{c.texto}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {(q.config_matriz?.filas || []).map(f => (
                        <tr key={f.texto}>
                          <td className="matrix-row-label">{f.texto}</td>
                          {(q.config_matriz?.columnas || []).map(c => (
                            <td key={c.texto}>
                              <button
                                aria-label={`${f.texto}: ${c.texto}`}
                                className={'matrix-radio ' + (value?.[f.texto] === c.texto ? 'selected' : '')}
                                onClick={() => elegirMatriz(f.texto, c.texto)}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <p className="error" role="alert">{error}</p>
              <div className="actions">
                <button className="primary" onClick={next}>{step === preguntas.length - 1 ? 'Finalizar' : 'Continuar'} <Arrow/></button>
                <span className="keyboard">{q.tipo === 'texto_libre' || q.tipo === 'matriz' || q.tipo === 'escala' || q.tipo === 'desplegable' ? (q.requerida ? 'Obligatoria' : 'Opcional') : <>presioná <kbd>Enter ↵</kbd></>}</span>
              </div>
            </>
          )}
        </div>
      </main>
      <footer className="survey-footer">
        <div className="progress-block">
          <div className="progress-meta">
            <span>{done ? 'Recorrido completo' : step < 0 ? 'Una conversación que empieza con vos' : `Pregunta ${step + 1} de ${preguntas.length}`}</span>
            <span>{progress}%</span>
          </div>
          <div className="progress-track" role="progressbar" aria-label="Progreso de la encuesta" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
            <div style={{ width: progress + '%' }}/>
          </div>
        </div>
        <div className="navigation">
          <button aria-label="Pregunta anterior" disabled={step <= -1 || done} onClick={() => setStep(s => s - 1)}><Arrow back/></button>
          <button aria-label="Continuar encuesta" disabled={done} onClick={next}><Arrow/></button>
        </div>
      </footer>
    </div>
  )
}

function Pantalla({ titulo, children }) {
  return (
    <div className="survey-area">
      <main className="main welcome">
        <div className="screen">
          <h1>{titulo}</h1>
          {children}
        </div>
      </main>
    </div>
  )
}

export default function App() {
  const [subdominio] = useState(resolverSubdominio)
  const [estado, setEstado] = useState('cargando') // cargando | no_encontrada | lista | sin_subdominio | ya_respondida
  const [encuesta, setEncuesta] = useState(null)
  const [preguntas, setPreguntas] = useState([])
  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState(null)

  useEffect(() => {
    if (!subdominio) { setEstado('sin_subdominio'); return }

    supabase.rpc('obtener_encuesta_publica', { p_subdominio: subdominio }).then(({ data, error }) => {
      if (error || !data || data.error) { setEstado('no_encontrada'); return }
      setEncuesta(data.encuesta)
      if (yaRespondio(subdominio)) { setEstado('ya_respondida'); return }
      setPreguntas(data.preguntas || [])
      setEstado('lista')
    })
  }, [subdominio])

  const tema = resolverTema(encuesta?.tema_visual)
  const titulo = encuesta?.titulo_publico || encuesta?.nombre || 'Encuesta'
  const bajada = encuesta?.subtitulo_publico || encuesta?.descripcion || 'Contanos qué pensás. Es anónimo, no hace falta registrarse.'

  async function handleFinish(respuestasPayload) {
    setEnviando(true)
    setErrorEnvio(null)
    try {
      const [token_navegador, fingerprint] = await Promise.all([
        obtenerTokenNavegador(),
        obtenerFingerprint(),
      ])
      const res = await fetch('/api/responder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subdominio, respuestas: respuestasPayload, token_navegador, fingerprint }),
      })
      const json = await res.json()
      if (!json.ok) {
        setErrorEnvio(json.error || 'error_desconocido')
      } else {
        marcarRespondida(subdominio)
      }
    } catch {
      setErrorEnvio('error_desconocido')
    }
    setEnviando(false)
  }

  return (
    <>
      <header>
        <Logo/>
        <div className="header-right">
          <span>Entender hoy. Transformar mañana.</span>
          <span>Metr1ka ↗</span>
        </div>
      </header>
      <div className="layout">
        <aside className="story">
          <div className="story-top">
            <span className="eyebrow"><span className="live-dot"/> {tema.eyebrow}</span>
            <span className="edition">{tema.edition}</span>
          </div>
          <div className="story-copy">
            <h2>{tema.tituloAside}</h2>
            <p>{tema.bajadaAside}</p>
          </div>
          <tema.Ilustracion/>
          <div className="story-bottom"><span>PERSONAS. DATOS. DECISIONES.</span><span>↗</span></div>
        </aside>

        {estado === 'cargando' && <Pantalla titulo="Cargando…"/>}
        {estado === 'sin_subdominio' && (
          <Pantalla titulo="Falta indicar la encuesta">
            <p className="intro">Esta página se abre desde el subdominio de cada encuesta (ej. campogrande.metr1ka.com). En desarrollo local, agregá <code>?subdominio=campogrande</code> a la URL.</p>
          </Pantalla>
        )}
        {estado === 'no_encontrada' && (
          <Pantalla titulo="Esta encuesta no está disponible">
            <p className="intro">O no existe, o todavía no fue publicada.</p>
          </Pantalla>
        )}
        {estado === 'ya_respondida' && (
          <Pantalla titulo="Ya respondiste esta encuesta">
            <p className="intro">Cada persona puede responder una sola vez. ¡Gracias por participar!</p>
          </Pantalla>
        )}
        {estado === 'lista' && (
          <Survey preguntas={preguntas} onFinish={handleFinish} enviando={enviando} errorEnvio={errorEnvio} titulo={titulo} bajada={bajada}/>
        )}
      </div>
    </>
  )
}
