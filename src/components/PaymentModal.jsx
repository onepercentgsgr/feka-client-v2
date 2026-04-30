import { useState, useEffect } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import { showToast } from './Toast'
import styles from './PaymentModal.module.css'

/**
 * Modal de pago — flujo 2 pasos idéntico a V1:
 *  Paso 1: importe + propina (opcional) + botón "Elegir método"
 *  Paso 2: métodos habilitados por config (transfer / MP / card / cash / QR)
 */
export default function PaymentModal({ orderId, total, commerceId, settings, onClose, onViewOrders }) {
  const [step, setStep]             = useState(1)
  const [copied, setCopied]         = useState(false)
  const [notifying, setNotifying]   = useState(false)

  // Tip
  const [tipPct, setTipPct]         = useState(null)   // null = sin propina, número = %
  const [tipCustom, setTipCustom]   = useState('')
  const [showCustom, setShowCustom] = useState(false)

  const config = settings?.config || {}
  const alias              = config.alias              || ''
  const holder             = config.holder             || ''
  const mpLink             = config.mpLink             || ''
  const payTransferEnabled = config.payTransferEnabled || false
  const payMpEnabled       = config.payMpEnabled       || false
  const payCardEnabled     = config.payCardEnabled     || false
  const payCashEnabled     = config.payCashEnabled     || false
  const payQrEnabled       = config.payQrEnabled       || false
  const tipEnabled         = config.tipEnabled         || false

  const anyMethod = payTransferEnabled || payMpEnabled || payCardEnabled || payCashEnabled || payQrEnabled
  const showNotify = payTransferEnabled || payMpEnabled

  // Cálculo propina
  const subtotal   = Number(total) || 0
  const tipAmount  = tipPct === null
    ? 0
    : tipPct === 'custom'
      ? (parseFloat(tipCustom) || 0)
      : Math.round(subtotal * tipPct / 100)
  const grandTotal = subtotal + tipAmount

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function fmt(n) { return `$${Math.round(n).toLocaleString('es-AR')}` }

  function handleTipPct(pct) {
    if (pct === 'custom') {
      setShowCustom(true)
      setTipPct('custom')
    } else {
      setShowCustom(false)
      setTipPct(prev => prev === pct ? null : pct)
      setTipCustom('')
    }
  }

  async function handleCopyAlias() {
    if (!alias) return
    try {
      await navigator.clipboard.writeText(alias)
    } catch (_) {
      const ta = document.createElement('textarea')
      ta.value = alias; ta.style.position = 'fixed'; ta.style.opacity = '0'
      document.body.appendChild(ta); ta.focus(); ta.select()
      document.execCommand('copy'); ta.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function updateOrder(fields) {
    if (!orderId || !commerceId) return
    try {
      await updateDoc(doc(db, 'feka_users', commerceId, 'orders', orderId), fields)
    } catch (_) {}
  }

  async function handleNotifyPayment(method) {
    if (notifying) return
    setNotifying(true)
    try {
      await updateOrder({ paymentStatus: 'payment_verify', paymentMethod: method })
      onClose()
      onViewOrders?.()
    } catch (e) {
      showToast('Error al notificar. Intentá de nuevo.', 'error')
      setNotifying(false)
    }
  }

  async function handleCashPayment() {
    await updateOrder({ paymentStatus: 'pay_at_counter', paymentMethod: 'cash' })
    onClose()
    onViewOrders?.()
  }

  async function handleCardPayment() {
    await updateOrder({ paymentStatus: 'pay_at_counter', paymentMethod: 'card' })
    onClose()
    onViewOrders?.()
    showToast('💳 El mozo se acercará con el posnet', 'success')
  }

  async function handleQrPayment() {
    await updateOrder({ paymentStatus: 'pay_at_counter', paymentMethod: 'qr_posnet' })
    onClose()
    onViewOrders?.()
    showToast('📱 El mozo se acercará con el QR', 'success')
  }

  return (
    <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={styles.sheet}>
        <div className={styles.handle} />

        {/* ══════════════ PASO 1: IMPORTE + PROPINA ══════════════ */}
        {step === 1 && (
          <div className={styles.step1}>
            <div className={styles.step1Header}>
              <h2 className={styles.title}>💳 Realizar Pago</h2>
              <p className={styles.subtitle}>🚀 ¡Pedido enviado a cocina!</p>
              <div className={styles.amountBig}>{fmt(subtotal)}</div>
              <p className={styles.amountLabel}>Importe de tu pedido</p>
              <div className={styles.infoBox}>
                Podés abonar el importe total de <strong>{fmt(subtotal)}</strong> usando cualquiera de los métodos disponibles.
              </div>
            </div>

            {/* Propina */}
            {tipEnabled && (
              <div className={styles.tipBox}>
                <div className={styles.tipTitle}>
                  <span>💰</span>
                  <strong>¿Querés dejar propina?</strong>
                </div>
                <p className={styles.tipSub}>100% para el personal que te atendió. Totalmente opcional.</p>
                <div className={styles.tipGrid}>
                  {[0, 2, 5, 10].map(pct => (
                    <button
                      key={pct}
                      className={`${styles.tipBtn} ${tipPct === pct ? styles.tipBtnActive : ''}`}
                      onClick={() => handleTipPct(pct)}
                    >
                      {pct === 0 ? 'Sin propina' : `${pct}%`}
                    </button>
                  ))}
                </div>
                <button
                  className={`${styles.tipBtn} ${styles.tipBtnCustom} ${tipPct === 'custom' ? styles.tipBtnActive : ''}`}
                  onClick={() => handleTipPct('custom')}
                >
                  ✏️ Otro monto
                </button>
                {showCustom && (
                  <input
                    type="number"
                    className={styles.tipInput}
                    placeholder="Monto en $"
                    min="0"
                    value={tipCustom}
                    onChange={e => setTipCustom(e.target.value)}
                  />
                )}
                {tipAmount > 0 && (
                  <div className={styles.tipSummary}>
                    <div className={styles.tipRow}><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                    <div className={`${styles.tipRow} ${styles.tipRowGreen}`}>
                      <span>Propina {tipPct !== 'custom' && tipPct ? `(${tipPct}%)` : ''}</span>
                      <span>{fmt(tipAmount)}</span>
                    </div>
                    <div className={`${styles.tipRow} ${styles.tipRowTotal}`}>
                      <span>Total a pagar</span>
                      <span>{fmt(grandTotal)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button className={styles.btnContinue} onClick={() => setStep(2)}>
              Elegir método de pago <span>→</span>
            </button>
            <button className={styles.closeLink} onClick={onClose}>
              Cerrar y seguir viendo el menú
            </button>
          </div>
        )}

        {/* ══════════════ PASO 2: MÉTODOS DE PAGO ══════════════ */}
        {step === 2 && (
          <div className={styles.step2}>
            <div className={styles.step2Header}>
              <p className={styles.step2Label}>Total a abonar</p>
              <div className={styles.step2Total}>{fmt(grandTotal)}</div>
              {tipAmount > 0 && (
                <p className={styles.step2TipNote}>Incluye propina de {fmt(tipAmount)}</p>
              )}
            </div>
            <p className={styles.methodsLabel}>Seleccioná cómo querés abonar:</p>

            <div className={styles.body}>

              {/* 🏦 Transferencia */}
              {payTransferEnabled && (
                <div className={styles.option}>
                  <h3 className={styles.optionTitle}><span>🏦</span> Transferencia Bancaria</h3>
                  <div className={styles.field}>
                    <div>
                      <p className={styles.fieldLabel}>Alias de cuenta</p>
                      <p className={styles.fieldValue}>{alias || 'No configurado'}</p>
                    </div>
                    {alias && (
                      <button className={styles.copyBtn} onClick={handleCopyAlias}>
                        {copied ? '✓ Copiado' : '📋 Copiar Alias'}
                      </button>
                    )}
                  </div>
                  {holder && (
                    <div className={`${styles.field} ${styles.fieldFlat}`}>
                      <div>
                        <p className={styles.fieldLabel}>Titular de cuenta</p>
                        <p className={styles.fieldValueSmall}>{holder}</p>
                      </div>
                    </div>
                  )}
                  <button
                    className={styles.btnNotify}
                    onClick={() => handleNotifyPayment('transfer')}
                    disabled={notifying}
                  >
                    {notifying ? 'Notificando…' : '✅ Ya transferí'}
                  </button>
                </div>
              )}

              {/* 🔗 Mercado Pago */}
              {payMpEnabled && mpLink && (
                <div className={`${styles.option} ${styles.optionMP}`}>
                  <h3 className={`${styles.optionTitle} ${styles.titleMP}`}><span>🔗</span> Mercado Pago</h3>
                  <p className={styles.optionSub}>Abonás con tarjeta o saldo de MP.</p>
                  <button
                    className={styles.btnMP}
                    onClick={() => window.open(mpLink, '_blank')}
                  >
                    Pagar con MP
                  </button>
                  <button
                    className={styles.btnNotify}
                    style={{ marginTop: 10 }}
                    onClick={() => handleNotifyPayment('mercadopago')}
                    disabled={notifying}
                  >
                    {notifying ? 'Notificando…' : '✅ Ya pagué con MP'}
                  </button>
                </div>
              )}

              {/* 💳 Tarjeta */}
              {payCardEnabled && (
                <div className={styles.option}>
                  <h3 className={styles.optionTitle}><span>💳</span> Tarjeta de Crédito / Débito</h3>
                  <p className={styles.optionSub}>El mozo se acercará con el posnet a tu mesa.</p>
                  <button className={styles.btnCard} onClick={handleCardPayment}>
                    💳 Pagar con Tarjeta en la mesa
                  </button>
                </div>
              )}

              {/* 💵 Efectivo */}
              {payCashEnabled && (
                <div className={`${styles.option} ${styles.optionCash}`}>
                  <h3 className={styles.optionTitle}><span>💵</span> Pago en Efectivo</h3>
                  <p className={styles.optionSub}>Solicitá que el mozo se acerque a tu mesa.</p>
                  <button className={styles.btnCash} onClick={handleCashPayment}>
                    🍽️ Mozo, la cuenta por favor
                  </button>
                </div>
              )}

              {/* 📱 QR Posnet */}
              {payQrEnabled && (
                <div className={`${styles.option} ${styles.optionQR}`}>
                  <h3 className={`${styles.optionTitle} ${styles.titleQR}`}><span>📱</span> Pagar con QR (Posnet)</h3>
                  <p className={styles.optionSub}>El mozo acerca el posnet con QR o un QR impreso para pagar desde tu celular.</p>
                  <button className={styles.btnQR} onClick={handleQrPayment}>
                    📱 Solicitar QR para pagar
                  </button>
                </div>
              )}

              {/* Sin métodos configurados */}
              {!anyMethod && (
                <div className={styles.noMethods}>
                  El comercio no ha configurado métodos de pago. Consultá con el mozo.
                </div>
              )}

              <button className={styles.btnBack} onClick={() => setStep(1)}>
                ← Volver
              </button>
              <button className={styles.closeLink} onClick={onClose}>
                Cerrar y seguir viendo el menú
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
