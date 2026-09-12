export default function Institucional() {
  return (
    <svg className="city" viewBox="0 0 460 350" fill="none" aria-hidden="true">
      <circle cx="335" cy="88" r="58" fill="#d8ef93"/>
      <circle cx="335" cy="88" r="78" stroke="#9fcdab" strokeDasharray="2 7" opacity=".4"/>
      <path d="M0 305L460 174M0 337L460 206M57 350L410 249" stroke="#639e79" opacity=".5"/>

      {/* barras tipo gráfico, en línea con la identidad de datos de Metr1ka */}
      <rect x="60"  y="190" width="52" height="110" rx="6" fill="#568966"/>
      <rect x="140" y="140" width="52" height="160" rx="6" fill="#83ae85"/>
      <rect x="220" y="100" width="52" height="200" rx="6" fill="#487857"/>
      <rect x="300" y="165" width="52" height="135" rx="6" fill="#83ae85"/>
      <rect x="380" y="215" width="40" height="85"  rx="6" fill="#568966"/>

      <path d="M50 300h380" stroke="#a6c6a6" strokeWidth="2"/>
      <path d="M41 281v-44M414 236v-44M153 308v-44" stroke="#b5cc9b" strokeWidth="3"/>
      <path d="M41 204c-27 27-27 42 0 42s27-15 0-42M414 159c-27 27-27 42 0 42s27-15 0-42M153 231c-27 27-27 42 0 42s27-15 0-42" fill="#93b877"/>
      <circle cx="216" cy="269" r="4" fill="#d8ef93"/>
      <path d="M216 273v12" stroke="#d8ef93" strokeWidth="3"/>
    </svg>
  )
}
