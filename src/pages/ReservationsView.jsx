import { useEffect, useState } from 'react'
import { doc, onSnapshot, addDoc, collection, serverTimestamp, query, where, getDocs, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import { showToast } from '../components/Toast'
import styles from './ReservationsView.module.css'

const STATUS_LABEL = {
  pending:            'Pendiente',
  confirmed:          'Confirmada',
  approved:           'Confirmada',
  cancelled:          'Cancelada',
  rejected:           'Rechazada',
  cancelled_by_client:'Cancelada por vos',
  no_show:            'Ausente',
  awaiting_deposit:   '💰 Seña Requerida',
}
const STATUS_CLASS = {
  pending:            'badge--pending',
  confirmed:          'badge--confirmed',
  approved:           'badge--confirmed',
  cancelled:          'badge--cancelled',
  rejected:           'badge--cancelled',
  cancelled_by_client:'badge--cancelled',
  no_show:            'badge--noshow',
  awaiting_deposit:   'badge--deposit',
}

const CANCELLABLE = new Set(['pending', 'approved', 'awaiting_deposit'])
const IS_CANCELLED = s => ['cancelled', 'cancelled_by_client', 'rejected', 'no_show'].includes(s)

/* ── Modal de pago de seña ── */
function DepositModal({ resId, commerceId, amount, expiresAt, notifiedAlready, onClose }) {
  const [alias,     setAlias]     = useState('Cargando…')
  const [holder,    setHolder]    = useState('Cargando…')
  const [notified,  setNotified]  = useState(notifiedAlready || false)
  const [notifying, setNotifying] = useState(false)
  const [hasError,  setHasError]  = useState(false)

  useEffect(() => {
    if (!commerceId) return
    getDoc(doc(db, 'feka_users_public', commerceId))
      .then(snap => {
        if (snap.exists()) {
          const cfg = snap.data().config || {}
          setAlias(cfg.alias  || 'No configurado')
          setHolder(cfg.holder || 'No configurado')
        }
      })
      .catch(() => { setAlias('—'); setHolder('—') })
  }, [commerceId])

  // Calcular vencimiento
  const expiryText = (() => {
    if (!expiresAt) return null
    const ms   = expiresAt.toMillis ? expiresAt.toMillis() : (expiresAt.seconds * 1000)
    const diff = ms - Date.now()
    if (diff <= 0) return '⛔ Plazo vencido — la reserva será cancelada'
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    const isUrgent = diff < 3600000
    return `⏳ Vence en ${h > 0 ? h + 'h ' : ''}${m}min${isUrgent ? ' — ¡Último momento!' : ''}`
  })()

  async function handleNotify() {
    setNotifying(true)
    setHasError(false)
    try {
      await updateDoc(doc(db, 'feka_reservations', resId), {
        depositNotified:   true,
        depositNotifiedAt: serverTimestamp(),
      })
      setNotified(true)
    } catch {
      setHasError(true)
    } finally {
      setNotifying(false)
    }
  }

  return (
    <div className={styles.depositOverlay} onClick={onClose}>
      <div className={styles.depositModal} onClick={e => e.stopPropagation()}>

        <div className={styles.depositHeader}>
          <p style={{ fontSize: '2.5rem', margin: 0 }}>💰</p>
          <h3 className={styles.depositTitle}>Abonar Seña</h3>
          <p className={styles.depositSubtitle}>Necesaria para confirmar tu reserva</p>
        </div>

        <div className={styles.depositAmountBox}>
          <p className={styles.depositAmountLabel}>Total a abonar</p>
          <p className={styles.depositAmount}>${(amount || 0).toLocaleString('es-AR')}</p>
          {expiryText && (
            <p className={`${styles.depositExpiry} ${expiryText.startsWith('⛔') ? styles.depositExpiryUrgent : ''}`}>
              {expiryText}
            </p>
          )}
        </div>

        <div className={styles.depositBankBox}>
          <p className={styles.depositBankTitle}>🏦 Transferencia bancaria</p>
          <div className={styles.depositBankRow}>
            <span>Alias</span>
            <strong>{alias}</strong>
          </div>
          <div className={styles.depositBankRow}>
            <span>Titular</span>
            <span>{holder}</span>
          </div>
        </div>

        {notified ? (
          <div className={styles.depositSuccess}>
            ✅ ¡Aviso enviado! El comercio verificará tu pago y confirmará la reserva.
          </div>
        ) : (
          <button
            className={styles.depositNotifyBtn}
            onClick={handleNotify}
            disabled={notifying}
          >
            {notifying ? 'Enviando…' : '💸 Ya pagué — Avisar al comercio'}
          </button>
        )}

        {hasError && (
          <div className={styles.depositError}>
            ⚠️ No se pudo enviar el aviso. Verificá tu conexión e intentá de nuevo.
          </div>
        )}

        <div className={styles.depositInfo}>
          ℹ️ Hacé la transferencia al alias indicado y avisá al comercio. Cuando verifiquen el pago, la reserva queda confirmada.
        </div>

        <button className={styles.depositCloseBtn} onClick={onClose}>Cerrar</button>
      </div>
    </div>
  )
}

function ReservationCard({ resId, onStatusLoad }) {
  const [res,         setRes]         = useState(null)
  const [depositOpen, setDepositOpen] = useState(false)
  const [cancelling,  setCancelling]  = useState(false)

  useEffect(() => {
    if (!resId) return
    const unsub = onSnapshot(
      doc(db, 'feka_reservations', resId),
      snap => {
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() }
          setRes(data)
          onStatusLoad?.(resId, data.status || 'pending')
        } else {
          setRes({ id: resId, status: 'cancelled' })
          onStatusLoad?.(resId, 'cancelled')
        }
      },
      () => {}
    )
    return unsub
  }, [resId])

  if (!res) return (
    <div className={styles.card}>
      <p className={styles.loading}>Cargando…</p>
    </div>
  )

  const status  = res.status || 'pending'
  const date    = res.date || '—'
  const time    = res.time || ''
  const guests  = res.people || res.guests || res.partySize || ''

  const isDeposit   = status === 'awaiting_deposit'
  const isApproved  = status === 'approved' || status === 'confirmed'
  const isCancelled = IS_CANCELLED(status)
  const canCancel   = CANCELLABLE.has(status)

  async function handleCancel() {
    if (!window.confirm('¿Cancelar esta reserva?')) return
    setCancelling(true)
    try {
      await updateDoc(doc(db, 'feka_reservations', resId), { status: 'cancelled_by_client' })
      showToast('Reserva cancelada', 'success')
    } catch {
      showToast('No se pudo cancelar. Intentá de nuevo.', 'error')
      setCancelling(false)
    }
  }

  function handleStartOrder() {
    const merchantId = res.merchantId
    const tableNum   = res.assignedTableNumber
    if (!merchantId || !tableNum) return
    const base = window.location.origin + window.location.pathname
    window.location.href = `${base}?commerce=${merchantId}&table=${tableNum}`
  }

  return (
    <>
      <div className={styles.card}>
        <div className={styles.cardTop}>
          <span className={`${styles.badge} ${styles[STATUS_CLASS[status] || 'badge--pending']}`}>
            {STATUS_LABEL[status] || status}
          </span>
          <span className={styles.dateTime}>{date}{time ? ` · ${time}` : ''}</span>
        </div>
        {guests ? <p className={styles.guests}>👥 {guests} personas</p> : null}
        {res.notes ? <p className={styles.notes}>📝 {res.notes}</p> : null}

        {/* Sección confirmada */}
        {isApproved && (
          <div className={styles.confirmedSection}>
            <p className={styles.confirmedMsg}>✅ ¡Tu lugar está confirmado!</p>
            {res.assignedTableNumber && (
              <>
                <p className={styles.confirmedTable}>🍽️ Mesa Asignada: {res.assignedTableNumber}</p>
                <button className={styles.orderBtn} onClick={handleStartOrder}>
                  🍽️ ¡Hacer Pedido en Mesa {res.assignedTableNumber}!
                </button>
              </>
            )}
          </div>
        )}

        {/* Bloque de seña — solo cuando el admin la solicitó */}
        {isDeposit && (
          <div className={`${styles.depositBlock} ${res.depositPaid ? styles.depositBlockPaid : ''}`}>
            <div className={styles.depositBlockRow}>
              <span>{res.depositPaid ? '✅ Seña abonada' : '💰 Seña requerida'}</span>
              <strong>${(res.depositAmount || 0).toLocaleString('es-AR')}</strong>
            </div>
            {!res.depositPaid && res.depositNotified && (
              <p className={styles.depositNotifiedMsg}>⏳ Pago avisado — esperando verificación del comercio</p>
            )}
            {!res.depositPaid && !res.depositNotified && (
              <button className={styles.depositBtn} onClick={() => setDepositOpen(true)}>
                💳 Abonar seña ${(res.depositAmount || 0).toLocaleString('es-AR')}
              </button>
            )}
          </div>
        )}

        {/* Cancelar — solo para estados activos */}
        {canCancel && (
          <div className={styles.cancelRow}>
            <button
              className={styles.cancelBtn}
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? 'Cancelando…' : 'Cancelar Reserva'}
            </button>
          </div>
        )}
      </div>

      {depositOpen && (
        <DepositModal
          resId={resId}
          commerceId={res.merchantId}
          amount={res.depositAmount}
          expiresAt={res.depositExpiresAt}
          notifiedAlready={res.depositNotified}
          onClose={() => setDepositOpen(false)}
        />
      )}
    </>
  )
}

// Formulario de nueva reserva
function ReservationForm({ commerceId, user, settings, onSuccess, onCancel }) {
  const [name,    setName]    = useState(user?.displayName || '')
  const [phone,   setPhone]   = useState('')
  const [date,    setDate]    = useState('')
  const [time,    setTime]    = useState('')
  const [pax,     setPax]     = useState(2)
  const [loading, setLoading] = useState(false)

  const PAX_OPTIONS = [2, 3, 4, 5, 6, 8]

  // Fecha mínima = hoy
  const today = new Date().toISOString().split('T')[0]

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !phone.trim() || !date || !time) {
      showToast('Completá todos los campos', 'error')
      return
    }

    // Validar horarios del comercio
    const resvSettings = settings?.reservationSettings || settings?.config?.reservationSettings
    if (resvSettings) {
      const open  = resvSettings.openTime
      const close = resvSettings.closeTime
      if (open && time < open) {
        showToast(`El horario de apertura es a las ${open} hs.`, 'error')
        return
      }
      if (close && time > close) {
        showToast(`El horario de cierre es a las ${close} hs.`, 'error')
        return
      }
    }

    if (!commerceId) {
      showToast('No se identificó el comercio. Escaneá el QR nuevamente.', 'error')
      return
    }

    // Validación: si es hoy, debe ser con al menos 30 minutos de anticipación
    if (date === today) {
      const [h, m] = time.split(':').map(Number)
      const selectedMinutes = h * 60 + m
      const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes()
      if (selectedMinutes < nowMinutes + 30) {
        showToast('La reserva debe ser con al menos 30 minutos de anticipación.', 'error')
        return
      }
    }

    setLoading(true)
    try {
      // Chequeo de duplicados: misma fecha + hora en el mismo comercio
      const dupQ = query(
        collection(db, 'feka_reservations'),
        where('merchantId', '==', commerceId),
        where('date', '==', date),
        where('time', '==', time)
      )
      const dupSnap = await getDocs(dupQ)
      const activeStatuses = ['pending', 'confirmed', 'awaiting_deposit']
      const hasDuplicate = dupSnap.docs.some(d => activeStatuses.includes(d.data().status))
      if (hasDuplicate) {
        showToast('Ya hay una reserva para esa fecha y horario. Elegí otro.', 'error')
        setLoading(false)
        return
      }

      const reservationData = {
        merchantId: commerceId,
        clientName: name.trim(),
        clientPhone: phone.trim(),
        date,
        time,
        people: pax,
        status: 'pending',
        createdAt: serverTimestamp(),
      }
      if (user?.uid) reservationData.userId = user.uid

      const docRef = await addDoc(collection(db, 'feka_reservations'), reservationData)

      // Guardar en localStorage para tracking
      const stored = JSON.parse(localStorage.getItem('feka_my_reservations') || '[]')
      stored.push(docRef.id)
      localStorage.setItem('feka_my_reservations', JSON.stringify(stored))

      onSuccess(docRef.id)
    } catch (err) {
      showToast('No se pudo enviar la reserva. Intentá de nuevo.', 'error')
      setLoading(false)
    }
  }

  return (
    <div className={styles.formCard}>
      <div className={styles.formHeader}>
        <h3 className={styles.formTitle}>📅 Nueva Reserva</h3>
        <button className={styles.formClose} onClick={onCancel}>✕</button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Nombre</label>
          <input
            type="text"
            className={styles.input}
            placeholder="Tu nombre"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Teléfono (WhatsApp)</label>
          <input
            type="tel"
            className={styles.input}
            placeholder="Ej: 11 1234 5678"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            required
            disabled={loading}
          />
          <small className={styles.hint}>Para confirmarte la reserva.</small>
        </div>

        <div className={styles.row}>
          <div className={styles.field} style={{ flex: 1 }}>
            <label className={styles.fieldLabel}>Fecha</label>
            <input
              type="date"
              className={styles.input}
              value={date}
              min={today}
              onChange={e => setDate(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className={styles.field} style={{ flex: 1 }}>
            <label className={styles.fieldLabel}>Hora</label>
            <input
              type="time"
              className={styles.input}
              value={time}
              onChange={e => setTime(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Personas</label>
          <div className={styles.paxRow}>
            {PAX_OPTIONS.map(n => (
              <button
                key={n}
                type="button"
                className={`${styles.paxBtn} ${pax === n ? styles.paxSelected : ''}`}
                onClick={() => setPax(n)}
                disabled={loading}
              >
                {n === 8 ? '8+' : n}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={loading}
        >
          {loading ? 'Enviando…' : 'Solicitar Reserva'}
        </button>
      </form>
    </div>
  )
}

function SuccessCard({ onBack }) {
  return (
    <div className={styles.successCard}>
      <p style={{ fontSize: '3rem', margin: '0 0 12px' }}>✅</p>
      <h3 className={styles.successTitle}>Solicitud Enviada</h3>
      <p className={styles.successMsg}>Tu reserva está pendiente de confirmación por el local.</p>
      <button className={styles.successBtn} onClick={onBack}>Ver mis reservas</button>
    </div>
  )
}

const FILTER_TABS = [
  { key: 'all',       label: 'Todas'       },
  { key: 'pending',   label: 'Pendientes'  },
  { key: 'confirmed', label: 'Confirmadas' },
  { key: 'cancelled', label: 'Canceladas'  },
]

export default function ReservationsView({ commerceId, user, settings, onBack }) {
  const [ids,            setIds]           = useState([])
  const [showForm,       setShowForm]      = useState(false)
  const [justBooked,     setJustBooked]    = useState(false)
  const [statusFilter,   setStatusFilter]  = useState('all')
  const [loadedStatuses, setLoadedStatuses] = useState({})

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('feka_my_reservations') || '[]')
      setIds(stored)
    } catch (_) {
      setIds([])
    }
  }, [])

  function handleStatusLoad(id, status) {
    setLoadedStatuses(prev => ({ ...prev, [id]: status }))
  }

  function isVisible(id) {
    if (statusFilter === 'all') return true
    const s = loadedStatuses[id]
    if (s === undefined) return true   // todavía cargando, mostrarlo
    if (statusFilter === 'pending')   return s === 'pending' || s === 'awaiting_deposit'
    if (statusFilter === 'confirmed') return s === 'confirmed' || s === 'approved'
    if (statusFilter === 'cancelled') return IS_CANCELLED(s)
    return s === statusFilter
  }

  function handleSuccess(newId) {
    setIds(prev => [newId, ...prev])
    setShowForm(false)
    setJustBooked(true)
  }

  if (showForm) {
    return (
      <div className={styles.container}>
        <ReservationForm
          commerceId={commerceId}
          user={user}
          settings={settings}
          onSuccess={handleSuccess}
          onCancel={() => setShowForm(false)}
        />
      </div>
    )
  }

  if (justBooked) {
    return (
      <div className={styles.container}>
        <SuccessCard onBack={() => setJustBooked(false)} />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <h2 className={styles.title}>📅 Mis Reservas</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className={styles.newBtn} onClick={() => setShowForm(true)}>+ Nueva</button>
          <button className={styles.backBtn} onClick={onBack}>← Menú</button>
        </div>
      </div>

      {ids.length === 0 ? (
        <div className={styles.empty}>
          <p style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📅</p>
          <p>No tenés reservas activas.</p>
          <button className={styles.newBtnLarge} onClick={() => setShowForm(true)}>
            + Hacer una reserva
          </button>
        </div>
      ) : (
        <>
          {/* Filtros por estado */}
          <div className={styles.filterTabs}>
            {FILTER_TABS.map(({ key, label }) => (
              <button
                key={key}
                className={`${styles.filterTab} ${statusFilter === key ? styles.filterTabActive : ''}`}
                onClick={() => setStatusFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className={styles.list}>
            {ids.map(id =>
              isVisible(id)
                ? <ReservationCard key={id} resId={id} onStatusLoad={handleStatusLoad} />
                : null
            )}
            {/* Mensaje cuando el filtro no muestra nada */}
            {ids.length > 0 &&
             Object.keys(loadedStatuses).length === ids.length &&
             ids.every(id => !isVisible(id)) && (
              <div className={styles.filterEmpty}>
                No hay reservas {statusFilter === 'pending' ? 'pendientes' : statusFilter === 'confirmed' ? 'confirmadas' : 'canceladas'}.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
