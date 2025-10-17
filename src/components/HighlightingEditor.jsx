import React, { useRef } from 'react'
import { Textarea } from '@/components/ui/textarea.jsx'

const HighlightingEditor = ({
  value,
  onChange,
  variables = {},
  placeholder = '',
  minHeight = '150px'
}) => {
  const textareaRef = useRef(null)
  const overlayRef = useRef(null)

  // Synchroniser le scroll entre textarea et overlay
  const handleScroll = () => {
    if (textareaRef.current && overlayRef.current) {
      const textarea = textareaRef.current
      overlayRef.current.scrollTop = textarea.scrollTop
      overlayRef.current.scrollLeft = textarea.scrollLeft
    }
  }

  // Helpers
  const escapeHtml = (s = '') =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')

  const escapeRegExp = (s = '') => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  // Créer le texte avec variables surlignées (tokens restants + valeurs remplacées)
  const createHighlightedText = (text) => {
    if (!text) return ''
    
    // Échapper les caractères HTML
    let escaped = escapeHtml(text)

    // 1) Surligner les tokens restants <<var>> (variables non remplies)
    escaped = escaped.replace(/&lt;&lt;([^&]+?)&gt;&gt;/g, (match, varName) => {
      const hasValue = variables[varName] && variables[varName].trim() !== ''
      const colorClass = hasValue 
        ? 'variable filled'
        : 'variable empty'
      
      return `<span class="${colorClass}">&lt;&lt;${varName}&gt;&gt;</span>`
    })

    // 2) Surligner les VALEURS insérées (variables remplies)
    //    On remplace en dernier pour éviter de matcher dans le markup inséré ci-dessus.
    for (const [name, valRaw] of Object.entries(variables || {})) {
      const val = (valRaw || '').trim()
      if (!val) continue
      const escapedVal = escapeHtml(val)
      if (!escapedVal) continue
      try {
        const rx = new RegExp(escapeRegExp(escapedVal), 'g')
        escaped = escaped.replace(rx, (m) => `<span class="variable filled">${m}</span>`)
      } catch {}
    }

    // Remplacer les retours à la ligne
    escaped = escaped.replace(/\n/g, '<br>')
    
    return escaped
  }

  return (
    <div className="editor-container">
      {/* Couche de surlignage */}
      <div
        ref={overlayRef}
        className="editor-overlay"
        style={{ minHeight }}
        dangerouslySetInnerHTML={{ __html: createHighlightedText(value) }}
      />
      
      {/* Textarea */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onScroll={handleScroll}
        placeholder={placeholder}
        className="editor-textarea border-2 border-gray-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all duration-300 rounded-2xl"
        style={{ minHeight }}
      />
    </div>
  )
}

export default HighlightingEditor