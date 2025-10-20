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
    
    // Try to use templateOriginal structure to identify where variables should be highlighted
    if (templateOriginal && templateOriginal.includes('<<')) {
      // Parse the template structure to find variable positions
      const parts = []
      const tokenNames = []
      const re = /<<([^>]+)>>/g
      let lastIdx = 0
      let match
      
      while ((match = re.exec(templateOriginal)) !== null) {
        parts.push(templateOriginal.slice(lastIdx, match.index))
        tokenNames.push(match[1])
        lastIdx = match.index + match[0].length
      }
      parts.push(templateOriginal.slice(lastIdx))

      // Try to match the current text against this structure
      let cursor = 0
      let html = ''
      let successfulMatch = true
      
      for (let i = 0; i < parts.length; i++) {
        const literalPart = parts[i]
        
        // Look for literal part in current text
        if (literalPart) {
          const foundIndex = text.indexOf(literalPart, cursor)
          if (foundIndex === -1) {
            // Structure doesn't match, fall back to simple approach
            successfulMatch = false
            break
          }
          // Add any text before this literal part (could be from previous variables)
          html += escapeHtml(text.slice(cursor, foundIndex + literalPart.length)).replace(/\n/g, '<br>')
          cursor = foundIndex + literalPart.length
        }
        
        // If there's a variable at this position
        if (i < tokenNames.length) {
          const varName = tokenNames[i]
          const nextLiteralPart = parts[i + 1] || ''
          
          // Find where this variable content ends
          let variableEndPos
          if (nextLiteralPart) {
            variableEndPos = text.indexOf(nextLiteralPart, cursor)
            if (variableEndPos === -1) variableEndPos = text.length
          } else {
            variableEndPos = text.length
          }
          
          const variableContent = text.slice(cursor, variableEndPos)
          const isEmpty = !variableContent.trim() || variableContent === `<<${varName}>>`
          
          html += `<mark class="var-highlight ${isEmpty ? 'empty' : 'filled'}" data-var="${escapeHtml(varName)}">${escapeHtml(variableContent) || '&nbsp;'}</mark>`
          cursor = variableEndPos
        }
      }
      
      if (successfulMatch) {
        // Add any remaining text
        if (cursor < text.length) {
          html += escapeHtml(text.slice(cursor)).replace(/\n/g, '<br>')
        }
        return html
      }
    }
    
    // Fallback: look for <<VarName>> patterns directly in the text
    const variablePattern = /<<([^>]+)>>/g
    let lastIndex = 0
    let html = ''
    let match
    
    while ((match = variablePattern.exec(text)) !== null) {
      const fullMatch = match[0] // "<<VarName>>"
      const varName = match[1] // "VarName"
      const startIndex = match.index
      
      // Add text before this variable
      html += escapeHtml(text.slice(lastIndex, startIndex)).replace(/\n/g, '<br>')
      
      // Add highlighted variable placeholder - always show as empty since it's a placeholder
      html += `<mark class="var-highlight empty" data-var="${escapeHtml(varName)}">${escapeHtml(fullMatch)}</mark>`
      
      lastIndex = startIndex + fullMatch.length
    }
    
    // Add remaining text after last variable
    html += escapeHtml(text.slice(lastIndex)).replace(/\n/g, '<br>')
    
    return html
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
        // For highlighted variables, just extract the content as-is
        // The highlighting system will handle the display properly
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
  }, [value, variables, templateOriginal])

  // Update highlights when showHighlights toggles
  useEffect(() => {
    if (!editableRef.current) return
    const cursorPos = saveCursorPosition()
    const html = buildHighlightedHTML(value)
    editableRef.current.innerHTML = html
    setTimeout(() => restoreCursorPosition(cursorPos), 0)
  }, [showHighlights])

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
  className="border-2 border-[#bfe7e3] focus:border-[#7bd1ca] focus:outline-none focus:ring-2 focus:ring-[#7bd1ca]/30 transition-all duration-200 rounded-[12px] px-4 py-4 text-[16px] leading-[1.7] tracking-[0.01em] bg-[#f9fdfd] resize-none overflow-auto"
  style={{ minHeight, fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}
      data-placeholder={placeholder}
    />
  )
}

export default HighlightingEditor