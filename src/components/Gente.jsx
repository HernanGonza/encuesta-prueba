export default function Gente() {
  return (
    <svg className="city" viewBox="0 0 460 350" fill="none" aria-hidden="true">
      <circle cx="335" cy="88" r="58" fill="#d8ef93"/>
      <circle cx="335" cy="88" r="78" stroke="#9fcdab" strokeDasharray="2 7" opacity=".4"/>
      <path d="M0 305L460 174M0 337L460 206M57 350L410 249" stroke="#639e79" opacity=".5"/>

      {/* tres siluetas superpuestas, tomadas de la mano en espíritu */}
      <g>
        <circle cx="120" cy="180" r="34" fill="#568966"/>
        <path d="M60 300c0-46 27-83 60-83s60 37 60 83z" fill="#568966"/>
      </g>
      <g>
        <circle cx="230" cy="160" r="40" fill="#83ae85"/>
        <path d="M158 300c0-56 32-98 72-98s72 42 72 98z" fill="#83ae85"/>
      </g>
      <g>
        <circle cx="335" cy="185" r="34" fill="#487857"/>
        <path d="M275 300c0-46 27-83 60-83s60 37 60 83z" fill="#487857"/>
      </g>

      <path d="M41 281v-44M414 236v-44M153 308v-44" stroke="#b5cc9b" strokeWidth="3"/>
      <path d="M41 204c-27 27-27 42 0 42s27-15 0-42M414 159c-27 27-27 42 0 42s27-15 0-42M153 231c-27 27-27 42 0 42s27-15 0-42" fill="#93b877"/>
      <circle cx="216" cy="269" r="4" fill="#d8ef93"/>
      <path d="M216 273v12" stroke="#d8ef93" strokeWidth="3"/>
    </svg>
  )
}
