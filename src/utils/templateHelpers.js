const PLACEHOLDER_PATTERN = '<<([^>]+)>>'

function getPlaceholderRegex() {
  return new RegExp(PLACEHOLDER_PATTERN, 'g')
}

function parseTemplateSegments(template = '') {
  const regex = getPlaceholderRegex()
  const segments = []
  let lastIndex = 0
  let match

  while ((match = regex.exec(template)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'literal',
        content: template.slice(lastIndex, match.index)
      })
    }

    segments.push({
      type: 'variable',
      name: match[1],
      placeholder: match[0]
    })

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < template.length) {
    segments.push({
      type: 'literal',
      content: template.slice(lastIndex)
    })
  }

  return segments
}

export function replaceTemplateVariables(text = '', variables = {}) {
  if (!text) return ''
  const regex = getPlaceholderRegex()
  return text.replace(regex, (_, varName) => {
    const value = variables?.[varName]
    return value ? value : `<<${varName}>>`
  })
}

export function applyVariablesToText(template = '', currentText = '', variables = {}, previousVariables = {}) {
  if (!template) {
    return replaceTemplateVariables(currentText, variables)
  }

  if (!currentText) {
    return replaceTemplateVariables(template, variables)
  }

  const segments = parseTemplateSegments(template)
  if (segments.length === 0) {
    return replaceTemplateVariables(currentText, variables)
  }

  const fallback = () => replaceTemplateVariables(currentText, variables)

  let textCursor = 0
  let result = ''

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]

    if (segment.type === 'literal') {
      if (!segment.content) continue
      const idx = currentText.indexOf(segment.content, textCursor)
      if (idx === -1) return fallback()
      if (idx > textCursor) {
        result += currentText.slice(textCursor, idx)
      }
      result += segment.content
      textCursor = idx + segment.content.length
      continue
    }

    const nextLiteral = segments.slice(i + 1).find(s => s.type === 'literal' && s.content)
    let nextIndex
    if (nextLiteral) {
      nextIndex = currentText.indexOf(nextLiteral.content, textCursor)
      if (nextIndex === -1) return fallback()
    } else {
      nextIndex = currentText.length
    }

    const segmentContent = currentText.slice(textCursor, nextIndex)
    const trimmed = segmentContent.trim()
    const prevValue = previousVariables?.[segment.name] ?? ''
    const newValue = variables?.[segment.name] ?? ''
    const placeholder = segment.placeholder

    const shouldReplace =
      segmentContent === placeholder ||
      trimmed === placeholder.trim() ||
      segmentContent === prevValue ||
      trimmed === prevValue.trim() ||
      segmentContent === '' ||
      trimmed === ''

    if (shouldReplace) {
      result += newValue ? newValue : placeholder
    } else {
      result += segmentContent
    }

    textCursor = nextIndex
  }

  if (textCursor < currentText.length) {
    result += currentText.slice(textCursor)
  }

  return result
}
