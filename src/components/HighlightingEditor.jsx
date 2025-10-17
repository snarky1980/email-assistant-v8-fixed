import React, { useRef, useEffect } from 'react'

const HighlightingEditor = ({
  value,
  onChange,
  variables = {},
  placeholder = '',
  minHeight = '150px',
  templateOriginal = ''
}) => {
  const editableRef = useRef(null)
  const lastValueRef = useRef(value)

  const escapeHtml = (s = '') =>
    s.replace(/&/g, '&amp;')
     .replace(/</g, '&lt;')
     .replace(/>/g, '&gt;')
     .replace(/"/g, '&quot;')
     .replace(/'/g, '&#x27;')

  // Build HTML with highlighted variable spans
  const buildHighlightedHTML = (text) => {
    if (!text) return ''
    
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

      let cursor = 0
      let html = ''
      for (let i = 0; i < parts.length; i++) {
        const lit = parts[i]
        if (lit) {
          const idx = text.indexOf(lit, cursor)
          if (idx === -1) {
            html += escapeHtml(text.slice(cursor)).replace(/\n/g, '<br>')
            return html
          }
          html += escapeHtml(text.slice(cursor, idx + lit.length)).replace(/\n/g, '<br>')
          cursor = idx + lit.length
        }
        if (i < tokenNames.length) {
          const nextLit = parts[i + 1] || ''
          let nextIdx = nextLit ? text.indexOf(nextLit, cursor) : text.length
          if (nextIdx === -1) nextIdx = text.length
          
          const seg = text.slice(cursor, nextIdx)
          const varName = tokenNames[i]
          const filled = (seg || '').trim().length > 0
          html += `<mark class="var-highlight ${filled ? 'filled' : 'empty'}" data-var="${escapeHtml(varName)}">${escapeHtml(seg) || '&nbsp;'}</mark>`
          cursor = nextIdx
        }
      }
      if (cursor < text.length) html += escapeHtml(text.slice(cursor)).replace(/\n/g, '<br>')
      return html
    }

    return escapeHtml(text).replace(/\n/g, '<br>')
  }

  // Extract plain text from contentEditable div
  const extractText = (el) => {
    if (!el) return ''
    let text = ''
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent
      } else if (node.nodeName === 'BR') {
        text += '\n'
      } else if (node.nodeName === 'MARK') {
        text += node.textContent || ''
      } else if (node.nodeName === 'DIV') {
        if (text && !text.endsWith('\n')) text += '\n'
        text += extractText(node)
      } else {
        text += node.textContent || ''
      }
    }
    return text
  }

  // Handle input changes
  const handleInput = () => {
    if (!editableRef.current) return
    const newText = extractText(editableRef.current)
    if (newText !== lastValueRef.current) {
      lastValueRef.current = newText
      onChange({ target: { value: newText } })
    }
  }

  // Update content when value changes externally
  useEffect(() => {
    if (!editableRef.current) return
    const currentText = extractText(editableRef.current)
    if (value !== currentText && value !== lastValueRef.current) {
      lastValueRef.current = value
      const html = buildHighlightedHTML(value)
      editableRef.current.innerHTML = html
    }
  }, [value, variables, templateOriginal])

  return (
    <div
      ref={editableRef}
      contentEditable
      onInput={handleInput}
      suppressContentEditableWarning
      className="border-2 border-gray-200 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-100 transition-all duration-300 rounded-2xl px-4 py-4 text-[16px] leading-[1.7] font-[Inter] tracking-[0.01em] bg-white resize-none overflow-auto"
      style={{ minHeight }}
      data-placeholder={placeholder}
      dangerouslySetInnerHTML={{ __html: buildHighlightedHTML(value) }}
    />
  )
}

export default HighlightingEditor