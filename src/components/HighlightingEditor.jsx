import React, { useRef, useEffect } from 'react'

const HighlightingEditor = ({
  value,
  onChange,
  variables = {},
  placeholder = '',
  minHeight = '150px',
  templateOriginal = '',
  showHighlights = true
}) => {
  const editableRef = useRef(null)
  const lastValueRef = useRef(value)
  const isInternalUpdateRef = useRef(false)

  const escapeHtml = (s = '') =>
    s.replace(/&/g, '&amp;')
     .replace(/</g, '&lt;')
     .replace(/>/g, '&gt;')
     .replace(/"/g, '&quot;')
     .replace(/'/g, '&#x27;')

  // Build HTML with highlighted variable spans
  const buildHighlightedHTML = (text) => {
    if (!text) return ''
    
    // If highlights are disabled, just return escaped text
    if (!showHighlights) {
      return escapeHtml(text).replace(/\n/g, '<br>')
    }
    
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
    isInternalUpdateRef.current = true
    const newText = extractText(editableRef.current)
    if (newText !== lastValueRef.current) {
      lastValueRef.current = newText
      onChange({ target: { value: newText } })
    }
    isInternalUpdateRef.current = false
  }

  // Save and restore cursor position
  const saveCursorPosition = () => {
    const sel = window.getSelection()
    if (!sel.rangeCount || !editableRef.current) return null
    const range = sel.getRangeAt(0)
    const preCaretRange = range.cloneRange()
    preCaretRange.selectNodeContents(editableRef.current)
    preCaretRange.setEnd(range.endContainer, range.endOffset)
    const caretOffset = preCaretRange.toString().length
    return caretOffset
  }

  const restoreCursorPosition = (offset) => {
    if (!editableRef.current || offset === null || offset === undefined) return
    const sel = window.getSelection()
    const range = document.createRange()
    let currentOffset = 0
    let found = false

    const findOffset = (node) => {
      if (found) return
      if (node.nodeType === Node.TEXT_NODE) {
        const nextOffset = currentOffset + node.textContent.length
        if (nextOffset >= offset) {
          range.setStart(node, Math.min(offset - currentOffset, node.textContent.length))
          range.collapse(true)
          found = true
          return
        }
        currentOffset = nextOffset
      } else {
        for (const child of node.childNodes) {
          findOffset(child)
          if (found) return
        }
      }
    }

    findOffset(editableRef.current)
    if (found) {
      sel.removeAllRanges()
      sel.addRange(range)
    }
  }

  // Update content when value changes externally
  useEffect(() => {
    if (!editableRef.current || isInternalUpdateRef.current) return
    const currentText = extractText(editableRef.current)
    if (value !== currentText && value !== lastValueRef.current) {
      const cursorPos = saveCursorPosition()
      lastValueRef.current = value
      const html = buildHighlightedHTML(value)
      editableRef.current.innerHTML = html
      // Restore cursor after a microtask to let DOM settle
      setTimeout(() => restoreCursorPosition(cursorPos), 0)
    }
  }, [value, variables, templateOriginal, showHighlights])

  // Initial render only
  useEffect(() => {
    if (!editableRef.current || editableRef.current.innerHTML) return
    const html = buildHighlightedHTML(value)
    editableRef.current.innerHTML = html
  }, [])

  return (
    <div
      ref={editableRef}
      contentEditable
      onInput={handleInput}
      suppressContentEditableWarning
      className="border-2 border-gray-200 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-100 transition-all duration-300 rounded-2xl px-4 py-4 text-[16px] leading-[1.7] font-[Inter] tracking-[0.01em] bg-white resize-none overflow-auto"
      style={{ minHeight }}
      data-placeholder={placeholder}
    />
  )
}

export default HighlightingEditor