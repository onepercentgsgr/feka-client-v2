import { useEffect, useState, useRef } from 'react'
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore'
import { db } from '../services/firebase'

function getParams() {
  const p = new URLSearchParams(window.location.search)
  return {
    commerceId: p.get('commerce') || p.get('qr') || null,
    table: p.get('table') || null,
  }
}

function applyTheme(settings) {
  const color = settings?.primaryColor || settings?.config?.primaryColor || '#FF7043'
  document.documentElement.style.setProperty('--primary', color)
  document.documentElement.style.setProperty('--bg-gradient', 'linear-gradient(to bottom, rgb(255,220,190) 0%, #ffffff 100%)')
  document.documentElement.style.setProperty('--header-bg', 'rgb(255,220,190)')
  document.body.style.background = 'var(--bg-gradient)'
  const meta = document.getElementById('meta-theme-color')
  if (meta) meta.content = color
}

function getCacheKey(id) { return `feka_menu_v2_${id}` }

export function useCommerce() {
  const { commerceId: rawId, table } = getParams()
  const [settings,   setSettings]   = useState(null)
  const [categories, setCategories] = useState([])
  const [products,   setProducts]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [realId,     setRealId]     = useState(rawId)

  // Refs para acceder al valor más reciente en los callbacks de Firestore
  const latestCats  = useRef([])
  const latestProds = useRef([])
  const catReady    = useRef(false)
  const prodReady   = useRef(false)

  function trySaveCache(id) {
    if (!catReady.current || !prodReady.current) return
    try {
      localStorage.setItem(getCacheKey(id), JSON.stringify({
        categories: latestCats.current,
        products:   latestProds.current,
        cachedAt:   Date.now(),
      }))
    } catch (_) {}
  }

  // Commerce settings (real-time) — acepta alias lowercase
  useEffect(() => {
    if (!rawId) { setLoading(false); return }

    const unsub = onSnapshot(
      doc(db, 'feka_users_public', rawId),
      snap => {
        if (snap.exists()) {
          const data = snap.data()
          const canonical = data._realId || rawId
          setRealId(canonical)
          setSettings(data)
          applyTheme(data)

          // Cachear logo para splash screen
          const logo = data?.config?.logo || data?.logoUrl
          if (logo && canonical) {
            try { localStorage.setItem(`feka_logo_${canonical}`, logo) } catch (_) {}
          }
        } else {
          setError('Comercio no encontrado')
          setLoading(false)
        }
      },
      () => {
        setError('Error al conectar')
        setLoading(false)
      }
    )
    return unsub
  }, [rawId])

  // Cargar desde cache inmediatamente mientras llegan los datos de Firestore
  useEffect(() => {
    if (!realId) return
    try {
      const cached = localStorage.getItem(getCacheKey(realId))
      if (cached) {
        const { categories: cats, products: prods } = JSON.parse(cached)
        if (cats?.length || prods?.length) {
          if (cats?.length)  { latestCats.current  = cats;  setCategories(cats)  }
          if (prods?.length) { latestProds.current = prods; setProducts(prods)   }
          setLoading(false)
        }
      }
    } catch (_) {}
  }, [realId])

  // Categories (real-time)
  useEffect(() => {
    if (!realId) return
    const unsub = onSnapshot(
      query(collection(db, 'feka_users', realId, 'menu_categories'), orderBy('order', 'asc')),
      snap => {
        const cats = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        latestCats.current = cats
        catReady.current   = true
        setCategories(cats)
        setLoading(false)
        trySaveCache(realId)
      },
      () => { setLoading(false) }
    )
    return unsub
  }, [realId])

  // Products (real-time)
  useEffect(() => {
    if (!realId) return
    const unsub = onSnapshot(
      collection(db, 'feka_users', realId, 'menu_products'),
      snap => {
        const prods = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        latestProds.current = prods
        prodReady.current   = true
        setProducts(prods)
        setLoading(false)
        trySaveCache(realId)
      },
      () => { setLoading(false) }
    )
    return unsub
  }, [realId])

  const commissionRate = settings?.commissionRate ?? 0

  return { commerceId: realId, table, settings, categories, products, loading, error, commissionRate }
}
