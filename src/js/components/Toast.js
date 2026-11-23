class Toast {
    static init() {
        if (!document.getElementById('toast-container')) {
            const container = document.createElement('div');
            container.id = 'toast-container';
            container.setAttribute('role', 'status');
            container.setAttribute('aria-live', 'polite');
            container.setAttribute('aria-atomic', 'false');
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
 * Implementado con <dialog> nativo en Top Layer, closedby="any" y animaciones @starting-style.
 */
class SCITICModal {
    static _supportsDisplayTransition;

    static _canTransitionDisplay() {
        if (this._supportsDisplayTransition !== undefined) return this._supportsDisplayTransition;
        if (!window.CSS?.supports?.('transition-behavior', 'allow-discrete') || !document.body) {
            return false;
        }
        const probe = document.createElement('div');
        probe.style.cssText = 'transition: display 1s allow-discrete !important; display: block;';
        document.body.appendChild(probe);
        getComputedStyle(probe).display;
        probe.style.display = 'none';
        this._supportsDisplayTransition = getComputedStyle(probe).display === 'block';
        probe.remove();
        return this._supportsDisplayTransition;
    }

    static _supportsTopLayerExit() {
        return Boolean(window.CSS?.supports?.('overlay', 'auto') && this._canTransitionDisplay());
    }

    static async _closeTopLayer(dialog, returnValue = '') {
        if (!dialog.open) return;
        if (!this._supportsTopLayerExit()) {
            dialog.setAttribute('data-closing', '');
            const animations = dialog.getAnimations({ subtree: true });
            if (animations.length > 0) {
                await Promise.race([
                    Promise.allSettled(animations.map((a) => a.finished)),
                    new Promise((r) => setTimeout(r, 400)),
                ]);
            }
            if (!dialog.hasAttribute('data-closing')) return;
            dialog.removeAttribute('data-closing');
        }
        dialog.close(returnValue);
    }

    static confirm(options) {
        const opts = typeof options === 'string'
            ? { title: 'Confirmar acción', message: options, confirmText: 'Confirmar', cancelText: 'Cancelar', type: 'warning' }
            : Object.assign({ title: 'Confirmar acción', message: '', confirmText: 'Confirmar', cancelText: 'Cancelar', type: 'warning' }, options);

        return new Promise((resolve) => {
            const titleId = `scitic-dialog-title-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            const dialog = document.createElement('dialog');
            dialog.className = 'scitic-dialog';
            dialog.setAttribute('closedby', 'any');
            dialog.setAttribute('aria-labelledby', titleId);

            const iconSvg = opts.type === 'danger'
                ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`
                : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;

            dialog.innerHTML = `
                <div class="scitic-dialog-box">
                    <div class="scitic-dialog-header">
                        <div class="scitic-dialog-icon type-${opts.type === 'danger' ? 'danger' : 'warning'}">${iconSvg}</div>
                        <div style="flex:1;">
                            <h4 id="${titleId}" class="scitic-dialog-title"></h4>
                            <p class="scitic-dialog-message"></p>
                        </div>
                    </div>
                    <form method="dialog" class="scitic-dialog-actions">
                        <button type="submit" value="cancel" class="scitic-dialog-btn scitic-dialog-btn-cancel" autofocus></button>
                        <button type="submit" value="confirm" class="scitic-dialog-btn scitic-dialog-btn-confirm ${opts.type === 'danger' ? 'is-danger' : ''}"></button>
                    </form>
                </div>
            `;
            dialog.querySelector('.scitic-dialog-title').textContent = opts.title;
            dialog.querySelector('.scitic-dialog-message').textContent = opts.message;
            dialog.querySelector('.scitic-dialog-btn-cancel').textContent = opts.cancelText;
            dialog.querySelector('.scitic-dialog-btn-confirm').textContent = opts.confirmText;

            document.body.appendChild(dialog);
            dialog.showModal();

            // Interceptar cierre para animar salida en navegadores sin transition-behavior + overlay
            dialog.addEventListener('cancel', (event) => {
                if (!this._supportsTopLayerExit()) {
                    event.preventDefault();
                    this._closeTopLayer(dialog, '');
                }
            });

            if (!this._supportsTopLayerExit()) {
                dialog.querySelector('form').addEventListener('submit', (event) => {
                    event.preventDefault();
                    const val = event.submitter?.value || 'cancel';
                    this._closeTopLayer(dialog, val);
                });
            }

            // Fallback progresivo de closedby="any" para Safari
            if (!('closedBy' in HTMLDialogElement.prototype)) {
                const outside = (e) => {
                    const r = dialog.getBoundingClientRect();
                    return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
                };
                let pressedOutside = false;
                dialog.addEventListener('pointerdown', (e) => { pressedOutside = outside(e); });
                dialog.addEventListener('pointerup', (e) => {
                    if (pressedOutside && outside(e)) this._closeTopLayer(dialog, '');
                });
            }

            dialog.addEventListener('close', () => {
                const confirmed = dialog.returnValue === 'confirm';
                dialog.returnValue = '';
                dialog.remove();
                resolve(confirmed);
            });
        });
    }
}

/**
 * SCITICTheme — Gestor de tema (Compatibilidad y fallback si no se cargó src/theme/theme.js)
 */
class SCITICThemeFallback {
    static getTheme() {
        return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    }

    static getColor(varName) {
        if (!varName) return '';
        const name = varName.startsWith('--') ? varName : `--${varName}`;
        try {
            return window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        } catch (e) {
            return '';
        }
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
        const resolved = isLight ? 'light' : 'dark';
        if (isLight) {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        let meta = document.querySelector('meta[name="color-scheme"]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = 'color-scheme';
            document.head.prepend(meta);
        }
        meta.content = resolved;
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

// Preservar la API del tema central si ya fue cargada desde src/theme/theme.js
if (!window.SCITICTheme) {
    window.SCITICTheme = SCITICThemeFallback;
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => SCITICThemeFallback.init());
    } else {
        SCITICThemeFallback.init();
    }
}
