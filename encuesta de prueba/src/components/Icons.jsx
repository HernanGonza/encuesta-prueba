export function Arrow({ back = false }) {
  return <span aria-hidden="true">{back ? '←' : '→'}</span>
}

export function Lock() {
  return (
    <svg aria-hidden="true" width="15" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="5" y="10" width="14" height="11" rx="3"/>
      <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>
    </svg>
  )
}
