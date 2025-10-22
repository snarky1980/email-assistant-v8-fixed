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
  console.log('🚀 HighlightingEditor render:', { value: value?.substring(0, 50), showHighlights, hasVariables: Object.keys(variables).length > 0 })
  
  const editableRef = useRef(null)
  const lastValueRef = useRef(value)
  const isInternalUpdateRef = useRef(false)
  const isUserTypingRef = useRef(false)

  const escapeHtml = (s = '') =>
    s.replace(/&/g, '&amp;')
     .replace(/</g, '&lt;')
     .replace(/>/g, '&gt;')
     .replace(/"/g, '&quot;')
     .replace(/'/g, '&#x27;')

  // Helper function to highlight variables that have been filled with values
  const highlightFilledVariables = (text, templateOriginal) => {
    console.log('🔧 highlightFilledVariables called:', {
      textPreview: text.substring(0, 80),
      templatePreview: templateOriginal.substring(0, 80)
    })
    
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
    
    console.log('🔧 Template segments:', templateSegments.length, templateSegments.map(s => ({
      type: s.type,
      content: s.type === 'literal' ? s.content.substring(0, 20) : s.name
    })))
    
    if (templateSegments.length === 0) {
      console.log('🔧 No template segments - returning plain text')
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
          const isEmpty = !actualVariableContent.trim() || actualVariableContent === segment.placeholder
          html += `<mark class="var-highlight ${isEmpty ? 'empty' : 'filled'}" data-var="${escapeHtml(varName)}">${escapeHtml(actualVariableContent)}</mark>`
        } else {
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

  // Build HTML with highlighted variable spans - ALWAYS highlight, no toggles
  const buildHighlightedHTML = (text) => {
    if (!text) return ''
    
    console.log('🔍 buildHighlightedHTML called:', {
      textPreview: text.substring(0, 80),
      variablesCount: Object.keys(variables).length,
      variablesList: Object.keys(variables).join(', '),
      hasTemplate: !!templateOriginal,
      templatePreview: templateOriginal?.substring(0, 50)
    })
    
    // Strategy 1: Look for <<VarName>> patterns (unfilled templates)
    const variablePattern = /<<([^>]+)>>/g
    const foundPlaceholders = []
    let match
    
    variablePattern.lastIndex = 0
    while ((match = variablePattern.exec(text)) !== null) {
      foundPlaceholders.push({
        start: match.index,
        end: match.index + match[0].length,
        varName: match[1],
        placeholder: match[0]
      })
    }
    
    console.log('🔍 Found <<VarName>> patterns:', foundPlaceholders.length, foundPlaceholders)
    
    // Strategy 2: If no placeholders but we have variables, try filled variables  
    if (foundPlaceholders.length === 0 && Object.keys(variables).length > 0 && templateOriginal) {
      console.log('🔍 Using filled variables strategy')
      const result = highlightFilledVariables(text, templateOriginal)
      console.log('🔍 Filled variables result:', result.substring(0, 200) + (result.length > 200 ? '...' : ''))
      return result
    }
    
    // Strategy 3: Highlight found placeholders
    if (foundPlaceholders.length > 0) {
      console.log('🔍 Using placeholder highlighting strategy')
      let html = ''
      let lastIndex = 0
      
      for (const placeholder of foundPlaceholders) {
        html += escapeHtml(text.slice(lastIndex, placeholder.start)).replace(/\n/g, '<br>')
        
        const varName = placeholder.varName
        const varValue = variables[varName] || ''
        const filled = varValue.trim().length > 0
        const displayText = filled ? varValue : placeholder.placeholder
        
        html += `<mark class="var-highlight ${filled ? 'filled' : 'empty'}" data-var="${escapeHtml(varName)}">${escapeHtml(displayText)}</mark>`
        
        lastIndex = placeholder.end
      }
      
      html += escapeHtml(text.slice(lastIndex)).replace(/\n/g, '<br>')
      console.log('🔍 Placeholder highlight result:', html.substring(0, 200) + (html.length > 200 ? '...' : ''))
      return html
    }
    
    // Fallback: return plain text
    console.log('🔍 Using fallback - no highlighting applied')
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

  // Handle input changes - allow normal editing, sync back to parent
  const handleInput = () => {
    if (!editableRef.current) return
    
    // Skip if this is from our programmatic innerHTML update
    if (isInternalUpdateRef.current) {
      console.log('🔧 Skipping handleInput - internal update in progress')
      return
    }
    
    const newText = extractText(editableRef.current)
    if (newText !== lastValueRef.current) {
      lastValueRef.current = newText
      isUserTypingRef.current = true
      
      // Immediately call onChange - this is normal editing behavior
      onChange({ target: { value: newText } })
    }
  }

  // Handle before input normally
  const handleBeforeInput = () => {
    // Allow normal text input
  }

  // Handle key down normally  
  const handleKeyDown = () => {
    // Allow all normal typing
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

  // Simple, bulletproof highlighting effect
  useEffect(() => {
    if (!editableRef.current) return
    
    // Skip if this is from user typing
    if (isInternalUpdateRef.current) return
    
    if (isUserTypingRef.current) {
      // User is actively editing; keep existing DOM highlights intact
      lastValueRef.current = value
      isUserTypingRef.current = false
      return
    }

    const hasVars = Object.keys(variables).length > 0
    const hasTemplate = !!templateOriginal
    
    console.log('🔧 Highlighting effect triggered:', { 
      hasValue: !!value, 
      hasVariables: hasVars,
      hasTemplate: hasTemplate,
      valuePreview: value?.substring(0, 50),
      variablesCount: Object.keys(variables).length
    })
    
    // Only apply highlighting if we have both template AND variables
    // This prevents highlighting plain edited text that no longer matches template
    if (!hasTemplate || !hasVars) {
      console.log('⏳ No highlighting - missing template or variables')
      // Just show plain text
      const textToRender = value || ''
      const plainHtml = escapeHtml(textToRender).replace(/\n/g, '<br>')
      if (editableRef.current.innerHTML !== plainHtml) {
        editableRef.current.innerHTML = plainHtml
      }
      return
    }
    
    const textToRender = value || ''
    const newHtml = buildHighlightedHTML(textToRender)
    
    const currentHtml = editableRef.current.innerHTML
    if (currentHtml === newHtml) {
      lastValueRef.current = textToRender
      return
    }
    
    console.log('🔧 Generated HTML:', newHtml.substring(0, 100) + (newHtml.length > 100 ? '...' : ''))
    
    // Mark as internal update to prevent handleInput from firing onChange
    isInternalUpdateRef.current = true
    
    const cursorPos = saveCursorPosition()
    editableRef.current.innerHTML = newHtml
    lastValueRef.current = textToRender
    
    // Restore cursor position and reset internal flag
    requestAnimationFrame(() => {
      restoreCursorPosition(cursorPos)
      // Reset flag after a delay to ensure input event doesn't trigger
      setTimeout(() => {
        isInternalUpdateRef.current = false
      }, 50)
    })
  }, [value, variables, templateOriginal]) // React to any change

  // Re-apply highlighting when window focus changes (popout opens/closes)
  // DISABLED - causing highlighting to disappear when clicking Variables button
  // The BroadcastChannel and mouseup handlers are sufficient
  /*
  useEffect(() => {
    const handleFocusChange = () => {
      console.log('🔄 Focus change detected - re-applying highlights')
      
      // Small delay to let any state changes settle
      setTimeout(() => {
        if (!editableRef.current) return
        
        const currentText = extractText(editableRef.current)
        const newHtml = buildHighlightedHTML(currentText)
        
        if (editableRef.current.innerHTML !== newHtml) {
          console.log('🔄 Re-applying highlights after focus change')
          isInternalUpdateRef.current = true
          const cursorPos = saveCursorPosition()
          editableRef.current.innerHTML = newHtml
          
          requestAnimationFrame(() => {
            restoreCursorPosition(cursorPos)
            setTimeout(() => {
              isInternalUpdateRef.current = false
            }, 50)
          })
        }
      }, 100)
    }

    window.addEventListener('focus', handleFocusChange)
    window.addEventListener('blur', handleFocusChange)
    
    // Also listen for visibility change (when popouts are opened)
    document.addEventListener('visibilitychange', handleFocusChange)
    
    return () => {
      window.removeEventListener('focus', handleFocusChange)
      window.removeEventListener('blur', handleFocusChange)
      document.removeEventListener('visibilitychange', handleFocusChange)
    }
  }, [variables, templateOriginal])
  */

  // Listen for popout state changes via BroadcastChannel
  // DISABLED - causing highlighting to disappear when Variables popup opens
  // The main highlighting effect and mouseup handler are sufficient
  /*
  useEffect(() => {
    const channel = new BroadcastChannel('email-assistant-sync')
    
    const handleMessage = (event) => {
      console.log('🔄 BroadcastChannel message received:', event.data)
      
      if (event.data.type === 'popoutOpened' || 
          event.data.type === 'popoutClosed' ||
          event.data.type === 'variablesPopupOpened' ||
          event.data.type === 'variablesPopupClosed') {
        // Re-apply highlighting when popup/popout state changes
        setTimeout(() => {
          if (!editableRef.current) return
          
          const currentText = extractText(editableRef.current)
          const newHtml = buildHighlightedHTML(currentText)
          
          if (editableRef.current.innerHTML !== newHtml) {
            console.log('🔄 Re-applying highlights after popup/popout state change')
            isInternalUpdateRef.current = true
            const cursorPos = saveCursorPosition()
            editableRef.current.innerHTML = newHtml
            
            requestAnimationFrame(() => {
              restoreCursorPosition(cursorPos)
              setTimeout(() => {
                isInternalUpdateRef.current = false
              }, 50)
            })
          }
        }, 150)
      }
    }

    channel.addEventListener('message', handleMessage)
    
    return () => {
      channel.removeEventListener('message', handleMessage)
      channel.close()
    }
  }, [variables, templateOriginal])
  */

  // Persist highlights on mouse up (clicking in the editor)
  const handleMouseUp = () => {
    if (!editableRef.current) return
    
    // Only re-apply if the content has actually changed from what we expect
    const currentHtml = editableRef.current.innerHTML
    const hasMarks = currentHtml.includes('<mark')
    const expectedHtml = buildHighlightedHTML(value || '')
    const expectedHasMarks = expectedHtml.includes('<mark')
    
    if (!hasMarks && expectedHasMarks) {
      console.log('🔄 Mouse up - highlights missing, restoring expected highlights')
      const cursorPos = saveCursorPosition()
      isInternalUpdateRef.current = true
      editableRef.current.innerHTML = expectedHtml
      requestAnimationFrame(() => {
        restoreCursorPosition(cursorPos)
        setTimeout(() => {
          isInternalUpdateRef.current = false
        }, 50)
      })
    }
  }

  return (
    <div
      ref={editableRef}
      contentEditable
      onInput={handleInput}
      onBeforeInput={handleBeforeInput}
      onKeyDown={handleKeyDown}
      onMouseUp={handleMouseUp}
      suppressContentEditableWarning
      className="border-2 border-[#bfe7e3] focus:border-[#7bd1ca] focus:outline-none focus:ring-2 focus:ring-[#7bd1ca]/30 transition-all duration-200 rounded-[12px] px-4 py-4 text-[16px] leading-[1.7] tracking-[0.01em] bg-[#f9fdfd] resize-none overflow-auto"
      style={{ minHeight, fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}
      data-placeholder={placeholder}
    />
  )
}

export default HighlightingEditor