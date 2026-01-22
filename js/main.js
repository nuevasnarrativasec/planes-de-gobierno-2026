/* ============================================
   MAIN.JS - INICIALIZACION DE LA APLICACION
   ============================================ */

/**
 * Verificar que todas las dependencias esten cargadas
 */
function checkDependencies() {
    const deps = {
        'CONFIG': typeof CONFIG !== 'undefined',
        'loadDataFromGoogleSheets': typeof window.loadDataFromGoogleSheets === 'function',
        'loadComparisonData': typeof window.loadComparisonData === 'function',
        'loadFactcheckingData': typeof window.loadFactcheckingData === 'function',
        'loadDensityData': typeof window.loadDensityData === 'function',
        'parseCSV': typeof window.parseCSV === 'function'
    };
    
    const missing = Object.entries(deps).filter(([name, loaded]) => !loaded).map(([name]) => name);
    
    if (missing.length > 0) {
        console.log('Dependencias faltantes:', missing.join(', '));
        return false;
    }
    
    return true;
}

/**
 * Inicializacion principal de la aplicacion
 */
async function initApp() {
    console.log('Iniciando aplicacion...');
    
    try {
        // Cargar datos principales
        await window.loadDataFromGoogleSheets();
        
        // Cargar datos del comparador
        await window.loadComparisonData();
        window.renderComparisonCards();
        
        // Cargar datos de factchecking
        await window.loadFactcheckingData();
        
        // Cargar y renderizar densidad discursiva
        await window.loadDensityData();
        window.initThemeSlider();
        window.populateDensityPartySelector();
        window.renderDensityBars();
        
        // Event listener para resize (actualizar slider y densidad)
        window.addEventListener('resize', () => {
            if (typeof window.updateSliderHandle === 'function') {
                window.updateSliderHandle();
            }
            if (typeof window.renderDensityBars === 'function') {
                window.renderDensityBars();
            }
        });
        
        // Atajo de teclado para refrescar datos (Ctrl+Shift+R)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'R') {
                e.preventDefault();
                console.log('Atajo de teclado: Refrescando datos...');
                refreshAllData();
            }
        });
        
        console.log('Aplicacion inicializada correctamente');
        
    } catch (error) {
        console.error('Error al inicializar la aplicacion:', error);
    }
}

/**
 * Refrescar todos los datos
 */
async function refreshAllData() {
    try {
        console.log('Refrescando todos los datos...');
        
        await window.loadDataFromGoogleSheets();
        await window.loadComparisonData();
        window.renderComparisonCards();
        
        await window.loadDensityData();
        window.populateDensityPartySelector();
        window.renderDensityBars();
        
        console.log('Todos los datos actualizados correctamente');
        
    } catch (error) {
        console.error('Error al refrescar datos:', error);
    }
}

/**
 * Inicializar social sharing
 */
function initSocialSharing() {
    document.querySelectorAll('.sharer').forEach(button => {
        button.addEventListener('click', shareUrl);
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

/**
 * Inicializar scroll container horizontal (tarjetas Sabias que?)
 */
function initScrollContainer() {
    const slider = document.querySelector('.scroll-container');
    if (!slider) return;
    
    let isDown = false;
    let startX;
    let scrollLeft;

    slider.addEventListener('mousedown', (e) => {
        isDown = true;
        slider.classList.add('active');
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    });

    slider.addEventListener('mouseleave', () => {
        isDown = false;
        slider.classList.remove('active');
    });

    slider.addEventListener('mouseup', () => {
        isDown = false;
        slider.classList.remove('active');
    });

    slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 2;
        slider.scrollLeft = scrollLeft - walk;
    });
}

/**
 * Inicializar navegacion por anclas
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
            });
        }
    });
}

/**
 * Inicializar boton flotante (Ver Hojas de Vida)
 */
function initFloatingButton() {
    const boton = document.querySelector('.btn-ver-hojas');
    const header = document.querySelector('.header');
    const footer = document.querySelector('.footer-section');

    if (!boton || !header || !footer) return;

    const offset = 50;

    window.addEventListener('scroll', function() {
        const scrollY = window.scrollY;
        const ventanaAlto = window.innerHeight;
        const alturaHeader = header.offsetHeight;
        const inicioFooter = footer.offsetTop;

        const muyArriba = scrollY < alturaHeader;
        const muyAbajo = (scrollY + ventanaAlto) > (inicioFooter - offset);

        if (muyArriba || muyAbajo) {
            boton.style.opacity = '0';
            boton.style.pointerEvents = 'none';
        } else {
            boton.style.opacity = '1';
            boton.style.pointerEvents = 'all';
        }
    });
}

/**
 * Inicializar seccion de metodologia (expandible)
 */
function initMetodologia() {
    const botonLeerMas = document.querySelector('.mas-metodologia');
    const contenidoOculto = document.getElementById('detalle-oculto');

    if (!botonLeerMas || !contenidoOculto) return;

    botonLeerMas.addEventListener('click', function() {
        if (contenidoOculto.style.display === "none") {
            contenidoOculto.style.display = "block";
            botonLeerMas.innerText = "Ocultar detalle del metodo";
        } else {
            contenidoOculto.style.display = "none";
            botonLeerMas.innerText = "Conoce el detalle del metodo de analisis aqui";
        }
    });

    // Link desde tarjetas del comparador
    document.addEventListener('click', function(e) {
        if (e.target.closest('.discourse-tone.ancla')) {
            e.preventDefault();
            
            if (contenidoOculto.style.display === "none") {
                contenidoOculto.style.display = "block";
                botonLeerMas.innerText = "Ocultar detalle del metodo";
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

/**
 * Toggle para acordeon de conceptos
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

// Exportar funcion global
window.toggleConceptosAccordion = toggleConceptosAccordion;

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
            if (typeof window.hideFactcheckingAutocomplete === 'function') {
                window.hideFactcheckingAutocomplete();
            }
        }
    });
});

/**
 * Inicializacion robusta con retry
 */
function robustInit(retries = 10, delay = 300) {
    if (window._appInitialized) {
        console.log('App ya inicializada, ignorando...');
        return;
    }
    
    if (checkDependencies()) {
        console.log('Dependencias verificadas, iniciando...');
        window._appInitialized = true;
        initApp();
    } else if (retries > 0) {
        console.log('Esperando dependencias... (intentos restantes: ' + retries + ')');
        setTimeout(() => robustInit(retries - 1, delay), delay);
    } else {
        console.error('No se pudieron cargar las dependencias despues de varios intentos');
        // Mostrar que scripts estan cargados para debug
        console.log('Scripts disponibles:', {
            CONFIG: typeof CONFIG,
            loadDataFromGoogleSheets: typeof window.loadDataFromGoogleSheets,
            loadComparisonData: typeof window.loadComparisonData,
            loadFactcheckingData: typeof window.loadFactcheckingData,
            loadDensityData: typeof window.loadDensityData
        });
    }
}

/**
 * Iniciar cuando el DOM este listo
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(robustInit, 200);
    });
} else {
    setTimeout(robustInit, 200);
}

// Respaldo con window.onload
window.addEventListener('load', function() {
    if (!window._appInitialized) {
        console.log('Inicializacion por window.load...');
        setTimeout(robustInit, 100);
    }
});

// Exportar funciones globales
window.refreshAllData = refreshAllData;
window.shareUrl = shareUrl;
window.forceReload = function() {
    window._appInitialized = false;
    robustInit(5, 100);
};