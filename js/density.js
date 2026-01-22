/* ============================================
   DENSIDAD DISCURSIVA
   ============================================ */

// Variables globales
let selectedThemeIndex = 15; // Por defecto: TRANSPORTE
let densityFilteredParty = '';
let densityData = {};
let isSliderDragging = false;

/**
 * Cargar datos de densidad desde JSON
 */
async function loadDensityData() {
    try {
        const fetchFn = window.fetchWithRetry || fetch;
        const response = await fetchFn(CONFIG.DENSITY_DATA_URL);
        if (!response.ok) {
            throw new Error('Error al cargar datos de densidad');
        }
        const data = await response.json();
        
        densityData = {};
        data.partidos.forEach(partido => {
            densityData[partido.id] = {
                partido: partido.nombre,
                logoUrl: partido.logoUrl || '',
                temas: partido.densidad
            };
        });
        
        console.log('Datos de densidad cargados:', Object.keys(densityData).length, 'partidos');
        return densityData;
    } catch (error) {
        console.error('Error cargando datos de densidad:', error);
        // Datos de ejemplo si falla
        densityData = {
            "1": {
                partido: "Partido Ejemplo",
                logoUrl: "",
                temas: { educacion: 15, salud: 25, economia: 20 }
            }
        };
        return densityData;
    }
}

/**
 * Inicializar theme slider
 */
function initThemeSlider() {
    const segmentsContainer = document.getElementById('themeSegments');
    const labelsContainer = document.getElementById('themeLabels');
    const slider = document.getElementById('themeSlider');
    const handle = document.getElementById('sliderHandle');
    
    if (!segmentsContainer || !labelsContainer || !slider || !handle) {
        console.error('Elementos del slider no encontrados');
        return;
    }
    
    // Aplicar estilos criticos
    slider.style.position = 'relative';
    slider.style.touchAction = 'none';
    
    handle.style.position = 'absolute';
    handle.style.cursor = 'grab';
    handle.style.touchAction = 'none';
    handle.style.userSelect = 'none';
    handle.style.zIndex = '100';
    
    // Crear segmentos
    segmentsContainer.innerHTML = THEMES.map((theme, index) => `
        <div class="theme-segment theme-${theme.id} ${index === selectedThemeIndex ? 'active' : ''}" 
            data-index="${index}">
        </div>
    `).join('');
    
    // Crear labels
    labelsContainer.innerHTML = THEMES.map((theme, index) => `
        <div class="theme-label-item ${index === selectedThemeIndex ? 'active' : ''}" 
            data-index="${index}">
            ${theme.name}
        </div>
    `).join('');

    // Posicionar labels
    const totalThemes = THEMES.length;
    const labelItems = labelsContainer.querySelectorAll('.theme-label-item');
    labelItems.forEach((label, index) => {
        const centerPosition = (100 / totalThemes) * (index + 0.1);
        label.style.left = `${centerPosition}%`;
    });
    
    setTimeout(() => updateSliderHandle(), 100);
    
    // Eventos de click en segmentos
    document.querySelectorAll('.theme-segment').forEach((segment, index) => {
        segment.addEventListener('click', (e) => {
            if (!isSliderDragging) {
                selectTheme(index);
            }
        });
    });
    
    // Eventos de drag - Mouse
    handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        startSliderDrag();
        updateSliderFromPosition(e.clientX);
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isSliderDragging) return;
        e.preventDefault();
        updateSliderFromPosition(e.clientX);
    });
    
    document.addEventListener('mouseup', () => {
        if (isSliderDragging) stopSliderDrag();
    });
    
    // Eventos de drag - Touch
    handle.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        startSliderDrag();
        const touch = e.touches[0];
        updateSliderFromPosition(touch.clientX);
    }, { passive: false });
    
    document.addEventListener('touchmove', (e) => {
        if (!isSliderDragging) return;
        e.preventDefault();
        const touch = e.touches[0];
        updateSliderFromPosition(touch.clientX);
    }, { passive: false });
    
    document.addEventListener('touchend', () => {
        if (isSliderDragging) stopSliderDrag();
    });
    
    document.addEventListener('touchcancel', () => {
        if (isSliderDragging) stopSliderDrag();
    });
    
    // Click en la barra del slider
    slider.addEventListener('click', (e) => {
        if (e.target === handle || e.target.closest('#sliderHandle') || isSliderDragging) {
            return;
        }
        updateSliderFromPosition(e.clientX);
    });
    
    console.log('Theme slider inicializado');
}

/**
 * Iniciar drag del slider
 */
function startSliderDrag() {
    isSliderDragging = true;
    const handle = document.getElementById('sliderHandle');
    if (handle) {
        handle.classList.add('dragging');
        handle.style.transition = 'none';
        handle.style.cursor = 'grabbing';
    }
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
}

/**
 * Detener drag del slider
 */
function stopSliderDrag() {
    isSliderDragging = false;
    const handle = document.getElementById('sliderHandle');
    if (handle) {
        handle.classList.remove('dragging');
        handle.style.transition = 'left 0.2s ease-out';
        handle.style.cursor = 'grab';
        handle.style.removeProperty('transform');
    }
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    
    updateSliderHandle();
}

/**
 * Actualizar slider desde posicion
 */
function updateSliderFromPosition(clientX) {
    const slider = document.getElementById('themeSlider');
    const handle = document.getElementById('sliderHandle');
    if (!slider || !handle) return;
    
    const sliderRect = slider.getBoundingClientRect();
    const handleRect = handle.getBoundingClientRect();
    const handleWidth = handleRect.width || 40;
    
    const x = clientX - sliderRect.left;
    const clampedX = Math.max(0, Math.min(x, sliderRect.width));
    
    if (isSliderDragging) {
        handle.style.transition = 'none';
        const leftPos = clampedX - (handleWidth / 2);
        handle.style.setProperty('left', `${leftPos}px`, 'important');
        handle.style.setProperty('transform', 'none', 'important');
    }
    
    const percentage = clampedX / sliderRect.width;
    const newIndex = Math.round(percentage * (THEMES.length - 1));
    
    if (newIndex !== selectedThemeIndex && newIndex >= 0 && newIndex < THEMES.length) {
        selectedThemeIndex = newIndex;
        
        document.querySelectorAll('.theme-segment').forEach((seg, i) => {
            seg.classList.toggle('active', i === newIndex);
            seg.classList.toggle('dimmed', i !== newIndex);
        });
        
        document.querySelectorAll('.theme-label-item').forEach((label, i) => {
            label.classList.toggle('active', i === newIndex);
        });
        
        renderDensityBars();
    }
}

/**
 * Seleccionar tema
 */
function selectTheme(index) {
    if (index < 0 || index >= THEMES.length) return;
    
    selectedThemeIndex = index;
    
    document.querySelectorAll('.theme-segment').forEach((seg, i) => {
        seg.classList.toggle('active', i === index);
        seg.classList.toggle('dimmed', i !== index);
    });
    
    document.querySelectorAll('.theme-label-item').forEach((label, i) => {
        label.classList.toggle('active', i === index);
    });
    
    const handle = document.getElementById('sliderHandle');
    if (handle) {
        handle.style.transition = 'left 0.2s ease-out';
    }
    
    updateSliderHandle();
    renderDensityBars();
}

/**
 * Actualizar posicion del handle
 */
function updateSliderHandle() {
    const slider = document.getElementById('themeSlider');
    const handle = document.getElementById('sliderHandle');
    const segments = document.querySelectorAll('.theme-segment');
    
    if (!slider || !handle || segments.length === 0) return;
    
    const activeSegment = segments[selectedThemeIndex];
    if (!activeSegment) return;
    
    const segmentRect = activeSegment.getBoundingClientRect();
    const sliderRect = slider.getBoundingClientRect();
    const handleRect = handle.getBoundingClientRect();
    const handleWidth = handleRect.width || 40;
    
    const segmentCenter = segmentRect.left - sliderRect.left + (segmentRect.width / 2);
    const leftPos = segmentCenter - (handleWidth / 2);
    
    if (!isSliderDragging) {
        handle.style.transition = 'left 0.2s ease-out';
    }
    
    handle.style.removeProperty('transform');
    handle.style.setProperty('left', `${leftPos}px`, 'important');
}

/**
 * Renderizar barras de densidad
 */
function renderDensityBars() {
    const container = document.getElementById('partyDensityList');
    if (!container) return;
    
    const selectedTheme = THEMES[selectedThemeIndex].id;
    const isMobile = window.innerWidth <= 768;
    
    let partidosToShow = Object.keys(densityData);
    if (densityFilteredParty) {
        partidosToShow = partidosToShow.filter(id => id == densityFilteredParty);
    }
    
    if (isMobile) {
        container.className = 'party-list mobile-view';
        container.innerHTML = partidosToShow.map(partidoId => {
            const partido = densityData[partidoId];
            const highlightClass = densityFilteredParty == partidoId ? 'highlighted' : '';
            const selectedPercentage = partido.temas[selectedTheme] || 0;
            
            const logoHTML = partido.logoUrl 
                ? `<img src="${partido.logoUrl}" alt="${partido.partido}" onerror="this.style.display='none';">` 
                : '🎈';
            
            const totalPercentage = THEMES.reduce((sum, theme) => {
                return sum + (partido.temas[theme.id] || 0);
            }, 0);
            
            const segmentsHTML = THEMES.map((theme, themeIndex) => {
                const originalPercentage = partido.temas[theme.id] || 0;
                const normalizedPercentage = totalPercentage > 0 
                    ? (originalPercentage / totalPercentage) * 100 
                    : 0;
                const isSelected = theme.id === selectedTheme;
                const dimmedClass = selectedTheme ? (isSelected ? 'highlighted' : 'dimmed') : '';
                
                return `
                    <div class="density-segment theme-${theme.id} ${dimmedClass}" 
                        style="width: ${normalizedPercentage}%"
                        data-theme="${theme.id}"
                        onclick="selectThemeFromBar(${themeIndex})">
                        <div class="density-tooltip">${theme.name}: ${originalPercentage}%</div>
                    </div>
                `;
            }).join('');
            
            return `
                <div class="party-complete-item ${highlightClass}">
                    <div class="party-complete-header">
                        <div class="party-density-icon">${logoHTML}</div>
                        <div class="party-density-name">${partido.partido}</div>
                    </div>
                    <div class="party-complete-bar">
                        <div class="party-density-bar-container">
                            <div class="party-density-bar">${segmentsHTML}</div>
                        </div>
                        <div class="selected-theme-badge">${THEMES[selectedThemeIndex].name}: ${selectedPercentage}%</div>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        container.className = 'party-list';
        
        const namesHTML = partidosToShow.map(partidoId => {
            const partido = densityData[partidoId];
            const logoHTML = partido.logoUrl 
                ? `<img src="${partido.logoUrl}" alt="${partido.partido}" onerror="this.style.display='none';">` 
                : '🎈';
            const highlightClass = densityFilteredParty == partidoId ? 'highlighted' : '';
            
            return `
                <div class="party-name-item ${highlightClass}">
                    <div class="party-density-item">
                        <div class="party-density-icon">${logoHTML}</div>
                        <div class="party-density-name">${partido.partido}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        const barsHTML = partidosToShow.map(partidoId => {
            const partido = densityData[partidoId];
            const highlightClass = densityFilteredParty == partidoId ? 'highlighted' : '';
            const selectedPercentage = partido.temas[selectedTheme] || 0;
            
            const totalPercentage = THEMES.reduce((sum, theme) => {
                return sum + (partido.temas[theme.id] || 0);
            }, 0);
            
            const segmentsHTML = THEMES.map((theme, themeIndex) => {
                const originalPercentage = partido.temas[theme.id] || 0;
                const normalizedPercentage = totalPercentage > 0 
                    ? (originalPercentage / totalPercentage) * 100 
                    : 0;
                const isSelected = theme.id === selectedTheme;
                const dimmedClass = selectedTheme ? (isSelected ? 'highlighted' : 'dimmed') : '';
                
                return `
                    <div class="density-segment theme-${theme.id} ${dimmedClass}" 
                        style="width: ${normalizedPercentage}%"
                        onclick="selectThemeFromBar(${themeIndex})">
                        <div class="density-tooltip">${theme.name}: ${originalPercentage}%</div>
                    </div>
                `;
            }).join('');
            
            return `
                <div class="party-bar-item ${highlightClass}">
                    <div class="party-density-bar-container">
                        <div class="party-density-bar">${segmentsHTML}</div>
                    </div>
                    <div class="selected-theme-badge">${THEMES[selectedThemeIndex].name}: ${selectedPercentage}%</div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = `
            <div class="party-names-column">${namesHTML}</div>
            <div class="party-bars-column">${barsHTML}</div>
        `;
    }
}

/**
 * Seleccionar tema desde la barra
 */
function selectThemeFromBar(themeIndex) {
    selectTheme(themeIndex);
    
    const slider = document.getElementById('themeSlider');
    if (slider) {
        slider.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

/**
 * Actualizar filtro de partido
 */
function updateDensityFilter() {
    densityFilteredParty = document.getElementById('densityPartyFilter').value;
    renderDensityBars();
}

/**
 * Poblar selector de partidos
 */
function populateDensityPartySelector() {
    const select = document.getElementById('densityPartyFilter');
    if (!select) return;
    
    const options = Object.keys(densityData).map(partidoId => {
        const partido = densityData[partidoId];
        return `<option value="${partidoId}">${partido.partido}</option>`;
    }).join('');
    
    select.innerHTML = '<option value="">Todos los partidos</option>' + options;
}

// Exportar funciones
window.loadDensityData = loadDensityData;
window.initThemeSlider = initThemeSlider;
window.selectTheme = selectTheme;
window.selectThemeFromBar = selectThemeFromBar;
window.updateDensityFilter = updateDensityFilter;
window.populateDensityPartySelector = populateDensityPartySelector;
window.renderDensityBars = renderDensityBars;