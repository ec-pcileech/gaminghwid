/* ───────────────────────────────────────────────────────────────────────────
   Layout Editor  ·  STARLINE plugin (API 2.3.0)
   Adds a top-bar button (and Ctrl+Shift+L) that opens the built-in visual
   editor: click ANY element, drag it, resize it with the handles, nudge it
   with the arrow keys, hide it with Delete, or restyle it in the inspector.
   Your layout is saved with this plugin and restored on every start.
   Disabling the plugin returns the app to its default layout.
   ─────────────────────────────────────────────────────────────────────────── */
const plugin = {
  id: 'layout-editor',
  name: 'Layout Editor',
  version: '1.0.0',
  description: 'Visual editor for the whole interface: drag, resize, hide and restyle any element. Opens from the top bar or with Ctrl+Shift+L; the layout is saved automatically.',
  minApiVersion: '2.3.0',
  permissions: ['layout', 'storage', 'ui'],

  activate(api) {
    // Re-apply the layout the user saved last time.
    api.ui.edit.load();

    // Top-bar button (pencil icon).
    api.ui.addTopbarButton({
      title: 'Edit layout',
      icon: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
      onClick: () => api.ui.edit.toggle()
    });

    // Keyboard shortcut. Removed again in deactivate().
    this._onKey = (e) => {
      if (e.ctrlKey && e.shiftKey && !e.altKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        api.ui.edit.toggle();
      }
    };
    window.addEventListener('keydown', this._onKey);
  },

  deactivate() {
    window.removeEventListener('keydown', this._onKey);
  }
};
