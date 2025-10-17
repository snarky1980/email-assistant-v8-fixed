import React, { useRef } from 'react'
import { Textarea } from '@/components/ui/textarea.jsx'

const HighlightingEditor = ({
  value,
  onChange,
  variables = {},
  placeholder = '',
  minHeight = '150px',
  templateOriginal = ''
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

  // Create overlay markup using template anchors, so highlighted segments align with current text
  const createHighlightedText = (text) => {
    if (!text) return ''
    // If an original template is provided, use anchor-based highlighting
    if (templateOriginal && templateOriginal.includes('<<')) {
      const parts = []
      const tokenNames = []
      const re = /<<([^>]+)>>/g
      let lastIdx = 0
      let m
      while ((m = re.exec(templateOriginal)) !== null) {
        parts.push(templateOriginal.slice(lastIdx, m.index))
        tokenNames.push(m[1])
        lastIdx = m.index + m[0].length
      }
      parts.push(templateOriginal.slice(lastIdx))

      // Walk through current value using template anchors
      let cursor = 0
      let html = ''
      for (let i = 0; i < parts.length; i++) {
        const lit = parts[i]
        if (lit) {
          const idx = text.indexOf(lit, cursor)
          if (idx === -1) {
            // Diverged: fallback to safe escape of the rest
            html += escapeHtml(text.slice(cursor))
            return html.replace(/\n/g, '<br>')
          }
          // append the literal segment as-is
          html += escapeHtml(text.slice(cursor, idx + lit.length))
          cursor = idx + lit.length
        }
        // Between this literal and the next literal is the variable value (if any)
        if (i < tokenNames.length) {
          const nextLit = parts[i + 1] || ''
          let nextIdx
          if (nextLit) {
            nextIdx = text.indexOf(nextLit, cursor)
            if (nextIdx === -1) nextIdx = text.length
          } else {
            nextIdx = text.length
          }
          const seg = text.slice(cursor, nextIdx)
          const varName = tokenNames[i]
          const filled = (seg || '').trim().length > 0 || ((variables[varName] || '').trim().length > 0)
          html += `<span class=\"variable ${filled ? 'filled' : 'empty'}\">${escapeHtml(seg)}</span>`
          cursor = nextIdx
        }
      }
      // any trailing remainder
      if (cursor < text.length) html += escapeHtml(text.slice(cursor))
      return html.replace(/\n/g, '<br>')
    }

    // Fallback: highlight raw <<var>> tokens only
    let escaped = escapeHtml(text)
    escaped = escaped.replace(/&lt;&lt;([^&]+?)&gt;&gt;/g, (_match, _varName) => `<span class=\"variable empty\">&lt;&lt;${_varName}&gt;&gt;</span>`)
    return escaped.replace(/\n/g, '<br>')
  }

  return (
    <div className="editor-container" aria-live="polite">
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