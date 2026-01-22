/* ============================================
   MAIN.JS - INICIALIZACIÓN DE LA APLICACIÓN
   Versión optimizada para iOS/Safari
   ============================================ */

/* ============================================
   UTILIDADES DE PERFORMANCE
   ============================================ */

/**
 * Throttle - Limita la frecuencia de ejecución de una función
 * @param {Function} func - Función a limitar
 * @param {number} limit - Milisegundos entre ejecuciones
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Debounce - Retrasa la ejecución hasta que paren las llamadas
 * @param {Function} func - Función a retrasar
 * @param {number} wait - Milisegundos de espera
 */
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/**
 * RequestAnimationFrame wrapper para actualizaciones visuales
 */
function rafUpdate(callback) {
    if (window.requestAnimationFrame) {
        window.requestAnimationFrame(callback);
    } else {
        callback();
    }
}

// Exportar utilidades globalmente
window.throttle = throttle;
window.debounce = debounce;
window.rafUpdate = rafUpdate;

/* ============================================
   LAZY LOADING PARA FLOURISH EMBEDS
   ============================================ */

/**
 * Inicializar lazy loading de Flourish con Intersection Observer
 */
function initFlourishLazyLoad() {
    // Verificar soporte de Intersection Observer
    if (!('IntersectionObserver' in window)) {
        console.log('IntersectionObserver no soportado, cargando Flourish inmediatamente');
        return;
    }
    
    const flourishEmbeds = document.querySelectorAll('.flourish-embed');
    
    if (flourishEmbeds.length === 0) return;
    
    const observerOptions = {
        root: null,
        rootMargin: '200px 0px', // Cargar 200px antes de que sea visible
        threshold: 0.01
    };
    
    const flourishObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const embed = entry.target;
                
                // Si ya tiene el script cargado, no hacer nada
                if (embed.dataset.loaded === 'true') {
                    observer.unobserve(embed);
                    return;
                }
                
                // Marcar como cargado
                embed.dataset.loaded = 'true';
                
                // El script de Flourish ya está en la página, 
                // solo necesitamos triggear la inicialización
                if (window.Flourish && window.Flourish.loadEmbed) {
                    window.Flourish.loadEmbed(embed);
                }
                
                observer.unobserve(embed);
                console.log('✅ Flourish embed cargado:', embed.dataset.src);
            }
        });
    }, observerOptions);
    
    flourishEmbeds.forEach(embed => {
        flourishObserver.observe(embed);
    });
    
    console.log('✅ Lazy loading de Flourish inicializado para', flourishEmbeds.length, 'embeds');
}

/* ============================================
   INICIALIZACIÓN PRINCIPAL
   ============================================ */

/**
 * Inicialización principal de la aplicación
 */
async function init() {
    console.log('🚀 Iniciando aplicación (optimizada para iOS)...');
    
    try {
        // Cargar datos principales
        await loadDataFromGoogleSheets();
        
        // Cargar datos del comparador
        await loadComparisonData();
        renderComparisonCards();
        
        // Cargar datos de factchecking
        await loadFactcheckingData();
        
        // Cargar y renderizar densidad discursiva
        await loadDensityData();
        initThemeSlider();
        populateDensityPartySelector();
        renderDensityBars();
        
        // Event listener para resize con THROTTLE (optimización iOS)
        const throttledResize = throttle(() => {
            rafUpdate(() => {
                updateSliderHandle();
                renderDensityBars();
            });
        }, 150); // Máximo 6-7 veces por segundo
        
        window.addEventListener('resize', throttledResize, { passive: true });
        
        // Atajo de teclado para refrescar datos (Ctrl+Shift+R)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'R') {
                e.preventDefault();
                console.log('⌨️ Atajo de teclado: Refrescando datos...');
                refreshAllData();
            }
        });
        
        // Inicializar lazy loading de Flourish
        initFlourishLazyLoad();
        
        console.log('✅ Aplicación inicializada correctamente');
        
    } catch (error) {
        console.error('❌ Error al inicializar la aplicación:', error);
    }
}

/**
 * Refrescar todos los datos
 */
async function refreshAllData() {
    try {
        console.log('🔄 Refrescando todos los datos...');
        
        await loadDataFromGoogleSheets();
        await loadComparisonData();
        renderComparisonCards();
        
        await loadDensityData();
        populateDensityPartySelector();
        renderDensityBars();
        
        console.log('✅ Todos los datos actualizados correctamente');
        
    } catch (error) {
        console.error('❌ Error al refrescar datos:', error);
    }
}

/* ============================================
   SOCIAL SHARING
   ============================================ */

/**
 * Inicializar social sharing
 */
function initSocialSharing() {
    document.querySelectorAll('.sharer').forEach(button => {
        button.addEventListener('click', shareUrl, { passive: true });
    });
}

/**
 * Compartir URL en redes sociales
 */
function shareUrl(event) {
    const button = event.target;
    const url = button.getAttribute('data-url');
    const sharer = button.getAttribute('data-sharer');
    let shareUrl = '';

    switch (sharer) {
        case 'facebook':
            const fbHashtag = button.getAttribute('data-hashtag') || '';
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&hashtag=${encodeURIComponent(fbHashtag)}`;
            break;
        case 'whatsapp':
            const whatsappTitle = button.getAttribute('data-title');
            shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappTitle + ' ' + url)}`;
            break;
        case 'twitter':
            const twitterTitle = button.getAttribute('data-title');
            const twitterHashtags = button.getAttribute('data-hashtags');
            const twitterVia = button.getAttribute('data-via');
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterTitle)}&url=${encodeURIComponent(url)}&hashtags=${twitterHashtags}&via=${twitterVia}`;
            break;
    }

    window.open(shareUrl, '_blank');
}

/* ============================================
   SCROLL CONTAINER (TARJETAS)
   ============================================ */

/**
 * Inicializar scroll container horizontal (tarjetas ¿Sabías que?)
 * Optimizado para iOS con passive events
 */
function initScrollContainer() {
    const slider = document.querySelector('.scroll-container');
    if (!slider) return;
    
    let isDown = false;
    let startX;
    let scrollLeft;

    // Mouse events
    slider.addEventListener('mousedown', (e) => {
        isDown = true;
        slider.classList.add('active');
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    }, { passive: true });

    slider.addEventListener('mouseleave', () => {
        isDown = false;
        slider.classList.remove('active');
    }, { passive: true });

    slider.addEventListener('mouseup', () => {
        isDown = false;
        slider.classList.remove('active');
    }, { passive: true });

    slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 2;
        slider.scrollLeft = scrollLeft - walk;
    });
    
    // Touch events optimizados para iOS
    slider.addEventListener('touchstart', (e) => {
        isDown = true;
        slider.classList.add('active');
        startX = e.touches[0].pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    }, { passive: true });
    
    slider.addEventListener('touchend', () => {
        isDown = false;
        slider.classList.remove('active');
    }, { passive: true });
    
    slider.addEventListener('touchcancel', () => {
        isDown = false;
        slider.classList.remove('active');
    }, { passive: true });
}

/* ============================================
   NAVEGACIÓN POR ANCLAS
   ============================================ */

/**
 * Inicializar navegación por anclas
 */
function initAnchorNavigation() {
    const anchorItems = document.querySelectorAll('ul.anclas li');
    
    const sections = [
        { element: anchorItems[0], target: '#box-main-candidatos' },
        { element: anchorItems[1], target: '#comparisonSection' },
        { element: anchorItems[2], target: '.box-main-panorama' }
    ];
    
    sections.forEach(function(section) {
        if (section.element) {
            section.element.addEventListener('click', function() {
                const targetElement = document.querySelector(section.target);
                
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    anchorItems.forEach(item => item.classList.remove('active'));
                    section.element.classList.add('active');
                }
            }, { passive: true });
        }
    });
}

/* ============================================
   BOTÓN FLOTANTE
   ============================================ */

/**
 * Inicializar botón flotante (Ver Hojas de Vida)
 * Optimizado con throttle para iOS
 */
function initFloatingButton() {
    const boton = document.querySelector('.btn-ver-hojas');
    const header = document.querySelector('.header');
    const footer = document.querySelector('.footer-section');

    if (!boton || !header || !footer) return;

    const offset = 50;
    
    // Cache de valores que no cambian frecuentemente
    let cachedFooterTop = footer.offsetTop;
    let cachedHeaderHeight = header.offsetHeight;
    
    // Actualizar cache en resize (con debounce)
    const updateCache = debounce(() => {
        cachedFooterTop = footer.offsetTop;
        cachedHeaderHeight = header.offsetHeight;
    }, 250);
    
    window.addEventListener('resize', updateCache, { passive: true });

    // Handler de scroll con throttle
    const handleScroll = throttle(() => {
        const scrollY = window.scrollY;
        const ventanaAlto = window.innerHeight;

        const muyArriba = scrollY < cachedHeaderHeight;
        const muyAbajo = (scrollY + ventanaAlto) > (cachedFooterTop - offset);

        rafUpdate(() => {
            if (muyArriba || muyAbajo) {
                boton.style.opacity = '0';
                boton.style.pointerEvents = 'none';
            } else {
                boton.style.opacity = '1';
                boton.style.pointerEvents = 'all';
            }
        });
    }, 100); // Máximo 10 veces por segundo

    window.addEventListener('scroll', handleScroll, { passive: true });
}

/* ============================================
   METODOLOGÍA
   ============================================ */

/**
 * Inicializar sección de metodología (expandible)
 */
function initMetodologia() {
    const botonLeerMas = document.querySelector('.mas-metodologia');
    const contenidoOculto = document.getElementById('detalle-oculto');

    if (!botonLeerMas || !contenidoOculto) return;

    botonLeerMas.addEventListener('click', function() {
        if (contenidoOculto.style.display === "none") {
            contenidoOculto.style.display = "block";
            botonLeerMas.innerText = "Ocultar detalle del método";
        } else {
            contenidoOculto.style.display = "none";
            botonLeerMas.innerText = "Conoce el detalle del método de análisis aquí";
        }
    }, { passive: true });

    // Link desde tarjetas del comparador
    document.addEventListener('click', function(e) {
        if (e.target.closest('.discourse-tone.ancla')) {
            e.preventDefault();
            
            if (contenidoOculto.style.display === "none") {
                contenidoOculto.style.display = "block";
                botonLeerMas.innerText = "Ocultar detalle del método";
            }
            
            const boxMetodologia = document.querySelector('.box-metodologia');
            if (boxMetodologia) {
                boxMetodologia.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
}

/* ============================================
   ACORDEÓN DE CONCEPTOS
   ============================================ */

/**
 * Toggle para acordeón de conceptos
 */
function toggleConceptosAccordion(accordionId) {
    const accordion = document.getElementById(accordionId);
    if (!accordion) return;
    
    const isOpen = accordion.classList.contains('open');
    
    if (isOpen) {
        accordion.classList.remove('open');
    } else {
        accordion.classList.add('open');
    }
}

// Exportar función global
window.toggleConceptosAccordion = toggleConceptosAccordion;

/* ============================================
   DOM CONTENT LOADED
   ============================================ */

/**
 * DOM Content Loaded - Inicializar componentes UI
 */
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar componentes UI
    initSocialSharing();
    initScrollContainer();
    initAnchorNavigation();
    initFloatingButton();
    initMetodologia();
    
    // Cerrar autocomplete al hacer click fuera
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.factchecking-search-box')) {
            if (typeof hideFactcheckingAutocomplete === 'function') {
                hideFactcheckingAutocomplete();
            }
        }
    }, { passive: true });
});

/* ============================================
   WINDOW ONLOAD
   ============================================ */

/**
 * Window onload - Inicializar datos
 */
window.onload = init;

// Exportar funciones globales
window.refreshAllData = refreshAllData;
window.shareUrl = shareUrl;
window.initFlourishLazyLoad = initFlourishLazyLoad;