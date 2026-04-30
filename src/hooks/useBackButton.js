import { useEffect } from 'react'

/**
 * Cada modal/drawer que se abre llama pushBack().
 * Cuando el usuario presiona "atrás" en Android, el browser
 * dispara popstate y nosotros llamamos onBack() en lugar de navegar.
 */
export function useBackButton(isOpen, onBack) {
  useEffect(() => {
    if (!isOpen) return

    // Agregar estado al historial cuando se abre
    history.pushState({ fekaModal: true }, '')

    function handlePop(e) {
      onBack()
    }

    window.addEventListener('popstate', handlePop)
    return () => {
      window.removeEventListener('popstate', handlePop)
    }
  }, [isOpen, onBack])
}
