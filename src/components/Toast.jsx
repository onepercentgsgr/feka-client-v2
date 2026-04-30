import { useEffect, useState } from 'react'

const DURATION = 2800

// Singleton queue — se usa con showToast() importado como función
let _setToasts = null

export function showToast(msg, type = 'info') {
  if (!_setToasts) return
  const id = Date.now() + Math.random()
  _setToasts(prev => [...prev, { id, msg, type }])
  setTimeout(() => {
    _setToasts(prev => prev.filter(t => t.id !== id))
  }, DURATION)
}

const COLOR = { info: '#333', success: '#2e7d32', error: '#c62828' }

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])
  _setToasts = setToasts // registrar setter global

  return (
    <div style={{
      position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8,
      pointerEvents: 'none', width: '90%', maxWidth: 360,
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: COLOR[t.type] || COLOR.info,
          color: 'white', padding: '10px 16px', borderRadius: 12,
          fontSize: '0.88rem', fontWeight: 600,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          animation: 'toastIn 0.25s ease',
          textAlign: 'center',
        }}>
          {t.msg}
        </div>
      ))}
      <style>{`@keyframes toastIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  )
}
