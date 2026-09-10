/**
 * @file modules/icons.js
 * Central Icon Registry & Auto-loader for M3E Icons (@m3e/icons)
 *
 * Integrates @m3e/icons SVG modules with @m3e/web IconRegistry.
 * Pre-registers all core application icons and dynamically loads any
 * additional icons on demand when <m3e-icon> elements appear in the DOM.
 */

import { registerIcon } from '@m3e/web/icon';

// --- Core Outlined Icons from @m3e/icons ---
import '@m3e/icons/outlined/language.js';
import '@m3e/icons/outlined/terminal.js';
import '@m3e/icons/outlined/description.js';
import '@m3e/icons/outlined/folder.js';
import '@m3e/icons/outlined/close.js';
import '@m3e/icons/outlined/search.js';
import '@m3e/icons/outlined/music_note.js';
import '@m3e/icons/outlined/shuffle.js';
import '@m3e/icons/outlined/skip_previous.js';
import '@m3e/icons/outlined/play_arrow.js';
import '@m3e/icons/outlined/pause.js';
import '@m3e/icons/outlined/skip_next.js';
import '@m3e/icons/outlined/repeat.js';
import '@m3e/icons/outlined/repeat_one.js';
import '@m3e/icons/outlined/code.js';
import '@m3e/icons/outlined/refresh.js';
import '@m3e/icons/outlined/settings.js';
import '@m3e/icons/outlined/check_circle.js';
import '@m3e/icons/outlined/calendar_month.js';
import '@m3e/icons/outlined/edit_calendar.js';
import '@m3e/icons/outlined/mail.js';
import '@m3e/icons/outlined/login.js';
import '@m3e/icons/outlined/edit.js';
import '@m3e/icons/outlined/category.js';
import '@m3e/icons/outlined/delete.js';
import '@m3e/icons/outlined/widgets.js';
import '@m3e/icons/outlined/open_with.js';
import '@m3e/icons/outlined/tune.js';
import '@m3e/icons/outlined/visibility_off.js';
import '@m3e/icons/outlined/visibility.js';
import '@m3e/icons/outlined/palette.js';
import '@m3e/icons/outlined/speed.js';
import '@m3e/icons/outlined/shield.js';
import '@m3e/icons/outlined/database.js';
import '@m3e/icons/outlined/developer_board.js';
import '@m3e/icons/outlined/info.js';
import '@m3e/icons/outlined/colorize.js';
import '@m3e/icons/outlined/key.js';
import '@m3e/icons/outlined/brightness_auto.js';
import '@m3e/icons/outlined/check.js';
import '@m3e/icons/outlined/star.js';
import '@m3e/icons/outlined/schedule.js';
import '@m3e/icons/outlined/cloud.js';
import '@m3e/icons/outlined/photo_camera.js';
import '@m3e/icons/outlined/attach_file.js';
import '@m3e/icons/outlined/image.js';
import '@m3e/icons/outlined/graphic_eq.js';
import '@m3e/icons/outlined/mic.js';
import '@m3e/icons/outlined/send.js';
import '@m3e/icons/outlined/north_east.js';
import '@m3e/icons/outlined/add.js';
import '@m3e/icons/outlined/error.js';
import '@m3e/icons/outlined/warning.js';
import '@m3e/icons/outlined/person_add.js';
import '@m3e/icons/outlined/shopping_bag.js';
import '@m3e/icons/outlined/subject.js';
import '@m3e/icons/outlined/task_alt.js';
import '@m3e/icons/outlined/translate.js';
import '@m3e/icons/outlined/autorenew.js';
import '@m3e/icons/outlined/reply.js';
import '@m3e/icons/outlined/lightbulb.js';
import '@m3e/icons/outlined/location_on.js';
import '@m3e/icons/outlined/security.js';
import '@m3e/icons/outlined/storage.js';
import '@m3e/icons/outlined/help.js';
import '@m3e/icons/outlined/home.js';
import '@m3e/icons/outlined/lock.js';
import '@m3e/icons/outlined/notifications.js';
import '@m3e/icons/outlined/volume_up.js';
import '@m3e/icons/outlined/volume_off.js';

// --- Aliases and Symbol Polyfills ---

// 1. mail_outline (alias for mail)
registerIcon('mail_outline', 'outlined', {
  outlined: 'M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm320-280L160-640v400h640v-400L480-440Zm0-80 320-200H160l320 200ZM160-640v-80 480-400Z',
  filled: 'M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm320-280L160-640v400h640v-400L480-440Zm0-80 320-200H160l320 200ZM160-640v-80 480-400Z'
});

// 2. help_outline (alias for help)
registerIcon('help_outline', 'outlined', {
  outlined: 'M511-258q11-11 11-27t-11-27q-11-11-27-11t-27 11q-11 11-11 27t11 27q11 11 27 11t27-11Zm-62-135h59q0-26 6.5-47.5T555-490q31-26 44-51t13-55q0-53-34.5-85T486-713q-49 0-86.5 24.5T345-621l53 20q11-28 33-43.5t52-15.5q34 0 55 18.5t21 47.5q0 22-13 41.5T508-512q-30 26-44.5 51.5T449-393Zm31 313q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-156t86-127Q252-817 325-848.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 82-31.5 155T763-197.5q-54 54.5-127 86T480-80Zm0-60q142 0 241-99.5T820-480q0-142-99-241t-241-99q-141 0-240.5 99T140-480q0 141 99.5 240.5T480-140Zm0-340Z',
  filled: 'M511-258q11-11 11-27t-11-27q-11-11-27-11t-27 11q-11 11-11 27t11 27q11 11 27 11t27-11Zm-62-135h59q0-26 6.5-47.5T555-490q31-26 44-51t13-55q0-53-34.5-85T486-713q-49 0-86.5 24.5T345-621l53 20q11-28 33-43.5t52-15.5q34 0 55 18.5t21 47.5q0 22-13 41.5T508-512q-30 26-44.5 51.5T449-393Zm31 313q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-156t86-127Q252-817 325-848.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 82-31.5 155T763-197.5q-54 54.5-127 86T480-80Z'
});

// 3. done (alias for check)
registerIcon('done', 'outlined', {
  outlined: 'M378-246 154-470l43-43 181 181 384-384 43 43-427 427Z',
  filled: 'M378-246 154-470l43-43 181 181 384-384 43 43-427 427Z'
});

// 4. add_to_home_screen (Material Symbols)
registerIcon('add_to_home_screen', 'outlined', {
  outlined: 'M320-40q-33 0-56.5-23.5T240-120v-160h80v40h400v-480H320v40h-80v-160q0-33 23.5-56.5T320-920h400q33 0 56.5 23.5T800-840v720q0 33-23.5 56.5T720-40H320Zm0-120v40h400v-40H320ZM176-280l-56-56 224-224H200v-80h280v280h-80v-144L176-280Zm144-520h400v-40H320v40Zm0 0v-40 40Zm0 640v40-40Z',
  filled: 'M320-40q-33 0-56.5-23.5T240-120v-160h80v40h400v-480H320v40h-80v-160q0-33 23.5-56.5T320-920h400q33 0 56.5 23.5T800-840v720q0 33-23.5 56.5T720-40H320Zm0-120v40h400v-40H320ZM176-280l-56-56 224-224H200v-80h280v280h-80v-144L176-280Zm144-520h400v-40H320v40Zm0 0v-40 40Zm0 640v40-40Z'
});

// 5. auto_awesome (AI sparkles)
registerIcon('auto_awesome', 'outlined', {
  outlined: {
    viewBox: '0 0 24 24',
    path: 'm19 9-1.25-2.75L15 5l2.75-1.25L19 1l1.25 2.75L23 5l-2.75 1.25Zm0 14-1.25-2.75L15 19l2.75-1.25L19 15l1.25 2.75L23 19l-2.75 1.25ZM9 20l-2.5-5.5L1 12l5.5-2.5L9 4l2.5 5.5L17 12l-5.5 2.5Zm0-4.85L10 13l2.15-1L10 11 9 8.85 8 11l-2.15 1L8 13ZM9 12Z'
  },
  filled: {
    viewBox: '0 0 24 24',
    path: 'm19 9-1.25-2.75L15 5l2.75-1.25L19 1l1.25 2.75L23 5l-2.75 1.25Zm0 14-1.25-2.75L15 19l2.75-1.25L19 15l1.25 2.75L23 19l-2.75 1.25ZM9 20l-2.5-5.5L1 12l5.5-2.5L9 4l2.5 5.5L17 12l-5.5 2.5Z'
  }
});

// 6. tips_and_updates
registerIcon('tips_and_updates', 'outlined', {
  outlined: {
    viewBox: '0 0 24 24',
    path: 'm22 10-.625-1.375L20 8l1.375-.625L22 6l.625 1.375L24 8l-1.375.625Zm-3-4-.95-2.05L16 3l2.05-.95L19 0l.95 2.05L22 3l-2.05.95ZM9 22q-.825 0-1.412-.587Q7 20.825 7 20h4q0 .825-.587 1.413Q9.825 22 9 22Zm-4-3v-2h8v2Zm.25-3q-1.725-1.025-2.737-2.75Q1.5 11.525 1.5 9.5q0-3.125 2.188-5.312Q5.875 2 9 2q3.125 0 5.312 2.188Q16.5 6.375 16.5 9.5q0 2.025-1.012 3.75-1.013 1.725-2.738 2.75Zm.6-2h6.3q1.125-.8 1.737-1.975.613-1.175.613-2.525 0-2.3-1.6-3.9T9 4Q6.7 4 5.1 5.6T3.5 9.5q0 1.35.613 2.525Q4.725 13.2 5.85 14ZM9 14Z'
  },
  filled: {
    viewBox: '0 0 24 24',
    path: 'm22 10-.625-1.375L20 8l1.375-.625L22 6l.625 1.375L24 8l-1.375.625Zm-3-4-.95-2.05L16 3l2.05-.95L19 0l.95 2.05L22 3l-2.05.95ZM9 22q-.825 0-1.412-.587Q7 20.825 7 20h4q0 .825-.587 1.413Q9.825 22 9 22Zm-4-3v-2h8v2Zm.25-3q-1.725-1.025-2.737-2.75Q1.5 11.525 1.5 9.5q0-3.125 2.188-5.312Q5.875 2 9 2q3.125 0 5.312 2.188Q16.5 6.375 16.5 9.5q0 2.025-1.012 3.75-1.013 1.725-2.738 2.75Zm.6-2h6.3q1.125-.8 1.737-1.975.613-1.175.613-2.525 0-2.3-1.6-3.9T9 4Q6.7 4 5.1 5.6T3.5 9.5q0 1.35.613 2.525Q4.725 13.2 5.85 14ZM9 14Z'
  }
});

// --- Dynamic On-Demand Icon Loader ---
const STATIC_ICONS = [
  'mail_outline', 'help_outline', 'done', 'add_to_home_screen',
  'auto_awesome', 'tips_and_updates', 'language', 'terminal',
  'description', 'folder', 'close', 'search', 'music_note', 'shuffle',
  'skip_previous', 'play_arrow', 'pause', 'skip_next', 'repeat',
  'repeat_one', 'code', 'refresh', 'settings', 'check_circle',
  'calendar_month', 'edit_calendar', 'mail', 'login', 'edit',
  'category', 'delete', 'widgets', 'open_with', 'tune',
  'visibility_off', 'visibility', 'palette', 'speed', 'shield',
  'database', 'developer_board', 'info', 'colorize', 'key',
  'brightness_auto', 'check', 'star', 'schedule', 'cloud',
  'photo_camera', 'attach_file', 'image', 'graphic_eq', 'mic',
  'send', 'north_east', 'add', 'error', 'warning', 'person_add',
  'shopping_bag', 'subject', 'task_alt', 'translate', 'autorenew',
  'reply', 'lightbulb', 'location_on', 'security', 'storage',
  'help', 'home', 'lock', 'notifications', 'volume_up', 'volume_off'
];

const loadedIcons = new Set(STATIC_ICONS.map(name => `outlined:${name}`));
const loadingPromises = new Map();

/**
 * Loads an icon from @m3e/icons on demand.
 * @param {string} name - Name of the icon
 * @param {string} variant - 'outlined' | 'rounded' | 'sharp'
 * @returns {Promise<boolean>} Whether the icon was successfully loaded and registered
 */
export async function loadIcon(name, variant = 'outlined') {
  if (!name || typeof name !== 'string') return false;
  const cleanName = name.trim();
  const key = `${variant}:${cleanName}`;

  if (loadedIcons.has(key)) return true;
  if (loadingPromises.has(key)) return loadingPromises.get(key);

  const promise = (async () => {
    try {
      await import(`@m3e/icons/${variant}/${cleanName}.js`);
      loadedIcons.add(key);
      return true;
    } catch (err) {
      try {
        await import(`./node_modules/@m3e/icons/dist/${variant}/${cleanName}.js`);
        loadedIcons.add(key);
        return true;
      } catch (err2) {
        console.warn(`[IconManager] Could not load icon "${cleanName}" (${variant}) from @m3e/icons`);
        return false;
      }
    } finally {
      loadingPromises.delete(key);
    }
  })();

  loadingPromises.set(key, promise);
  return promise;
}

/**
 * Inspect an element and ensure its icon is loaded.
 * @param {Element} el
 */
function ensureIconLoaded(el) {
  if (!el || el.tagName !== 'M3E-ICON') return;
  const name = el.getAttribute('name');
  const variant = el.getAttribute('variant') || 'outlined';
  if (name && !loadedIcons.has(`${variant}:${name}`)) {
    loadIcon(name, variant);
  }
}

// Observe DOM for newly connected or updated <m3e-icon> components
const observer = new MutationObserver((mutations) => {
  for (const m of mutations) {
    if (m.type === 'childList') {
      m.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.tagName === 'M3E-ICON') ensureIconLoaded(node);
          node.querySelectorAll?.('m3e-icon').forEach(ensureIconLoaded);
        }
      });
    } else if (m.type === 'attributes' && m.target?.tagName === 'M3E-ICON') {
      ensureIconLoaded(m.target);
    }
  }
});

if (typeof document !== 'undefined') {
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['name', 'variant']
  });

  // Initial scan of any elements present at load time
  document.querySelectorAll('m3e-icon').forEach(ensureIconLoaded);
}

// Expose globally for imperative usage and widget scripts
window.IconManager = {
  loadIcon,
  registerIcon,
  loadedIcons
};

export default window.IconManager;
