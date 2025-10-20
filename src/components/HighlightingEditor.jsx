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

  // Helper function to highlight variables that have been filled with values
  const highlightFilledVariables = (text, templateOriginal) => {
    // Parse template to understand structure, but be more flexible with matching
    const templateVars = []
    const varPattern = /<<([^>]+)>>/g
    let templateMatch
    
    while ((templateMatch = varPattern.exec(templateOriginal)) !== null) {
      templateVars.push({
        name: templateMatch[1],
        placeholder: templateMatch[0]
      })
    }
    
    if (templateVars.length === 0) {
      return escapeHtml(text).replace(/\n/g, '<br>')
    }
    
    // Try to find variable values in the current text
    // Look for known variable values that were filled in
    const highlights = []
    
    for (const templateVar of templateVars) {
      const varValue = variables[templateVar.name]
      if (varValue && varValue.trim()) {
        // Look for this variable's value in the text
        let searchStart = 0
        let foundIndex
        
        while ((foundIndex = text.indexOf(varValue, searchStart)) !== -1) {
          // Check if this position makes sense (not overlapping with other highlights)
          const isOverlapping = highlights.some(h => 
            (foundIndex >= h.start && foundIndex < h.end) ||
            (foundIndex + varValue.length > h.start && foundIndex + varValue.length <= h.end)
          )
          
          if (!isOverlapping) {
            highlights.push({
              start: foundIndex,
              end: foundIndex + varValue.length,
              varName: templateVar.name,
              content: varValue,
              filled: true
            })
            break // Only highlight first occurrence of each variable
          }
          
          searchStart = foundIndex + 1
        }
      }
    }
    
    // Sort highlights by position
    highlights.sort((a, b) => a.start - b.start)
    
    // Build HTML with highlights
    let html = ''
    let lastIndex = 0
    
    for (const highlight of highlights) {
      // Add text before this highlight
      html += escapeHtml(text.slice(lastIndex, highlight.start)).replace(/\n/g, '<br>')
      
      // Add highlighted variable
      html += `<mark class="var-highlight filled" data-var="${escapeHtml(highlight.varName)}">${escapeHtml(highlight.content)}</mark>`
      
      lastIndex = highlight.end
    }
    
    // Add remaining text
    html += escapeHtml(text.slice(lastIndex)).replace(/\n/g, '<br>')
    
    return html
  }

  // Build HTML with highlighted variable spans
  const buildHighlightedHTML = (text) => {
    if (!text) return ''
    
    // If highlights are disabled, just return escaped text
    if (!showHighlights) {
      return escapeHtml(text).replace(/\n/g, '<br>')
    }
    
    // Strategy 1: Look for existing <<VarName>> patterns in the current text
    const variablePattern = /<<([^>]+)>>/g
    const foundPlaceholders = []
    let match
    
    // Reset regex state
    variablePattern.lastIndex = 0
    while ((match = variablePattern.exec(text)) !== null) {
      foundPlaceholders.push({
        start: match.index,
        end: match.index + match[0].length,
        varName: match[1],
        placeholder: match[0]
      })
    }
    
    // Strategy 2: If we have variables but no placeholders found, try to identify filled variables
    // This handles the case where variables have been replaced with actual values
    if (foundPlaceholders.length === 0 && Object.keys(variables).length > 0 && templateOriginal) {
      return highlightFilledVariables(text, templateOriginal)
    }
    
    // Strategy 3: Highlight the found placeholders
    if (foundPlaceholders.length > 0) {
      let html = ''
      let lastIndex = 0
      
      for (const placeholder of foundPlaceholders) {
        // Add text before this variable
        html += escapeHtml(text.slice(lastIndex, placeholder.start)).replace(/\n/g, '<br>')
        
        // Add highlighted variable placeholder
        const varName = placeholder.varName
        const varValue = variables[varName] || ''
        const filled = varValue.trim().length > 0
        const displayText = filled ? varValue : placeholder.placeholder
        
        html += `<mark class="var-highlight ${filled ? 'filled' : 'empty'}" data-var="${escapeHtml(varName)}">${escapeHtml(displayText)}</mark>`
        
        lastIndex = placeholder.end
      }
      
      // Add remaining text after last variable
      html += escapeHtml(text.slice(lastIndex)).replace(/\n/g, '<br>')
      return html
    }
    
    // Fallback: return plain text if no highlighting possible
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
      // Use requestAnimationFrame for smoother updates
      requestAnimationFrame(() => {
        restoreCursorPosition(cursorPos)
      })
    }
  }, [value, variables, templateOriginal])

  // Update highlights when showHighlights toggles
  useEffect(() => {
    if (!editableRef.current) return
    
    // Avoid unnecessary updates if the content hasn't changed
    const currentHtml = editableRef.current.innerHTML
    const newHtml = buildHighlightedHTML(value)
    
    if (currentHtml !== newHtml) {
      const cursorPos = saveCursorPosition()
      editableRef.current.innerHTML = newHtml
      // Use requestAnimationFrame for smoother updates
      requestAnimationFrame(() => {
        restoreCursorPosition(cursorPos)
      })
    }
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