class Toast {
    static init() {
        if (!document.getElementById('toast-container')) {
            const container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
    }

    static getIconSVG(type) {
        if (type === 'success') {
            return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
        }
        if (type === 'error') {
            return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
        }
        if (type === 'warning') {
            return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
        }
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }

    static show(message, type = 'success') {
        this.init();
        const container = document.getElementById('toast-container');

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<span class="toast-icon" style="display:inline-flex;align-items:center;">${this.getIconSVG(type)}</span> <span class="toast-message">${message}</span>`;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('toast-show');
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.parentElement.removeChild(toast);
                }
            }, 300);
        }, 3200);
    }

    static success(msg) { this.show(msg, 'success'); }
    static error(msg) { this.show(msg, 'error'); }
    static warning(msg) { this.show(msg, 'warning'); }
    static info(msg) { this.show(msg, 'info'); }
}

/**
 * SCITICModal — Diálogos corporativos asíncronos (Confirmación y Alerta)
 * Reemplaza confirm() y alert() nativos del navegador con estética Frosted Glass.
 */
class SCITICModal {
    static confirm(options) {
        const opts = typeof options === 'string'
            ? { title: 'Confirmar acción', message: options, confirmText: 'Confirmar', cancelText: 'Cancelar', type: 'warning' }
            : Object.assign({ title: 'Confirmar acción', message: '', confirmText: 'Confirmar', cancelText: 'Cancelar', type: 'warning' }, options);

        return new Promise((resolve) => {
            const backdrop = document.createElement('div');
            backdrop.className = 'scitic-dialog-backdrop';

            const iconSvg = opts.type === 'danger'
                ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`
                : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;

            backdrop.innerHTML = `
                <div class="scitic-dialog-box" role="dialog" aria-modal="true">
                    <div class="scitic-dialog-header">
                        <div class="scitic-dialog-icon type-${opts.type === 'danger' ? 'danger' : 'warning'}">${iconSvg}</div>
                        <div style="flex:1;">
                            <h4 class="scitic-dialog-title">${opts.title}</h4>
                            <p class="scitic-dialog-message"></p>
                        </div>
                    </div>
                    <div class="scitic-dialog-actions">
                        <button type="button" class="scitic-dialog-btn scitic-dialog-btn-cancel" data-action="cancel">${opts.cancelText}</button>
                        <button type="button" class="scitic-dialog-btn scitic-dialog-btn-confirm ${opts.type === 'danger' ? 'is-danger' : ''}" data-action="confirm">${opts.confirmText}</button>
                    </div>
                </div>
            `;
            backdrop.querySelector('.scitic-dialog-message').textContent = opts.message;
            document.body.appendChild(backdrop);

            requestAnimationFrame(() => backdrop.classList.add('is-open'));

            const close = (result) => {
                backdrop.classList.remove('is-open');
                setTimeout(() => backdrop.remove(), 220);
                resolve(result);
            };

            backdrop.querySelector('[data-action="cancel"]').addEventListener('click', () => close(false));
            backdrop.querySelector('[data-action="confirm"]').addEventListener('click', () => close(true));
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) close(false);
            });
        });
    }
}

/**
 * SCITICTheme — Gestor de tema (Dark Corporativo por defecto + Modo Campo Claro opcional)
 */
class SCITICTheme {
    static getTheme() {
        return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    }

    static init() {
        const saved = localStorage.getItem('scitic_ui_theme') || 'dark';
        this.apply(saved);

        // Vigilar cargas de iframes para sincronizar tema automáticamente
        const iframe = document.getElementById('iframeHerramienta');
        if (iframe) {
            iframe.addEventListener('load', () => this.syncIframe());
        }
    }

    static syncIframe() {
        const theme = this.getTheme();
        const iframe = document.getElementById('iframeHerramienta');
        if (!iframe) return;

        try {
            if (iframe.contentDocument && iframe.contentDocument.documentElement) {
                if (theme === 'light') {
                    iframe.contentDocument.documentElement.setAttribute('data-theme', 'light');
                } else {
                    iframe.contentDocument.documentElement.removeAttribute('data-theme');
                }
            }
            if (iframe.contentWindow) {
                try {
                    iframe.contentWindow.localStorage.setItem('scitic_ui_theme', theme);
                } catch (e) {}
                if (iframe.contentWindow.SCITICTheme && typeof iframe.contentWindow.SCITICTheme.apply === 'function') {
                    iframe.contentWindow.SCITICTheme.apply(theme);
                }
                iframe.contentWindow.dispatchEvent(new CustomEvent('sciticthemechange', { detail: { theme } }));
            }
        } catch (err) {
            // Manejo silencioso en caso de restricciones de origen cruzado
        }
    }

    static apply(theme) {
        const isLight = theme === 'light';
        if (isLight) {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        try {
            localStorage.setItem('scitic_ui_theme', theme);
        } catch (e) {}

        // Sincronizar con iframe
        this.syncIframe();

        // Actualizar botón de alternancia
        const btn = document.getElementById('btnThemeToggle');
        if (btn) {
            btn.title = isLight ? 'Cambiar a Modo Oscuro Corporativo' : 'Cambiar a Modo Claro (Campo)';
            btn.setAttribute('aria-label', btn.title);
            btn.innerHTML = isLight
                ? `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
                : `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
        }

        // Disparar evento para componentes (ej: Chart.js y vistas personalizadas)
        window.dispatchEvent(new CustomEvent('sciticthemechange', { detail: { theme } }));
    }

    static toggle() {
        const nextTheme = this.getTheme() === 'light' ? 'dark' : 'light';
        this.apply(nextTheme);
        return nextTheme;
    }
}

window.Toast = Toast;
window.SCITICModal = SCITICModal;
window.SCITICTheme = SCITICTheme;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SCITICTheme.init());
} else {
    SCITICTheme.init();
}
