import { useState, useEffect, useRef } from 'react'
import Logo from './components/Logo'
import City from './components/City'
import { Arrow, Lock } from './components/Icons'

// TODO: esto hoy es fijo. Cuando se conecte a Supabase, `questions` va a
// venir de obtener_encuesta_publica(subdominio) en vez de estar hardcodeado.
const questions = [
  { title: '¿Cómo se siente vivir en tu ciudad?', description: 'Pensá en tu experiencia cotidiana, en general.', type: 'single', options: ['Muy bien', 'Bien', 'Ni bien ni mal', 'Mal', 'Muy mal'], icons: ['✦', '↗', '—', '↘', '↓'] },
  { title: '¿Qué te gustaría que mejore?', description: 'Elegí hasta 3 temas que consideres prioritarios.', type: 'multi', options: ['Seguridad', 'Calles y veredas', 'Transporte público', 'Limpieza y residuos', 'Espacios verdes', 'Salud', 'Educación', 'Iluminación'] },
  { title: '¿Cómo evaluás los espacios públicos?', description: 'Del 1 al 5, ¿qué tan satisfecho/a estás con las plazas y parques de tu ciudad?', type: 'rating' },
  { title: '¿Hace cuánto vivís en tu ciudad?', description: 'Cada mirada cuenta, desde el primer día.', type: 'single', options: ['Menos de 1 año', 'Entre 1 y 5 años', 'Entre 6 y 10 años', 'Más de 10 años', 'Toda mi vida'] },
  { title: 'Si pudieras cambiar una cosa, ¿cuál sería?', description: 'Ese detalle que haría mejor tu día a día. Esta pregunta es opcional.', type: 'text' },
]

function Survey() {
  const [step, setStep] = useState(-1)
  const [answers, setAnswers] = useState({})
  const [error, setError] = useState('')
  const heading = useRef(null)

  const q = questions[step]
  const done = step === questions.length
  const value = answers[step]
  const progress = done ? 100 : Math.max(0, step) / questions.length * 100

  useEffect(() => {
    heading.current?.focus()
    window.scrollTo(0, 0)
    setError('')
  }, [step])

  const choose = (v) => {
    setError('')
    if (q.type === 'multi') {
      const old = value || []
      if (old.includes(v)) setAnswers({ ...answers, [step]: old.filter(x => x !== v) })
      else if (old.length < 3) setAnswers({ ...answers, [step]: [...old, v] })
      else setError('Podés elegir hasta 3 temas. Quitá uno para seleccionar otro.')
    } else {
      setAnswers({ ...answers, [step]: v })
    }
  }

  const next = () => {
    if (q && q.type !== 'text' && (value === undefined || (Array.isArray(value) && !value.length))) {
      setError('Elegí una respuesta para continuar.')
      return
    }
    setStep(s => s + 1)
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return
      const tag = e.target.tagName
      if (['TEXTAREA', 'INPUT', 'BUTTON', 'A'].includes(tag)) return
      if (e.key === 'Enter' && !done) { e.preventDefault(); next() }
      if (q && q.type !== 'text') {
        const index = e.key.toUpperCase().charCodeAt(0) - 65
        if (q.options && index >= 0 && index < q.options.length) choose(q.options[index])
        if (q.type === 'rating' && /^[1-5]$/.test(e.key)) choose(Number(e.key))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step, answers])

  return (
    <div className="survey-area">
      <div className="survey-top">
        <span>VIDA EN TU CIUDAD</span>
        <span className="demo"><i/> Encuesta de muestra</span>
      </div>
      <main id="main" className={'main ' + (step < 0 ? 'welcome' : '')}>
        <div className="screen" key={step}>
          {step < 0 ? (
            <>
              <div className="tag">TU OPINIÓN ES EL PUNTO DE PARTIDA</div>
              <h1 ref={heading} tabIndex={-1}>Tu ciudad.<br/>Tu mirada.<br/><span>Queremos escucharte.</span></h1>
              <p className="intro">Contanos cómo es vivir en tu ciudad y qué te gustaría mejorar. Unos minutos tuyos pueden abrir nuevas conversaciones.</p>
              <div className="facts">
                <span>◷ &nbsp; 2 minutos</span>
                <span>☷ &nbsp; 5 preguntas</span>
                <span>↗ &nbsp; Sin registro</span>
              </div>
              <div className="actions">
                <button className="primary" onClick={next}>Empezar encuesta <Arrow/></button>
                <span className="keyboard">presioná <kbd>Enter ↵</kbd></span>
              </div>
              <p className="privacy"><Lock/> Esta es una demo. Tus respuestas no se envían ni se guardan.</p>
            </>
          ) : done ? (
            <>
              <div className="complete-icon">✓</div>
              <div className="tag">CADA MIRADA SUMA</div>
              <h1 ref={heading} tabIndex={-1}>Gracias por<br/><span>sumar tu voz.</span></h1>
              <p className="intro">Así de simple puede ser participar.<br/>Llegaste al final de esta encuesta de muestra.</p>
              <div className="notice"><Lock/><p>Demo finalizada. No se enviaron ni guardaron tus respuestas. Al reiniciar o recargar, se borran.</p></div>
              <button className="primary" onClick={() => { setAnswers({}); setStep(-1) }}>Volver a empezar <span aria-hidden="true">↻</span></button>
            </>
          ) : (
            <>
              <div className="question-label">
                <span>{String(step + 1).padStart(2, '0')}</span> / {String(questions.length).padStart(2, '0')}
                <span className="question-kind">
                  {q.type === 'multi' ? 'SELECCIÓN MÚLTIPLE' : q.type === 'text' ? 'RESPUESTA ABIERTA' : q.type === 'rating' ? 'VALORACIÓN' : 'UNA SOLA OPCIÓN'}
                </span>
              </div>
              <h1 className="question-title" ref={heading} tabIndex={-1}>{q.title}</h1>
              <p className="question-description" id="question-description">{q.description}</p>

              {q.options && (
                <div className={'options ' + (q.type === 'multi' ? 'grid' : '')} role="group" aria-label={q.title} aria-describedby="question-description">
                  {q.options.map((option, i) => {
                    const selected = q.type === 'multi' ? (value || []).includes(option) : value === option
                    return (
                      <button key={option} className={'option ' + (selected ? 'selected' : '')} aria-pressed={selected} onClick={() => choose(option)}>
                        <span className="letter">{String.fromCharCode(65 + i)}</span>
                        <span>{option}</span>
                        <span className="option-end" aria-hidden="true">{selected ? '✓' : q.icons?.[i] || '+'}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {q.type === 'rating' && (
                <div className="rating-wrap">
                  <div className="ratings" role="group" aria-label={q.title}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} aria-label={`${n} de 5`} aria-pressed={value === n} className={'rating ' + (value === n ? 'selected' : '')} onClick={() => choose(n)}>
                        <span aria-hidden="true">{['☂', '☁', '◒', '☀', '✺'][n - 1]}</span>{n}
                      </button>
                    ))}
                  </div>
                  <div className="scale"><span>Nada satisfecho/a</span><span>Muy satisfecho/a</span></div>
                </div>
              )}

              {q.type === 'text' && (
                <>
                  <textarea aria-label={q.title} maxLength={500} value={value || ''} onChange={e => choose(e.target.value)} placeholder="Me gustaría que…" rows={5}/>
                  <div className="character-count">{(value || '').length} / 500</div>
                </>
              )}

              <p className="error" role="alert">{error}</p>
              <div className="actions">
                <button className="primary" onClick={next}>{step === questions.length - 1 ? 'Finalizar demo' : 'Continuar'} <Arrow/></button>
                <span className="keyboard">{q.type === 'text' ? 'Pregunta opcional' : <>presioná <kbd>Enter ↵</kbd></>}</span>
              </div>
            </>
          )}
        </div>
      </main>
      <footer className="survey-footer">
        <div className="progress-block">
          <div className="progress-meta">
            <span>{done ? 'Recorrido completo' : step < 0 ? 'Una conversación que empieza con vos' : `Pregunta ${step + 1} de ${questions.length}`}</span>
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

export default function App() {
  return (
    <>
    <header>
      <Logo/>
      <div className="header-right">
        <span>Entender hoy. Transformar mañana.</span>
        <span>Encuestas online ↗</span>
      </div>
    </header>
    <div className="layout">
      <aside className="story">
        <div className="story-top">
          <span className="eyebrow"><span className="live-dot"/> ESCUCHAR PARA ENTENDER</span>
          <span className="edition">ESTUDIO DE OPINIÓN / 01</span>
        </div>
        <div className="story-copy">
          <h2>Las ciudades<br/>cambian.<br/><span>Con tu voz.</span></h2>
          <p>Las mejores decisiones empiezan<br className="desktop"/> por escuchar a quienes viven ahí.</p>
        </div>
        <City/>
        <div className="story-bottom"><span>PERSONAS. DATOS. DECISIONES.</span><span>↗</span></div>
      </aside>
      <Survey/>
    </div>
    </>
  )
}
