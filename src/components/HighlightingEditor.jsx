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
  const updateTimeoutRef = useRef(null)

  const escapeHtml = (s = '') =>
    s.replace(/&/g, '&amp;')
     .replace(/</g, '&lt;')
     .replace(/>/g, '&gt;')
     .replace(/"/g, '&quot;')
     .replace(/'/g, '&#x27;')

  // Helper function to highlight variables that have been filled with values
  const highlightFilledVariables = (text, templateOriginal) => {
    // Parse template to understand the expected structure
    const templateSegments = []
    const varPattern = /<<([^>]+)>>/g
    let lastIndex = 0
    let match
    
    while ((match = varPattern.exec(templateOriginal)) !== null) {
      // Add the literal text before this variable
      if (match.index > lastIndex) {
        templateSegments.push({
          type: 'literal',
          content: templateOriginal.slice(lastIndex, match.index)
        })
      }
      
      // Add the variable placeholder
      templateSegments.push({
        type: 'variable',
        name: match[1],
        placeholder: match[0]
      })
      
      lastIndex = match.index + match[0].length
    }
    
    // Add any remaining literal text
    if (lastIndex < templateOriginal.length) {
      templateSegments.push({
        type: 'literal',
        content: templateOriginal.slice(lastIndex)
      })
    }
    
    if (templateSegments.length === 0) {
      return escapeHtml(text).replace(/\n/g, '<br>')
    }
    
    // Now try to match the current text against this structure
    let textCursor = 0
    let html = ''
    let matchedSuccessfully = true
    
    for (let i = 0; i < templateSegments.length; i++) {
      const segment = templateSegments[i]
      
      if (segment.type === 'literal') {
        // For literal segments, try to find them in the current text
        const literalText = segment.content
        
        if (literalText.trim()) {
          // Look for this literal text
          const foundIndex = text.indexOf(literalText, textCursor)
          
          if (foundIndex !== -1) {
            // Add any text before this literal (could be from previous variable)
            if (foundIndex > textCursor) {
              const beforeText = text.slice(textCursor, foundIndex)
              html += escapeHtml(beforeText).replace(/\n/g, '<br>')
            }
            
            // Add the literal text
            html += escapeHtml(literalText).replace(/\n/g, '<br>')
            textCursor = foundIndex + literalText.length
          } else {
            // Literal text not found - structure has changed too much
            matchedSuccessfully = false
            break
          }
        }
      } else if (segment.type === 'variable') {
        // For variables, find where this variable's content should be
        const varName = segment.name
        const varValue = variables[varName] || ''
        
        // Find the next literal segment to know where this variable should end
        const nextSegment = templateSegments[i + 1]
        let variableEndPos
        
        if (nextSegment && nextSegment.type === 'literal' && nextSegment.content.trim()) {
          // Look for the next literal text to determine variable boundaries
          variableEndPos = text.indexOf(nextSegment.content, textCursor)
          if (variableEndPos === -1) {
            // Can't find next literal - structure changed too much
            matchedSuccessfully = false
            break
          }
        } else {
          // This is the last variable or no clear boundary
          variableEndPos = text.length
        }
        
        // Extract what should be the variable content
        const actualVariableContent = text.slice(textCursor, variableEndPos)
        
        if (actualVariableContent) {
          // Highlight this as the variable content
          const isEmpty = !actualVariableContent.trim() || actualVariableContent === segment.placeholder
          html += `<mark class="var-highlight ${isEmpty ? 'empty' : 'filled'}" data-var="${escapeHtml(varName)}">${escapeHtml(actualVariableContent)}</mark>`
        } else {
          // Empty variable - show placeholder
          html += `<mark class="var-highlight empty" data-var="${escapeHtml(varName)}">${escapeHtml(segment.placeholder)}</mark>`
        }
        
        textCursor = variableEndPos
      }
    }
    
    // Add any remaining text
    if (textCursor < text.length && matchedSuccessfully) {
      html += escapeHtml(text.slice(textCursor)).replace(/\n/g, '<br>')
    }
    
    // If we couldn't match the structure, fall back to simple approach
    if (!matchedSuccessfully) {
      // Just look for remaining <<VarName>> patterns
      return escapeHtml(text).replace(/\n/g, '<br>')
    }
    
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
    let hasContent = false
    
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent
        if (node.textContent.trim()) hasContent = true
      } else if (node.nodeName === 'BR') {
        text += '\n'
        hasContent = true
      } else if (node.nodeName === 'MARK') {
        // For highlighted variables, just extract the content as-is
        text += node.textContent || ''
        if (node.textContent && node.textContent.trim()) hasContent = true
      } else if (node.nodeName === 'DIV') {
        // Only add line break if there's already content and the div has content
        const divContent = extractText(node)
        if (divContent.trim()) {
          if (hasContent && text && !text.endsWith('\n')) {
            text += '\n'
          }
          text += divContent
          hasContent = true
        }
      } else {
        const nodeText = node.textContent || ''
        text += nodeText
        if (nodeText.trim()) hasContent = true
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

  // Combined effect for content updates and highlighting
  useEffect(() => {
    if (!editableRef.current) return
    
    // Skip if this is an internal update (to avoid loops)
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false
      return
    }
    
    // Clear any pending update
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }
    
    // Debounce updates to prevent BroadcastChannel interference
    updateTimeoutRef.current = setTimeout(() => {
      if (!editableRef.current) return
      
      const currentText = extractText(editableRef.current)
      
      // Determine what text to render
      let textToRender = value
      
      // If we have current content that differs from the prop value, use current content
      // unless the prop value has genuinely changed
      if (currentText && currentText !== value) {
        const normalizedCurrent = currentText.replace(/\s+/g, ' ').trim()
        const normalizedValue = (value || '').replace(/\s+/g, ' ').trim()
        
        // Use current text if it's just formatting differences, otherwise use prop value
        if (normalizedCurrent === normalizedValue) {
          textToRender = currentText
        } else if (lastValueRef.current === value) {
          // Value hasn't changed from parent, keep current text
          textToRender = currentText
        }
      }
      
      // Generate the HTML with highlighting
      const newHtml = buildHighlightedHTML(textToRender)
      

      
      // Update if content or highlighting changed
      if (editableRef.current.innerHTML !== newHtml) {
        const cursorPos = saveCursorPosition()
        lastValueRef.current = textToRender
        editableRef.current.innerHTML = newHtml
        
        // Update parent if text differs from prop
        if (textToRender !== value && onChange) {
          // Temporarily set flag to prevent recursive updates
          setTimeout(() => {
            onChange({ target: { value: textToRender } })
          }, 0)
        }
        
        // Restore cursor position
        requestAnimationFrame(() => {
          restoreCursorPosition(cursorPos)
        })
      }
    }, 10) // Small debounce to prevent rapid updates from BroadcastChannel
    
    // Cleanup timeout on unmount or dependency change
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [value, showHighlights, variables, templateOriginal])

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