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
     * Sincroniza <meta name="color-scheme"> en el documento dado
     */
    function syncColorSchemeMeta(doc, theme) {
        if (!doc || !doc.head) return;
        let meta = doc.querySelector('meta[name="color-scheme"]');
        if (!meta) {
            meta = doc.createElement('meta');
            meta.name = 'color-scheme';
            doc.head.prepend(meta);
        }
        meta.content = theme === 'light' ? 'light' : (theme === 'dark' ? 'dark' : 'light dark');
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
                    syncColorSchemeMeta(iframe.contentDocument, theme);
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
        const resolved = isLight ? 'light' : 'dark';
        if (isLight) {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        syncColorSchemeMeta(document, resolved);

        try {
            localStorage.setItem(STORAGE_KEY, resolved);
        } catch (e) {}

        // Sincronizar iframes y botón
        syncIframe();
        updateToggleButton(isLight);

        // Disparar evento personalizado para que gráficos (Chart.js) y tablas reaccionen
        window.dispatchEvent(new CustomEvent('sciticthemechange', { 
            detail: { theme: resolved, isLight } 
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

    function injectStandaloneToolNav() {
        if (window.top !== window.self) return;
        const path = (window.location.pathname || '').toLowerCase();
        if (!path.startsWith('/herramientas/')) return;
        if (document.getElementById('sciticStandaloneToolNav')) return;

        const slug = path.replace(/^\/herramientas\/?/, '').replace(/\/+$/, '');
        const helpHref = slug ? `/help#${slug}` : '/help';

        const nav = document.createElement('nav');
        nav.id = 'sciticStandaloneToolNav';
        nav.className = 'scitic-standalone-tool-nav';
        nav.setAttribute('aria-label', 'Navegación de herramienta');
        nav.innerHTML = `
            <a href="/herramientas" class="scitic-tool-nav-btn is-primary">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                <span>Herramientas</span>
            </a>
            <a href="/" class="scitic-tool-nav-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                <span>Módulos</span>
            </a>
            <a href="/sitios" class="scitic-tool-nav-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                <span>Sitios</span>
            </a>
            <a href="${helpHref}" class="scitic-tool-nav-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <span>Ayuda</span>
            </a>
            <button type="button" id="btnThemeToggle" class="scitic-tool-theme-btn" title="Alternar Modo Oscuro / Modo Claro" aria-label="Alternar Modo Oscuro / Modo Claro"></button>
        `;
        document.body.prepend(nav);
        const toggleBtn = nav.querySelector('#btnThemeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => toggleTheme());
            updateToggleButton(getTheme() === 'light');
        }
    }

    function init() {
        const saved = localStorage.getItem(STORAGE_KEY) || 'dark';
        setTheme(saved);
        injectStandaloneToolNav();

        const iframe = document.getElementById('iframeHerramienta');
        if (iframe) {
            iframe.addEventListener('load', () => syncIframe());
        }

        window.addEventListener('storage', (e) => {
            if (e.key === STORAGE_KEY) {
                const next = e.newValue === 'light' ? 'light' : 'dark';
                setTheme(next);
            }
        });
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
            syncColorSchemeMeta(document, saved === 'light' ? 'light' : 'dark');
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
