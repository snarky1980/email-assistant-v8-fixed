/* DEPLOY: 2025-10-15 07:40 - FIXED: Function hoisting error resolved */
import React, { useState, useEffect, useMemo, useRef } from 'react'
import { loadState, saveState } from './utils/storage.js';
// Deploy marker: 2025-10-16T07:31Z
import { Search, FileText, Copy, RotateCcw, Languages, Filter, Globe, Sparkles, Mail, Edit3, Link, Settings, X, Move, Send, Star } from 'lucide-react'
import { Button } from './components/ui/button.jsx'
import { Input } from './components/ui/input.jsx'
import { Textarea } from './components/ui/textarea.jsx'
import HighlightingEditor from './components/HighlightingEditor';
import AISidebar from './components/AISidebar';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card.jsx'
import { Badge } from './components/ui/badge.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select.jsx'
import { Separator } from './components/ui/separator.jsx'
import { ScrollArea } from './components/ui/scroll-area.jsx'
import './App.css'

// Custom CSS for modern typography and variable highlighting with the EXACT original teal/sage styling
const customEditorStyles = `
  /* Translation Bureau Brand Colors - EXACT MATCH from original design */
  :root {
    --tb-teal: #059669;         /* Emerald-600 - Main teal */
    --tb-teal-light: #10b981;   /* Emerald-500 - Light teal */
    --tb-teal-dark: #047857;    /* Emerald-700 - Dark teal */
    --tb-sage: #65a30d;         /* Lime-600 - Sage green */
    --tb-sage-light: #84cc16;   /* Lime-500 - Light sage */
    --tb-mint: #d9f99d;         /* Lime-200 - Mint background */
    --tb-cream: #fefefe;        /* Clean white */
  }

  /* Modern typography base */
  * {
    font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  /* Enhanced variable highlighting styles */
  .variable-highlight {
    background-color: #fef3c7;
    color: #d97706;
    padding: 3px 6px;
    border-radius: 6px;
    font-weight: 600;
    font-size: 15px;
    border: 1px solid #f59e0b;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    letter-spacing: 0.005em;
  }
  
  /* Scrollbar always visible */
  [data-slot="scroll-area-scrollbar"] {
    opacity: 1 !important;
    visibility: visible !important;
  }
  
  [data-slot="scroll-area-thumb"] {
    background-color: #cbd5e1 !important;
    opacity: 1 !important;
  }
  
  [data-slot="scroll-area-scrollbar"]:hover [data-slot="scroll-area-thumb"] {
    background-color: #94a3b8 !important;
  }
  
  /* Remove visual artifacts in inputs */
  input[type="text"], input[type="number"], input {
    list-style: none !important;
    list-style-type: none !important;
    background-image: none !important;
  }
  
  input::before, input::after {
    content: none !important;
    display: none !important;
  }
  
  /* Remove dots/bullets artifacts */
  input::-webkit-list-button {
    display: none !important;
  }
  
  input::-webkit-calendar-picker-indicator {
    display: none !important;
  }
  
  /* Modern editor typography */
  .editor-container {
    position: relative;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  }
  
  .editor-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    padding: 16px;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.7;
    letter-spacing: 0.01em;
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow: hidden;
    color: transparent;
    z-index: 1;
  }
  
  /* Variable highlighting using <mark> tags in contentEditable */
  mark.var-highlight {
    display: inline;
    padding: 2px 6px;
    border-radius: 6px;
    font-weight: 600;
    background: rgba(216, 226, 176, 0.7); /* sage */
    color: #1a365d; /* navy text */
    border: 1px solid rgba(163, 179, 84, 0.5);
    font-style: normal;
  }
  mark.var-highlight.filled {
    background: rgba(216, 226, 176, 0.9);
    border-color: rgba(163, 179, 84, 0.8);
    font-weight: 700;
  }
  mark.var-highlight.empty {
    background: rgba(216, 226, 176, 0.45);
    border-color: rgba(163, 179, 84, 0.45);
    color: #1a365d;
    font-style: italic;
  }
  
  .editor-textarea {
    position: relative;
    z-index: 2;
    background: transparent !important;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
    font-weight: 400;
    letter-spacing: 0.01em;
  }
  
  /* Input field typography improvements */
  input, textarea {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif !important;
    font-weight: 400;
    letter-spacing: 0.01em;
  }
  
  /* Resizable popup styles */
  .resizable-popup {
    resize: both;
    overflow: auto;
  }
  
  .resizable-popup::-webkit-resizer {
    background-color: var(--tb-teal);
    background-image: linear-gradient(45deg, transparent 50%, var(--tb-teal-dark) 50%);
  }
`

// Interface texts by language - moved outside component to avoid TDZ issues
const interfaceTexts = {
  fr: {
    title: 'Assistant pour rédaction de courriels aux clients',
    subtitle: 'Bureau de la traduction',
    selectTemplate: 'Sélectionnez un modèle',
    templatesCount: `modèles disponibles`,
  searchPlaceholder: 'Rechercher un modèle...',
    allCategories: 'Toutes les catégories',
    categories: {
      'Devis et estimations': 'Devis et estimations',
      'Gestion de projets': 'Gestion de projets', 
      'Problèmes techniques': 'Problèmes techniques',
      'Communications générales': 'Communications générales',
      'Services spécialisés': 'Services spécialisés'
    },
    templateLanguage: 'Langue du modèle:',
    interfaceLanguage: 'Langue de l\'interface:',
    variables: 'Variables',
    editEmail: 'Éditez votre courriel',
    subject: 'Objet',
    body: 'Corps du message',
    reset: 'Réinitialiser',
    copy: 'Copier',
    copySubject: 'Copier Objet',
    copyBody: 'Copier Corps', 
    copyAll: 'Copier Tout',
    copied: 'Copié !',
    copyLink: 'Copier le lien',
    copyLinkTitle: 'Copier le lien direct vers ce modèle',
    openInOutlook: 'Ouvrir dans Outlook',
    openInOutlookTitle: 'Composer un courriel avec Outlook',
    sendEmail: 'Envoyer courriel',
  favorites: 'Favoris',
  showFavoritesOnly: 'Afficher uniquement les favoris',
    noTemplate: 'Sélectionnez un modèle pour commencer',
    resetWarningTitle: 'Confirmer la réinitialisation',
    resetWarningMessage: 'Êtes-vous sûr de vouloir réinitialiser toutes les variables ? Cette action ne peut pas être annulée.',
    cancel: 'Annuler',
    confirm: 'Confirmer'
  },
  en: {
    title: 'Email Writing Assistant for Clients',
    subtitle: 'Translation Bureau',
    selectTemplate: 'Select a template',
    templatesCount: `templates available`,
  searchPlaceholder: 'Search for a template...',
    allCategories: 'All categories',
    categories: {
      'Devis et estimations': 'Quotes and estimates',
      'Gestion de projets': 'Project management', 
      'Problèmes techniques': 'Technical issues',
      'Communications générales': 'General communications',
      'Services spécialisés': 'Specialized services'
    },
    templateLanguage: 'Template language:',
    interfaceLanguage: 'Interface language:',
    variables: 'Variables',
    editEmail: 'Edit your email',
    subject: 'Subject',
    body: 'Message body',
    reset: 'Reset',
    copy: 'Copy',
    copySubject: 'Copy Subject',
    copyBody: 'Copy Body',
    copyAll: 'Copy All',
    copied: 'Copied!',
    copyLink: 'Copy link',
    copyLinkTitle: 'Copy direct link to this template',
    openInOutlook: 'Open in Outlook',
    openInOutlookTitle: 'Compose email in Outlook',
    sendEmail: 'Send Email',
  favorites: 'Favorites',
  showFavoritesOnly: 'Show only favorites',
    noTemplate: 'Select a template to get started',
    resetWarningTitle: 'Confirm Reset',
    resetWarningMessage: 'Are you sure you want to reset all variables? This action cannot be undone.',
    cancel: 'Cancel',
    confirm: 'Confirm'
  }
}

function App() {
  // Inject custom styles for variable highlighting
  useEffect(() => {
    const styleElement = document.createElement('style')
    styleElement.textContent = customEditorStyles
    document.head.appendChild(styleElement)
    return () => document.head.removeChild(styleElement)
  }, [])

  // Debug flag via ?debug=1
  const debug = useMemo(() => {
    try { return new URLSearchParams(window.location.search).has('debug') } catch { return false }
  }, [])

  // Load saved state
  const savedState = loadState()
  
  // State for template data
  const [templatesData, setTemplatesData] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Separate interface language from template language
  const [interfaceLanguage, setInterfaceLanguage] = useState(savedState.interfaceLanguage || 'fr') // Interface language
  const [templateLanguage, setTemplateLanguage] = useState(savedState.templateLanguage || 'fr')   // Template language
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [searchQuery, setSearchQuery] = useState(savedState.searchQuery || '')
  const [selectedCategory, setSelectedCategory] = useState(savedState.selectedCategory || 'all')
  const [finalSubject, setFinalSubject] = useState('') // Final editable version
  const [finalBody, setFinalBody] = useState('') // Final editable version
  const [variables, setVariables] = useState(savedState.variables || {})
  const [favorites, setFavorites] = useState(savedState.favorites || [])
  const [favoritesOnly, setFavoritesOnly] = useState(savedState.favoritesOnly || false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [showVariablePopup, setShowVariablePopup] = useState(false)
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [showHighlights, setShowHighlights] = useState(() => {
    const saved = localStorage.getItem('ea_show_highlights')
    return saved === null ? true : saved === 'true'
  })
  const [leftWidth, setLeftWidth] = useState(() => {
    const saved = Number(localStorage.getItem('ea_left_width'))
    return Number.isFinite(saved) && saved >= 300 && saved <= 680 ? saved : 440
  })
  const isDragging = useRef(false)
  const [varPopupPos, setVarPopupPos] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('ea_var_popup_pos') || 'null')
      if (saved && typeof saved.top === 'number' && typeof saved.left === 'number' && typeof saved.width === 'number' && typeof saved.height === 'number') return saved
    } catch {}
    return { top: 80, left: 80, width: 600, height: 500 }
  })
  const varPopupRef = useRef(null)
  const dragState = useRef({ dragging: false, startX: 0, startY: 0, origTop: 0, origLeft: 0 })
  // Export menu state (replaces <details> for reliability)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const exportMenuRef = useRef(null)
  
  // References for keyboard shortcuts
  const searchRef = useRef(null) // Reference for focus on search (Ctrl+J)

  // Automatically save important preferences
  useEffect(() => {
    saveState({
      interfaceLanguage,
      templateLanguage,
      searchQuery,
      selectedCategory,
      variables,
      favorites,
      favoritesOnly
    })
  }, [interfaceLanguage, templateLanguage, searchQuery, selectedCategory, variables, favorites, favoritesOnly])

  // Persist pane sizes
  useEffect(() => {
    try {
      localStorage.setItem('ea_left_width', String(leftWidth))
    } catch {}
  }, [leftWidth])

  // Persist highlight visibility
  useEffect(() => {
    try {
      localStorage.setItem('ea_show_highlights', String(showHighlights))
    } catch {}
  }, [showHighlights])

  // Persist popup position/size
  useEffect(() => {
    try { localStorage.setItem('ea_var_popup_pos', JSON.stringify(varPopupPos)) } catch {}
  }, [varPopupPos])

  // Close export menu on outside click or ESC
  useEffect(() => {
    if (!showExportMenu) return
    const onDocClick = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false)
      }
    }
    const onEsc = (e) => { if (e.key === 'Escape') setShowExportMenu(false) }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [showExportMenu])

  const t = interfaceTexts[interfaceLanguage]

  // Load template data on startup
  useEffect(() => {
    const loadTemplatesData = async () => {
      try {
    if (debug) console.log('[EA][Debug] Fetching templates (with prod raw GitHub fallback)...')
  const REPO_RAW_URL = 'https://raw.githubusercontent.com/snarky1980/email-assistant-v8-fixed/main/complete_email_templates.json'
        const LOCAL_URL = './complete_email_templates.json'
        // Absolute path based on Vite base for GitHub Pages (e.g., /email-assistant-v8-fixed/)
        const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) ? import.meta.env.BASE_URL : '/'
        const ABSOLUTE_URL = (BASE_URL.endsWith('/') ? BASE_URL : BASE_URL + '/') + 'complete_email_templates.json'
        const isLocal = /^(localhost|127\.|0\.0\.0\.0)/i.test(window.location.hostname)
        const ts = Date.now()
        const withBust = (u) => u + (u.includes('?') ? '&' : '?') + 'cb=' + ts
        // Prefer local JSON first in all environments; fall back to raw repo
        // This avoids transient network/CORS issues on GitHub Pages
        const candidates = [withBust(LOCAL_URL), withBust(ABSOLUTE_URL), withBust(REPO_RAW_URL)]

        let loaded = null
        let lastErr = null
        for (const url of candidates) {
          try {
            if (debug) console.log('[EA][Debug] Try fetch', url)
            const resp = await fetch(url, { cache: 'no-cache' })
            if (!resp.ok) throw new Error('HTTP ' + resp.status)
            const j = await resp.json()
            loaded = j
            break
          } catch (e) {
            lastErr = e
            if (debug) console.warn('[EA][Debug] fetch candidate failed', url, e?.message || e)
          }
        }
        if (!loaded) throw lastErr || new Error('No template source reachable')
        setTemplatesData(loaded)
        if (debug) console.log('[EA][Debug] Templates loaded:', loaded.templates?.length)
      } catch (error) {
        console.error('Error loading templates data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadTemplatesData()
  }, [])

  // Auto-select first template once data is available
  useEffect(() => {
    if (!loading && templatesData && !selectedTemplate && Array.isArray(templatesData.templates) && templatesData.templates.length > 0) {
      if (debug) console.log('[EA][Debug] Auto-selecting first template')
      setSelectedTemplate(templatesData.templates[0])
    }
  }, [loading, templatesData, selectedTemplate, debug])

  /**
   * URL PARAMETER SUPPORT FOR DEEP LINK SHARING
   */
  useEffect(() => {
    if (!templatesData) return
    
    // Read current URL parameters
    const params = new URLSearchParams(window.location.search)
    const templateId = params.get('id')
    const langParam = params.get('lang')
    
    // Apply language from URL if specified and valid
    if (langParam && ['fr', 'en'].includes(langParam)) {
      setTemplateLanguage(langParam)
      setInterfaceLanguage(langParam)
    }
    
    // Pre-select template from URL
    if (templateId) {
      const template = templatesData.templates.find(t => t.id === templateId)
      if (template) {
        setSelectedTemplate(template)
      }
    }
  }, [templatesData]) // Triggers when templates are loaded

  /**
   * KEYBOARD SHORTCUTS FOR PROFESSIONAL UX
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + Enter: Copy all (main quick action)
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        if (selectedTemplate) {
          copyToClipboard('all')
        }
      }
      
      // Ctrl/Cmd + B: Copy body only (Body)
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault()
        if (selectedTemplate) {
          copyToClipboard('body')
        }
      }
      
      // Ctrl/Cmd + J: Copy subject only (subJect)
      if ((e.ctrlKey || e.metaKey) && e.key === 'j') {
        e.preventDefault()
        if (selectedTemplate) {
          copyToClipboard('subject')
        }
      }
      
      // Ctrl/Cmd + Shift + Enter: Send email (Enhanced send action)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Enter') {
        e.preventDefault()
        if (selectedTemplate) {
          openInOutlook()
        }
      }
      
      // Ctrl/Cmd + /: Focus on search (search shortcut)
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault()
        if (searchRef.current) {
          searchRef.current.focus()
        }
      }
    }

    // Attach keyboard events globally
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedTemplate]) // Re-bind when template changes

  // Filter templates based on search and category
  const filteredTemplates = useMemo(() => {
    if (!templatesData) return []
    let filtered = templatesData.templates

    if (searchQuery) {
      filtered = filtered.filter(template => 
        template.title[templateLanguage]?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description[templateLanguage]?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory)
    }

    if (favoritesOnly) {
      const favSet = new Set(favorites)
      filtered = filtered.filter(t => favSet.has(t.id))
    }

    return filtered
  }, [templatesData, searchQuery, selectedCategory, templateLanguage, favoritesOnly, favorites])

  // Get unique categories
  const categories = useMemo(() => {
    if (!templatesData) return []
    const cats = [...new Set(templatesData.templates.map(t => t.category))]
    return cats
  }, [templatesData])

  const isFav = (id) => favorites.includes(id)
  const toggleFav = (id) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  // Replace variables in text
  const replaceVariables = (text) => {
    let result = text
    Object.entries(variables).forEach(([varName, value]) => {
      const regex = new RegExp(`<<${varName}>>`, 'g')
      result = result.replace(regex, value || `<<${varName}>>`)
    })
    return result
  }

  // Load a selected template
  useEffect(() => {
    if (selectedTemplate) {
      // Initialize variables with default values
      const initialVars = {}
      selectedTemplate.variables.forEach(varName => {
        const varInfo = templatesData.variables[varName]
        if (varInfo) {
          initialVars[varName] = varInfo.example || ''
        }
      })
      setVariables(initialVars)
      
      // Update final versions with replaced variables
      const subjectWithVars = replaceVariables(selectedTemplate.subject[templateLanguage] || '')
      const bodyWithVars = replaceVariables(selectedTemplate.body[templateLanguage] || '')
      setFinalSubject(subjectWithVars)
      setFinalBody(bodyWithVars)
    }
  }, [selectedTemplate, templateLanguage])

  // Update final versions when variables change
  useEffect(() => {
    if (selectedTemplate) {
      const subjectWithVars = replaceVariables(selectedTemplate.subject[templateLanguage] || '')
      const bodyWithVars = replaceVariables(selectedTemplate.body[templateLanguage] || '')
      setFinalSubject(subjectWithVars)
      setFinalBody(bodyWithVars)
    }
  }, [variables, selectedTemplate, templateLanguage])

  /**
   * GRANULAR COPY FUNCTION
   */
  const copyToClipboard = async (type = 'all') => {
    let content = ''
    
    // Content selection based on requested type
    switch (type) {
      case 'subject':
        content = finalSubject
        break
      case 'body':
        content = finalBody
        break
      case 'all':
      default:
        content = `${finalSubject}\n\n${finalBody}`
        break
    }
    
    try {
      // Modern and secure method (HTTPS required)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(content)
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea')
        textArea.value = content
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        textArea.remove()
      }
      
      // Visual success feedback (2 seconds)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('Copy error:', error)
      // Error handling with user message
      alert('Copy error. Please select the text manually and use Ctrl+C.')
    }
  }

  /**
   * DIRECT LINK COPY FUNCTION
   */
  const copyTemplateLink = async () => {
    if (!selectedTemplate) return
    
    // Build full URL with parameters
    const currentUrl = window.location.origin + window.location.pathname
    const templateUrl = `${currentUrl}?id=${selectedTemplate.id}&lang=${templateLanguage}`
    
    try {
      // Copy URL to clipboard
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(templateUrl)
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = templateUrl
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        textArea.remove()
      }
      
      // Temporary visual feedback
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('Link copy error:', error)
      alert('Link copy error. Please copy the URL manually from the address bar.')
    }
  }

  // Export helpers for .eml, HTML, and copy HTML
  const exportAs = async (mode) => {
    const subject = finalSubject || ''
    const bodyText = finalBody || ''
    const bodyHtml = `<html><body><pre style="font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; white-space: pre-wrap; line-height: 1.6">${
      (bodyText || '').replace(/[&<>]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))
    }</pre></body></html>`

    if (mode === 'eml') {
      // Build a minimal .eml content
      const eml = [
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        '',
        bodyText
      ].join('\r\n')
      const blob = new Blob([eml], { type: 'message/rfc822' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'email.eml'
      a.click()
      URL.revokeObjectURL(url)
      return
    }

    if (mode === 'html') {
      const blob = new Blob([bodyHtml], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'email.html'
      a.click()
      URL.revokeObjectURL(url)
      return
    }

    if (mode === 'copy-html') {
      try {
        if (navigator.clipboard && navigator.clipboard.write) {
          const type = 'text/html'
          const blob = new Blob([bodyHtml], { type })
          const item = new ClipboardItem({ [type]: blob })
          await navigator.clipboard.write([item])
        } else {
          // Fallback: copy as plain text
          await navigator.clipboard.writeText(bodyHtml)
        }
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 1500)
      } catch (e) {
        console.error('Copy HTML failed', e)
        alert('Copy HTML failed. Please try again or use the HTML export option.')
      }
      return
    }
  }

  // Close popup on ESC
  useEffect(() => {
    if (!showVariablePopup) return
    const onKey = (e) => { if (e.key === 'Escape') setShowVariablePopup(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [showVariablePopup])

  // Track resize to persist size
  useEffect(() => {
    if (!showVariablePopup || !varPopupRef.current) return
    const el = varPopupRef.current
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect
      setVarPopupPos(p => ({ ...p, width: Math.round(rect.width), height: Math.round(rect.height) }))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [showVariablePopup])

  // Drag handlers
  const startDrag = (e) => {
    if (!varPopupRef.current) return
    e.preventDefault()
    const { clientX, clientY } = e
    dragState.current = { dragging: true, startX: clientX, startY: clientY, origTop: varPopupPos.top, origLeft: varPopupPos.left }
    const onMove = (ev) => {
      if (!dragState.current.dragging) return
      const dx = ev.clientX - dragState.current.startX
      const dy = ev.clientY - dragState.current.startY
      const nextTop = Math.max(0, Math.min(window.innerHeight - 80, dragState.current.origTop + dy))
      const nextLeft = Math.max(0, Math.min(window.innerWidth - 80, dragState.current.origLeft + dx))
      setVarPopupPos(p => ({ ...p, top: nextTop, left: nextLeft }))
    }
    const onUp = () => {
      dragState.current.dragging = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  // Reset form with confirmation
  const [showResetWarning, setShowResetWarning] = useState(false)
  
  const handleResetClick = () => {
    setShowResetWarning(true)
  }

  const confirmReset = () => {
    if (selectedTemplate) {
      const initialVars = {}
      selectedTemplate.variables.forEach(varName => {
        const varInfo = templatesData.variables[varName]
        if (varInfo) {
          initialVars[varName] = varInfo.example || ''
        }
      })
      setVariables(initialVars)
      
      const subjectWithVars = replaceVariables(selectedTemplate.subject[templateLanguage] || '')
      const bodyWithVars = replaceVariables(selectedTemplate.body[templateLanguage] || '')
      setFinalSubject(subjectWithVars)
      setFinalBody(bodyWithVars)
    }
    setShowResetWarning(false)
  }

  // Open default mail client (Outlook if default) with subject/body prefilled
  function openInOutlook() {
    console.log('Opening email client with subject:', finalSubject)
    
    if (!finalSubject && !finalBody) {
      alert(templateLanguage === 'fr' ? 'Veuillez d\'abord sélectionner un modèle et remplir le contenu.' : 'Please first select a template and fill in the content.')
      return
    }
    
    const subject = finalSubject || ''
    const body = (finalBody || '').replace(/\n/g, '\r\n')
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    
    try {
      // Try to open using window.location.href first (preferred method)
      window.location.href = mailtoUrl
      
      // Provide visual feedback
      const originalText = document.activeElement?.textContent
      if (document.activeElement) {
        const button = document.activeElement
        const originalText = button.textContent
        button.textContent = templateLanguage === 'fr' ? 'Ouverture...' : 'Opening...'
        setTimeout(() => {
          if (button.textContent === (templateLanguage === 'fr' ? 'Ouverture...' : 'Opening...')) {
            button.textContent = originalText
          }
        }, 2000)
      }
    } catch (error) {
      console.error('Error opening email client:', error)
      // Fallback method
      try {
        window.open(mailtoUrl, '_blank')
      } catch (fallbackError) {
        console.error('Fallback method failed:', fallbackError)
        // Final fallback - copy to clipboard and show instructions
        navigator.clipboard.writeText(`${subject}\n\n${finalBody}`).then(() => {
          alert(templateLanguage === 'fr' 
            ? 'Impossible d\'ouvrir votre client de messagerie. Le contenu a été copié dans le presse-papiers.' 
            : 'Unable to open your email client. The content has been copied to your clipboard.')
        }).catch(() => {
          alert(templateLanguage === 'fr' 
            ? 'Impossible d\'ouvrir votre client de messagerie. Veuillez copier manuellement le contenu.' 
            : 'Unable to open your email client. Please copy the content manually.')
        })
      }
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom right, #f8fafc, #dbeafe, #e0f2fe)' }}>
      {debug && (
        <div style={{ position: 'fixed', bottom: 8, left: 8, background: '#1e293b', color: '#fff', padding: '8px 12px', borderRadius: 8, fontSize: 12, zIndex: 9999, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
          <div style={{ fontWeight: 600 }}>Debug</div>
          <div>loading: {String(loading)}</div>
          <div>templates: {templatesData?.templates?.length || 0}</div>
          <div>selected: {selectedTemplate?.id || 'none'}</div>
          <div>vars: {Object.keys(variables || {}).length}</div>
        </div>
      )}
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1f8a99] mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des modèles...</p>
          </div>
        </div>
      ) : (
        <>
      {/* Exact banner from attached design */}
      <header className="w-full mx-auto max-w-none page-wrap py-4 relative z-50 sticky top-0 border-b" style={{ backgroundColor: '#ffffff', borderColor: 'var(--tb-mint)' }}>
        {/* Decorative pills and lines - EXACT positions from design */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {/* Top row of pills */}
          <div className="banner-pill" style={{ top: '-38px', left: '-190px', width: '320px', height: '112px', background: 'var(--tb-navy)', opacity: 0.93, borderRadius: '140px' }}></div>
          <div className="banner-pill" style={{ top: '-28px', left: '250px', width: '220px', height: '90px', background: 'var(--tb-light-blue)', opacity: 0.58, borderRadius: '130px' }}></div>
          <div className="banner-pill" style={{ top: '-20px', left: '720px', width: '260px', height: '46px', background: 'var(--tb-gray)', opacity: 0.34, borderRadius: '120px' }}></div>
          <div className="banner-pill" style={{ top: '-10px', left: '960px', width: '360px', height: '90px', background: 'var(--tb-mint)', opacity: 0.5, borderRadius: '140px' }}></div>
          <div className="banner-pill" style={{ top: '-40px', left: '1180px', width: '430px', height: '96px', background: 'var(--tb-navy)', opacity: 0.85, borderRadius: '120px' }}></div>
          <div className="banner-pill" style={{ top: '-30px', left: '1740px', width: '250px', height: '104px', background: 'var(--tb-navy)', opacity: 0.88, borderRadius: '140px' }}></div>
          
          {/* Bottom row of pills */}
          <div className="banner-pill" style={{ top: '62px', left: '-180px', width: '300px', height: '86px', background: 'var(--tb-teal)', opacity: 0.35, borderRadius: '120px' }}></div>
          <div className="banner-pill" style={{ top: '98px', left: '760px', width: '620px', height: '160px', background: 'var(--tb-teal)', opacity: 0.28, borderRadius: '180px' }}></div>
          <div className="banner-pill" style={{ top: '62px', left: '1320px', width: '120px', height: '68px', background: 'var(--tb-light-blue)', opacity: 0.58, borderRadius: '100px' }}></div>
          <div className="banner-pill" style={{ top: '74px', left: '1600px', width: '150px', height: '76px', background: 'var(--tb-mint)', opacity: 0.56, borderRadius: '110px' }}></div>
          <div className="banner-pill" style={{ top: '-8px', left: '130px', width: '110px', height: '70px', background: 'var(--tb-light-blue)', opacity: 0.32, borderRadius: '110px' }}></div>
          
          {/* Horizontal line with dot */}
          <div className="hpill-line" style={{ left: '600px', top: '40px', height: '2px', width: '320px', background: 'var(--tb-navy)', opacity: 0.35 }}>
            <span className="hpill-dot" style={{ top: '50%', left: '30%', transform: 'translate(-50%, -50%)', width: '18px', height: '18px', background: '#ffffff', borderRadius: '9999px', boxShadow: '0 0 0 4px var(--tb-mint), 0 0 0 6px #fff', position: 'absolute' }}></span>
          </div>
          
          {/* Vertical line with dot */}
          <div className="hpill-line" style={{ left: '1530px', top: '-44px', height: '176px', width: '2px', background: 'var(--tb-navy)', opacity: 0.5 }}>
            <span className="hpill-dot" style={{ top: '52%', left: '50%', transform: 'translate(-50%, -50%)', width: '16px', height: '16px', background: '#ffffff', borderRadius: '9999px', boxShadow: '0 0 0 4px var(--tb-teal), 0 0 0 6px #fff', position: 'absolute' }}></span>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex items-center justify-between relative">
          {/* Left side: Logo + Title with 2in margin */}
          <div className="flex items-center space-x-6" style={{ marginLeft: '2in' }}>
            {/* Large navy circle with mail icon */}
            <div className="relative">
              <div className="p-6" style={{ backgroundColor: 'var(--tb-navy)', borderRadius: '56px' }}>
                <Mail className="text-white" style={{ width: '60px', height: '60px' }} />
              </div>
            </div>
            
            {/* Title and subtitle */}
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: 'var(--tb-navy)' }}>
                {t.title}
              </h1>
              <p className="text-xl md:text-2xl font-semibold" style={{ color: '#1f8a99' }}>
                {t.subtitle}
              </p>
            </div>
          </div>
          
          {/* Right side: Language selector - Pure Teal */}
          <div className="flex items-center space-x-3 px-4 py-3 shadow-xl" style={{ backgroundColor: 'var(--primary)', borderRadius: 'calc(var(--radius) + 8px)' }}>
            <Globe className="h-8 w-8 text-white" />
            <span className="font-bold text-base text-white">{t.interfaceLanguage}</span>
            <div className="flex bg-white p-1.5 shadow-lg" style={{ borderRadius: '14px' }}>
              <button
                onClick={() => setInterfaceLanguage('fr')}
                className={`px-4 py-2 text-sm font-bold transition-all duration-300 transform ${
                  interfaceLanguage === 'fr' ? 'text-white shadow-xl scale-105' : ''
                }`}
                style={
                  interfaceLanguage === 'fr'
                    ? { backgroundColor: 'var(--primary)', color: 'white', borderRadius: 'calc(var(--radius) + 4px)' }
                    : { backgroundColor: 'transparent', borderRadius: 'calc(var(--radius) + 4px)' }
                }
              >
                FR
              </button>
              <button
                onClick={() => setInterfaceLanguage('en')}
                className={`px-4 py-2 text-sm font-bold transition-all duration-300 transform ${
                  interfaceLanguage === 'en' ? 'text-white shadow-xl scale-105' : 'hover:scale-105'
                }`}
                style={
                  interfaceLanguage === 'en'
                    ? { backgroundColor: 'var(--primary)', color: 'white', borderRadius: 'calc(var(--radius) + 4px)' }
                    : { backgroundColor: 'transparent', borderRadius: 'calc(var(--radius) + 4px)' }
                }
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </header>

  {/* Main content with resizable panes - full width */}
  <main className="w-full max-w-none px-3 sm:px-4 lg:px-6 py-5">
  {/* Data integrity banner: show when templates failed to load */}
  {!loading && (!templatesData || !Array.isArray(templatesData.templates) || templatesData.templates.length === 0) && (
    <div className="mb-6 p-4 rounded-lg border-2 border-amber-300 bg-amber-50 text-amber-900 shadow-sm">
      <div className="font-semibold mb-1">{interfaceLanguage === 'fr' ? 'Aucun modèle chargé' : 'No templates loaded'}</div>
      <div className="text-sm">
        {interfaceLanguage === 'fr'
          ? "Le fichier complete_email_templates.json n'a pas été trouvé ou n'a pas pu être chargé. Le bouton d'envoi s'affiche uniquement quand un modèle est sélectionné."
          : 'The complete_email_templates.json file was not found or could not be loaded. The Send Email button only shows when a template is selected.'}
        <div className="mt-2">
          <a className="underline text-amber-800" href="./complete_email_templates.json" target="_blank" rel="noreferrer">complete_email_templates.json</a>
        </div>
        <div className="mt-1 text-xs text-amber-800/80">
          {interfaceLanguage === 'fr'
            ? 'Astuce: ajoutez ?debug=1 à l’URL pour voir les compteurs. Vérifiez la console réseau (F12) pour les erreurs 404/CORS.'
            : 'Tip: add ?debug=1 to the URL to see counters. Check the Network console (F12) for 404/CORS errors.'}
        </div>
      </div>
    </div>
  )}
  <div className="flex gap-4 items-stretch w-full">
    {/* Left panel - Template list (resizable) */}
    <div style={{ width: leftWidth }} className="shrink-0">
            <Card className="h-fit card-soft border-0 overflow-hidden" style={{ background: '#ffffff' }}>
              <CardHeader className="pb-0" style={{ background: 'var(--primary)', borderTopLeftRadius: 12, borderTopRightRadius: 12, boxShadow: 'none', borderBottom: 'none' }}>
                <div className="h-[56px] grid grid-cols-[1fr_auto_1fr] items-center">
                  <div className="col-start-2 justify-self-center min-w-0">
                    <div data-slot="card-title" className="text-lg md:text-xl font-bold text-white flex items-center justify-center gap-2 leading-tight whitespace-nowrap">
                      <FileText className="h-6 w-6 text-white" aria-hidden="true" />
                      <span className="truncate">{t.selectTemplate}</span>
                    </div>
                  </div>
                </div>
              {/* small white spacer to match main banner separation */}
              <div style={{ height: 8, background: '#ffffff' }} />
                <div className="flex items-center justify-between px-4 py-2" style={{ background: '#f6fbfb', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
                  <p className="text-sm text-gray-600">{filteredTemplates.length} {t.templatesCount}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setFavoritesOnly(v => !v)}
                    className="shadow-soft"
                    style={{ background: '#fff', color: '#145a64', borderColor: 'rgba(20,90,100,0.35)', borderRadius: 10 }}
                    title={t.showFavoritesOnly}
                    aria-pressed={favoritesOnly}
                  >
                    <Star className="h-4 w-4 mr-2" /> {t.favorites}
                  </Button>
                </div>
                
                {/* Category filter with style (white background wrapper) */}
                <div className="bg-white p-2 rounded-[12px] border border-[#e6eef5]">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger
                      className="border-2 transition-all duration-200 rounded-md"
                      style={selectedCategory === 'all'
                        ? { background: 'var(--tb-sage-muted)', borderColor: 'var(--tb-sage-muted)', color: '#1a365d' }
                        : { background: '#ffffff', borderColor: '#bfe7e3' }
                      }
                    >
                      <Filter className="h-4 w-4 mr-2 text-[#1f8a99]" />
                      <SelectValue placeholder={t.allCategories} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="font-semibold">{t.allCategories}</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {t.categories[category] || category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Search with white field, single magnifier (left only) and clear button */}
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={searchRef}
                    type="text"
                    placeholder={t.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex w-full min-w-0 rounded-md bg-transparent px-3 py-1 text-base shadow-xs outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive h-10 pl-10 pr-10 border-2 transition-all duration-300 teal-focus"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                      title="Clear search"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>

                {/* Template language header and toggler on one teal bar */}
                <div className="h-[48px] w-full rounded-lg mt-3 px-3 flex items-center justify-between" style={{ background: 'var(--primary)' }}>
                  <div className="text-base font-bold text-white inline-flex items-center gap-2 leading-tight whitespace-nowrap">
                    <Languages className="h-5 w-5 text-white" />
                    <span className="truncate">{t.templateLanguage}</span>
                  </div>
                  <div className="flex bg-white rounded-lg p-1 shadow-sm">
                    <button
                      onClick={() => setTemplateLanguage('fr')}
                      className={`px-3 py-1 text-sm font-bold rounded-md transition-all duration-300 button-ripple teal-focus ${templateLanguage === 'fr' ? 'text-white' : 'text-gray-600'}`}
                      style={templateLanguage === 'fr' ? { background: 'var(--primary)' } : {} }
                    >
                      FR
                    </button>
                    <button
                      onClick={() => setTemplateLanguage('en')}
                      className={`px-3 py-1 text-sm font-bold rounded-md transition-all duration-300 button-ripple teal-focus ${templateLanguage === 'en' ? 'text-white' : 'text-gray-600'}`}
                      style={templateLanguage === 'en' ? { background: 'var(--primary)' } : {} }
                    >
                      EN
                    </button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <ScrollArea className="h-[600px]" style={{ '--scrollbar-width': '8px' }}>
                  <div className="space-y-3 p-2 relative">
                    {/* Scroll indicator at bottom */}
                    {filteredTemplates.length > 6 && (
                      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-10 flex items-end justify-center pb-1">
                        <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full shadow-sm border">
                          ↓ {filteredTemplates.length - 6}+ more templates
                        </div>
                      </div>
                    )}
                    {filteredTemplates.map((template) => (
                      <div
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        className={`p-4 border cursor-pointer transition-all duration-200 ${
                          selectedTemplate?.id === template.id
                            ? 'shadow-lg transform scale-[1.02]'
                            : 'border-[#e1eaf2] hover:border-[#bfe7e3] bg-white hover:shadow-sm'
                        }`}
                        style={
                          selectedTemplate?.id === template.id
                            ? {
                                borderColor: '#1f8a99',
                                background: '#e6f0ff',
                                borderRadius: '14px',
                              }
                            : { borderRadius: '14px' }
                        }
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-[13px] mb-0.5">
                              {template.title[templateLanguage]}
                            </h3>
                            <p className="text-[12px] text-gray-600 mb-1.5 leading-relaxed line-clamp-2">
                              {template.description[templateLanguage]}
                            </p>
                            <Badge variant="secondary" className="text-[11px] font-medium bg-[#e6f0ff] text-[#1a365d] border-[#c7dbff]">
                              {template.category}
                            </Badge>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleFav(template.id) }}
                            className={`ml-3 text-base ${isFav(template.id) ? 'text-[#f5c542]' : 'text-gray-300 hover:text-[#f5c542]'}`}
                            title={isFav(template.id) ? 'Unfavorite' : 'Favorite'}
                            aria-label="Toggle favorite"
                          >★</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Drag handle between left and main */}
          <div
            role="separator"
            aria-orientation="vertical"
            className="w-[3px] cursor-col-resize select-none rounded"
            style={{
              background: 'rgba(20,90,100,0.15)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(31,138,153,0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(20,90,100,0.15)';
            }}
            onMouseDown={(e) => {
              isDragging.current = 'left';
              const startX = e.clientX; const startLeft = leftWidth;
              const onMove = (ev) => {
                if (isDragging.current !== 'left') return
                const dx = ev.clientX - startX
                const nextLeft = Math.max(300, Math.min(680, startLeft + dx))
                setLeftWidth(nextLeft)
              }
              const onUp = () => { isDragging.current = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
              document.addEventListener('mousemove', onMove)
              document.addEventListener('mouseup', onUp)
            }}
          />

          {/* Main editing panel (flexible) */}
          <div className="flex-1 min-w-[600px] space-y-5">
            {selectedTemplate ? (
              <>
                {/* Editable version - MAIN AREA */}
                <Card className="card-soft border-0 overflow-hidden" style={{ background: '#ffffff' }}>
                  <CardHeader style={{ background: 'var(--primary)', paddingTop: 10, paddingBottom: 10, boxShadow: 'none', borderBottom: 'none', borderTopLeftRadius: 12, borderTopRightRadius: 12, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
                    <CardTitle className="text-2xl font-bold text-white flex items-center justify-between">
                      <div className="flex items-center">
                        <Mail className="h-6 w-6 mr-3 text-white" />
	                      {t.editEmail}
	                    </div>
	                    <div className="flex items-center space-x-3">
	                      {selectedTemplate && selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                          <>
                            <Button
                              onClick={() => setShowVariablePopup(true)}
                              size="sm"
                              className="shadow-soft"
                              variant="outline"
                              style={{ background: '#fff', color: '#145a64', borderColor: 'rgba(20,90,100,0.35)' }}
                            >
	                          <Settings className="h-4 w-4 mr-2" />
	                          {t.variables}
	                        </Button>
                            {/* Toggle highlight visibility */}
                            <Button
                              onClick={() => setShowHighlights(v => !v)}
                              variant="outline"
                              className="transition-all duration-200 font-medium text-sm px-2.5"
                              style={{ borderRadius: '10px', background: '#fff', color: '#145a64', borderColor: 'rgba(20,90,100,0.35)' }}
                              size="sm"
                              title={showHighlights ? 'Masquer les surlignages' : 'Afficher les surlignages'}
                              aria-label={showHighlights ? 'Hide highlights' : 'Show highlights'}
                            >
                              {showHighlights ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/></svg>
                              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.5"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c2.06 0 4 .62 5.6 1.68M21.542 12c-.408 1.299-1.085 2.48-1.962 3.466" stroke="currentColor" strokeWidth="1.5"/></svg>}
                            </Button>
                          </>
	                      )}
                        {/* IA trigger: opens hidden AI panel - Sage accent */}
                        <Button
                          onClick={() => setShowAIPanel(true)}
                          size="sm"
                          variant="outline"
                          className="shadow-soft"
                          style={{ background: '#fff', color: '#145a64', borderColor: 'rgba(20,90,100,0.35)' }}
                          title="Ouvrir les fonctions IA"
                        >
                          IA
                        </Button>
                        {/* Outlook button moved below editor */}
	                    </div>
                    </CardTitle>
                  </CardHeader>
                  {/* small white spacer to separate banner from content */}
                  <div style={{ height: 8, background: '#ffffff' }} />
                  <CardContent className="p-5 space-y-5" style={{ background: '#f6fbfb', borderRadius: 12 }}>


                    {/* Editable subject with preview highlighting */}
                    <div className="space-y-3 mt-1">
                      <div className="flex items-center gap-2 text-slate-800 font-semibold">
                        <span className="inline-block h-2 w-2 rounded-full bg-[#1f8a99]"></span>
                        <span>{t.subject}</span>
                      </div>
                      <HighlightingEditor
                        value={finalSubject}
                        onChange={(e) => setFinalSubject(e.target.value)}
                        variables={variables}
                        placeholder={t.subject}
                        minHeight="60px"
                        templateOriginal={selectedTemplate?.subject?.[templateLanguage] || ''}
                        showHighlights={showHighlights}
                      />

                    </div>

                    {/* Editable body with preview highlighting */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-slate-800 font-semibold">
                        <span className="inline-block h-2 w-2 rounded-full bg-[#1f8a99]"></span>
                        <span>{t.body}</span>
                      </div>
                      <HighlightingEditor
                        value={finalBody}
                        onChange={(e) => setFinalBody(e.target.value)}
                        variables={variables}
                        placeholder={t.body}
                        minHeight="250px"
                        templateOriginal={selectedTemplate?.body?.[templateLanguage] || ''}
                        showHighlights={showHighlights}
                      />

                    </div>
                  </CardContent>
                </Card>

                {/* Actions with modern style */}
                <div className="flex justify-between items-center actions-row">
                  {/* Left-side tools: Export (+) then Copy link */}
                  <div className="flex items-center gap-2 relative" ref={exportMenuRef}>
                    <Button size="sm" variant="outline" className="font-medium border-2" style={{ borderRadius: 12, borderColor: '#bfe7e3' }} onClick={() => setShowExportMenu(v => !v)} aria-expanded={showExportMenu} aria-haspopup="menu">
                      +
                    </Button>
                    {showExportMenu && (
                      <div className="absolute left-0 z-20 mt-2 w-48 bg-white border border-[#e6eef5] rounded-[12px] shadow-soft py-1" role="menu">
                        <button className="w-full text-left px-3 py-2 hover:bg-[#f5fbff] text-sm" onClick={() => { exportAs('eml'); setShowExportMenu(false) }}>Exporter en .eml</button>
                        <button className="w-full text-left px-3 py-2 hover:bg-[#f5fbff] text-sm" onClick={() => { exportAs('html'); setShowExportMenu(false) }}>Exporter en HTML</button>
                        <button className="w-full text-left px-3 py-2 hover:bg-[#f5fbff] text-sm" onClick={() => { exportAs('copy-html'); setShowExportMenu(false) }}>Copier en HTML</button>
                      </div>
                    )}
                    <Button 
                      variant="ghost" 
                      onClick={() => copyTemplateLink()}
                      className="text-gray-500 hover:text-[#1f8a99] hover:bg-[#dbeafe] transition-all duration-300 font-medium text-sm"
                      style={{ borderRadius: '12px' }}
                      title={t.copyLinkTitle}
                    >
                      <Link className="h-4 w-4 mr-2" />
                      {t.copyLink}
                    </Button>

                  </div>
                  
                  <div className="flex space-x-3">
                    <Button 
                      onClick={handleResetClick}
                      size="sm"
                      variant="outline"
                      className="font-semibold shadow-soft hover:shadow-md border-2 text-black hover:bg-[#fee2e2]"
                      style={{ borderColor: '#7f1d1d', borderRadius: 12 }}
                      title={t.resetWarningTitle}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      {t.reset}
                    </Button>
                  
                  {/* 
                    GRANULAR COPY BUTTONS - ENHANCED UX
                  */}
                  <div className="flex space-x-2">
                    {/* Subject Copy Button - Teal theme */}
                    <Button 
                      onClick={() => copyToClipboard('subject')} 
                      variant="outline"
                      size="sm"
                      className="font-medium border-2 transition-all duration-300 group shadow-soft"
                      style={{ 
                        borderColor: 'rgba(31, 138, 153, 0.3)',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(219, 234, 254, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#1f8a99';
                        e.currentTarget.style.backgroundColor = 'rgba(219, 234, 254, 0.6)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(31, 138, 153, 0.3)';
                        e.currentTarget.style.backgroundColor = 'rgba(219, 234, 254, 0.3)';
                      }}
                      title="Copy subject only (Ctrl+J)"
                    >
                      <Mail className="h-4 w-4 mr-2 text-[#1f8a99]" />
                      <span className="text-[#1a365d]">{t.copySubject || 'Subject'}</span>
                    </Button>
                    
                    {/* Body Copy Button - Sage accent */}
                    <Button 
                      onClick={() => copyToClipboard('body')} 
                      variant="outline"
                      size="sm"
                      className="font-medium border-2 transition-all duration-300 group shadow-soft"
                      style={{ 
                        borderColor: 'rgba(163, 179, 84, 0.3)',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(163, 179, 84, 0.1)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#a3b354';
                        e.currentTarget.style.backgroundColor = 'rgba(163, 179, 84, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(163, 179, 84, 0.3)';
                        e.currentTarget.style.backgroundColor = 'rgba(163, 179, 84, 0.1)';
                      }}
                      title="Copy body only (Ctrl+B)"
                    >
                      <Edit3 className="h-4 w-4 mr-2 text-[#a3b354]" />
                      <span className="text-[#1a365d]">{t.copyBody || 'Body'}</span>
                    </Button>
                    
                    {/* Complete Copy Button - Gradient (main action) */}
                    <Button 
                      onClick={() => copyToClipboard('all')} 
                      className={`font-bold transition-all duration-200 shadow-soft btn-pill text-white ${
                        copySuccess 
                          ? 'transform scale-[1.02]' 
                          : 'hover:scale-[1.02]'
                      }`}
                      style={{ background: '#1f8a99' }}
                      title="Copy entire email (Ctrl+Enter)"
                    >
                      <Copy className="h-5 w-5 mr-2" />
                      {copySuccess ? t.copied : (t.copyAll || 'All')}
                    </Button>

                    {/* Send Email Button - Teal primary action (moved CTA) */}
                    <Button 
                      onClick={openInOutlook}
                      className="font-bold transition-all duration-200 shadow-soft text-white btn-pill"
                      style={{ background: '#145a64', borderRadius: '12px' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                      title="Open in your default email client (Ctrl+Shift+Enter)"
                    >
                      <Send className="h-5 w-5 mr-2" />
                      {t.openInOutlook}
                    </Button>
                  </div>
                  </div>
                </div>
              </>
            ) : (
              <Card className="card-soft border-0 bg-gradient-to-br from-white to-emerald-50 rounded-[18px]">
                <CardContent className="flex items-center justify-center h-80">
                  <div className="text-center">
                    <div className="relative mb-6">
                      <FileText className="h-16 w-16 text-gray-300 mx-auto animate-bounce" />
                      <Sparkles className="h-6 w-6 text-emerald-400 absolute -top-2 -right-2 animate-pulse" />
                    </div>
                    <p className="text-gray-500 text-lg font-medium">{t.noTemplate}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          {/* Removed permanent AI sidebar; optional slide-over below */}
        </div>
      </main>
        </>
      )}

      {/* Reset Warning Dialog */}
      {showResetWarning && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="text-yellow-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{t.resetWarningTitle}</h2>
              <p className="text-gray-600">{t.resetWarningMessage}</p>
            </div>
            <div className="flex space-x-4">
              <Button
                onClick={() => setShowResetWarning(false)}
                variant="outline"
                className="flex-1"
              >
                {t.cancel}
              </Button>
              <Button
                onClick={confirmReset}
                variant="outline"
                className="flex-1 border-2 text-[#7f1d1d] hover:bg-[#fee2e2]"
                style={{ borderColor: '#7f1d1d' }}
              >
                {t.confirm}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Resizable Variables Popup */}
      {showVariablePopup && selectedTemplate && selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
  <div className="fixed inset-0 bg-black/30 z-50 p-4" onMouseDown={() => setShowVariablePopup(false)}>
          <div 
            ref={varPopupRef}
            className="bg-white rounded-xl shadow-2xl border border-gray-200 min-w-[400px] max-w-[90vw] min-h-[300px] max-h-[85vh] overflow-hidden resizable-popup"
            style={{ 
              position: 'fixed',
              top: varPopupPos.top,
              left: varPopupPos.left,
              width: varPopupPos.width,
              height: varPopupPos.height,
              cursor: dragState.current.dragging ? 'grabbing' : 'default'
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Popup Header */}
            <div 
              className="px-6 py-4 border-b border-gray-200 flex items-center justify-between select-none"
              style={{ background: 'linear-gradient(to right, #dbeafe, #bfe7e3)', cursor: 'grab' }}
              onMouseDown={startDrag}
            >
              <div className="flex items-center">
                <Edit3 className="h-6 w-6 mr-3 text-[#1f8a99]" />
                <h2 className="text-xl font-bold text-gray-800">{t.variables}</h2>
                <Badge variant="outline" className="ml-3 text-xs">
                  {selectedTemplate.variables.length} variable{selectedTemplate.variables.length > 1 ? 's' : ''}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                  <Move className="h-3 w-3 mr-1" />
                  {interfaceLanguage === 'fr' ? 'Déplaçable + redimensionnable' : 'Movable + resizable'}
                </div>
                <Button
                  onClick={() => setShowVariablePopup(false)}
                  variant="ghost"
                  size="sm"
                  className="hover:bg-red-100 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Popup Content - Scrollable */}
            <div className="p-6 overflow-y-auto" style={{ height: 'calc(100% - 80px)' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedTemplate.variables.map((varName) => {
                  const varInfo = templatesData.variables[varName]
                  if (!varInfo) return null
                  
                  const currentValue = variables[varName] || ''
                  
                  // Color based on variable type
                  const getTypeColor = () => {
                    switch (varInfo.type) {
                      case 'email': return 'border-blue-300 focus:border-blue-500 focus:ring-blue-200'
                      case 'phone': return 'border-green-300 focus:border-green-500 focus:ring-green-200'
                      case 'date': return 'border-purple-300 focus:border-purple-500 focus:ring-purple-200'
                      case 'number': return 'border-orange-300 focus:border-orange-500 focus:ring-orange-200'
                      default: return 'border-gray-300 focus:border-gray-500 focus:ring-gray-200'
                    }
                  }
                  
                  return (
                    <div key={varName} className="bg-gradient-to-br from-white to-emerald-50 rounded-lg p-4 border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all duration-200">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-semibold text-gray-700 flex items-center">
                          <span className={`w-3 h-3 rounded-full mr-2 ${
                            varInfo.type === 'email' ? 'bg-blue-400' :
                            varInfo.type === 'phone' ? 'bg-green-400' :
                            varInfo.type === 'date' ? 'bg-purple-400' :
                            varInfo.type === 'number' ? 'bg-orange-400' :
                            'bg-gray-400'
                          }`}></span>
                          {varInfo.description[interfaceLanguage]}
                        </label>
                        
                        {/* Type badge */}
                        <Badge variant="outline" className={`text-xs font-medium ${
                          varInfo.type === 'email' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          varInfo.type === 'phone' ? 'bg-green-50 text-green-700 border-green-200' :
                          varInfo.type === 'date' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          varInfo.type === 'number' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          'bg-gray-50 text-gray-700 border-gray-200'
                        }`}>
                          {varInfo.type}
                        </Badge>
                      </div>
                      
                      {/* Input field */}
                      <Input
                        value={currentValue}
                        onChange={(e) => setVariables(prev => ({
                          ...prev,
                          [varName]: e.target.value
                        }))}
                        placeholder={varInfo.example}
                        className={`h-11 border-2 transition-all duration-200 input-rounded ${getTypeColor()}`}
                      />
                      
                      {/* Example and counter */}
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500">
                          Ex: {varInfo.example}
                        </span>
                        {varInfo.type === 'text' && currentValue.length > 20 && (
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                            {currentValue.length} characters
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* Footer info */}
              <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                <p className="text-sm text-emerald-800">
                  <span className="font-semibold">💡 Tip:</span> Changes are applied in real-time to your email.
                  You can resize this window by dragging the corners.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over AI panel */}
      {showAIPanel && (
        <div className="fixed inset-0 z-50" aria-modal="true" role="dialog">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAIPanel(false)} />
          <div className="absolute right-0 top-0 h-full w-[420px] bg-white shadow-2xl border-l border-gray-200 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-gray-700">Assistant IA</div>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowAIPanel(false)}>✕</button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <AISidebar emailText={finalBody} onResult={setFinalBody} variables={variables} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App