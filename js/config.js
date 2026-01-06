/* ============================================
   CONFIGURACIÓN GLOBAL
   ============================================ */

// URLs de Google Spreadsheets
const CONFIG = {
    // Hoja 1: Datos generales de partidos y candidatos
    SPREADSHEET_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR_yZQbmqUse6lOcFRxBhP53YkC3CdIc36YcOE3bk-w_91-TVudDvH9uVuJoSMZwf_4bPPuq--qbHKb/pub?output=csv',
    
    // Hoja 2: Datos de comparación por temas
    COMPARISON_SPREADSHEET_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRcgvr6YP_YLsgXS9-mJD34bBug-Qzlv8W_d3ZacfQhYcM-7u85u-U6TCl8S9rsBDVPD8Ck5mMsYNxW/pub?output=csv',
    
    // Hoja 3: Factchecking
    FACTCHECKING_SPREADSHEET_URL: 'https://docs.google.com/spreadsheets/d/1IV5othVVZ0udcHWXN5Tfv5UDsDRPjHcJDz4X6BWGiV8/export?format=csv',
    
    // URL del archivo JSON con datos de densidad
    DENSITY_DATA_URL: './data/densidad-data.json'
};

// Temas para densidad discursiva
const THEMES = [
    { id: 'agricultura', name: 'AGRICULTURA', color: '#3B82F6' },
    { id: 'medio_ambiente', name: 'AMBIENTE', color: '#EF4444' },
    { id: 'cambio_climatico', name: 'CAMBIO CLIMÁTICO', color: '#10B981' },
    { id: 'cultura_turismo', name: 'CULTURA Y TURISMO', color: '#F59E0B' },
    { id: 'descentralizacion', name: 'DESCENTRALIZACIÓN', color: '#8B5CF6' },
    { id: 'economia', name: 'ECONOMÍA', color: '#06B6D4' },
    { id: 'educacion', name: 'EDUCACIÓN', color: '#06B6D4' },
    { id: 'energia_minera', name: 'ENERGÍA MINERA', color: '#06B6D4' },
    { id: 'familia', name: 'FAMILIA', color: '#06B6D4' },
    { id: 'gobernanza_digital', name: 'GOBERNANZA DIGITAL', color: '#06B6D4' },
    { id: 'infraestructura', name: 'INFRAESTRUCTURA', color: '#06B6D4' },
    { id: 'justicia_dh', name: 'JUSTICIA', color: '#06B6D4' },
    { id: 'programas_sociales', name: 'PROGRAMAS SOCIALES', color: '#06B6D4' },
    { id: 'salud', name: 'SALUD', color: '#06B6D4' },
    { id: 'seguridad', name: 'SEGURIDAD', color: '#06B6D4' },
    { id: 'transporte', name: 'TRANSPORTE', color: '#06B6D4' },
    { id: 'vivienda', name: 'VIVIENDA', color: '#06B6D4' }
];

/* ============================================
   UTILIDADES
   ============================================ */

/**
 * Agrega timestamp para evitar caché
 * @param {string} url - URL a modificar
 * @returns {string} URL con parámetro de cache-busting
 */
function addCacheBuster(url) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}_=${Date.now()}`;
}

/**
 * Parsea CSV completo (maneja saltos de línea dentro de celdas con comillas)
 * @param {string} csvText - Texto CSV a parsear
 * @returns {Array} Array de objetos con los datos
 */
function parseCSV(csvText) {
    const rows = parseCSVComplete(csvText);
    
    if (rows.length === 0) return [];
    
    const headers = rows[0].map(h => h.trim().toLowerCase());
    const data = [];
    
    for (let i = 1; i < rows.length; i++) {
        const values = rows[i];
        const row = {};
        
        headers.forEach((header, index) => {
            row[header] = values[index] ? values[index].trim() : '';
        });
        
        // Procesar temas y descripciones (solo para la hoja principal)
        if (row.temas && row.descripcionestemas) {
            const temasArray = row.temas.split(',').map(t => t.trim());
            const descripcionesArray = row.descripcionestemas.split(',').map(d => d.trim());
            
            row.temas = temasArray.map((nombre, index) => ({
                nombre: nombre,
                descripcion: descripcionesArray[index] || ''
            }));
        }
        
        data.push(row);
    }
    
    return data;
}

/**
 * Parser CSV completo que maneja saltos de línea dentro de celdas con comillas
 * @param {string} csvText - Texto CSV
 * @returns {Array} Array de arrays con las filas
 */
function parseCSVComplete(csvText) {
    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let inQuotes = false;
    
    for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        const nextChar = csvText[i + 1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentCell += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            currentRow.push(currentCell);
            currentCell = '';
        } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
            currentRow.push(currentCell);
            if (currentRow.some(cell => cell.trim() !== '')) {
                rows.push(currentRow);
            }
            currentRow = [];
            currentCell = '';
            if (char === '\r') i++;
        } else if (char === '\r' && !inQuotes) {
            currentRow.push(currentCell);
            if (currentRow.some(cell => cell.trim() !== '')) {
                rows.push(currentRow);
            }
            currentRow = [];
            currentCell = '';
        } else {
            currentCell += char;
        }
    }
    
    if (currentCell || currentRow.length > 0) {
        currentRow.push(currentCell);
        if (currentRow.some(cell => cell.trim() !== '')) {
            rows.push(currentRow);
        }
    }
    
    return rows;
}

/**
 * Parsea una línea CSV individual
 * @param {string} line - Línea CSV
 * @returns {Array} Array con los valores
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current);
    return result;
}

/**
 * Extrae dominio de una URL
 * @param {string} url - URL completa
 * @returns {string} Dominio extraído
 */
function extractDomain(url) {
    try {
        const domain = new URL(url).hostname;
        return domain.replace('www.', '');
    } catch {
        return url;
    }
}

// Exportar para uso global
window.CONFIG = CONFIG;
window.THEMES = THEMES;
window.addCacheBuster = addCacheBuster;
window.parseCSV = parseCSV;
window.parseCSVComplete = parseCSVComplete;
window.parseCSVLine = parseCSVLine;
window.extractDomain = extractDomain;
