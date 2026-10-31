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
     * Sincroniza el tema activo con los iframes embebidos (calculadoras/micro-herramientas)
     */
    function syncIframe() {
        const theme = getTheme();
        const isLight = theme === 'light';

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
                if (iframe.contentWindow) {
                    try {
                        iframe.contentWindow.localStorage.setItem(STORAGE_KEY, theme);
                    } catch (e) {}
                    if (iframe.contentWindow.SCITICTheme && typeof iframe.contentWindow.SCITICTheme.apply === 'function') {
                        iframe.contentWindow.SCITICTheme.apply(theme);
                    }
                    iframe.contentWindow.dispatchEvent(new CustomEvent('sciticthemechange', { detail: { theme, isLight } }));
                }
            } catch (err) {
                // Silencioso ante restricciones de origen
            }
        });
    }

    /**
     * Actualiza el botón de alternancia en la barra superior si existe
     */
    function updateToggleButton(isLight) {
        const btn = document.getElementById('btnThemeToggle');
        if (!btn) return;

        btn.title = isLight ? 'Cambiar a Modo Oscuro Corporativo' : 'Cambiar a Modo Claro (Campo)';
        btn.setAttribute('aria-label', btn.title);
        btn.innerHTML = isLight
            ? `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
            : `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
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

        // Sincronizar iframes y botón
        syncIframe();
        updateToggleButton(isLight);

        // Disparar evento personalizado para que gráficos (Chart.js) y tablas reaccionen
        window.dispatchEvent(new CustomEvent('sciticthemechange', { 
            detail: { theme: isLight ? 'light' : 'dark', isLight } 
        }));
    }

    /**
     * Alterna entre modo oscuro y claro
     */
    function toggleTheme() {
        const next = getTheme() === 'dark' ? 'light' : 'dark';
        setTheme(next);
        return next;
    }

    /**
     * Lee un token o variable CSS calculada directamente de theme.css
     * @param {string} varName - Nombre de la variable (ej: '--primary', '--card-bg')
     * @returns {string} Valor computado (ej: '#10b981', 'rgba(6, 10, 7, 0.75)')
     */
    function getColor(varName) {
        if (!varName) return '';
        const name = varName.startsWith('--') ? varName : `--${varName}`;
        try {
            return window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        } catch (e) {
            return '';
        }
    }

    function init() {
        const saved = localStorage.getItem(STORAGE_KEY) || 'dark';
        setTheme(saved);

        const iframe = document.getElementById('iframeHerramienta');
        if (iframe) {
            iframe.addEventListener('load', () => syncIframe());
        }
    }

    // Inicialización preventiva inmediata (Zero-FOUC)
    (function bootstrap() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY) || 'dark';
            if (saved === 'light') {
                document.documentElement.setAttribute('data-theme', 'light');
            } else {
                document.documentElement.removeAttribute('data-theme');
            }
        } catch (e) {}
    })();

    // API Global Unificada
    const themeController = {
        get: getTheme,
        getTheme: getTheme,
        set: setTheme,
        apply: setTheme,
        toggle: toggleTheme,
        getColor: getColor,
        init: init,
        syncIframe: syncIframe
    };

    window.SCITICTheme = themeController;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            init();
        });
    } else {
        init();
    }

})(window);
