// src/i18n/translations.js
export const translations = {
  en: {
    // Header
    header: {
      subtitle: 'Choose your favourite streamer build and generate trade links instantly'
    },

    // Currency Converter
    currency: {
      economyStatus: 'Economy Status',
      showing: 'Showing',
      of: 'of',
      paused: 'Paused'
    },

    // Build Form
    buildForm: {
      game: 'Game',
      league: 'League',
      leagueLoading: 'loading...',
      pobCodeLabel: 'PoB Code or URL',
      pobPlaceholder: `Paste your PoB code (base64) or a pobb.in URL here

Examples:
• Raw PoB code: eNrtXW1z27gR_u7...
• pobb.in URL: https://pobb.in/VVZy6u-NrRUi`,
      analyzeButton: 'Analyze Build',
      analyzing: 'Analyzing...'
    },

    // Item List
    itemList: {
      itemsFound: 'Items Found',
      league: 'League',
      status: 'Status'
    },

    // Item Card
    itemCard: {
      editFilters: 'Edit filters',
      copyUrl: 'Copy URL',
      searchInTrade: 'Search in Trade',
      enchants: 'Enchants',
      implicitMods: 'Implicit Mods',
      explicitMods: 'Explicit Mods',
      showAll: 'Show all',
      showLess: 'Show less',
      corrupted: 'Corrupted',
      allocates: 'ALLOCATES',
      rune: 'RUNE',
      enchant: 'ENCHANT',
      implicit: 'IMPLICIT',
      fractured: 'FRACTURED'
    },

    // Edit Modal
    editModal: {
      itemLevel: 'Item Level (minimum)',
      rarity: 'Rarity',
      enchantsSelected: 'selected',
      implicitsSelected: 'selected',
      explicitsSelected: 'selected',
      minPlaceholder: 'Min',
      maxPlaceholder: 'Max',
      saveChanges: 'Save Changes',
      cancel: 'Cancel'
    },

    // Report Modal
    reportModal: {
      title: 'Report an Issue',
      subtitle: 'How can we help improve PoE Build Analyzer?',
      bugReportTitle: 'Report a Bug',
      bugReportDesc: 'Something not working? Let us know about technical issues, errors, or broken features.',
      featureRequestTitle: 'Request a Feature',
      featureRequestDesc: 'Have an idea? Suggest new features or improvements (opens GitHub Issues).',
      availableIn: 'Available in',
      describeBug: 'Describe the bug',
      bugPlaceholder: 'What happened? What did you expect to happen? Include steps to reproduce if possible...',
      minimumChars: 'Minimum 10 characters',
      emailLabel: 'Email (optional)',
      emailPlaceholder: 'your.email@example.com',
      emailHelp: 'Optional - if you want us to follow up with you',
      screenshotLabel: 'Screenshot (optional)',
      screenshotUpload: 'Click to upload or press Ctrl+V to paste',
      screenshotTip: '💡 Tip: Take a screenshot (Win+Shift+S or Snipping Tool) and paste it here',
      screenshotHelp: 'Helps us understand the issue better',
      autoCapture: 'Auto-captured info:',
      autoCaptureDesc: 'Browser version, current game',
      autoCaptureSuffix: 'and page URL will be included in the report.',
      back: 'Back',
      submitReport: 'Submit Report',
      sending: 'Sending...',
      reportIssue: 'Report Issue',
      successMessage: 'Report submitted successfully!',
      errorMessage: 'Failed to submit report',
      networkError: 'Network error. Please try again.',
      waitMessage: 'Please wait',
      beforeSubmitting: 'before submitting another',
      bugReport: 'bug report',
      featureRequest: 'feature request',
      invalidSubmission: 'Invalid submission detected',
      minLengthError: 'Please provide at least 10 characters',
      imageTooLarge: 'Image must be smaller than 5MB',
      imageTypeError: 'Please select an image file',
      screenshotPasted: 'Screenshot pasted successfully!',
      removeScreenshot: 'Remove screenshot'
    },

    // Footer
    footer: {
      aboutTitle: 'About',
      aboutText1: 'PoE Build Analyzer automates item searches from your Path of Building builds. Paste your PoB code or pobb.in URL, and instantly generate trade searches for all your items with customizable filters.',
      aboutText2: 'The application is still under development and subject to change.',
      resourcesTitle: 'Resources',
      userGuide: 'User Guide & FAQ',
      userGuideDesc: 'Learn how to use all features, troubleshoot issues, and get pro tips for efficient item searching.',
      feature1: 'Supports PoB codes & pobb.in URLs',
      feature2: 'Real-time currency prices',
      feature3: 'Customizable search filters',
      quickLinksTitle: 'Quick Links',
      disclaimer: 'This site is fan-made and not affiliated with Grinding Gear Games in any way.'
    },

    // User Guide Modal
    userGuide: {
      title: 'User Guide & FAQ',
      close: 'Close',
      gettingStarted: 'Getting Started',
      step1Title: 'Copy Your Build',
      step1Desc: 'Open Path of Building and click "Generate" to copy your build code, or use a pobb.in URL',
      step2Title: 'Paste & Analyze',
      step2Desc: 'Paste the code in the text area above and click "Analyze Build"',
      step3Title: 'Browse & Trade',
      step3Desc: 'View all your items with their mods, edit filters, and search on trade with one click',
      featuresTitle: 'Features',
      feature1Title: 'Smart Mod Detection',
      feature1Desc: 'Automatically extracts and matches item mods from PoB',
      feature2Title: 'Custom Filters',
      feature2Desc: 'Edit search filters, select specific mods, and set min/max values',
      feature3Title: 'Direct Trade Links',
      feature3Desc: 'One-click search on official trade site with all your filters applied',
      feature4Title: 'Currency Prices',
      feature4Desc: 'Real-time currency exchange rates from poe2scout and poe.ninja',
      faqTitle: 'FAQ',
      faq1Question: 'Why are some mods missing?',
      faq1Answer: "The PoE trade API doesn't index all possible mods. The tool shows the most common and valuable mods (typically 3-7 per item).",
      faq2Question: 'Can I edit the search filters?',
      faq2Answer: 'Yes! Click the pencil icon on any item to customize which mods to search for and their value ranges.',
      faq3Question: 'Does this work for both PoE1 and PoE2?',
      faq3Answer: 'Yes! Select your game version at the top, and the app will use the correct APIs and leagues.',
      faq4Question: 'How often are currency prices updated?',
      faq4Answer: 'Currency prices are cached for 5 minutes and fetched from live APIs (poe2scout for PoE2, poe.ninja for PoE1).',
      troubleshootingTitle: 'Troubleshooting',
      trouble1Title: '"Invalid PoB code" error',
      trouble1Desc: 'Make sure you copied the entire code or URL correctly. pobb.in URLs must start with https://',
      trouble2Title: 'No items showing',
      trouble2Desc: 'Check that your build has equipped items. The tool only analyzes equipped gear, not stash items.',
      trouble3Title: 'Trade search finds no results',
      trouble3Desc: 'Try editing the item filters to be less restrictive, or search for a lower item level.'
    },

    // Language Selector
    language: {
      title: 'Language',
      english: 'English',
      spanish: 'Español',
      changeLanguage: 'Change Language'
    }
  },

  es: {
    // Header
    header: {
      subtitle: 'Elige la build de tu streamer favorito y genera enlaces de trade al instante'
    },

    // Currency Converter
    currency: {
      economyStatus: 'Estado de la Economía',
      showing: 'Mostrando',
      of: 'de',
      paused: 'Pausado'
    },

    // Build Form
    buildForm: {
      game: 'Juego',
      league: 'Liga',
      leagueLoading: 'cargando...',
      pobCodeLabel: 'Código PoB o URL',
      pobPlaceholder: `Pega tu código PoB (base64) o URL de pobb.in aquí

Ejemplos:
• Código PoB: eNrtXW1z27gR_u7...
• URL pobb.in: https://pobb.in/VVZy6u-NrRUi`,
      analyzeButton: 'Analizar Build',
      analyzing: 'Analizando...'
    },

    // Item List
    itemList: {
      itemsFound: 'Objetos Encontrados',
      league: 'Liga',
      status: 'Estado'
    },

    // Item Card
    itemCard: {
      editFilters: 'Editar filtros',
      copyUrl: 'Copiar URL',
      searchInTrade: 'Buscar en Trade',
      enchants: 'Encantamientos',
      implicitMods: 'Mods Implícitos',
      explicitMods: 'Mods Explícitos',
      showAll: 'Mostrar todo',
      showLess: 'Mostrar menos',
      corrupted: 'Corrupto',
      allocates: 'ASIGNA',
      rune: 'RUNA',
      enchant: 'ENCANTAMIENTO',
      implicit: 'IMPLÍCITO',
      fractured: 'FRACTURADO'
    },

    // Edit Modal
    editModal: {
      itemLevel: 'Nivel de Objeto (mínimo)',
      rarity: 'Rareza',
      enchantsSelected: 'seleccionados',
      implicitsSelected: 'seleccionados',
      explicitsSelected: 'seleccionados',
      minPlaceholder: 'Mín',
      maxPlaceholder: 'Máx',
      saveChanges: 'Guardar Cambios',
      cancel: 'Cancelar'
    },

    // Report Modal
    reportModal: {
      title: 'Reportar un Problema',
      subtitle: '¿Cómo podemos ayudar a mejorar PoE Build Analyzer?',
      bugReportTitle: 'Reportar un Bug',
      bugReportDesc: '¿Algo no funciona? Cuéntanos sobre problemas técnicos, errores o funciones rotas.',
      featureRequestTitle: 'Solicitar una Función',
      featureRequestDesc: '¿Tienes una idea? Sugiere nuevas funciones o mejoras (abre GitHub Issues).',
      availableIn: 'Disponible en',
      describeBug: 'Describe el bug',
      bugPlaceholder: '¿Qué pasó? ¿Qué esperabas que pasara? Incluye pasos para reproducir si es posible...',
      minimumChars: 'Mínimo 10 caracteres',
      emailLabel: 'Email (opcional)',
      emailPlaceholder: 'tu.email@ejemplo.com',
      emailHelp: 'Opcional - si quieres que te contactemos',
      screenshotLabel: 'Captura de Pantalla (opcional)',
      screenshotUpload: 'Haz clic para subir o presiona Ctrl+V para pegar',
      screenshotTip: '💡 Consejo: Toma una captura (Win+Shift+S o Recortes) y pégala aquí',
      screenshotHelp: 'Nos ayuda a entender mejor el problema',
      autoCapture: 'Info auto-capturada:',
      autoCaptureDesc: 'Versión del navegador, juego actual',
      autoCaptureSuffix: 'y URL de la página se incluirán en el reporte.',
      back: 'Atrás',
      submitReport: 'Enviar Reporte',
      sending: 'Enviando...',
      reportIssue: 'Reportar Problema',
      successMessage: '¡Reporte enviado exitosamente!',
      errorMessage: 'Error al enviar el reporte',
      networkError: 'Error de red. Por favor intenta de nuevo.',
      waitMessage: 'Por favor espera',
      beforeSubmitting: 'antes de enviar otro',
      bugReport: 'reporte de bug',
      featureRequest: 'solicitud de función',
      invalidSubmission: 'Envío inválido detectado',
      minLengthError: 'Por favor proporciona al menos 10 caracteres',
      imageTooLarge: 'La imagen debe ser menor a 5MB',
      imageTypeError: 'Por favor selecciona un archivo de imagen',
      screenshotPasted: '¡Captura pegada exitosamente!',
      removeScreenshot: 'Eliminar captura'
    },

    // Footer
    footer: {
      aboutTitle: 'Acerca de',
      aboutText1: 'PoE Build Analyzer automatiza las búsquedas de objetos desde tus builds de Path of Building. Pega tu código PoB o URL de pobb.in, y genera instantáneamente búsquedas de trade para todos tus objetos con filtros personalizables.',
      aboutText2: 'La aplicación aún está en desarrollo y sujeta a cambios.',
      resourcesTitle: 'Recursos',
      userGuide: 'Guía de Usuario y FAQ',
      userGuideDesc: 'Aprende a usar todas las funciones, resolver problemas y obtener consejos para búsquedas eficientes.',
      feature1: 'Soporta códigos PoB y URLs de pobb.in',
      feature2: 'Precios de moneda en tiempo real',
      feature3: 'Filtros de búsqueda personalizables',
      quickLinksTitle: 'Enlaces Rápidos',
      disclaimer: 'Este sitio esta hecho por fans y no está afiliado con Grinding Gear Games de ninguna manera.'
    },

    // User Guide Modal
    userGuide: {
      title: 'Guía de Usuario y FAQ',
      close: 'Cerrar',
      gettingStarted: 'Comenzando',
      step1Title: 'Copia tu Build',
      step1Desc: 'Abre Path of Building y haz clic en "Generate" para copiar el código de tu build, o usa una URL de pobb.in',
      step2Title: 'Pegar y Analizar',
      step2Desc: 'Pega el código en el área de texto arriba y haz clic en "Analizar Build"',
      step3Title: 'Explorar y Tradear',
      step3Desc: 'Ve todos tus objetos con sus mods, edita filtros y busca en trade con un clic',
      featuresTitle: 'Características',
      feature1Title: 'Detección Inteligente de Mods',
      feature1Desc: 'Extrae y empareja automáticamente los mods de objetos desde PoB',
      feature2Title: 'Filtros Personalizados',
      feature2Desc: 'Edita filtros de búsqueda, selecciona mods específicos y establece valores mín/máx',
      feature3Title: 'Enlaces Directos a Trade',
      feature3Desc: 'Búsqueda con un clic en el sitio oficial de trade con todos tus filtros aplicados',
      feature4Title: 'Precios de Moneda',
      feature4Desc: 'Tasas de cambio de moneda en tiempo real desde poe2scout y poe.ninja',
      faqTitle: 'Preguntas Frecuentes',
      faq1Question: '¿Por qué faltan algunos mods?',
      faq1Answer: 'La API de trade de PoE no indexa todos los mods posibles. La herramienta muestra los mods más comunes y valiosos (típicamente 3-7 por objeto).',
      faq2Question: '¿Puedo editar los filtros de búsqueda?',
      faq2Answer: '¡Sí! Haz clic en el ícono del lápiz en cualquier objeto para personalizar qué mods buscar y sus rangos de valores.',
      faq3Question: '¿Funciona para PoE1 y PoE2?',
      faq3Answer: '¡Sí! Selecciona tu versión del juego en la parte superior, y la app usará las APIs y ligas correctas.',
      faq4Question: '¿Con qué frecuencia se actualizan los precios?',
      faq4Answer: 'Los precios se almacenan en caché por 5 minutos y se obtienen de APIs en vivo (poe2scout para PoE2, poe.ninja para PoE1).',
      troubleshootingTitle: 'Solución de Problemas',
      trouble1Title: 'Error "Código PoB inválido"',
      trouble1Desc: 'Asegúrate de haber copiado el código o URL completo correctamente. Las URLs de pobb.in deben comenzar con https://',
      trouble2Title: 'No se muestran objetos',
      trouble2Desc: 'Verifica que tu build tenga objetos equipados. La herramienta solo analiza equipo equipado, no objetos del stash.',
      trouble3Title: 'La búsqueda no encuentra resultados',
      trouble3Desc: 'Intenta editar los filtros del objeto para ser menos restrictivo, o busca un nivel de objeto más bajo.'
    },

    // Language Selector
    language: {
      title: 'Idioma',
      english: 'English',
      spanish: 'Español',
      changeLanguage: 'Cambiar Idioma'
    }
  }
};
