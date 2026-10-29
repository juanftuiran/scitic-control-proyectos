/**
 * =========================================================================
 * SCITIC S.A.S. — CONTROLADOR REACTIVO DE TEMA (DARK / LIGHT THEME ENGINE)
 * =========================================================================
 * Gestiona la persistencia, alternancia y consulta dinámica de variables CSS
 * desde JavaScript para gráficos (Chart.js), micro-herramientas y Canvas.
 * =========================================================================
 */

(function(window) {
    'use strict';

    const STORAGE_KEY = 'scitic_ui_theme';

    /**
     * Obtiene el tema activo actual ('dark' | 'light')
     */
    function getTheme() {
        return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    }

    /**
     * Aplica un tema determinado y notifica a toda la interfaz
     * @param {string} theme - 'dark' o 'light'
     */
    function setTheme(theme) {
        const isLight = theme === 'light';
        if (isLight) {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }

        try {
            localStorage.setItem(STORAGE_KEY, isLight ? 'light' : 'dark');
        } catch (e) {}

        // Sincronizar tema con iframes embebidos activos (micro-herramientas)
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            try {
                if (iframe.contentDocument && iframe.contentDocument.documentElement) {
                    if (isLight) {
                        iframe.contentDocument.documentElement.setAttribute('data-theme', 'light');
                    } else {
                        iframe.contentDocument.documentElement.removeAttribute('data-theme');
                    }
                }
            } catch (e) {}
        });

        // Disparar evento personalizado para que gráficos (Chart.js) y tablas reaccionen
        window.dispatchEvent(new CustomEvent('sciticthemechange', { 
            detail: { theme: isLight ? 'light' : 'dark', isLight } 
        }));
    }

    /**
     * Alterna entre modo oscuro y claro
     */
    function toggleTheme() {
        setTheme(getTheme() === 'dark' ? 'light' : 'dark');
    }

    /**
     * Lee un token o variable CSS calculada directamente de theme.css
     * @param {string} varName - Nombre de la variable (ej: '--primary', '--card-bg')
     * @returns {string} Valor computado (ej: '#10b981', 'rgba(13, 19, 30, 0.76)')
     */
    function getColor(varName) {
        const name = varName.startsWith('--') ? varName : `--${varName}`;
        return window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }

    // Inicialización preventiva inmediata (Zero-FOUC)
    (function init() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY) || 'dark';
            if (saved === 'light') {
                document.documentElement.setAttribute('data-theme', 'light');
            } else {
                document.documentElement.removeAttribute('data-theme');
            }
        } catch (e) {}
    })();

    // API Global
    window.SCITICTheme = {
        get: getTheme,
        set: setTheme,
        toggle: toggleTheme,
        getColor: getColor
    };

})(window);
