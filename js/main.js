/* ============================================
   MAIN.JS - INICIALIZACIÓN DE LA APLICACIÓN
   ============================================ */

/**
 * Inicialización principal de la aplicación
 */
async function init() {
    console.log('🚀 Iniciando aplicación...');
    
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
        
        // Event listener para resize (actualizar slider y densidad)
        window.addEventListener('resize', () => {
            updateSliderHandle();
            renderDensityBars();
        });
        
        // Atajo de teclado para refrescar datos (Ctrl+Shift+R)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'R') {
                e.preventDefault();
                console.log('⌨️ Atajo de teclado: Refrescando datos...');
                refreshAllData();
            }
        });
        
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
 * Inicializar scroll container horizontal (tarjetas ¿Sabías que?)
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
            });
        }
    });
}

/**
 * Inicializar botón flotante (Ver Hojas de Vida)
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
    });

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
            hideFactcheckingAutocomplete();
        }
    });
});

/**
 * Window onload - Inicializar datos
 */
window.onload = init;

// Exportar funciones globales
window.refreshAllData = refreshAllData;
window.shareUrl = shareUrl;
