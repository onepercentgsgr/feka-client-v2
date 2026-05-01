import { useEffect, useState, useRef } from 'react'
import { doc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '../services/firebase'
import { showToast } from '../components/Toast'
import { downloadOrderReceipt } from '../services/receipt'
import styles from './OrdersView.module.css'

/* ── Helpers ── */
function fmt(n) {
  return `$${Math.round(n || 0).toLocaleString('es-AR')}`
}
function fmtDate(ts) {
  if (!ts?.seconds) return ''
  return new Date(ts.seconds * 1000).toLocaleString([], {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

const STATUS_META = {
  requested: { label: 'Solicitado',        color: '#FFCA28', textColor: '#fff' },
  pending:   { label: 'Solicitado',        color: '#FFCA28', textColor: '#fff' },
  preparing: { label: 'En Preparación',    color: '#FFA726', textColor: '#fff' },
  ready:     { label: '¡Listo para entregar!', color: '#FFA726', textColor: '#fff' },
  completed: { label: 'Consumido',         color: '#66BB6A', textColor: '#fff' },
  cancelled: { label: 'Cancelado',         color: '#EF5350', textColor: '#fff' },
}

/* ── Timer en vivo para "Preparando" ── */
function Countdown({ startedAt, prepTime }) {
  const [secs, setSecs] = useState(0)
  useEffect(() => {
    const start = startedAt?.toMillis?.() || Date.now()
    const end   = start + (prepTime || 15) * 60 * 1000
    const tick = () => setSecs(Math.max(0, Math.ceil((end - Date.now()) / 1000)))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startedAt, prepTime])

  if (secs <= 0) return (
    <div className={styles.countdownBanner}>⏳ Ya debería estar listo…</div>
  )
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return (
    <div className={styles.countdownBanner}>
      ⏳ Sale en {m > 0 ? `${m}min ` : ''}{String(s).padStart(2, '0')}s aprox…
    </div>
  )
}

/* ── Barra de progreso ── */
function ProgressBar({ status }) {
  if (status === 'cancelled') return null

  const done   = '#4CAF50'
  const orange = '#FFA726'
  const empty  = '#e0e0e0'

  const after1 = ['preparing', 'ready', 'completed'].includes(status)
  const after2 = ['ready', 'completed'].includes(status)
  const after3 = status === 'completed'

  const dot1 = done
  const dot2 = after2 ? done : status === 'preparing' ? orange : empty
  const dot3 = after3 ? done : status === 'ready' ? orange : empty
  const dot4 = after3 ? done : empty

  const line1 = after1 ? done : empty
  const line2 = after2 ? done : empty
  const line3 = after3 ? done : empty

  const icon2 = status === 'preparing' ? '🍳' : after2 ? '✓' : '·'
  const icon3 = status === 'ready' ? '🔔' : after3 ? '✓' : '·'
  const icon4 = after3 ? '✓' : '·'

  const lbl1 = '#4CAF50'
  const lbl2 = status === 'preparing' ? orange : after2 ? done : '#bbb'
  const lbl3 = status === 'ready' ? orange : after3 ? done : '#bbb'
  const lbl4 = after3 ? done : '#bbb'

  return (
    <div className={styles.progress}>
      <div className={styles.progressStep}>
        <div className={styles.dot} style={{ background: dot1, color: '#fff' }}>✓</div>
        <div className={styles.dotLabel} style={{ color: lbl1 }}>Recibido</div>
      </div>
      <div className={styles.line} style={{ background: line1 }} />
      <div className={styles.progressStep}>
        <div className={styles.dot} style={{ background: dot2, color: '#fff' }}>{icon2}</div>
        <div className={styles.dotLabel} style={{ color: lbl2 }}>Preparando</div>
      </div>
      <div className={styles.line} style={{ background: line2 }} />
      <div className={styles.progressStep}>
        <div className={`${styles.dot} ${status === 'ready' ? styles.dotReady : ''}`} style={{ background: dot3, color: '#fff' }}>{icon3}</div>
        <div className={styles.dotLabel} style={{ color: lbl3 }}>¡Listo!</div>
      </div>
      <div className={styles.line} style={{ background: line3 }} />
      <div className={styles.progressStep}>
        <div className={styles.dot} style={{ background: dot4, color: '#fff' }}>{icon4}</div>
        <div className={styles.dotLabel} style={{ color: lbl4 }}>Entregado</div>
      </div>
    </div>
  )
}

/* ── Tarjeta individual ── */
function OrderCard({ orderId, commerceId, onPayNow, onStatusLoad }) {
  const [order, setOrder] = useState(null)

  useEffect(() => {
    if (!orderId || !commerceId) return
    const unsub = onSnapshot(
      doc(db, 'feka_users', commerceId, 'orders', orderId),
      snap => {
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() }
          setOrder(data)
          onStatusLoad?.(orderId, data.status || 'requested')
        } else {
          setOrder({ id: orderId, status: 'cancelled' })
          onStatusLoad?.(orderId, 'cancelled')
        }
      },
      () => setOrder(prev => prev || { id: orderId, status: 'cancelled' })
    )
    return unsub
  }, [orderId, commerceId])

  async function handleCancel() {
    if (!window.confirm('¿Cancelar este pedido?')) return
    try {
      await updateDoc(doc(db, 'feka_users', commerceId, 'orders', orderId), {
        status: 'cancelled',
        paymentStatus: 'cancelled',
        cancelledAt: serverTimestamp(),
        cancelledBy: 'client',
      })
      showToast('Pedido cancelado', 'success')
    } catch {
      showToast('No se pudo cancelar. Intentá de nuevo.', 'error')
    }
  }

  if (!order) {
    return (
      <div className={styles.card} style={{ borderLeftColor: '#ddd' }}>
        <p className={styles.loading}>Cargando pedido…</p>
      </div>
    )
  }

  // Los llamados al mozo no se muestran como pedidos al cliente
  if (order.isWaiterCall) return null

  const status      = order.status || 'requested'
  const meta        = STATUS_META[status] || STATUS_META.requested
  const items       = order.items || []
  const total       = order.total || 0
  const pStatus     = order.paymentStatus
  const pMethod     = order.paymentMethod
  const dateStr     = fmtDate(order.createdAt)
  const shortId     = orderId.slice(-4).toUpperCase()

  /* ── Badge de pago ── */
  let payBadge = null
  if (status === 'cancelled') {
    payBadge = <span className={styles.payGray}>— Cancelado —</span>
  } else if (pStatus === 'paid') {
    payBadge = <span className={styles.payGreen}>💰 Pagado</span>
  } else if (pStatus === 'payment_verify') {
    payBadge = <span className={styles.payOrange}>⏳ Verificando Pago...</span>
  } else if (pStatus === 'pay_at_counter') {
    if (pMethod === 'card')     payBadge = <span className={styles.payOrange}>💳 Esperando Posnet</span>
    else if (pMethod === 'qr' || pMethod === 'qr_posnet') payBadge = <span className={styles.payPurple}>📱 Esperando QR</span>
    else                        payBadge = <span className={styles.payOrange}>💵 Efectivo Pendiente</span>
  } else {
    payBadge = <span className={styles.payOrange}>🕒 Pendiente de Pago</span>
  }

  /* ── Botones de acción ── */
  const canPay    = status !== 'cancelled' && pStatus !== 'paid' && pStatus !== 'payment_verify'
  const canCancel = status !== 'completed' && status !== 'cancelled' && pStatus !== 'paid'

  return (
    <div
      className={styles.card}
      style={{ borderLeftColor: meta.color }}
    >
      {/* Header */}
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.orderTitle}>Pedido #{shortId}</div>
          {dateStr && <div className={styles.orderDate}>{dateStr}</div>}
        </div>
        <div className={styles.cardHeaderRight}>
          <div
            className={styles.statusBadge}
            style={{ background: meta.color }}
          >
            {meta.label}
          </div>
          <div className={styles.payMethod}>{payBadge}</div>
        </div>
      </div>

      {/* Progress bar */}
      <ProgressBar status={status} />

      {/* Banner "Preparando" countdown */}
      {status === 'preparing' && order.preparingAt && (
        <Countdown startedAt={order.preparingAt} prepTime={order.prepTime} />
      )}
      {status === 'preparing' && !order.preparingAt && (
        <div className={styles.countdownBanner}>
          ⏳ Sale en {order.prepTime || 15} min aprox…
        </div>
      )}

      {/* Banner "¡Listo!" */}
      {status === 'ready' && (
        <div className={styles.readyBanner}>
          <div className={styles.readyIcon}>🔔</div>
          <div className={styles.readyTitle}>¡Tu pedido está listo!</div>
          <div className={styles.readySub}>El mozo lo lleva a tu mesa ahora 🚀</div>
        </div>
      )}

      {/* Banner pedido parcial */}
      {order.isPartial && (
        <div className={styles.partialBanner}>
          <div className={styles.bannerTitle}>🛎️ Pedido ajustado por el local</div>
          <div className={styles.bannerSub}>{order.partialNote || 'Algunos productos no estaban disponibles.'}</div>
          <div className={styles.bannerTip}>¡Podés hacer otro pedido con lo que falta! 🍽️</div>
        </div>
      )}

      {/* Banner reembolso */}
      {order.refund?.amount > 0 && (
        order.refund.status === 'issued' ? (
          <div className={styles.refundGreenBanner}>
            <div className={styles.bannerTitle}>✅ Reembolso entregado</div>
            <div className={styles.bannerSub}>El comercio te devolvió <strong>{fmt(order.refund.amount)}</strong> por los productos no disponibles.</div>
          </div>
        ) : (
          <div className={styles.refundRedBanner}>
            <div className={styles.bannerTitle}>💰 Te corresponde un reembolso de {fmt(order.refund.amount)}</div>
            <div className={styles.bannerSub}>El comercio te lo va a devolver en breve.</div>
          </div>
        )
      )}

      {/* Items */}
      <div className={styles.itemsList}>
        {items.map((it, i) => (
          <div key={i} className={styles.itemRow}>
            <span className={styles.itemName}>• {it.name}{it.qty > 1 ? ` x${it.qty}` : ''}</span>
            <span className={styles.itemPrice}>{fmt(it.price * (it.qty || 1))}</span>
          </div>
        ))}
        {(order.removedItems || []).map((it, i) => (
          <div key={`r-${i}`} className={`${styles.itemRow} ${styles.itemRemoved}`}>
            <span className={styles.itemName}>• {it.name}{it.qty > 1 ? ` x${it.qty}` : ''}</span>
            <span className={styles.itemPrice}>{fmt(it.price * (it.qty || 1))}</span>
          </div>
        ))}
      </div>

      {/* Descuento */}
      {order.discountAmount > 0 && (
        <div className={styles.discountRow}>
          <span>🏷️ Descuento{order.discountType === 'percentage' ? ` (${order.discountValue}%)` : ''}</span>
          <span>-{fmt(order.discountAmount)}</span>
        </div>
      )}

      {/* Banner verificación de pago */}
      {pStatus === 'payment_verify' && (
        <div className={styles.verifyBox}>
          <div className={styles.verifyTitle}>⏳ DETALLE DEL PAGO EN VERIFICACIÓN</div>
          <div className={styles.verifyRow}>
            <span>Subtotal items</span>
            <span>{fmt(total)}</span>
          </div>
          {order.tipAmount > 0 && (
            <div className={`${styles.verifyRow} ${styles.verifyGreen}`}>
              <span>Propina{typeof order.tipPercent === 'number' ? ` (${order.tipPercent}%)` : ''}</span>
              <span>+{fmt(order.tipAmount)}</span>
            </div>
          )}
          <div className={styles.verifyTotal}>
            <span>Total pagado</span>
            <span>{fmt(total + (order.tipAmount || 0))}</span>
          </div>
        </div>
      )}

      {/* Total */}
      <div className={styles.totalRow}>
        <span>Total</span>
        <span>{fmt(total)}</span>
      </div>

      {/* Notas */}
      {order.notes && (
        <div className={styles.notesBox}>
          <span className={styles.notesLabel}>📝 Mis aclaraciones:</span>
          <span className={styles.notesText}>"{order.notes}"</span>
        </div>
      )}

      {/* Botones */}
      {canPay && (
        <button className={styles.btnPay} onClick={() => onPayNow(orderId, total)}>
          💸 Pagar Ahora ({fmt(total)})
        </button>
      )}
      {canCancel && (
        <button className={styles.btnCancel} onClick={handleCancel}>
          Cancelar Pedido
        </button>
      )}
      {/* Recibo descargable — solo en pedidos pagados */}
      {pStatus === 'paid' && !order.isWaiterCall && status !== 'cancelled' && (
        <button
          className={styles.btnReceipt}
          onClick={() => downloadOrderReceipt(commerceId, orderId)}
        >
          {order.refund?.amount > 0 ? '🧾 Recibo con reintegro' : '🧾 Descargar recibo'}
        </button>
      )}
    </div>
  )
}

const ACTIVE_STATUSES   = new Set(['requested', 'pending', 'preparing', 'ready'])
const ORDER_FILTER_TABS = [
  { key: 'all',       label: 'Todos'       },
  { key: 'active',    label: 'En curso'    },
  { key: 'completed', label: 'Completados' },
  { key: 'cancelled', label: 'Cancelados'  },
]

/* ── Vista principal ── */
export default function OrdersView({ commerceId, settings, onBack, onPayNow }) {
  const [entries,        setEntries]        = useState([])
  const [statusFilter,   setStatusFilter]   = useState('all')
  const [loadedStatuses, setLoadedStatuses] = useState({})

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('feka_active_orders') || '[]')
      const filtered = commerceId
        ? stored.filter(o => o.commerceId === commerceId)
        : stored
      setEntries(filtered.sort((a, b) => (b.date || 0) - (a.date || 0)))
    } catch {
      setEntries([])
    }
  }, [commerceId])

  function handleStatusLoad(id, status) {
    setLoadedStatuses(prev => ({ ...prev, [id]: status }))
  }

  function isVisible(entry) {
    if (statusFilter === 'all') return true
    const s = loadedStatuses[entry.id]
    if (s === undefined) return true   // todavía cargando, mostrar
    if (statusFilter === 'active')    return ACTIVE_STATUSES.has(s)
    if (statusFilter === 'completed') return s === 'completed'
    if (statusFilter === 'cancelled') return s === 'cancelled'
    return true
  }

  const allLoaded = entries.length > 0 && Object.keys(loadedStatuses).length === entries.length
  const noneVisible = allLoaded && entries.every(e => !isVisible(e))

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <h2 className={styles.title}>🧾 Mis Pedidos</h2>
        <button className={styles.newBtn} onClick={onBack}>+ Nuevo pedido</button>
      </div>

      {entries.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyIcon}>🛍️</p>
          <p className={styles.emptyText}>Todavía no hiciste ningún pedido.</p>
          <button className={styles.emptyBtn} onClick={onBack}>Ver el menú</button>
        </div>
      ) : (
        <>
          {/* Filtros por estado */}
          <div className={styles.filterTabs}>
            {ORDER_FILTER_TABS.map(({ key, label }) => (
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
            {entries.map(e =>
              isVisible(e)
                ? <OrderCard
                    key={e.id}
                    orderId={e.id}
                    commerceId={e.commerceId}
                    onPayNow={onPayNow}
                    onStatusLoad={handleStatusLoad}
                  />
                : null
            )}
            {noneVisible && (
              <div className={styles.filterEmpty}>
                No tenés pedidos {statusFilter === 'active' ? 'en curso' : statusFilter === 'completed' ? 'completados' : 'cancelados'}.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
