/**
 * Soul Widgets Manager - Desktop Module
 * @version 2.0.0
 * @description ChromeOSスタイルのデスクトップウィジェットマネージャー
 */

'use strict';

// =============================
// テスト用: 要素取得チェック関数
// =============================
window.__test_checkElementExists = function(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Element with id '${id}' not found`);
  return true;
};

// テスト用: localStorageデータ検証
// テスト用: localStorageデータ検証
window.setSelectValue = function(selectEl, value) {
  if (!selectEl) return;
  if (selectEl.tagName === 'M3E-SELECT') {
    const options = selectEl.querySelectorAll('m3e-option');
    options.forEach(opt => {
      const optVal = opt.value || opt.getAttribute('value');
      opt.selected = (optVal === value);
    });
    if (typeof selectEl.requestUpdate === 'function') {
      selectEl.requestUpdate();
    }
  } else {
    selectEl.value = value;
  }
};
const setSelectValue = window.setSelectValue;

window.__test_checkFoldersData = function() {
  try {
    const folders = JSON.parse(localStorage.getItem(LS_KEYS.APP_FOLDERS) || '{}');
    if (typeof folders !== 'object' || Array.isArray(folders)) throw new Error('folders is not an object');
    Object.keys(folders).forEach(fid => {
      if (!folders[fid].apps || !Array.isArray(folders[fid].apps)) throw new Error(`folder ${fid} has invalid apps`);
    });
    return true;
  } catch (e) {
    throw new Error('Invalid folders data: ' + e.message);
  }
};

// DOM 要素参照は後で初期化するためのプレースホルダ
let iconShapeSelector = null;

// Constants are defined in constants.js

// ========================================
// ダイアログヘルパー関数 (UIUtilsより取得)
// ========================================

const { showAlertDialog, showConfirmDialog, resizeImage, hexToRgb, getContrastColor } = window.UIUtils;

// ========================================
// アイコン形状の設定
window.getCurrentIconShape = function() {
  return localStorage.getItem(LS_KEYS.ICON_SHAPE) || 'circle';
};

window.getCurrentClockShape = function() {
  return localStorage.getItem(LS_KEYS.CLOCK_SHAPE) || '12-sided-cookie';
};



window.wrapIconWithShape = function(appiconEl, shape) {
  if (!appiconEl) return;
  const img = appiconEl.querySelector('img');
  if (!img) return;

  const parent = img.parentElement;
  const parentTag = parent && parent.tagName && parent.tagName.toLowerCase();

  // square/circle は CSS の border-radius で処理する — m3e-shape が不要
  if (shape === 'square' || shape === 'circle') {
    if (parentTag === 'm3e-shape' || (parent && parent.classList.contains('custom-shape-wrapper'))) {
      parent.replaceWith(img);
    }
    img.style.borderRadius = shape === 'circle' ? '50%' : 'var(--radius-sm)';
    return;
  }

  // カスタムシェイプのチェック
  const customShapes = JSON.parse(localStorage.getItem(LS_KEYS.CUSTOM_SHAPES) || '{}');
  if (customShapes[shape]) {
    if (parent && parent.classList.contains('custom-shape-wrapper')) {
      parent.style.clipPath = customShapes[shape];
      return;
    }
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-shape-wrapper';
    wrapper.style.clipPath = customShapes[shape];
    img.replaceWith(wrapper);
    wrapper.appendChild(img);
    return;
  }

  // もし custom-shape-wrapper でラップされていれば m3e-shape に戻すために置換準備
  if (parent && parent.classList.contains('custom-shape-wrapper')) {
    const wrapper = document.createElement('m3e-shape');
    wrapper.setAttribute('name', shape);
    parent.replaceWith(wrapper);
    wrapper.appendChild(img);
    return;
  }

  // カスタム形状: 既に m3e-shape でラップされているかチェック
  if (parentTag === 'm3e-shape') {
    const wrapper = img.parentElement;
    if (wrapper.getAttribute('name') === shape) {
      return; // 既に正しい形状
    }
    // 形状が違う場合は属性を更新
    wrapper.setAttribute('name', shape);
    return;
  }

  // img を m3e-shape でラップする
  try {
    const wrapper = document.createElement('m3e-shape');
    wrapper.setAttribute('name', shape);
    // move the image into wrapper
    img.replaceWith(wrapper);
    wrapper.appendChild(img);
  } catch (e) {
    // 何か失敗したらフォールバックで何もしない
    console.warn('Failed to wrap icon with m3e-shape:', e);
  }
};


window.wrapImageWithShape = function(img, shape) {
  if (!img) return;
  const parent = img.parentElement;
  const parentTag = parent && parent.tagName && parent.tagName.toLowerCase();

  if (shape === 'square' || shape === 'circle') {
    if (parentTag === 'm3e-shape' || (parent && parent.classList.contains('custom-shape-wrapper'))) {
      parent.replaceWith(img);
    }
    img.style.borderRadius = shape === 'circle' ? '50%' : 'var(--radius-sm)';
    return;
  }

  // カスタムシェイプのチェック
  const customShapes = JSON.parse(localStorage.getItem(LS_KEYS.CUSTOM_SHAPES) || '{}');
  if (customShapes[shape]) {
    if (parent && parent.classList.contains('custom-shape-wrapper')) {
      parent.style.clipPath = customShapes[shape];
      return;
    }
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-shape-wrapper';
    wrapper.style.clipPath = customShapes[shape];
    img.replaceWith(wrapper);
    wrapper.appendChild(img);
    return;
  }

  if (parent && parent.classList.contains('custom-shape-wrapper')) {
    const wrapper = document.createElement('m3e-shape');
    wrapper.setAttribute('name', shape);
    parent.replaceWith(wrapper);
    wrapper.appendChild(img);
    return;
  }

  if (parentTag === 'm3e-shape') {
    const wrapper = img.parentElement;
    if (wrapper.getAttribute('name') === shape) return;
    wrapper.setAttribute('name', shape);
    return;
  }

  try {
    const wrapper = document.createElement('m3e-shape');
    wrapper.setAttribute('name', shape);
    img.replaceWith(wrapper);
    wrapper.appendChild(img);
  } catch (e) {
    console.warn('Failed to wrap preview img with m3e-shape:', e);
  }
};


// 全アイコンに形状を適用する
window.applyShapeToAll = function(shape) {
  // 通常のアイコンとフォルダ内アイテム（モーダル）
  const icons = document.querySelectorAll('.appicon:not(.folder)');
  icons.forEach(icon => {
    // 個別設定がある場合はそれを優先、なければグローバル設定
    const targetShape = icon.dataset.shape || shape;
    window.wrapIconWithShape(icon, targetShape);
  });

  // フォルダアイコンのプレビュー画像
  const folderImages = document.querySelectorAll('.appicon.folder .folder-preview img');
  folderImages.forEach(img => {
    const folderEl = img.closest('.appicon.folder');
    const targetShape = folderEl?.dataset.shape || shape;
    window.wrapImageWithShape(img, targetShape);
  });
};

// 時計に形状を適用する
window.applyClockShape = function(shape) {
  let clockBg = document.querySelector('.clock-background');
  if (!clockBg) return;

  // 初期化
  clockBg.style.clipPath = '';
  clockBg.style.borderRadius = '';

  if (shape === 'square' || shape === 'circle') {
    if (clockBg.tagName === 'M3E-SHAPE' || clockBg.classList.contains('custom-shape-wrapper')) {
      const surface = clockBg.querySelector('.clock-surface');
      if (surface) {
        const newDiv = document.createElement('div');
        newDiv.className = 'clock-background';
        newDiv.style.overflow = 'hidden';
        newDiv.appendChild(surface);
        clockBg.replaceWith(newDiv);
        clockBg = newDiv;
      }
    }
    
    if (shape === 'circle') {
      clockBg.style.setProperty('border-radius', '50%', 'important');
    } else {
      clockBg.style.setProperty('border-radius', 'var(--radius-md)', 'important');
    }
    return;
  }

  // カスタムシェイプのチェック
  const customShapes = JSON.parse(localStorage.getItem(LS_KEYS.CUSTOM_SHAPES) || '{}');
  if (customShapes[shape]) {
    const surface = clockBg.querySelector('.clock-surface');
    if (!surface) return;

    if (clockBg.classList.contains('custom-shape-wrapper')) {
      clockBg.style.clipPath = customShapes[shape];
    } else {
      const wrapper = document.createElement('div');
      wrapper.className = 'clock-background custom-shape-wrapper';
      wrapper.style.clipPath = customShapes[shape];
      clockBg.replaceWith(wrapper);
      wrapper.appendChild(surface);
    }
    return;
  }

  // もし custom-shape-wrapper でラップされていれば m3e-shape に戻す
  if (clockBg.classList.contains('custom-shape-wrapper')) {
    const surface = clockBg.querySelector('.clock-surface');
    if (surface) {
      const wrapper = document.createElement('m3e-shape');
      wrapper.className = 'clock-background';
      wrapper.setAttribute('name', shape);
      clockBg.replaceWith(wrapper);
      wrapper.appendChild(surface);
    }
    return;
  }

  if (clockBg.tagName === 'M3E-SHAPE') {
    clockBg.setAttribute('name', shape);
  } else {
    const surface = clockBg.querySelector('.clock-surface');
    if (surface) {
      const wrapper = document.createElement('m3e-shape');
      wrapper.className = 'clock-background';
      wrapper.setAttribute('name', shape);
      clockBg.replaceWith(wrapper);
      wrapper.appendChild(surface);
    }
  }
};


/**
 * アイコン形状を更新
 */
const updateIconShape = window.StyleManager.updateIconShape.bind(window.StyleManager);

window.launchLinuxApp = async function(command) {
  if (window.electronAPI && window.electronAPI.launchLinuxApp) {
    return await window.electronAPI.launchLinuxApp(command);
  }
  return { success: false, error: 'Electron API not available' };
};


// ========================================
// ウィジェット管理
// ========================================

const availableWidgets = {
  'widget-clock': { name: '時計', element: document.getElementById('widget-clock') },
  'media_player_widget': { name: 'メディアプレイヤー', element: document.getElementById('media_player_widget') },
  'github_contribution_widget': { name: 'GitHub Contributions', element: document.getElementById('github_contribution_widget') },
  'google_calendar_widget': { name: 'Google Calendar', element: document.getElementById('google_calendar_widget') },
  'gmail_widget': { name: 'Gmail', element: document.getElementById('gmail_widget') },
  'weather_widget': { name: window.i18n ? window.i18n.t('weather') : 'Weather', element: document.getElementById('weather_widget') }
};

let widgetVisibility = {};

function loadWidgetVisibility() {
  const saved = JSON.parse(localStorage.getItem(LS_KEYS.WIDGET_VISIBILITY) || '{}');
  const defaults = {};
  Object.keys(availableWidgets).forEach(id => {
    // 時計と天気のみデフォルトで表示
    defaults[id] = (id === 'widget-clock' || id === 'weather_widget');
  });
  widgetVisibility = { ...defaults, ...saved };
}

async function applyWidgetVisibility() {
  for (const widgetId in availableWidgets) {
    const widget = availableWidgets[widgetId].element;
    const isVisible = widgetVisibility[widgetId];
    if (widget) {
      if (isVisible) {
        // 表示する前にリソースを読み込む
        if (window.WidgetLoader) {
          await window.WidgetLoader.load(widgetId);
        }
        widget.style.display = '';
        
        // ヘッダー表示設定を適用
        const headerMode = localStorage.getItem(`widgetHeaderMode:${widgetId}`) || 'always';
        widget.classList.remove('header-hover-show', 'header-always-hide');
        if (headerMode === 'hover') {
          widget.classList.add('header-hover-show');
        } else if (headerMode === 'hide') {
          widget.classList.add('header-always-hide');
        }
      } else {
        widget.style.display = 'none';
      }
    }
  }
  if (typeof updateMediaPollingActiveState === 'function') {
    await updateMediaPollingActiveState();
  }
}

async function setWidgetVisibility(widgetId, isVisible) {
  const widget = availableWidgets[widgetId]?.element;
  if (widget) {
    if (isVisible) {
      // 表示する前にリソースを読み込む
      if (window.WidgetLoader) {
        await window.WidgetLoader.load(widgetId);
      }
      widget.style.display = '';
    } else {
      widget.style.display = 'none';
    }
    widgetVisibility[widgetId] = isVisible;
    localStorage.setItem(LS_KEYS.WIDGET_VISIBILITY, JSON.stringify(widgetVisibility));
    if (widgetId === 'media_player_widget' && typeof updateMediaPollingActiveState === 'function') {
      await updateMediaPollingActiveState();
    }
  }
}

// デフォルトアイコン表示設定
function setDefaultIconVisibility(iconId, isVisible, key) {
  const icon = document.getElementById(iconId);
  if (icon) {
    // フォルダ内にある場合は、設定に関わらず非表示を維持する
    if (isVisible && typeof isAppInFolder === 'function' && isAppInFolder(app => app.isBuiltin && app.id === iconId)) {
      icon.style.display = 'none';
    } else {
      icon.style.display = isVisible ? 'flex' : 'none';
    }
    localStorage.setItem(key, isVisible);
  }
}

function loadDefaultIconVisibility() {
  const icons = {
    'appicon-chrome': LS_KEYS.SHOW_CHROME_ICON,
    'appicon-files': LS_KEYS.SHOW_FILES_ICON,
    'appicon-settings': LS_KEYS.SHOW_SETTINGS_ICON
  };

  for (const iconId in icons) {
    const key = icons[iconId];
    const isVisible = localStorage.getItem(key) !== 'false'; // Default to true
    const toggle = document.getElementById(`toggle_${iconId.split('-')[1]}_icon`);

    const icon = document.getElementById(iconId);
    if (icon) {
      // フォルダ内にある場合は常に非表示にする
      if (typeof isAppInFolder === 'function' && isAppInFolder(app => app.isBuiltin && app.id === iconId)) {
        icon.style.display = 'none';
      } else {
        icon.style.display = isVisible ? 'flex' : 'none';
      }
    }

    if (toggle) {
      toggle.checked = isVisible;
    }
  }
}


// すべてのモーダルを閉じる関数

window.closeAllModals = function() {

  // すべてのオーバーレイを非表示

  const overlays = document.querySelectorAll('.modal_overlay');

  overlays.forEach(el => {

    el.style.display = 'none';

    el.classList.remove('fade-out');

  });



  // フォルダーの状態をリセット

  window.currentOpenFolderId = null;

  const folderModal = document.getElementById('folder_modal');

  if (folderModal) {

    folderModal.classList.remove('folder-opening', 'folder-closing');

  }



  // 位置変更モードを終了
  if (window.isPositionChangeMode) {
    exitPositionChangeMode();
  }



  hideContextMenu();

};



// ========================================
// ビルトインアイコンのクリックイベント
// ========================================

/** アイコンクリックハンドラを設定 */
function setupBuiltinIconClick(id, url) {
  const el = document.getElementById(id);
  if (el) el.onclick = () => {
    if (typeof window.openURL === 'function') window.openURL(url);
  };
}


setupBuiltinIconClick('appicon-chrome', 'chrome://newtab');
setupBuiltinIconClick('appicon-files', 'chrome://file-manager');
setupBuiltinIconClick('appicon-settings', 'chrome://os-settings');

document.addEventListener('keydown', function(e) {
  if(e.key === 'Escape'){
    closeAllModals();
    document.getElementById('escmenu_modal_overlay').style.display = 'flex';
  }
});

// 右下の設定ボタン
document.getElementById('settings_fab').onclick = () => {
  closeAllModals();
  document.getElementById('escmenu_modal_overlay').style.display = 'flex';
}

document.getElementById('close_menu_modal').onclick = () => {
  closeAllModals();
}

document.getElementById('open_settingsmenu_modal').onclick = () => {
  closeAllModals();
  initDisplaySelector(); // 設定メニューを開くたびにディスプレイ情報を更新
  initWindowResizableSwitch();
  initAutoOpenDevToolsSwitch();
  // Load Gemini settings values from file
  const apiKeyInput = document.getElementById('gemini_api_key_input');
  const modelSelector = document.getElementById('gemini_model_selector');
  if (apiKeyInput && modelSelector && window.electronAPI && window.electronAPI.getGeminiConfig) {
    window.electronAPI.getGeminiConfig().then(config => {
      apiKeyInput.value = config.geminiApiKey || '';
      setSelectValue(modelSelector, config.geminiModel || 'gemini-3.1-flash-lite');
    }).catch(e => console.error('Failed to get Gemini settings:', e));
  }
  showSettingsSection('design_style'); // 開くたびに最初のカテゴリーを表示
  document.getElementById('settingsmenu_modal_overlay').style.display = 'flex';
}

document.getElementById('close_settingsmenu_modal').onclick = () => {
  closeAllModals();
}

// ========================================
// アプリケーション状態
// ========================================

window.isGridModeEnabled = localStorage.getItem(LS_KEYS.GRID_MODE_ENABLED) === 'true';
window.isMovementLocked = localStorage.getItem(LS_KEYS.LOCK_MOVEMENT) === 'true';
window.isPositionChangeMode = false;
window.draggedItem = null;
window.folders = JSON.parse(localStorage.getItem(LS_KEYS.APP_FOLDERS) || '{}');
window.currentOpenFolderId = null;
window.currentFolderPage = 0;

function updateLockMovementUI() {
  const toggle = document.getElementById('toggle_lock_movement_position_modal');
  if (toggle) {
    toggle.checked = window.isMovementLocked;
  }
}

// 初期化時にUIを更新
updateLockMovementUI();

// トグルイベントの設定
const lockMovementToggle = document.getElementById('toggle_lock_movement_position_modal');
if (lockMovementToggle) {
  lockMovementToggle.addEventListener('change', (e) => {
    const newState = e.target.checked;
    window.isMovementLocked = newState;
    localStorage.setItem(LS_KEYS.LOCK_MOVEMENT, newState);
  });
}

// ドラッグ開始判定に使う閾値（ピクセル）
const DRAG_THRESHOLD = 8;


// 編集機能用 (ContextMenuManagerと同期)
Object.defineProperty(window, 'currentEditingApp', { 
  get: () => window.ContextMenuManager?.currentEditingApp, 
  set: (v) => { if(window.ContextMenuManager) window.ContextMenuManager.currentEditingApp = v; } 
});
Object.defineProperty(window, 'currentEditingIcon', { 
  get: () => window.ContextMenuManager?.currentEditingIcon, 
  set: (v) => { if(window.ContextMenuManager) window.ContextMenuManager.currentEditingIcon = v; } 
});
Object.defineProperty(window, 'currentContextAppType', { 
  get: () => window.ContextMenuManager?.currentContextAppType, 
  set: (v) => { if(window.ContextMenuManager) window.ContextMenuManager.currentContextAppType = v; } 
});
Object.defineProperty(window, 'currentEditingWidget', { 
  get: () => window.ContextMenuManager?.currentEditingWidget, 
  set: (v) => { if(window.ContextMenuManager) window.ContextMenuManager.currentEditingWidget = v; } 
});

// ========================================
// ユーティリティ関数
// ========================================

/**
 * フォルダーデータを保存
 */
function saveFolders() {
  localStorage.setItem(LS_KEYS.APP_FOLDERS, JSON.stringify(window.folders));
}


/**
 * 現在の言語を取得
 * @returns {string} 言語コード ('ja' または 'en')
 */
function getCurrentLanguage() {
  return localStorage.getItem(LS_KEYS.LANGUAGE) || 'ja';
}

const getDominantColor = window.UIUtils.getDominantColor;

// 他のモジュールから関数を取得
const { 
  snapToGrid, 
  calculateOverlapArea, 
  cacheIconRects, 
  getOverlappingIcon, 
  getOverlappingFolder, 
  isOverlappingAny, 
  findNearestEmptyPosition,
  setupDraggableItem,
  setupNormalModeDrag
} = window.DragManager;




// ========================================
// フォルダー機能
// ========================================

const { 
  getIconData, 
  createDesktopIcon, 
  createLinuxAppIcon, 
  createFileShortcutIcon, 
  createFolderShortcutIcon, 
  getFileIcon 
} = window.AppManager;

const { 
  createFolder, 
  createFolderIcon, 
  updateFolderIcon, 
  closeFolder, 
  openFolder, 
  applyFolderStyle, 
  renderFolderPage, 
  updateFolderModalPosition,
  loadFolders,
  isAppInFolder,
  removeFromFolder
} = window.FolderManager;


// フォルダーモーダルを閉じる
document.getElementById('close_folder_modal').onclick = () => {
  closeFolder();
}


// オーバーレイクリックで閉じる
document.getElementById('folder_modal_overlay').onclick = (e) => {
  if (e.target.id === 'folder_modal_overlay') {
    closeFolder();
  }
};

// 位置変更モードを有効にする
function enterPositionChangeMode() {
  closeAllModals();
  if (window.isPositionChangeMode) return;
  window.isPositionChangeMode = true;
  
  document.getElementById('change_widget_position_modal_overlay').style.display = 'flex';
  
  // 位置変更モード中はデスクトップアイコンのz-indexを上げる
  const desktopIcons = document.getElementById('desktop_icons');
  if (desktopIcons) {
    desktopIcons.style.zIndex = '5';
  }

  // すべてのアイコンにドラッグイベントを設定
  document.querySelectorAll(".appicon,.widget").forEach(item => {
    setupDraggableItem(item);
    if (item.classList.contains('widget')) {
      item.style.zIndex = '15'; // オーバーレイ(10)より上
    }
  });
  
  // グリッドモードのスイッチの状態を復元
  window.isGridModeEnabled = localStorage.getItem(LS_KEYS.GRID_MODE_ENABLED) === 'true';
  updateGridModeSwitch();
  updateGridSizeUI();
  
  // グリッド線の表示/非表示
  if (window.isGridModeEnabled) {
    document.getElementById('change_widget_position_modal_overlay').classList.add('grid-mode');
  } else {
    document.getElementById('change_widget_position_modal_overlay').classList.remove('grid-mode');
  }
}

/**
 * グリッド設定のUIとCSS変数を更新
 */
function updateGridSizeUI() {
  const xSlider = document.getElementById('grid_size_x_slider');
  const ySlider = document.getElementById('grid_size_y_slider');
  const iconSlider = document.getElementById('icon_size_slider');
  const xValue = document.getElementById('grid_size_x_value');
  const yValue = document.getElementById('grid_size_y_value');
  const iconValue = document.getElementById('icon_size_value');
  const overlay = document.getElementById('change_widget_position_modal_overlay');

  if (xSlider && xValue) {
    const thumb = xSlider.querySelector('m3e-slider-thumb');
    if (thumb) thumb.value = GRID_SIZE_X;
    xValue.textContent = GRID_SIZE_X;
  }
  if (ySlider && yValue) {
    const thumb = ySlider.querySelector('m3e-slider-thumb');
    if (thumb) thumb.value = GRID_SIZE_Y;
    yValue.textContent = GRID_SIZE_Y;
  }
  if (iconSlider && iconValue) {
    const thumb = iconSlider.querySelector('m3e-slider-thumb');
    if (thumb) thumb.value = ICON_SIZE;
    iconValue.textContent = ICON_SIZE;
  }

  if (overlay) {
    overlay.style.setProperty('--grid-size-x', GRID_SIZE_X + 'px');
    overlay.style.setProperty('--grid-size-y', GRID_SIZE_Y + 'px');
    overlay.style.setProperty('--grid-offset', GRID_OFFSET + 'px');
  }
  
  // アイコンサイズを適用
  document.documentElement.style.setProperty('--icon-size-x', ICON_SIZE + 'px');
  document.documentElement.style.setProperty('--icon-size-y', (ICON_SIZE + 10) + 'px'); // 少し高めに設定
  document.documentElement.style.setProperty('--icon-img-size', (ICON_SIZE * 0.6) + 'px');
  document.documentElement.style.setProperty('--icon-font-size', Math.max(0.6, Math.min(1.2, ICON_SIZE / 80 * 0.8)) + 'rem');
}

// アイコンサイズスライダーのイベント
document.getElementById('icon_size_slider')?.addEventListener('input', (e) => {
  const newValue = parseInt(e.target.value || e.target.querySelector('m3e-slider-thumb')?.value || 80);
  ICON_SIZE = newValue;
  document.getElementById('icon_size_value').textContent = newValue;
  updateGridSizeUI();
});

document.getElementById('icon_size_slider')?.addEventListener('change', (e) => {
  const newValue = parseInt(e.target.value || e.target.querySelector('m3e-slider-thumb')?.value || 80);
  localStorage.setItem(LS_KEYS.ICON_SIZE, newValue);
});

/**
 * すべてのアイテムを現在のグリッドにスナップさせる
 */
function reSnapAllToGrid() {
  if (!window.isGridModeEnabled) return;
  document.querySelectorAll(".appicon,.widget").forEach(item => {
    const currentLeft = item.offsetLeft;
    const currentTop = item.offsetTop;
    item.style.position = 'absolute';
    item.style.left = snapToGrid(currentLeft, 'x') + 'px';
    item.style.top = snapToGrid(currentTop, 'y') + 'px';
  });
}

// グリッドサイズスライダーのイベント
document.getElementById('grid_size_x_slider')?.addEventListener('input', (e) => {
  const newValue = parseInt(e.target.value || e.target.querySelector('m3e-slider-thumb')?.value || 80);
  GRID_SIZE_X = newValue;
  document.getElementById('grid_size_x_value').textContent = newValue;
  updateGridSizeUI();
});

document.getElementById('grid_size_x_slider')?.addEventListener('change', (e) => {
  const newValue = parseInt(e.target.value || e.target.querySelector('m3e-slider-thumb')?.value || 80);
  localStorage.setItem(LS_KEYS.GRID_SIZE_X, newValue);
});

document.getElementById('grid_size_y_slider')?.addEventListener('input', (e) => {
  const newValue = parseInt(e.target.value || e.target.querySelector('m3e-slider-thumb')?.value || 90);
  GRID_SIZE_Y = newValue;
  document.getElementById('grid_size_y_value').textContent = newValue;
  updateGridSizeUI();
});

document.getElementById('grid_size_y_slider')?.addEventListener('change', (e) => {
  const newValue = parseInt(e.target.value || e.target.querySelector('m3e-slider-thumb')?.value || 90);
  localStorage.setItem(LS_KEYS.GRID_SIZE_Y, newValue);
});

// 位置変更モードを終了する（保存または閉じる時に呼ばれる）
function exitPositionChangeMode() {
  if (!window.isPositionChangeMode) return;
  window.isPositionChangeMode = false;
  
  document.getElementById('change_widget_position_modal_overlay').style.display = 'none';
  
  // z-indexを元に戻す
  const desktopIcons = document.getElementById('desktop_icons');
  if (desktopIcons) {
    desktopIcons.style.zIndex = '';
  }
  document.querySelectorAll('.widget').forEach(w => {
    w.style.zIndex = '';
  });
  
  // 位置変更モード終了時にクリックイベントを復元
  document.querySelectorAll(".appicon,.widget").forEach(item => {
    if (item._savedOnclick) {
      item.onclick = item._savedOnclick;
    } else if (!item.dataset.originalOnclick) {
      item.onclick = null;
    }
    delete item._savedOnclick;
    delete item.dataset.originalOnclick;
    
    // 右クリックイベントを復元
    if (item._savedOncontextmenu) {
      item.oncontextmenu = item._savedOncontextmenu;
      delete item._savedOncontextmenu;
    }
    
    // リンクタグのクリックイベントを復元
    const links = item.querySelectorAll('a');
    links.forEach(link => {
      link.onclick = null;
    });
    
    // 画像のドラッグ設定を復元
    const images = item.querySelectorAll('img');
    images.forEach(img => {
      img.draggable = true;
      img.style.pointerEvents = '';
    });
    
    // ポインターイベントをクリア（initNormalModeDragで再設定される）
    item.onpointerdown = null;
    item.onpointermove = null;
    item.onpointerup = null;
    
    // ドラッグ関連のプロパティもクリア
    delete item._isDragging;
    delete item._startX;
    delete item._startY;
    delete item._startLeft;
    delete item._startTop;
    delete item._normalModeDragStarted;
  });
  
  // 通常モードのドラッグを再設定
  initNormalModeDrag();
}


document.getElementById('open_change_widget_position_modal').onclick = () => {
  enterPositionChangeMode();
};

// グリッドモードスイッチの状態更新関数 (m3e-switchのプロパティを考慮)

function updateGridModeSwitch() {
  const gridModeSwitch = document.getElementById('toggle_grid_mode');
  if (gridModeSwitch) {
    gridModeSwitch.checked = window.isGridModeEnabled;
  }
}

// グリッドモードスイッチのイベント
const gridModeSwitch = document.getElementById('toggle_grid_mode');
if (gridModeSwitch) {
  gridModeSwitch.addEventListener('change', (e) => {
    // m3e-switch は 'selected' プロパティで状態を公開するが、念のため 'checked' も考慮
    const newState = e.target.checked;
    window.isGridModeEnabled = newState;
    localStorage.setItem(LS_KEYS.GRID_MODE_ENABLED, window.isGridModeEnabled);
    
    // グリッド線の表示/非表示
    const overlay = document.getElementById('change_widget_position_modal_overlay');
    if (window.isGridModeEnabled) {
      overlay.classList.add('grid-mode');
    } else {
      overlay.classList.remove('grid-mode');
    }
    
    // 自動スナップは行わない（ユーザーの操作を尊重）
  });
}


// すべてのアイコンに通常モードのドラッグを設定
function initNormalModeDrag() {

  document.querySelectorAll(".appicon,.widget").forEach(item => {
    setupNormalModeDrag(item);
  });
}

// 位置をリセットする関数
function resetWidgetPositions() {
  // localStorageから位置データを削除
  localStorage.removeItem(LS_KEYS.WIDGET_POSITIONS);
  
  // すべてのアイコンとウィジェットの位置をリセット
  document.querySelectorAll('.appicon, .widget').forEach(el => {
    el.style.position = '';
    el.style.left = '';
    el.style.top = '';
  });
  
  // モーダルを閉じる
  exitPositionChangeMode();
}

document.getElementById('reset_widget_position').onclick = () => {
  (async () => {
      const confirmMsg = i18n.t('reset_positions_confirm');
      if (await showConfirmDialog(confirmMsg)) {      resetWidgetPositions();
    }
  })();
}

document.getElementById('save_change_widget_position').onclick = () => {
  const positions = {};
  document.querySelectorAll('.appicon, .widget').forEach(el => {
    const key = el.id || el.dataset.saveKey;
    if (key) {
      positions[key] = {
        left: el.style.left || (el.offsetLeft + 'px'),
        top: el.style.top || (el.offsetTop + 'px'),
        position: 'absolute'
      };
    }
  });
  localStorage.setItem(LS_KEYS.WIDGET_POSITIONS, JSON.stringify(positions));
  
  exitPositionChangeMode();
}

// アプリ追加タイプ選択
document.getElementById('add_web_app_btn').onclick = () => {
  closeAllModals();
  document.getElementById('add_newapp_modal_overlay').style.display = 'flex';
}

document.getElementById('add_linux_app_btn').onclick = () => {
  closeAllModals();
  document.getElementById('add_linuxapp_modal_overlay').style.display = 'flex';
}

document.getElementById('close_add_app_type_modal').onclick = () => {
  document.getElementById('add_app_type_modal_overlay').style.display = 'none';
}

document.getElementById('close_add_newapp_modal').onclick = () => {
  document.getElementById('add_newapp_modal_overlay').style.display = 'none';
}

const developerUserAgent = document.getElementById('developer_user_agent');
if (developerUserAgent) {
  developerUserAgent.textContent = window.navigator.userAgent.toLowerCase();
}

const openDevToolsBtn = document.getElementById('open_devtools_btn');
if (openDevToolsBtn) {
  openDevToolsBtn.onclick = () => {
    if (window.electronAPI && window.electronAPI.openDevTools) {
      window.electronAPI.openDevTools();
    }
  };
}

document.getElementById('refresh_page').onclick = () => {
  location.reload();
}

// Translations and language selector logic have been moved to i18n.js

// ========================================
// カラースキーム設定
// ========================================

const colorSchemes = window.StyleManager.colorSchemes;
const updateColorScheme = window.StyleManager.updateColorScheme.bind(window.StyleManager);
const applyCustomColor = window.StyleManager.applyCustomColor.bind(window.StyleManager);
const rgbToHsl = window.StyleManager.rgbToHsl.bind(window.StyleManager);
const hslToHex = window.StyleManager.hslToHex.bind(window.StyleManager);
const resetCustomColorVars = window.StyleManager.resetCustomColorVars.bind(window.StyleManager);

// カラーパレットの初期化
const colorPalette = document.getElementById('color_palette');
const customColorPicker = document.getElementById('custom_color_picker');

if (colorPalette) {
  colorPalette.addEventListener('click', (e) => {
    const swatch = e.target.closest('.color-swatch');
    if (swatch && swatch.dataset.color && !swatch.classList.contains('color-picker-swatch')) {
      // カスタムカラーのCSS変数をリセット
      resetCustomColorVars();
      updateColorScheme(swatch.dataset.color);
    }
  });
  
  // 保存された設定を復元
  const savedScheme = localStorage.getItem(LS_KEYS.COLOR_SCHEME) || 'blue';
  const savedCustomColor = localStorage.getItem(LS_KEYS.CUSTOM_COLOR);
  
  if (savedScheme === 'custom' && savedCustomColor) {
    if (customColorPicker) {
      customColorPicker.value = savedCustomColor;
    }
    updateColorScheme('custom', savedCustomColor);
  } else {
    updateColorScheme(savedScheme);
  }
}

if (customColorPicker) {
  customColorPicker.addEventListener('input', (e) => {
    updateColorScheme('custom', e.target.value);
  });
}

// 画像から色抽出
const extractColorBtn = document.getElementById('extract_color_btn');
const colorSchemeImageInput = document.getElementById('color_scheme_image_input');

if (extractColorBtn && colorSchemeImageInput) {
  extractColorBtn.onclick = () => colorSchemeImageInput.click();
  
  colorSchemeImageInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const color = await getDominantColor(evt.target.result);
          // カスタムカラーとして適用
          if (customColorPicker) {
            customColorPicker.value = color;
          }
          updateColorScheme('custom', color);
        } catch (err) {
          console.error("Failed to extract color:", err);
        }
      };
      reader.readAsDataURL(file);
    }
  };
}

// 設定ボタン（FAB）の表示/非表示設定
const settingsFab = document.getElementById('settings_fab');
const toggleSettingsFabBtn = document.getElementById('toggle_settings_fab');

function updateSettingsFabVisibility(isVisible) {
  if (settingsFab) {
    settingsFab.style.display = isVisible ? 'flex' : 'none';
  }
  if (toggleSettingsFabBtn) {
    toggleSettingsFabBtn.checked = isVisible;
  }
  localStorage.setItem(LS_KEYS.SHOW_SETTINGS_FAB, isVisible);
}

if (toggleSettingsFabBtn) {
  // 保存された設定を復元（デフォルトは非表示）
  const showFab = localStorage.getItem(LS_KEYS.SHOW_SETTINGS_FAB) === 'true';
  updateSettingsFabVisibility(showFab);
  
  toggleSettingsFabBtn.addEventListener('change', (e) => {
    const newState = e.target.checked;
    updateSettingsFabVisibility(newState);
  });
}

// ブラー効果の設定
const toggleBlurEffectBtn = document.getElementById('toggle_blur_effect');
const updateBlurEffect = window.StyleManager.updateBlurEffect.bind(window.StyleManager);

if (toggleBlurEffectBtn) {
  // 保存された設定を復元（デフォルトは無効）
  const blurEnabled = localStorage.getItem(LS_KEYS.BLUR_EFFECT_ENABLED) === 'true';
  updateBlurEffect(blurEnabled);
  
  toggleBlurEffectBtn.addEventListener('change', (e) => {
    const newState = e.target.checked;
    updateBlurEffect(newState);
  });
}

// アニメーション効果無効化の設定
const toggleDisableAnimationsBtn = document.getElementById('toggle_disable_animations');
const updateAnimationsDisabled = window.StyleManager.updateAnimationsDisabled.bind(window.StyleManager);

if (toggleDisableAnimationsBtn) {
  const animationsDisabled = localStorage.getItem(LS_KEYS.ANIMATIONS_DISABLED) === 'true';
  toggleDisableAnimationsBtn.checked = animationsDisabled;
  updateAnimationsDisabled(animationsDisabled);
  
  toggleDisableAnimationsBtn.addEventListener('change', (e) => {
    const newState = e.target.checked;
    updateAnimationsDisabled(newState);
  });
} else {
  // UIボタンが無い場合も初期設定を適用
  const animationsDisabled = localStorage.getItem(LS_KEYS.ANIMATIONS_DISABLED) === 'true';
  updateAnimationsDisabled(animationsDisabled);
}

// パフォーマンス設定: メディアポーリング間隔とスマートポーリング
const mediaPollingIntervalSelector = document.getElementById('media_polling_interval_selector');
const toggleMediaSmartPollingBtn = document.getElementById('toggle_media_smart_polling');

async function updateMediaPollingActiveState() {
  const smartPollingEnabled = localStorage.getItem(LS_KEYS.MEDIA_SMART_POLLING) !== 'false';
  const isWidgetVisible = widgetVisibility['media_player_widget'] === true;
  
  let isActive = true;
  if (smartPollingEnabled) {
    isActive = isWidgetVisible;
  }
  
  if (window.electronAPI && window.electronAPI.setMediaPollingActive) {
    await window.electronAPI.setMediaPollingActive(isActive);
  }
}
window.updateMediaPollingActiveState = updateMediaPollingActiveState;

if (mediaPollingIntervalSelector) {
  const savedInterval = localStorage.getItem(LS_KEYS.MEDIA_POLLING_INTERVAL) || '1000';
  setSelectValue(mediaPollingIntervalSelector, savedInterval);
  
  if (window.electronAPI && window.electronAPI.setMediaPollingInterval) {
    window.electronAPI.setMediaPollingInterval(parseInt(savedInterval));
  }
  
  mediaPollingIntervalSelector.addEventListener('change', async (e) => {
    const val = e.target.value;
    localStorage.setItem(LS_KEYS.MEDIA_POLLING_INTERVAL, val);
    if (window.electronAPI && window.electronAPI.setMediaPollingInterval) {
      await window.electronAPI.setMediaPollingInterval(parseInt(val));
    }
  });
}

if (toggleMediaSmartPollingBtn) {
  const smartPollingEnabled = localStorage.getItem(LS_KEYS.MEDIA_SMART_POLLING) !== 'false';
  toggleMediaSmartPollingBtn.checked = smartPollingEnabled;
  localStorage.setItem(LS_KEYS.MEDIA_SMART_POLLING, smartPollingEnabled);
  
  toggleMediaSmartPollingBtn.addEventListener('change', async (e) => {
    const newState = e.target.checked;
    localStorage.setItem(LS_KEYS.MEDIA_SMART_POLLING, newState);
    await updateMediaPollingActiveState();
  });
}

// 起動時にスマートポーリングの状態を評価
setTimeout(updateMediaPollingActiveState, 1000);

// テーマ設定
const darkModeSelector = document.getElementById('dark_mode_selector');
const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)');
const applyTheme = window.StyleManager.applyTheme.bind(window.StyleManager);

if (darkModeSelector) {
  // 保存された設定を読み込み
  let savedMode = localStorage.getItem(LS_KEYS.DARK_MODE_SETTING);
  
  // 以前の設定からの移行
  if (!savedMode) {
    const oldEnabled = localStorage.getItem(LS_KEYS.DARK_MODE_ENABLED);
    if (oldEnabled !== null) {
      savedMode = oldEnabled === 'true' ? 'dark' : 'light';
    } else {
      savedMode = 'system';
    }
  }
  
  // セレクターの初期値を設定
  setSelectValue(darkModeSelector, savedMode);
  applyTheme(savedMode);
  
  darkModeSelector.addEventListener('change', (e) => {
    applyTheme(e.target.value);
  });
  
  // システム設定の変更監視
  systemDarkMode.addEventListener('change', (e) => {
    const currentMode = localStorage.getItem(LS_KEYS.DARK_MODE_SETTING) || 'system';
    if (currentMode === 'system') {
      applyTheme('system');
    }
  });
}

// アイコン形状の設定: 初期状態を適用
// ウィンドウ数の設定
const windowCountSelector = document.getElementById('window_count_selector');
const applyWindowCountBtn = document.getElementById('apply_window_count');

// ウィンドウ数セレクターの初期化
const initWindowCountSelector = window.SystemSettingsManager.initWindowCountSelector.bind(window.SystemSettingsManager);

// 初期化実行
initWindowCountSelector();
updateGridSizeUI();

// ディスプレイセレクターの初期化
const initDisplaySelector = window.SystemSettingsManager.initDisplaySelector.bind(window.SystemSettingsManager);

// ウィンドウリサイズ設定の初期化
const initWindowResizableSwitch = window.SystemSettingsManager.initWindowResizableSwitch.bind(window.SystemSettingsManager);

// デベロッパーツール自動起動設定の初期化
const initAutoOpenDevToolsSwitch = window.SystemSettingsManager.initAutoOpenDevToolsSwitch.bind(window.SystemSettingsManager);

// 適用ボタンのイベント
if (applyWindowCountBtn && windowCountSelector) {
  applyWindowCountBtn.onclick = async () => {
    const newCount = parseInt(windowCountSelector.value, 10);
    const lang = getCurrentLanguage();
    
    if (await showConfirmDialog(i18n.t('confirm_restart'))) {
      if (window.electronAPI && window.electronAPI.setWindowCount) {
        await window.electronAPI.setWindowCount(newCount);
      }
      if (window.electronAPI && window.electronAPI.restartApp) {
        await window.electronAPI.restartApp();
      }
    }
  };
}

// フォルダー一括設定
const applyFolderStyleAllBtn = document.getElementById('apply_folder_style_all');
if (applyFolderStyleAllBtn) {
  applyFolderStyleAllBtn.onclick = async () => {
    const color = document.getElementById('global_folder_bg_color').value;
    const opacitySlider = document.getElementById('global_folder_bg_opacity');
    const opacity = opacitySlider.querySelector('m3e-slider-thumb')?.value || 1;
    
    Object.keys(window.folders).forEach(folderId => {
      window.folders[folderId].style = { color, opacity };
    });
    Object.keys(window.folders).forEach(folderId => updateFolderIcon(folderId));
    saveFolders();
    
    // 開いているフォルダーがあれば更新
    if (window.currentOpenFolderId) {
      applyFolderStyle(window.currentOpenFolderId);
    }
    
    await showAlertDialog(i18n.t('applied_to_all_folders'));
  };
}


// New App Modal Logic
const newAppImageTrigger = document.getElementById('new_app_image_trigger');
const newAppFileInput = document.getElementById('new_app_image_file');
const newAppImagePreview = document.getElementById('new_app_image_preview');
let newAppIconDataUrl = './assets/app.png'; // Default icon

if (newAppImageTrigger && newAppFileInput) {
  newAppImageTrigger.onclick = () => newAppFileInput.click();
  newAppFileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const resizedDataUrl = await resizeImage(evt.target.result, 740, 740);
          newAppIconDataUrl = resizedDataUrl;
          newAppImagePreview.src = newAppIconDataUrl;
          newAppImagePreview.style.display = 'block';
        } catch (err) {
          console.error("Failed to resize image:", err);
          newAppIconDataUrl = evt.target.result;
          newAppImagePreview.src = newAppIconDataUrl;
          newAppImagePreview.style.display = 'block';
        }
      };
      reader.readAsDataURL(file);
    }
  };
}

// 全データ削除機能
const deleteAllDataBtn = document.getElementById('delete_all_data_btn');
if (deleteAllDataBtn) {
  deleteAllDataBtn.onclick = async () => {
    const lang = getCurrentLanguage();
    const confirmMsg = i18n.t('confirm_delete_all_data');
    
    if (await showConfirmDialog(confirmMsg)) {
      // localStorageの全データを削除
      localStorage.clear();
      
      // 削除完了メッセージを表示してページをリロード
      await showAlertDialog(i18n.t('data_deleted'));
      location.reload();
    }
  };
}

const saveNewAppBtn = document.getElementById('save_new_app');

if (saveNewAppBtn) {
  saveNewAppBtn.onclick = async () => {
    let name = document.getElementById('new_app_name').value;
    let url = document.getElementById('new_app_url').value;
    if (window.SecurityManager) {
      name = await window.SecurityManager.sanitizeInput(name);
      url = window.SecurityManager.sanitizeUrlInput(url);
    }
    
    if (!name || !url) {
      const lang = getCurrentLanguage();
      await showAlertDialog(i18n.t('enter_name_and_url'));
      return;
    }
    if (!url.startsWith('chrome://') && window.SecurityManager && !window.SecurityManager.isUrlAllowed(url)) {
      await showAlertDialog(i18n.t('blocked_url'));
      return;
    }
    
    const newApp = {
      name: name,
      url: url,
      icon: newAppIconDataUrl,
      saveKey: 'custom-app-' + name.replace(/\s+/g, '-') + '-' + Date.now()
    };
    
    const customApps = JSON.parse(localStorage.getItem(LS_KEYS.CUSTOM_APPS) || '[]');
    customApps.push(newApp);
    localStorage.setItem(LS_KEYS.CUSTOM_APPS, JSON.stringify(customApps));
    
    createDesktopIcon(newApp);
    if (window.SecurityManager && typeof window.SecurityManager.ensureAllowedDomain === 'function') {
      window.SecurityManager.ensureAllowedDomain(url);
    }
    
    // Close modal and reset
    document.getElementById('add_newapp_modal_overlay').style.display = 'none';
    document.getElementById('new_app_name').value = '';
    document.getElementById('new_app_url').value = '';
    newAppImagePreview.style.display = 'none';
    newAppIconDataUrl = './assets/app.png';
  };
}

// Load saved apps (skip those in folders)

const savedCustomApps = JSON.parse(localStorage.getItem(LS_KEYS.CUSTOM_APPS) || '[]');
savedCustomApps.forEach(app => {
  if (!isAppInFolder(folderApp => folderApp.url && folderApp.url === app.url && folderApp.name === app.name)) {
    createDesktopIcon(app);
  }
});

// Linuxアプリのアイコン作成

// Linuxアプリモーダルの処理

const linuxAppImageInput = document.getElementById('linux_app_image_file');
const linuxAppImageTrigger = document.getElementById('linux_app_image_trigger');
const linuxAppImagePreview = document.getElementById('linux_app_image_preview');
let linuxAppIconDataUrl = './assets/linux.png';

if (linuxAppImageTrigger && linuxAppImageInput) {
  linuxAppImageTrigger.onclick = () => linuxAppImageInput.click();
  
  linuxAppImageInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const resizedDataUrl = await resizeImage(evt.target.result, 740, 740);
          linuxAppIconDataUrl = resizedDataUrl;
          linuxAppImagePreview.src = linuxAppIconDataUrl;
          linuxAppImagePreview.style.display = 'block';
        } catch (err) {
          console.error("Failed to resize image:", err);
          linuxAppIconDataUrl = evt.target.result;
          linuxAppImagePreview.src = linuxAppIconDataUrl;
          linuxAppImagePreview.style.display = 'block';
        }
      };
      reader.readAsDataURL(file);
    }
  };
}

document.getElementById('close_add_linuxapp_modal').onclick = () => {
  document.getElementById('add_linuxapp_modal_overlay').style.display = 'none';
}

const saveLinuxAppBtn = document.getElementById('save_linux_app');
if (saveLinuxAppBtn) {
  saveLinuxAppBtn.onclick = async () => {
    let name = document.getElementById('linux_app_name').value;
    let command = document.getElementById('linux_app_command').value;
    if (window.SecurityManager) {
      name = await window.SecurityManager.sanitizeInput(name);
      command = window.SecurityManager.sanitizeCommandInput(command);
    }
    const runInTerminal = document.getElementById('linux_app_run_in_terminal').checked;
    
    if (!name || !command) {
      await showAlertDialog(i18n.t('enter_name_and_command'));
      return;
    }
    
    const newApp = {
      name: name,
      command: command,
      icon: linuxAppIconDataUrl,
      runInTerminal: runInTerminal,
      saveKey: 'linux-app-' + name.replace(/\s+/g, '-') + '-' + Date.now()
    };
    
    const linuxApps = JSON.parse(localStorage.getItem(LS_KEYS.LINUX_APPS) || '[]');
    linuxApps.push(newApp);
    localStorage.setItem(LS_KEYS.LINUX_APPS, JSON.stringify(linuxApps));
    
    createLinuxAppIcon(newApp);
    if (window.SecurityManager && typeof window.SecurityManager.ensureAllowedForCommand === 'function') {
      window.SecurityManager.ensureAllowedForCommand(command);
    }
    
    // Close modal and reset
    document.getElementById('add_linuxapp_modal_overlay').style.display = 'none';
    document.getElementById('linux_app_name').value = '';
    document.getElementById('linux_app_command').value = '';
    document.getElementById('linux_app_run_in_terminal').checked = false;
    linuxAppImagePreview.style.display = 'none';
    linuxAppIconDataUrl = './assets/linux.png';
  };
}

// Load saved folders first (to know which apps are in folders)
loadFolders();

// Hide builtin icons if they are already in folders
['appicon-chrome', 'appicon-files', 'appicon-settings'].forEach(id => {
  if (isAppInFolder(app => app.isBuiltin && app.id === id)) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  }
});

// Load saved Linux apps (skip those in folders)
const savedLinuxApps = JSON.parse(localStorage.getItem(LS_KEYS.LINUX_APPS) || '[]');
savedLinuxApps.forEach(app => {
  if (!isAppInFolder(folderApp => (folderApp.command && folderApp.command === app.command) || (folderApp.isLinuxApp && folderApp.name === app.name))) {
    createLinuxAppIcon(app);
  }
});


// Restore positions
const clockWidget = document.querySelector('.clock');
if (clockWidget && !clockWidget.id) clockWidget.id = 'widget-clock';

const mediaPlayerWidgetEl = document.querySelector('.media-player');
if (mediaPlayerWidgetEl && !mediaPlayerWidgetEl.id) mediaPlayerWidgetEl.id = 'widget-media-player';

function restoreWidgetPositions() {
  const positions = JSON.parse(localStorage.getItem(LS_KEYS.WIDGET_POSITIONS) || '{}');
  
  const screenWidth = window.innerWidth;
  const padding = 20;

  // 時計ウィジェットのデフォルト位置 (データがない場合のみ設定)
  if (!positions['widget-clock']) {
    positions['widget-clock'] = {
      left: (screenWidth - 220 - padding) + 'px',
      top: padding + 'px',
      position: 'absolute'
    };
  }
  
  // 天気ウィジェットのデフォルト位置 (データがない場合のみ設定)
  if (!positions['weather_widget']) {
    positions['weather_widget'] = {
      left: (screenWidth - 220 - padding) + 'px',
      top: (padding + 260) + 'px',
      position: 'absolute'
    };
  }

  Object.keys(positions).forEach(key => {
    let el = document.getElementById(key);
    if (!el) {
      el = document.querySelector(`[data-save-key="${key}"]`);
    }
    if (el) {
      el.style.position = positions[key].position;
      el.style.left = positions[key].left;
      el.style.top = positions[key].top;
    }
  });
}
restoreWidgetPositions();

// 通常モードのドラッグを初期化
initNormalModeDrag();

// 起動時に保存された形状を全アイコン（およびフォルダ内プレビュー）に適用
try {
  // ビルトインアイコンの個別形状を復元
  const builtinShapes = JSON.parse(localStorage.getItem('builtin_icon_shapes') || '{}');
  Object.keys(builtinShapes).forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.dataset.shape = builtinShapes[id];
    }
  });

  window.StyleManager.updateIconShape(getCurrentIconShape());
  window.StyleManager.updateClockShape(getCurrentClockShape());
} catch (e) {
  console.warn('Failed to apply shapes on init:', e);
}

// ========================================
// コンテキストメニューと編集機能
// ========================================

/**
 * コンテキストメニューを表示
 */
const showContextMenu = window.ContextMenuManager.showContextMenu.bind(window.ContextMenuManager);

/**
 * メニューを非表示にする
 */
const hideContextMenu = window.ContextMenuManager.hideContextMenu.bind(window.ContextMenuManager);

// 画面クリックでコンテキストメニューを閉じる
document.addEventListener('click', hideContextMenu);

// デスクトップのコンテキストメニュー
const desktopIconsContainer = document.getElementById('desktop_icons');
const desktopContextMenu = document.getElementById('desktop_context_menu');

if (desktopIconsContainer && desktopContextMenu) {
  desktopIconsContainer.addEventListener('contextmenu', (e) => {
    // アイコンやウィジェットの上で右クリックされた場合は、その要素のコンテキストメニューを優先
    if (e.target.closest('.appicon, .widget')) {
      return;
    }
    e.preventDefault();
    window.ContextMenuManager.showDesktopContextMenu(e);
  });

  document.getElementById('desktop_context_add_app').onclick = (e) => {
    e.stopPropagation();
    closeAllModals();
    document.getElementById('add_app_type_modal_overlay').style.display = 'flex';
  };
  document.getElementById('desktop_context_add_widget').onclick = (e) => {
    e.stopPropagation();
    closeAllModals();
    openAddWidgetModal();
  };
  document.getElementById('desktop_context_settings').onclick = (e) => {
    e.stopPropagation();
    closeAllModals();
    document.getElementById('settingsmenu_modal_overlay').style.display = 'flex';
  };
  document.getElementById('desktop_context_change_position').onclick = (e) => {
    e.stopPropagation();
    // closeAllModals is called inside enterPositionChangeMode
    enterPositionChangeMode();
  };
}

// ========================================
// ウィジェット追加モーダル (Aluminium OS Style)
// ========================================
const addWidgetModalOverlay = document.getElementById('add_widget_modal_overlay');
const closeAddWidgetModalBtn = document.getElementById('close_add_widget_modal');
const widgetPickerSearchInput = document.getElementById('widget_picker_search');
const widgetPickerCategoriesContainer = document.getElementById('widget_picker_categories');
const widgetPickerPreviewArea = document.getElementById('widget_picker_preview_area');

let currentWidgetPickerCategory = 'featured';
let widgetPickerSearchQuery = '';

// Widget category definitions matching Aluminium OS widgets
const widgetCategoryDefinitions = [
  {
    id: 'featured',
    name: 'Featured',
    icon: 'star',
    iconType: 'icon',
    count: 4,
    widgets: ['widget-clock', 'weather_widget', 'media_player_widget', 'google_calendar_widget']
  },
  {
    id: 'clock',
    name: 'Clock',
    icon: 'schedule',
    iconType: 'icon',
    count: 1,
    widgets: ['widget-clock']
  },
  {
    id: 'weather',
    name: 'Weather',
    icon: 'cloud',
    iconType: 'icon',
    count: 1,
    widgets: ['weather_widget']
  },
  {
    id: 'media',
    name: 'Media Player',
    icon: 'music_note',
    iconType: 'icon',
    count: 1,
    widgets: ['media_player_widget']
  },
  {
    id: 'calendar',
    name: 'Google Calendar',
    icon: 'calendar_month',
    iconType: 'icon',
    count: 1,
    widgets: ['google_calendar_widget']
  },
  {
    id: 'gmail',
    name: 'Gmail',
    icon: 'mail',
    iconType: 'icon',
    count: 1,
    widgets: ['gmail_widget']
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: 'code',
    iconType: 'icon',
    count: 1,
    widgets: ['github_contribution_widget']
  },
  {
    id: 'gemini',
    name: 'Gemini Intelligence',
    icon: 'auto_awesome',
    iconType: 'icon',
    count: 1,
    widgets: ['gemini_pointer']
  }
];

function getWidgetMetadata(widgetId) {
  switch (widgetId) {
    case 'widget-clock':
      return {
        id: 'widget-clock',
        name: window.i18n ? window.i18n.t('clock') || 'Clock' : 'Clock',
        appName: 'Clock',
        appIcon: 'schedule',
        origWidth: 212,
        origHeight: 210,
        viewWidth: 140,
        viewHeight: 140,
        scale: 0.65
      };
    case 'weather_widget':
      return {
        id: 'weather_widget',
        name: window.i18n ? window.i18n.t('weather') || 'Weather' : 'Weather',
        appName: 'Weather',
        appIcon: 'cloud',
        origWidth: 180,
        origHeight: 180,
        viewWidth: 140,
        viewHeight: 140,
        scale: 0.77
      };
    case 'media_player_widget':
      return {
        id: 'media_player_widget',
        name: window.i18n ? window.i18n.t('media_player') || 'Media Player' : 'Media Player',
        appName: 'Media Player',
        appIcon: 'music_note',
        origWidth: 320,
        origHeight: 180,
        viewWidth: 210,
        viewHeight: 120,
        scale: 0.65
      };
    case 'google_calendar_widget':
      return {
        id: 'google_calendar_widget',
        name: 'Google Calendar',
        appName: 'Google Calendar',
        appIcon: 'calendar_month',
        origWidth: 380,
        origHeight: 320,
        viewWidth: 210,
        viewHeight: 140,
        scale: 0.52
      };
    case 'gmail_widget':
      return {
        id: 'gmail_widget',
        name: 'Gmail',
        appName: 'Gmail',
        appIcon: 'mail',
        origWidth: 360,
        origHeight: 280,
        viewWidth: 200,
        viewHeight: 130,
        scale: 0.52
      };
    case 'github_contribution_widget':
      return {
        id: 'github_contribution_widget',
        name: 'GitHub Contributions',
        appName: 'GitHub',
        appIcon: 'code',
        origWidth: 380,
        origHeight: 220,
        viewWidth: 220,
        viewHeight: 125,
        scale: 0.56
      };
    case 'gemini_pointer':
      return {
        id: 'gemini_pointer',
        name: 'Gemini Intelligence',
        appName: 'Gemini',
        appIcon: 'auto_awesome',
        origWidth: 320,
        origHeight: 220,
        viewWidth: 180,
        viewHeight: 125,
        scale: 0.56
      };
    default:
      return null;
  }
}

async function openAddWidgetModal() {
  if (!addWidgetModalOverlay) return;

  currentWidgetPickerCategory = 'featured';
  widgetPickerSearchQuery = '';
  if (widgetPickerSearchInput) {
    widgetPickerSearchInput.value = '';
  }

  // Preload all widget CSS and JS so that the cloned widgets render with accurate styling and structure
  if (window.WidgetLoader) {
    const allWidgetIds = Object.keys(availableWidgets);
    await Promise.all(allWidgetIds.map(id => window.WidgetLoader.load(id)));
  }

  renderWidgetPickerCategories();
  renderWidgetPickerPreviews();

  if (window.i18n && typeof window.i18n.applyTranslations === 'function') {
    window.i18n.applyTranslations(addWidgetModalOverlay);
  }

  addWidgetModalOverlay.style.display = 'flex';
}

function renderWidgetPickerCategories() {
  if (!widgetPickerCategoriesContainer) return;
  widgetPickerCategoriesContainer.innerHTML = '';

  const query = widgetPickerSearchQuery.toLowerCase().trim();

  widgetCategoryDefinitions.forEach(cat => {
    // If search active, check if category or contained widgets match
    if (query) {
      const matchCat = cat.name.toLowerCase().includes(query);
      const matchWidgets = cat.widgets.some(wId => {
        const meta = getWidgetMetadata(wId);
        return meta && (meta.name.toLowerCase().includes(query) || meta.appName.toLowerCase().includes(query));
      });
      if (!matchCat && !matchWidgets) return;
    }

    const btn = document.createElement('button');
    btn.className = `widget-category-item ${currentWidgetPickerCategory === cat.id ? 'active' : ''}`;
    btn.onclick = () => {
      currentWidgetPickerCategory = cat.id;
      renderWidgetPickerCategories();
      renderWidgetPickerPreviews();
    };

    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'widget-category-icon-wrapper';
    iconWrapper.innerHTML = `<m3e-icon name="${cat.icon}"></m3e-icon>`;

    const info = document.createElement('div');
    info.className = 'widget-category-info';

    const name = document.createElement('div');
    name.className = 'widget-category-name';
    name.textContent = cat.name;

    const count = document.createElement('div');
    count.className = 'widget-category-count';
    count.textContent = `${cat.count} ${cat.count === 1 ? 'widget' : 'widgets'}`;

    info.appendChild(name);
    info.appendChild(count);
    btn.appendChild(iconWrapper);
    btn.appendChild(info);

    widgetPickerCategoriesContainer.appendChild(btn);
  });
}

function renderWidgetPickerPreviews() {
  if (!widgetPickerPreviewArea) return;
  widgetPickerPreviewArea.innerHTML = '';

  const cat = widgetCategoryDefinitions.find(c => c.id === currentWidgetPickerCategory) || widgetCategoryDefinitions[0];
  const query = widgetPickerSearchQuery.toLowerCase().trim();

  let targetWidgets = cat.widgets;

  if (query) {
    // When searching, search all widgets
    const allUnique = Array.from(new Set(widgetCategoryDefinitions.flatMap(c => c.widgets)));
    targetWidgets = allUnique.filter(wId => {
      const meta = getWidgetMetadata(wId);
      return meta && (meta.name.toLowerCase().includes(query) || meta.appName.toLowerCase().includes(query));
    });
  }

  targetWidgets.forEach(widgetId => {
    const meta = getWidgetMetadata(widgetId);
    if (!meta) return;

    const isVisible = widgetId === 'gemini_pointer' ? false : (widgetVisibility[widgetId] || false);

    const card = document.createElement('div');
    card.className = `widget-preview-card ${isVisible ? 'added' : ''}`;
    card.title = isVisible ? (window.i18n ? window.i18n.t('widget_already_added') || 'Already Added' : 'Already Added') : (window.i18n ? window.i18n.t('add') || 'Add' : 'Add');

    const wrapper = document.createElement('div');
    wrapper.className = 'widget-preview-wrapper';

    const viewport = document.createElement('div');
    viewport.className = 'widget-real-preview-viewport';
    viewport.style.width = `${meta.viewWidth}px`;
    viewport.style.height = `${meta.viewHeight}px`;

    const scaler = document.createElement('div');
    scaler.className = 'widget-real-preview-scaler';
    scaler.style.width = `${meta.origWidth}px`;
    scaler.style.height = `${meta.origHeight}px`;
    scaler.style.transform = `scale(${meta.scale})`;

    if (widgetId === 'gemini_pointer') {
      scaler.innerHTML = `
        <div class="mini-gemini-preview" style="width: ${meta.origWidth}px; height: ${meta.origHeight}px;">
          <div class="mini-gemini-pill">
            <div style="display: flex; align-items: center; gap: 6px;">
              <m3e-icon name="auto_awesome" style="font-size: 18px; color: #a8c7fa;"></m3e-icon>
              <span style="font-size: 14px;">Gemini</span>
            </div>
            <m3e-icon name="mic" style="font-size: 18px;"></m3e-icon>
          </div>
          <div class="mini-gemini-actions" style="gap: 12px; margin-top: 6px;">
            <div class="mini-gemini-btn" style="height: 48px;"><m3e-icon name="photo_camera" style="font-size: 22px;"></m3e-icon></div>
            <div class="mini-gemini-btn" style="height: 48px;"><m3e-icon name="attach_file" style="font-size: 22px;"></m3e-icon></div>
            <div class="mini-gemini-btn" style="height: 48px;"><m3e-icon name="image" style="font-size: 22px;"></m3e-icon></div>
            <div class="mini-gemini-btn" style="height: 48px;"><m3e-icon name="graphic_eq" style="font-size: 22px;"></m3e-icon></div>
          </div>
        </div>
      `;
    } else {
      const realEl = document.getElementById(widgetId);
      if (realEl) {
        const clone = realEl.cloneNode(true);
        clone.id = `preview_clone_${widgetId}`;
        clone.style.display = 'flex';
        clone.style.position = 'static';
        clone.style.transform = 'none';
        clone.style.margin = '0';
        clone.classList.remove('header-always-hide', 'header-hover-show');
        scaler.appendChild(clone);
      }
    }

    viewport.appendChild(scaler);
    wrapper.appendChild(viewport);

    if (isVisible) {
      const badge = document.createElement('m3e-badge');
      badge.className = 'widget-preview-badge';
      badge.setAttribute('size', 'medium');
      badge.textContent = '✓ Added';
      wrapper.appendChild(badge);
    }

    const labelRow = document.createElement('div');
    labelRow.className = 'widget-preview-label-row';
    labelRow.innerHTML = `<m3e-icon name="${meta.appIcon}"></m3e-icon><span>${escapeHTML(meta.name)}</span>`;

    card.appendChild(wrapper);
    card.appendChild(labelRow);

    card.onclick = async () => {
      if (widgetId === 'gemini_pointer') {
        // Open Magic Pointer
        addWidgetModalOverlay.style.display = 'none';
        showAIPromptCard(window.innerWidth / 2 - 160, window.innerHeight / 2 - 100);
        return;
      }

      if (!isVisible) {
        await setWidgetVisibility(widgetId, true);
        addWidgetModalOverlay.style.display = 'none';
      }
    };

    widgetPickerPreviewArea.appendChild(card);
  });
}

// Search input listener
if (widgetPickerSearchInput) {
  widgetPickerSearchInput.addEventListener('input', (e) => {
    widgetPickerSearchQuery = e.target.value;
    renderWidgetPickerCategories();
    renderWidgetPickerPreviews();
  });
}

if (closeAddWidgetModalBtn) {
  closeAddWidgetModalBtn.onclick = () => {
    if (addWidgetModalOverlay) addWidgetModalOverlay.style.display = 'none';
  };
}

// ========================================
// ウィジェットのコンテキストメニュー
// ========================================
const widgetContextMenu = document.getElementById('widget_context_menu');

/**
 * ウィジェット用コンテキストメニューを表示
 */
const showWidgetContextMenu = window.ContextMenuManager.showWidgetContextMenu.bind(window.ContextMenuManager);

// 編集ボタン
document.getElementById('context_edit').onclick = async (e) => {
  e.stopPropagation();
  hideContextMenu();
  
  if (currentContextAppType === 'webapp' || currentContextAppType === 'folder-item-webapp') {
    openEditWebappModal();
  } else if (currentContextAppType === 'folder') {
    openFolderSettingsModal(currentEditingIcon._folderId);
  } else if (currentContextAppType === 'linuxapp' || currentContextAppType === 'folder-item-linuxapp') {
    openEditLinuxappModal();
  } else if (currentContextAppType === 'file' || currentContextAppType === 'folder-shortcut') {
    // ファイル/フォルダショートカットは編集不可（パスは変更できない）
    await showAlertDialog(i18n.t('file_shortcut_edit_msg'));
  }
};

document.getElementById('context_shape').onclick = (e) => {
  e.stopPropagation();
  hideContextMenu();
  if (currentEditingIcon) {
    openIconIndividualShapeModal(currentEditingIcon);
  }
};

function openIconIndividualShapeModal(iconEl) {
  const containerId = 'icon_individual_shape_buttons';
  const currentShape = iconEl.dataset.shape || '';
  const imgSrc = iconEl.querySelector('img')?.src;

  setupShapeButtons(containerId, currentShape, (s) => {
    updateIndividualIconShape(iconEl, s);
  }, imgSrc);

  document.getElementById('icon_individual_shape_modal_overlay').style.display = 'flex';
}

document.getElementById('close_icon_individual_shape_modal').onclick = () => {
  document.getElementById('icon_individual_shape_modal_overlay').style.display = 'none';
};

document.getElementById('reset_individual_shape').onclick = () => {
  if (currentEditingIcon) {
    updateIndividualIconShape(currentEditingIcon, '');
    document.getElementById('icon_individual_shape_modal_overlay').style.display = 'none';
  }
};

function updateIndividualIconShape(iconEl, shape) {
  if (shape) {
    iconEl.dataset.shape = shape;
    window.wrapIconWithShape(iconEl, shape);
  } else {
    delete iconEl.dataset.shape;
    window.wrapIconWithShape(iconEl, window.getCurrentIconShape());
  }

  // データを保存
  saveIconShape(iconEl, shape);
  
  // フォルダ内のプレビュー画像も更新が必要な場合
  if (iconEl.classList.contains('folder')) {
    const folderImages = iconEl.querySelectorAll('.folder-preview img');
    folderImages.forEach(img => window.wrapImageWithShape(img, shape || window.getCurrentIconShape()));
  }
}

function saveIconShape(iconEl, shape) {
  const appData = window.AppManager.getIconData(iconEl);
  appData.shape = shape;
  
  const type = currentContextAppType || '';
  
  if (type === 'webapp' || iconEl.classList.contains('custom-app')) {
    const customApps = JSON.parse(localStorage.getItem(LS_KEYS.CUSTOM_APPS) || '[]');
    const index = customApps.findIndex(a => a.saveKey === iconEl.dataset.saveKey || (a.name === appData.name && a.url === appData.url));
    if (index !== -1) {
      customApps[index].shape = shape;
      localStorage.setItem(LS_KEYS.CUSTOM_APPS, JSON.stringify(customApps));
    }
  } else if (type === 'linuxapp' || iconEl.classList.contains('linux-app')) {
    const linuxApps = JSON.parse(localStorage.getItem(LS_KEYS.LINUX_APPS) || '[]');
    const index = linuxApps.findIndex(a => a.saveKey === iconEl.dataset.saveKey || (a.name === appData.name && a.command === appData.command));
    if (index !== -1) {
      linuxApps[index].shape = shape;
      localStorage.setItem(LS_KEYS.LINUX_APPS, JSON.stringify(linuxApps));
    }
  } else if (type === 'file' || iconEl.classList.contains('file-shortcut')) {
    const fileShortcuts = JSON.parse(localStorage.getItem(LS_KEYS.FILE_SHORTCUTS) || '[]');
    const index = fileShortcuts.findIndex(f => f.saveKey === iconEl.dataset.saveKey || f.path === iconEl._filePath);
    if (index !== -1) {
      fileShortcuts[index].shape = shape;
      localStorage.setItem(LS_KEYS.FILE_SHORTCUTS, JSON.stringify(fileShortcuts));
    }
  } else if (type === 'folder-shortcut' || iconEl.classList.contains('folder-shortcut')) {
    const folderShortcuts = JSON.parse(localStorage.getItem(LS_KEYS.FOLDER_SHORTCUTS) || '[]');
    const index = folderShortcuts.findIndex(f => f.saveKey === iconEl.dataset.saveKey || f.path === iconEl._filePath);
    if (index !== -1) {
      folderShortcuts[index].shape = shape;
      localStorage.setItem(LS_KEYS.FOLDER_SHORTCUTS, JSON.stringify(folderShortcuts));
    }
  } else if (type === 'folder' || iconEl.classList.contains('folder')) {
    const folderId = iconEl._folderId;
    if (window.folders[folderId]) {
      window.folders[folderId].shape = shape;
      saveFolders();
    }
  } else if (type.startsWith('folder-item')) {
    const folderId = iconEl._folderId;
    const index = iconEl._folderIndex;
    if (window.folders[folderId] && window.folders[folderId].apps[index]) {
      window.folders[folderId].apps[index].shape = shape;
      saveFolders();
    }
  } else if (iconEl.id && iconEl.id.startsWith('appicon-')) {
    // ビルトインアイコンの形状保存
    const builtinShapes = JSON.parse(localStorage.getItem('builtin_icon_shapes') || '{}');
    if (shape) {
      builtinShapes[iconEl.id] = shape;
    } else {
      delete builtinShapes[iconEl.id];
    }
    localStorage.setItem('builtin_icon_shapes', JSON.stringify(builtinShapes));
  }
}

document.getElementById('context_delete').onclick = async (e) => {
  e.stopPropagation();
  hideContextMenu();
  
  if (!currentEditingIcon) return;
  
  const appName = currentEditingApp?.name || currentEditingIcon._fileData?.name || 'Unknown';
  const confirmMsg = i18n.t('confirm_delete_app', { name: appName });
  
  // フォルダー内アイテムの場合
  if (currentContextAppType && currentContextAppType.startsWith('folder-item')) {
    const folderConfirmMsg = i18n.t('confirm_remove_from_folder', { name: appName });
    if (await showConfirmDialog(folderConfirmMsg)) {
      const folderId = currentEditingIcon._folderId;
      const index = currentEditingIcon._folderIndex;
      removeFromFolder(folderId, index);
      if (window.folders[folderId]) renderFolderPage(folderId);
      else closeFolder();
    }
    return;
  }
  
  // フォルダーの場合
  if (currentContextAppType === 'folder') {
    if (await showConfirmDialog(confirmMsg)) {
      const folderId = currentEditingIcon._folderId;
      delete window.folders[folderId];
      saveFolders();
      currentEditingIcon.remove();
    }
    return;
  }

  
  if (await showConfirmDialog(confirmMsg)) {
    const saveKey = currentEditingIcon.dataset.saveKey;
    currentEditingIcon.remove();
    
    if (currentContextAppType === 'webapp') {
      const customApps = JSON.parse(localStorage.getItem(LS_KEYS.CUSTOM_APPS) || '[]');
      const newApps = customApps.filter(a => !(a.name === currentEditingApp.name && a.url === currentEditingApp.url));
      localStorage.setItem(LS_KEYS.CUSTOM_APPS, JSON.stringify(newApps));
    } else if (currentContextAppType === 'linuxapp') {
      const linuxApps = JSON.parse(localStorage.getItem(LS_KEYS.LINUX_APPS) || '[]');
      const newApps = linuxApps.filter(a => !(a.name === currentEditingApp.name && a.command === currentEditingApp.command));
      localStorage.setItem(LS_KEYS.LINUX_APPS, JSON.stringify(newApps));
    } else if (currentContextAppType === 'file') {
      const fileShortcuts = JSON.parse(localStorage.getItem(LS_KEYS.FILE_SHORTCUTS) || '[]');
      const newShortcuts = fileShortcuts.filter(f => f.path !== currentEditingIcon._filePath);
      localStorage.setItem(LS_KEYS.FILE_SHORTCUTS, JSON.stringify(newShortcuts));
    } else if (currentContextAppType === 'folder-shortcut') {
      const folderShortcuts = JSON.parse(localStorage.getItem(LS_KEYS.FOLDER_SHORTCUTS) || '[]');
      const newShortcuts = folderShortcuts.filter(f => f.path !== currentEditingIcon._filePath);
      localStorage.setItem(LS_KEYS.FOLDER_SHORTCUTS, JSON.stringify(newShortcuts));
    }
    
    // 位置データも削除
    const positions = JSON.parse(localStorage.getItem(LS_KEYS.WIDGET_POSITIONS) || '{}');
    if (positions[saveKey]) {
      delete positions[saveKey];
      localStorage.setItem(LS_KEYS.WIDGET_POSITIONS, JSON.stringify(positions));
    }
  }
};

// ========================================
// Webアプリ編集モーダル
// ========================================

let editWebappIconDataUrl = '';
const editWebappImageInput = document.getElementById('edit_webapp_image_file');
const editWebappImageTrigger = document.getElementById('edit_webapp_image_trigger');
const editWebappImagePreview = document.getElementById('edit_webapp_image_preview');

if (editWebappImageTrigger && editWebappImageInput) {
  editWebappImageTrigger.onclick = () => editWebappImageInput.click();
  editWebappImageInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const resizedDataUrl = await resizeImage(evt.target.result, 740, 740);
          editWebappIconDataUrl = resizedDataUrl;
          editWebappImagePreview.src = editWebappIconDataUrl;
        } catch (err) {
          console.error("Failed to resize image:", err);
          editWebappIconDataUrl = evt.target.result;
          editWebappImagePreview.src = editWebappIconDataUrl;
        }
      };
      reader.readAsDataURL(file);
    }
  };
}

function openEditWebappModal() {
  closeAllModals();
  if (!currentEditingApp) return;
  
  document.getElementById('edit_webapp_name').value = currentEditingApp.name;
  document.getElementById('edit_webapp_url').value = currentEditingApp.url;
  editWebappImagePreview.src = currentEditingApp.icon;
  editWebappIconDataUrl = currentEditingApp.icon;
  
  document.getElementById('edit_webapp_modal_overlay').style.display = 'flex';
}

document.getElementById('close_edit_webapp_modal').onclick = () => {
  document.getElementById('edit_webapp_modal_overlay').style.display = 'none';
};

document.getElementById('save_edit_webapp').onclick = async () => {
  let name = document.getElementById('edit_webapp_name').value.trim();
  let url = document.getElementById('edit_webapp_url').value.trim();
  if (window.SecurityManager) {
    name = await window.SecurityManager.sanitizeInput(name);
    url = window.SecurityManager.sanitizeUrlInput(url);
  }
  
  if (!name || !url) {
    await showAlertDialog(i18n.t('enter_name_and_url'));
    return;
  }
  if (!url.startsWith('chrome://') && window.SecurityManager && !window.SecurityManager.isUrlAllowed(url)) {
    await showAlertDialog(i18n.t('blocked_url'));
    return;
  }
  
  // フォルダー内アイテムの場合
  if (currentContextAppType === 'folder-item-webapp') {
    const folderId = currentEditingIcon._folderId;
    const index = currentEditingIcon._folderIndex;
    const folder = window.folders[folderId];
    
    if (folder && folder.apps[index]) {
      folder.apps[index].name = name;
      folder.apps[index].url = url;
      folder.apps[index].icon = editWebappIconDataUrl;
      saveFolders();
      updateFolderIcon(folderId);
      renderFolderPage(folderId);
    }
    document.getElementById('edit_webapp_modal_overlay').style.display = 'none';
    return;
  }

  
  // localStorageを更新
  const customApps = JSON.parse(localStorage.getItem(LS_KEYS.CUSTOM_APPS) || '[]');
  const index = customApps.findIndex(a => a.name === currentEditingApp.name && a.url === currentEditingApp.url);
  
  const updatedApp = {
    name: name,
    url: url,
    icon: editWebappIconDataUrl
  };
  
  if (index !== -1) {
    customApps[index] = updatedApp;
  }
  localStorage.setItem(LS_KEYS.CUSTOM_APPS, JSON.stringify(customApps));
  if (window.SecurityManager && typeof window.SecurityManager.ensureAllowedDomain === 'function') {
    window.SecurityManager.ensureAllowedDomain(url);
  }
  
  // アイコンを更新
  if (currentEditingIcon) {
    currentEditingIcon.querySelector('img').src = editWebappIconDataUrl;
    currentEditingIcon.querySelector('p').textContent = name;
    currentEditingIcon._appUrl = url;
    currentEditingIcon._appData = updatedApp;
    
    // onclickも更新
    currentEditingIcon.onclick = () => {
      if (url.startsWith('chrome://')) {
        if (typeof openURL === 'function') openURL(url);
      } else if (window.AppManager && typeof window.AppManager._openUrl === 'function') {
        window.AppManager._openUrl(url);
      } else {
        window.open(url);
      }
    };
  }
  
  document.getElementById('edit_webapp_modal_overlay').style.display = 'none';
};

// ========================================
// フォルダー設定モーダル
// ========================================

let currentSettingsFolderId = null;

function openFolderSettingsModal(folderId) {
  const folderData = window.folders[folderId];
  if (!folderData) return;
  
  currentSettingsFolderId = folderId;

  
  // デフォルトスタイル
  if (!folderData.style) {
    const isDark = document.body.classList.contains('dark-mode');
    folderData.style = { color: isDark ? '#1f1f1f' : '#ffffff', opacity: 1.0 };
  }
  
  document.getElementById('folder_settings_name').value = folderData.name;
  document.getElementById('folder_settings_color').value = folderData.style.color;
  const opacitySlider = document.getElementById('folder_settings_opacity');
  const thumb = opacitySlider.querySelector('m3e-slider-thumb');
  if (thumb) thumb.value = folderData.style.opacity;
  
  document.getElementById('folder_settings_modal_overlay').style.display = 'flex';
}

// フォルダー内の設定ボタン
document.getElementById('folder_style_btn').onclick = (e) => {
  e.stopPropagation();
  if (window.currentOpenFolderId) {
    openFolderSettingsModal(window.currentOpenFolderId);
  }
};


document.getElementById('close_folder_settings_modal').onclick = () => {
  document.getElementById('folder_settings_modal_overlay').style.display = 'none';
  // プレビューで変更されたスタイルを元に戻すために再適用（保存されていない場合）
  if (currentSettingsFolderId) {
    applyFolderStyle(currentSettingsFolderId);
  }
  if (currentSettingsFolderId) updateFolderIcon(currentSettingsFolderId);
  currentSettingsFolderId = null;
};

document.getElementById('save_folder_settings').onclick = () => {
  if (!currentSettingsFolderId || !window.folders[currentSettingsFolderId]) return;
  
  const name = document.getElementById('folder_settings_name').value.trim();
  const color = document.getElementById('folder_settings_color').value;
  const opacitySlider = document.getElementById('folder_settings_opacity');
  const opacity = opacitySlider.querySelector('m3e-slider-thumb')?.value || 1;
  
  const folderData = window.folders[currentSettingsFolderId];
  folderData.name = name || folderData.name;
  folderData.style = { color, opacity };
  
  saveFolders();
  applyFolderStyle(currentSettingsFolderId);
  
  // フォルダーアイコンの名前更新
  const folderIcon = document.querySelector(`[data-folder-id="${currentSettingsFolderId}"]`);
  if (folderIcon) {
    const nameEl = folderIcon.querySelector('p');
    if (nameEl) nameEl.textContent = folderData.name;
  }
  
  // 開いているフォルダーのタイトル更新
  if (window.currentOpenFolderId === currentSettingsFolderId) {
    const title = document.getElementById('folder_title');
    if (title) title.textContent = folderData.name;
  }
  
  updateFolderIcon(currentSettingsFolderId);
  
  document.getElementById('folder_settings_modal_overlay').style.display = 'none';
  currentSettingsFolderId = null;
};


// 設定モーダルでのライブプレビュー（フォルダーが開いている場合）
function updateFolderPreview() {
  const color = document.getElementById('folder_settings_color').value;
  const opacitySlider = document.getElementById('folder_settings_opacity');
  const opacity = opacitySlider.querySelector('m3e-slider-thumb')?.value || 1;
  const rgb = hexToRgb(color);

  if (currentSettingsFolderId && window.currentOpenFolderId === currentSettingsFolderId) {
    // 一時的にスタイル適用（保存はしない）
    const modal = document.getElementById('folder_modal');
    if (rgb && modal) {
      modal.style.backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
      const textColor = getContrastColor(rgb.r, rgb.g, rgb.b);
      modal.style.setProperty('--on-surface', textColor);
      modal.style.setProperty('--on-surface-variant', textColor);
    }
  }

  
  // アイコンのプレビューも更新
  if (currentSettingsFolderId && rgb) {
    const folderEl = document.querySelector(`[data-folder-id="${currentSettingsFolderId}"]`);
    const previewDiv = folderEl?.querySelector('.folder-preview');
    if (previewDiv) {
      previewDiv.style.background = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
    }
  }
}

document.getElementById('folder_settings_color').addEventListener('input', updateFolderPreview);
document.getElementById('folder_settings_opacity').addEventListener('input', updateFolderPreview);

// ========================================
// Linuxアプリ編集モーダル
// ========================================

let editLinuxappIconDataUrl = '';
const editLinuxappImageInput = document.getElementById('edit_linuxapp_image_file');
const editLinuxappImageTrigger = document.getElementById('edit_linuxapp_image_trigger');
const editLinuxappImagePreview = document.getElementById('edit_linuxapp_image_preview');

if (editLinuxappImageTrigger && editLinuxappImageInput) {
  editLinuxappImageTrigger.onclick = () => editLinuxappImageInput.click();
  editLinuxappImageInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const resizedDataUrl = await resizeImage(evt.target.result, 740, 740);
          editLinuxappIconDataUrl = resizedDataUrl;
          editLinuxappImagePreview.src = editLinuxappIconDataUrl;
        } catch (err) {
          console.error("Failed to resize image:", err);
          editLinuxappIconDataUrl = evt.target.result;
          editLinuxappImagePreview.src = editLinuxappIconDataUrl;
        }
      };
      reader.readAsDataURL(file);
    }
  };
}

function openEditLinuxappModal() {
  closeAllModals();
  if (!currentEditingApp) return;
  
  document.getElementById('edit_linuxapp_name').value = currentEditingApp.name;
  document.getElementById('edit_linuxapp_command').value = currentEditingApp.command;
  document.getElementById('edit_linuxapp_run_in_terminal').checked = currentEditingApp.runInTerminal || false;
  editLinuxappImagePreview.src = currentEditingApp.icon || './assets/linux.png';
  editLinuxappIconDataUrl = currentEditingApp.icon || './assets/linux.png';
  
  document.getElementById('edit_linuxapp_modal_overlay').style.display = 'flex';
}

document.getElementById('close_edit_linuxapp_modal').onclick = () => {
  document.getElementById('edit_linuxapp_modal_overlay').style.display = 'none';
};

// ========================================
// GitHub Contribution ウィジェット
// ========================================
// Moved to widgets/github_widget.js

// ========================================
// Google Calendar Widget
// ========================================
// Moved to widgets/google_calendar.js

document.getElementById('save_edit_linuxapp').onclick = async () => {
  let name = document.getElementById('edit_linuxapp_name').value.trim();
  let command = document.getElementById('edit_linuxapp_command').value.trim();
  if (window.SecurityManager) {
    name = await window.SecurityManager.sanitizeInput(name);
    command = window.SecurityManager.sanitizeCommandInput(command);
  }
  const runInTerminal = document.getElementById('edit_linuxapp_run_in_terminal').checked;
  
  if (!name || !command) {
    await showAlertDialog(i18n.t('enter_name_and_command'));
    return;
  }
    
    // フォルダー内アイテムの場合
    if (currentContextAppType === 'folder-item-linuxapp') {
      const folderId = currentEditingIcon._folderId;
      const index = currentEditingIcon._folderIndex;
      const folder = window.folders[folderId];
      
      if (folder && folder.apps[index]) {
        folder.apps[index].name = name;
        folder.apps[index].command = command;
        folder.apps[index].runInTerminal = runInTerminal;
        folder.apps[index].icon = editLinuxappIconDataUrl;
        saveFolders();
        updateFolderIcon(folderId);
        renderFolderPage(folderId);
      }
      if (window.SecurityManager && typeof window.SecurityManager.ensureAllowedForCommand === 'function') {
        window.SecurityManager.ensureAllowedForCommand(command);
      }
      document.getElementById('edit_linuxapp_modal_overlay').style.display = 'none';
      return;
    }

  
  // localStorageを更新
  const linuxApps = JSON.parse(localStorage.getItem(LS_KEYS.LINUX_APPS) || '[]');
  const index = linuxApps.findIndex(a => a.name === currentEditingApp.name && a.command === currentEditingApp.command);
  
  const updatedApp = {
    name: name,
    command: command,
    icon: editLinuxappIconDataUrl,
    runInTerminal: runInTerminal
  };
  
  if (index !== -1) {
    linuxApps[index] = updatedApp;
  }
  localStorage.setItem(LS_KEYS.LINUX_APPS, JSON.stringify(linuxApps));
  if (window.SecurityManager && typeof window.SecurityManager.ensureAllowedForCommand === 'function') {
    window.SecurityManager.ensureAllowedForCommand(command);
  }
  
  // アイコンを更新
  if (currentEditingIcon) {
    currentEditingIcon.querySelector('img').src = editLinuxappIconDataUrl;
    currentEditingIcon.querySelector('p').textContent = name;
    currentEditingIcon._appCommand = command;
    currentEditingIcon._runInTerminal = runInTerminal;
    currentEditingIcon._appData = updatedApp;
    
    // onclickも更新
    currentEditingIcon.onclick = async () => {
      let cmd = command;
      if (runInTerminal) {
        cmd = `xterm -hold -e "${command}"`;
      }
      console.log('Launching Linux app:', cmd);
      const result = await launchLinuxApp(cmd);
      if (!result.success) {
        const errorMsg = i18n.t('launch_failed', { error: result.error });
        await showAlertDialog(errorMsg);
      }
    };
  }
  
  document.getElementById('edit_linuxapp_modal_overlay').style.display = 'none';
};

// ========================================
// ファイル/フォルダショートカット機能
// ========================================

/**
 * ファイルまたはフォルダを開く
 */
const openFileOrFolder = window.electronAPI.openFileOrFolder;


// ファイル追加ボタンのイベント

document.getElementById('add_file_btn')?.addEventListener('click', async () => {
  closeAllModals();
  
  // ファイル選択ダイアログを開く
  if (window.electronAPI && window.electronAPI.selectFile) {
    const result = await window.electronAPI.selectFile();
    if (!result.canceled) {
      const fileData = {
        name: result.name,
        path: result.path,
        isDirectory: result.isDirectory,
        saveKey: 'file-shortcut-' + result.name.replace(/\s+/g, '-') + '-' + Date.now()
      };
      
      // localStorageに保存
      const fileShortcuts = JSON.parse(localStorage.getItem(LS_KEYS.FILE_SHORTCUTS) || '[]');
      fileShortcuts.push(fileData);
      localStorage.setItem(LS_KEYS.FILE_SHORTCUTS, JSON.stringify(fileShortcuts));
      
      // アイコンを作成
      createFileShortcutIcon(fileData);
    }
  }
});

// フォルダ追加ボタンのイベント
document.getElementById('add_folder_btn')?.addEventListener('click', async () => {
  closeAllModals();
  
  // フォルダ選択ダイアログを開く
  if (window.electronAPI && window.electronAPI.selectFolder) {
    const result = await window.electronAPI.selectFolder();
    if (!result.canceled) {
      const folderData = {
        name: result.name,
        path: result.path,
        isDirectory: true,
        saveKey: 'folder-shortcut-' + result.name.replace(/\s+/g, '-') + '-' + Date.now()
      };
      
      // localStorageに保存
      const folderShortcuts = JSON.parse(localStorage.getItem(LS_KEYS.FOLDER_SHORTCUTS) || '[]');
      folderShortcuts.push(folderData);
      localStorage.setItem(LS_KEYS.FOLDER_SHORTCUTS, JSON.stringify(folderShortcuts));
      
      // アイコンを作成
      createFolderShortcutIcon(folderData);
    }
  }
});

// 保存されたファイルショートカットを読み込み
const savedFileShortcuts = JSON.parse(localStorage.getItem(LS_KEYS.FILE_SHORTCUTS) || '[]');
savedFileShortcuts.forEach(file => {
  if (!isAppInFolder(folderApp => folderApp.path && folderApp.path === file.path)) {
    createFileShortcutIcon(file);
  }
});

// 保存されたフォルダショートカットを読み込み
const savedFolderShortcuts = JSON.parse(localStorage.getItem(LS_KEYS.FOLDER_SHORTCUTS) || '[]');
savedFolderShortcuts.forEach(folder => {
  if (!isAppInFolder(folderApp => folderApp.path && folderApp.path === folder.path)) {
    createFolderShortcutIcon(folder);
  }
});


// ウィジェットのリサイズ機能を有効化
function applySavedWidgetSizes() {
  document.querySelectorAll('.widget').forEach(w => {
    const id = w.id || w.dataset.widgetKey;
    if (!id) return;
    const raw = localStorage.getItem(`${LS_KEYS.WIDGET_SIZE_PREFIX}${id}`);
    if (!raw) return;
    try {
      const s = JSON.parse(raw);
      if (s.w) w.style.width = s.w + 'px';
      if (s.h) w.style.height = s.h + 'px';
    } catch (e) {}
  });
}

function enableWidgetResizers() {
  document.querySelectorAll('.widget').forEach(widget => {
    if (widget.querySelector('.widget-resizer')) return; // 既に追加済み

    // widget に一意キーがなければ自動付与
    if (!widget.id) {
      if (!widget.dataset.widgetKey) widget.dataset.widgetKey = 'w-' + Math.random().toString(36).slice(2,9);
    }

    const res = document.createElement('div');
    res.className = 'widget-resizer';
    // リサイズ操作はリサイズハンドラで完結させる（親にイベント伝播させない）
    res.addEventListener('pointerdown', function(e) {
      e.stopPropagation(); e.preventDefault();
      const widgetEl = widget;
      widgetEl._isResizing = true;
      widgetEl.classList.add('resizing');
      widgetEl.setPointerCapture(e.pointerId);

      // アンカーを左上に固定し、絶対配置にする
      const rect = widgetEl.getBoundingClientRect();
      const desktopIcons = document.getElementById('desktop_icons');
      const containerRect = desktopIcons ? desktopIcons.getBoundingClientRect() : {left: 0, top: 0};
      
      widgetEl.style.position = 'absolute';
      widgetEl.style.left = (rect.left - containerRect.left) + 'px';
      widgetEl.style.top = (rect.top - containerRect.top) + 'px';
      widgetEl.style.right = 'auto';
      widgetEl.style.bottom = 'auto';

      const startX = e.clientX;
      const startY = e.clientY;
      const startW = widgetEl.offsetWidth;
      const startH = widgetEl.offsetHeight;
      const minW = 120; const minH = 48;
      
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      function onMove(ev) {
        ev.preventDefault();
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        let newW = Math.max(minW, Math.round(startW + dx));
        let newH = Math.max(minH, Math.round(startH + dy));
        // グリッドモードが有効なら幅・高さをグリッドサイズにスナップ
        if (window.isGridModeEnabled) {
          newW = Math.max(minW, Math.round(newW / GRID_SIZE_X) * GRID_SIZE_X);
          newH = Math.max(minH, Math.round(newH / GRID_SIZE_Y) * GRID_SIZE_Y);
        }

        
        // 画面外にはみ出さないように制限
        if (rect.left + newW > screenWidth) {
          newW = Math.max(minW, screenWidth - rect.left);
        }
        if (rect.top + newH > screenHeight) {
          newH = Math.max(minH, screenHeight - rect.top);
        }
        
        widgetEl.style.width = newW + 'px';
        widgetEl.style.height = newH + 'px';
      }

      function onUp(ev) {
        try { widgetEl.releasePointerCapture(e.pointerId); } catch (err) {}
        widgetEl._isResizing = false;
        widgetEl.classList.remove('resizing');
        // 永続化
        const id = widgetEl.id || widgetEl.dataset.widgetKey;
        if (id) {
          const w = widgetEl.offsetWidth;
          const h = widgetEl.offsetHeight;
          localStorage.setItem(`${LS_KEYS.WIDGET_SIZE_PREFIX}${id}`, JSON.stringify({w,h}));
        }
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      }

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });

    widget.appendChild(res);
  });
}

// 起動時に適用
setTimeout(() => { applySavedWidgetSizes(); enableWidgetResizers(); }, 500);

// ウィジェットサイズをリセット（保存されたサイズを削除し、inline スタイルをクリア）
function resetWidgetSizes() {
  // localStorage キーを削除
  Object.keys(localStorage).forEach(k => {
    if (k && k.startsWith(LS_KEYS.WIDGET_SIZE_PREFIX)) localStorage.removeItem(k);
  });

  // 要素のサイズをクリア
  document.querySelectorAll('.widget').forEach(w => {
    w.style.width = '';
    w.style.height = '';
    // 自動付与した widgetKey は残しておく（不要なら削除可能）
  });

  // 再適用（リサイズハンドラ等がある場合に備えて）
  setTimeout(() => { applySavedWidgetSizes(); }, 50);
}

// アイコン形状選択UIの生成
function setupShapeButtons(containerId, currentShape, onSelect, previewImgSrc = './assets/app.png') {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  let selectedBtn = null;
  function markSelected(btn) {
    if (selectedBtn) selectedBtn.classList.remove('selected');
    selectedBtn = btn;
    if (selectedBtn) selectedBtn.classList.add('selected');
  }

  const customShapes = JSON.parse(localStorage.getItem(LS_KEYS.CUSTOM_SHAPES) || '{}');
  const allShapes = [...SHAPES, ...Object.keys(customShapes)];

  allShapes.forEach(s => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'shape-button';
    btn.title = s;
    
    if (customShapes[s]) {
      // カスタムシェイプのプレビュー
      const preview = document.createElement('div');
      preview.className = 'custom-shape-wrapper';
      preview.style.clipPath = customShapes[s];
      preview.style.width = '32px';
      preview.style.height = '32px';
      
      const img = document.createElement('img');
      img.src = previewImgSrc;
      img.alt = s;
      preview.appendChild(img);
      btn.appendChild(preview);
      
      // 右クリックで削除
      btn.oncontextmenu = async (e) => {
        e.preventDefault();
        if (await showConfirmDialog(i18n.t('confirm_delete_shape', { name: s }))) {
          delete customShapes[s];
          localStorage.setItem(LS_KEYS.CUSTOM_SHAPES, JSON.stringify(customShapes));
          setupShapeButtons(containerId, currentShape, onSelect, previewImgSrc);
        }
      };
    } else {
      // ビルトインシェイプ
      const preview = document.createElement('m3e-shape');
      preview.setAttribute('name', s);
      const img = document.createElement('img');
      img.src = previewImgSrc;
      img.alt = s;
      preview.appendChild(img);
      btn.appendChild(preview);
    }

    btn.addEventListener('click', () => {
      onSelect(s);
      markSelected(btn);
    });

    if (s === currentShape) {
      markSelected(btn);
    }
    container.appendChild(btn);
  });

  // 追加ボタン
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'add-shape-button';
  addBtn.innerHTML = '<m3e-icon name="add"></m3e-icon>';
  addBtn.title = 'Add Custom Shape';
  addBtn.onclick = () => openAddCustomShapeModal(() => {
      // 全てのシェイプボタンを更新
      const iconShapes = document.getElementById('icon_shape_buttons');
      if (iconShapes) setupShapeButtons('icon_shape_buttons', window.getCurrentIconShape(), (s) => window.StyleManager.updateIconShape(s));
      
      const clockShapes = document.getElementById('clock_shape_buttons');
      if (clockShapes) setupShapeButtons('clock_shape_buttons', window.getCurrentClockShape(), (s) => window.StyleManager.updateClockShape(s));
      
      const individualShapes = document.getElementById('icon_individual_shape_buttons');
      if (individualShapes && currentEditingIcon) {
          setupShapeButtons('icon_individual_shape_buttons', currentEditingIcon.dataset.shape || '', (s) => updateIndividualIconShape(currentEditingIcon, s), currentEditingIcon.querySelector('img')?.src);
      }
  });
  container.appendChild(addBtn);
}

function openAddCustomShapeModal(onSaved) {
  const modal = document.getElementById('add_custom_shape_modal_overlay');
  const nameInput = document.getElementById('custom_shape_name');
  const pathInput = document.getElementById('custom_shape_path');
  const saveBtn = document.getElementById('save_custom_shape');
  const closeBtn = document.getElementById('close_add_custom_shape_modal');

  nameInput.value = '';
  pathInput.value = '';
  modal.style.display = 'flex';

  closeBtn.onclick = () => {
    modal.style.display = 'none';
  };

  saveBtn.onclick = async () => {
    const name = nameInput.value.trim();
    const path = pathInput.value.trim();
    if (!name || !path) {
      await showAlertDialog(i18n.t('enter_name_and_clip_path'));
      return;
    }
    
    const customShapes = JSON.parse(localStorage.getItem(LS_KEYS.CUSTOM_SHAPES) || '{}');
    customShapes[name] = path;
    localStorage.setItem(LS_KEYS.CUSTOM_SHAPES, JSON.stringify(customShapes));
    
    modal.style.display = 'none';
    if (onSaved) onSaved();
  };
}

// 設定画面のカテゴリーを表示切り替え
function showSettingsSection(sectionId) {
  const menuItems = document.querySelectorAll('#settings_sidebar m3e-nav-menu-item');
  const sections = document.querySelectorAll('#settings_content .settings-section');

  sections.forEach(sec => {
    if (sec.getAttribute('data-section') === sectionId) {
      sec.classList.add('active');
    } else {
      sec.classList.remove('active');
    }
  });

  menuItems.forEach(item => {
    if (item.getAttribute('data-section') === sectionId) {
      item.setAttribute('active', '');
    } else {
      item.removeAttribute('active');
    }
  });
}

// 設定画面のサイドバーカテゴリー切り替え初期化
function initSettingsSidebarNavigation() {
  const menuItems = document.querySelectorAll('#settings_sidebar m3e-nav-menu-item');

  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      const sectionId = item.getAttribute('data-section');
      if (sectionId) {
        showSettingsSection(sectionId);
      }
    });
  });

  // 初期表示（デザインとスタイル）
  showSettingsSection('design_style');
}

// 設定画面のリセットボタンにハンドラを追加
document.addEventListener('DOMContentLoaded', async () => {
  initSettingsSidebarNavigation();
  // データ管理（エクスポート/インポート）の初期化
  if (window.DataManager) {
    window.DataManager.initUI();
  }

  const btn = document.getElementById('reset_widget_sizes_btn');
  if (btn) {
    btn.addEventListener('click', async () => {
      const lang = getCurrentLanguage();
      if (!await showConfirmDialog(i18n.t('reset_widget_sizes_confirm'))) return;
      resetWidgetSizes();
      await showAlertDialog(i18n.t('widget_sizes_reset'));
    });
  }

  setupShapeButtons('icon_shape_buttons', getCurrentIconShape(), (s) => {
    window.StyleManager.updateIconShape(s);
  });

  setupShapeButtons('clock_shape_buttons', getCurrentClockShape(), (s) => {
    window.StyleManager.updateClockShape(s);
  });

  // メディアプレーヤーの設定トグル
  function initMediaPlayerToggles() {
    const configs = [
      { id: 'toggle_media_seekbar', key: LS_KEYS.MEDIA_PLAYER_SHOW_SEEKBAR, part: 'seekbar' },
      { id: 'toggle_media_shuffle', key: LS_KEYS.MEDIA_PLAYER_SHOW_SHUFFLE, part: 'shuffle' },
      { id: 'toggle_media_repeat', key: LS_KEYS.MEDIA_PLAYER_SHOW_REPEAT, part: 'repeat' }
    ];

    configs.forEach(config => {
      const toggle = document.getElementById(config.id);
      if (toggle) {
        const isVisible = localStorage.getItem(config.key) !== 'false';
        toggle.checked = isVisible;

        // 初期状態適用
        window.StyleManager.updateMediaPlayerVisibility(config.part, isVisible);

        toggle.addEventListener('change', (e) => {
          const newState = e.target.checked;
          window.StyleManager.updateMediaPlayerVisibility(config.part, newState);
        });
      }
    });
  }
  initMediaPlayerToggles();

  // ウィジェットのコンテキストメニューを設定
  Object.values(availableWidgets).forEach(widgetInfo => {
    if (widgetInfo.element) {
      widgetInfo.element.addEventListener('contextmenu', (e) => showWidgetContextMenu(e, widgetInfo.element));
    }
  });

  // ウィジェット非表示ボタンの処理
  document.getElementById('widget_context_hide').onclick = async (e) => {
    e.stopPropagation();
    hideContextMenu();
    if (currentEditingWidget) {
      const widgetId = currentEditingWidget.id;
      if (widgetId) {
        await setWidgetVisibility(widgetId, false);
      }
    }
  };

  // ウィジェット設定ボタンの処理
  document.getElementById('widget_context_settings').onclick = (e) => {
    e.stopPropagation();
    hideContextMenu();
    if (currentEditingWidget) {
      openWidgetSettingsModal(currentEditingWidget);
    }
  };

  function setupHeaderModeSelector(selectId, widgetId, widgetEl) {
    const modeSelector = document.getElementById(selectId);
    if (modeSelector && widgetEl) {
      const savedMode = localStorage.getItem(`widgetHeaderMode:${widgetId}`) || 'always';
      setSelectValue(modeSelector, savedMode);

      modeSelector.addEventListener('change', (e) => {
        const newMode = e.target.value;
        localStorage.setItem(`widgetHeaderMode:${widgetId}`, newMode);
        
        // クラスのリセット
        widgetEl.classList.remove('header-hover-show', 'header-always-hide');
        
        if (newMode === 'hover') {
          widgetEl.classList.add('header-hover-show');
        } else if (newMode === 'hide') {
          widgetEl.classList.add('header-always-hide');
        }
      });
    }
  }

  function openWidgetSettingsModal(widgetEl) {
    const clockContent = document.getElementById('clock_settings_content');
    const mediaContent = document.getElementById('media_player_settings_content');
    const weatherContent = document.getElementById('weather_widget_settings_content');
    const commonSettings = document.getElementById('common_widget_settings');
    const title = document.getElementById('widget_settings_title');
    
    // 全て非表示にリセット
    clockContent.style.display = 'none';
    mediaContent.style.display = 'none';
    if (weatherContent) weatherContent.style.display = 'none';
    if (commonSettings) commonSettings.style.display = 'none';
    
    const widgetId = widgetEl.id;

    // ヘッダーを持つウィジェットの場合、共通設定を表示 (Clock/Weather以外)
    const hasHeader = !!widgetEl.querySelector('[class$="-header"]');
    if (hasHeader && commonSettings) {
      commonSettings.style.display = 'block';
      setupHeaderModeSelector('select_widget_header_mode', widgetId, widgetEl);
    }

    if (widgetId === 'widget-clock') {
      clockContent.style.display = 'block';
      title.textContent = i18n.t('clock_settings') || '時計設定';
    } else if (widgetId === 'media_player_widget') {
      mediaContent.style.display = 'block';
      title.textContent = i18n.t('media_player_settings') || 'メディアプレーヤー設定';
    } else if (widgetId === 'gmail_widget') {
      // Gmailは専用のモーダルがあるのでそちらを開く
      if (typeof gmailSettingsBtn?.onclick === 'function') {
        setupHeaderModeSelector('select_gmail_header_mode', widgetId, widgetEl);
        gmailSettingsBtn.onclick(new MouseEvent('click'));
      }
      return; // 共通モーダルは開かない
    } else if (widgetId === 'google_calendar_widget') {
      if (typeof googleCalendarSettingsBtn?.onclick === 'function') {
        setupHeaderModeSelector('select_google_calendar_header_mode', widgetId, widgetEl);
        googleCalendarSettingsBtn.onclick(new MouseEvent('click'));
      }
      return;
    } else if (widgetId === 'github_contribution_widget') {
      if (typeof githubSettingsBtn?.onclick === 'function') {
        setupHeaderModeSelector('select_github_header_mode', widgetId, widgetEl);
        githubSettingsBtn.onclick(new MouseEvent('click'));
      }
      return;
    } else if (widgetId === 'weather_widget') {
      if (weatherContent) {
        weatherContent.style.display = 'block';
        title.textContent = i18n.t('weather_settings') || '天気設定';
        
        // 保存された設定を表示
        const latInput = document.getElementById('weather_lat_input');
        const lonInput = document.getElementById('weather_lon_input');
        const intervalSelect = document.getElementById('weather_location_interval_select');
        const modeSelect = document.getElementById('weather_location_mode_select');
        const providerSelect = document.getElementById('weather_provider_select');
        const unitSelect = document.getElementById('weather_unit_select');
        
        const mode = localStorage.getItem('weather_location_mode') || 'auto';
        if (modeSelect) setSelectValue(modeSelect, mode);
        
        const provider = localStorage.getItem('weather_provider') || 'open-meteo';
        if (providerSelect) setSelectValue(providerSelect, provider);

        const unit = localStorage.getItem('weather_unit') || 'c';
        if (unitSelect) setSelectValue(unitSelect, unit);
        
        if (latInput) {
          latInput.value = mode === 'auto' 
            ? (localStorage.getItem('weather_lat') || '35.6895')
            : (localStorage.getItem('weather_lat_manual') || '35.6895');
        }
        if (lonInput) {
          lonInput.value = mode === 'auto' 
            ? (localStorage.getItem('weather_lon') || '139.6917')
            : (localStorage.getItem('weather_lon_manual') || '139.6917');
        }
        
        if (intervalSelect) setSelectValue(intervalSelect, localStorage.getItem('weather_location_interval') || '60');
        
        // モード変更時の入力可否切り替え
        const updateInputState = () => {
          const isManual = modeSelect.value === 'manual';
          latInput.readOnly = !isManual;
          lonInput.readOnly = !isManual;
          latInput.style.opacity = isManual ? '1' : '0.5';
          lonInput.style.opacity = isManual ? '1' : '0.5';
        };
        if (modeSelect) modeSelect.addEventListener('change', updateInputState);
        updateInputState();
        
        // 形状選択ボタンの初期化
        const currentShape = localStorage.getItem('weather_shape') || 'pill';
        setupShapeButtons('weather_shape_buttons', currentShape, (s) => {
          localStorage.setItem('weather_shape', s);
          if (window.applyWeatherShape) window.applyWeatherShape(s);
        }, './assets/weather/light/cloudy.svg');
        
        // 保存ボタンのイベント
        const saveBtn = document.getElementById('save_weather_settings');
        if (saveBtn) {
          saveBtn.onclick = () => {
            const lat = document.getElementById('weather_lat_input').value;
            const lon = document.getElementById('weather_lon_input').value;
            const interval = document.getElementById('weather_location_interval_select').value;
            const mode = document.getElementById('weather_location_mode_select').value;
            const provider = document.getElementById('weather_provider_select').value;
            const unit = document.getElementById('weather_unit_select').value;
            
            localStorage.setItem('weather_location_mode', mode);
            localStorage.setItem('weather_provider', provider);
            localStorage.setItem('weather_unit', unit);
            if (mode === 'manual') {
              localStorage.setItem('weather_lat_manual', lat);
              localStorage.setItem('weather_lon_manual', lon);
            }
            localStorage.setItem('weather_location_interval', interval);
            
            if (window.setupWeatherLocationTimer) window.setupWeatherLocationTimer();
            if (window.updateWeather) window.updateWeather();
            
            document.getElementById('widget_settings_modal_overlay').style.display = 'none';
          };
        }
      }
    } else {
      // 他のウィジェットにはまだ設定がない場合
      title.textContent = i18n.t('widget_settings');
    }
    
    document.getElementById('widget_settings_modal_overlay').style.display = 'flex';
  }

  document.getElementById('close_widget_settings_modal').onclick = () => {
    document.getElementById('widget_settings_modal_overlay').style.display = 'none';
  };

  loadWidgetVisibility();
  await applyWidgetVisibility();

  loadDefaultIconVisibility();

  const chromeToggle = document.getElementById('toggle_chrome_icon');
  if (chromeToggle) {
    chromeToggle.addEventListener('change', (e) => {
      const isVisible = e.target.checked;
      setDefaultIconVisibility('appicon-chrome', isVisible, LS_KEYS.SHOW_CHROME_ICON);
    });
  }

  const filesToggle = document.getElementById('toggle_files_icon');
  if (filesToggle) {
    filesToggle.addEventListener('change', (e) => {
      const isVisible = e.target.checked;
      setDefaultIconVisibility('appicon-files', isVisible, LS_KEYS.SHOW_FILES_ICON);
    });
  }

  const settingsToggle = document.getElementById('toggle_settings_icon');
  if (settingsToggle) {
    settingsToggle.addEventListener('change', (e) => {
      const isVisible = e.target.checked;
      setDefaultIconVisibility('appicon-settings', isVisible, LS_KEYS.SHOW_SETTINGS_ICON);
    });
  }

  // アップデートチェックの初期化
  if (window.UpdateManager) {
    // 起動時にチェック (3秒後)
    setTimeout(() => window.UpdateManager.checkForUpdates(), 3000);

    // 手動チェックボタン
    const checkBtn = document.getElementById('check_updates_btn');
    if (checkBtn) {
      checkBtn.onclick = () => window.UpdateManager.checkForUpdates(true);
    }
    
    // バージョン表示の更新
    const versionDisplay = document.getElementById('app_version_display');
    if (versionDisplay) {
      versionDisplay.textContent = 'v' + window.UpdateManager.CURRENT_VERSION;
    }

    // チャンネルセレクターの初期化
    const channelSelector = document.getElementById('update_channel_selector');
    if (channelSelector) {
      setSelectValue(channelSelector, window.UpdateManager.getChannel());
      channelSelector.addEventListener('change', (e) => {
        localStorage.setItem(LS_KEYS.UPDATE_CHANNEL, e.target.value);
      });
    }
  }

  // Initialize AI Settings, Gesture detection, and Prompt card events
  initGeminiSettings();
  initAIGesture();
  initAIPromptCardEvents();

  // Initialize Spotlight Search
  initSpotlight();
});

// ========================================
// AI Settings & Gesture & Prompt Management
// ========================================

let currentAIMode = 'chat';

function updateAIModeUI() {
  const modeButtons = document.querySelectorAll('.ai-mode-btn');
  modeButtons.forEach(btn => {
    if (btn.getAttribute('data-mode') === currentAIMode) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  const input = document.getElementById('ai_prompt_input');
  if (input && window.i18n) {
    if (currentAIMode === 'trans_en') {
      input.placeholder = window.i18n.t('ai_mode_trans_en');
    } else if (currentAIMode === 'trans_ja') {
      input.placeholder = window.i18n.t('ai_mode_trans_ja');
    } else {
      input.placeholder = window.i18n.t('magic_pointer_placeholder');
    }
  }
}

async function setAIMode(mode) {
  currentAIMode = mode;
  updateAIModeUI();

  try {
    if (window.electronAPI && window.electronAPI.getGeminiConfig) {
      const config = await window.electronAPI.getGeminiConfig();
      config.geminiDefaultMode = mode;
      await window.electronAPI.setGeminiConfig(config);
    }
  } catch (e) {
    console.error('Failed to save AI mode config:', e);
  }

  const defaultModeSelector = document.getElementById('gemini_default_mode_selector');
  if (defaultModeSelector) {
    setSelectValue(defaultModeSelector, mode);
  }
}

async function initGeminiSettings() {
  const apiKeyInput = document.getElementById('gemini_api_key_input');
  const modelSelector = document.getElementById('gemini_model_selector');
  const defaultModeSelector = document.getElementById('gemini_default_mode_selector');
  if (!apiKeyInput || !modelSelector || !defaultModeSelector) return;

  try {
    if (window.electronAPI && window.electronAPI.getGeminiConfig) {
      const config = await window.electronAPI.getGeminiConfig();
      apiKeyInput.value = config.geminiApiKey || '';
      setSelectValue(modelSelector, config.geminiModel || 'gemini-3.1-flash-lite');
      setSelectValue(defaultModeSelector, config.geminiDefaultMode || 'chat');
      
      // AIカードのモードを同期
      currentAIMode = config.geminiDefaultMode || 'chat';
      updateAIModeUI();
    }
  } catch (e) {
    console.error('Failed to get Gemini settings:', e);
  }

  const saveConfig = async () => {
    try {
      await window.electronAPI.setGeminiConfig({
        geminiApiKey: apiKeyInput.value,
        geminiModel: modelSelector.value,
        geminiDefaultMode: defaultModeSelector.value
      });
      // AIカードのモードも同期
      currentAIMode = defaultModeSelector.value;
      updateAIModeUI();
    } catch (e) {
      console.error('Failed to save Gemini config:', e);
    }
  };

  apiKeyInput.addEventListener('change', saveConfig);
  modelSelector.addEventListener('change', saveConfig);
  defaultModeSelector.addEventListener('change', saveConfig);
}

// AI Gesture variables
let gestureMouseDown = false;
let gestureMouseDownTime = 0;
let gestureLongPressActive = false;
let gestureLongPressTimeout = null;
let gesturePath = [];

// Cursor wiggle tracking without mouse down
let cursorWigglePath = [];

function initAIGesture() {
  const isGestureTarget = (element) => {
    if (!element) return false;
    const excluded = element.closest('.widget, .appicon, .modal_overlay, .modal, .context-menu, button, input, select, textarea, m3e-button, m3e-switch, m3e-slider, m3e-dialog, m3e-nav-menu');
    return !excluded;
  };

  const detectShake = (path) => {
    if (path.length < 5) return false;
    
    let reversalsX = 0;
    let lastDirX = 0;
    let lastReversalX = path[0].x;
    const minStroke = 20; // 20px min stroke length
    
    for (let i = 1; i < path.length; i++) {
      const dx = path[i].x - path[i - 1].x;
      const totalDx = path[i].x - lastReversalX;
      
      if (dx > 0) {
        if (lastDirX === -1 && Math.abs(totalDx) >= minStroke) {
          reversalsX++;
          lastReversalX = path[i].x;
        }
        if (lastDirX !== 1) lastDirX = 1;
      } else if (dx < 0) {
        if (lastDirX === 1 && Math.abs(totalDx) >= minStroke) {
          reversalsX++;
          lastReversalX = path[i].x;
        }
        if (lastDirX !== -1) lastDirX = -1;
      }
    }
    
    return reversalsX >= 3;
  };

  // Cursor wiggle (moving mouse quickly left and right across desktop)
  document.addEventListener('mousemove', (e) => {
    const now = Date.now();
    cursorWigglePath.push({ x: e.clientX, y: e.clientY, time: now });
    cursorWigglePath = cursorWigglePath.filter(p => now - p.time <= 600);

    const card = document.getElementById('ai_prompt_card');
    if ((!card || card.style.display !== 'flex') && isGestureTarget(e.target)) {
      if (detectShake(cursorWigglePath)) {
        cursorWigglePath = [];
        showAIPromptCard(e.clientX, e.clientY);
      }
    }
  });

  document.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // Left click only
    if (!isGestureTarget(e.target)) return;
    
    gestureMouseDown = true;
    gestureMouseDownTime = Date.now();
    gestureLongPressActive = false;
    gesturePath = [{ x: e.clientX, y: e.clientY, time: Date.now() }];
    
    if (gestureLongPressTimeout) clearTimeout(gestureLongPressTimeout);
    gestureLongPressTimeout = setTimeout(() => {
      if (gestureMouseDown) {
        gestureLongPressActive = true;
      }
    }, 400);
  });

  document.addEventListener('mousemove', (e) => {
    if (!gestureMouseDown) return;
    
    gesturePath.push({ x: e.clientX, y: e.clientY, time: Date.now() });
    
    const now = Date.now();
    gesturePath = gesturePath.filter(p => now - p.time <= 800);
    
    if (gestureLongPressActive) {
      if (detectShake(gesturePath)) {
        gestureMouseDown = false;
        gestureLongPressActive = false;
        if (gestureLongPressTimeout) clearTimeout(gestureLongPressTimeout);
        
        e.preventDefault();
        window.getSelection().removeAllRanges();
        
        showAIPromptCard(e.clientX, e.clientY);
      }
    }
  });

  document.addEventListener('mouseup', () => {
    gestureMouseDown = false;
    gestureLongPressActive = false;
    if (gestureLongPressTimeout) clearTimeout(gestureLongPressTimeout);
  });

  // Close prompt card if clicking outside it
  document.addEventListener('mousedown', (e) => {
    const card = document.getElementById('ai_prompt_card');
    if (card && card.style.display === 'flex') {
      if (!card.contains(e.target) && !magicPointerSelectingMode) {
        closeAIPromptCard();
      }
    }
  });
}

// Magic Pointer state
let magicPointerContextItems = [];
let magicPointerSelectingMode = false;
let magicPointerLastPos = { x: 200, y: 200 };

function initAIPromptCardEvents() {
  const input = document.getElementById('ai_prompt_input');
  const submitBtn = document.getElementById('ai_prompt_submit');
  const closeBtn = document.getElementById('ai_prompt_close');
  const addBtn = document.getElementById('magic_pointer_add_item_btn');
  const expandBtn = document.getElementById('magic_pointer_expand_btn');
  const container = document.getElementById('ai_prompt_card');
  
  if (!input || !submitBtn || !closeBtn || !container) return;
  
  submitBtn.addEventListener('click', () => submitAIPrompt());
  closeBtn.addEventListener('click', closeAIPromptCard);
  
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      toggleSelectMode();
    });
  }

  if (expandBtn) {
    expandBtn.addEventListener('click', () => {
      container.classList.toggle('expanded');
      repositionAIPromptCard();
    });
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitAIPrompt();
    }
  });
  
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = `${input.scrollHeight}px`;
    repositionAIPromptCard();
  });

  // Global selection and shortcut listener
  initMagicPointerTriggers();
}

function initMagicPointerTriggers() {
  const container = document.getElementById('ai_prompt_card');

  // 1. Shortcut: Meta (Command/Super) + G or Alt + G
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.altKey) && (e.key === 'g' || e.key === 'G')) {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      e.preventDefault();
      if (container && container.style.display === 'flex') {
        closeAIPromptCard();
      } else {
        // Collect current selection if exists
        const sel = window.getSelection()?.toString()?.trim();
        const items = [];
        if (sel) {
          items.push({ type: 'text', content: sel, label: sel });
        }
        showAIPromptCard(magicPointerLastPos.x, magicPointerLastPos.y, items);
      }
    }
  });

  // 2. Track mouse position for shortcut invocation
  document.addEventListener('mousemove', (e) => {
    magicPointerLastPos.x = e.clientX;
    magicPointerLastPos.y = e.clientY;
  });

  // 3. Selection popup trigger: when user selects text or release mouse after text selection
  document.addEventListener('mouseup', (e) => {
    if (magicPointerSelectingMode) {
      handleContextElementSelect(e);
      return;
    }

    // If selecting text on screen outside the Magic Pointer card
    if (container && container.contains(e.target)) return;

    setTimeout(() => {
      const sel = window.getSelection();
      const text = sel ? sel.toString().trim() : '';
      if (text && text.length >= 2) {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const x = rect.right > 0 ? rect.right : e.clientX;
        const y = rect.bottom > 0 ? rect.bottom + 10 : e.clientY;
        showAIPromptCard(x, y, [{ type: 'text', content: text, label: text }]);
      }
    }, 50);
  });
}

function toggleSelectMode() {
  const addBtn = document.getElementById('magic_pointer_add_item_btn');
  magicPointerSelectingMode = !magicPointerSelectingMode;
  if (magicPointerSelectingMode) {
    if (addBtn) addBtn.classList.add('active');
    document.body.style.cursor = 'crosshair';
  } else {
    if (addBtn) addBtn.classList.remove('active');
    document.body.style.cursor = '';
  }
}

function handleContextElementSelect(e) {
  const target = e.target;
  const container = document.getElementById('ai_prompt_card');
  if (container && container.contains(target)) return;

  e.preventDefault();
  e.stopPropagation();
  toggleSelectMode();

  // Analyze clicked entity
  let item = null;
  const img = target.closest('img');
  const appicon = target.closest('.appicon');
  const widget = target.closest('.widget');

  if (img && img.src) {
    item = { type: 'image', content: img.src, label: img.alt || 'Image' };
  } else if (appicon) {
    const p = appicon.querySelector('p')?.textContent?.trim() || 'App';
    const iconImg = appicon.querySelector('img')?.src;
    item = { type: 'app', content: p, label: p, icon: iconImg };
  } else if (widget) {
    const title = widget.id || 'Widget';
    const text = widget.innerText?.trim() || title;
    item = { type: 'widget', content: text, label: title };
  } else {
    const text = (window.getSelection()?.toString() || target.innerText || '').trim();
    if (text) {
      item = { type: 'text', content: text, label: text.slice(0, 40) };
    }
  }

  if (item) {
    addMagicPointerItem(item);
  }
}

function addMagicPointerItem(item) {
  // Avoid duplicate items
  const exists = magicPointerContextItems.some(i => i.type === item.type && i.content === item.content);
  if (!exists) {
    magicPointerContextItems.push(item);
  }
  renderMagicPointerContextItems();
  updateSuggestionChips();
  repositionAIPromptCard();
}

function removeMagicPointerItem(index) {
  magicPointerContextItems.splice(index, 1);
  renderMagicPointerContextItems();
  updateSuggestionChips();
  repositionAIPromptCard();
}

function renderMagicPointerContextItems() {
  const tray = document.getElementById('magic_pointer_items_tray');
  if (!tray) return;
  tray.innerHTML = '';

  magicPointerContextItems.forEach((item, index) => {
    const thumb = document.createElement('div');
    thumb.className = 'magic-pointer-item-thumb';

    if (item.type === 'image' || item.icon) {
      const img = document.createElement('img');
      img.src = item.type === 'image' ? item.content : item.icon;
      thumb.appendChild(img);
    } else {
      const textSpan = document.createElement('div');
      textSpan.className = 'thumb-text';
      textSpan.textContent = item.label || item.content;
      thumb.appendChild(textSpan);
    }

    const removeBtn = document.createElement('button');
    removeBtn.className = 'thumb-remove-btn';
    removeBtn.title = 'Remove item';
    removeBtn.innerHTML = '<m3e-icon name="close"></m3e-icon>';
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeMagicPointerItem(index);
    });

    thumb.appendChild(removeBtn);
    tray.appendChild(thumb);
  });
}

// 4 Categories: Understand, Transform, Ideate, Execute
function generateFallbackChips(contextItems) {
  if (!contextItems || contextItems.length === 0) {
    return [
      { category: 'Understand', label: 'Summarize screen', prompt: 'Summarize what is on the screen right now.', icon: 'subject' },
      { category: 'Ideate', label: 'Give suggestions & ideas', prompt: 'Give me creative ideas and next steps based on this context.', icon: 'lightbulb' },
      { category: 'Execute', label: 'Draft reply or action', prompt: 'Help me draft an action or reply.', icon: 'reply' }
    ];
  }

  const hasImage = contextItems.some(i => i.type === 'image' || i.icon);
  const hasSchedule = contextItems.some(i => /schedule|meet|calendar|may|june|july|aug|sept|oct|nov|dec|月|日|時|予定/i.test(i.content));
  const hasApp = contextItems.some(i => i.type === 'app');

  if (hasSchedule) {
    return [
      { category: 'Understand', label: 'View my schedule', prompt: 'Check this date against my schedule and explain availability: ' + contextItems.map(i => i.content).join(' '), icon: 'calendar_month' },
      { category: 'Transform', label: 'Draft a reply', prompt: 'Draft a friendly reply accepting or coordinating based on: ' + contextItems.map(i => i.content).join(' '), icon: 'reply' },
      { category: 'Ideate', label: 'Suggest meetup spots', prompt: 'Suggest suitable meetup spots or cafe ideas for: ' + contextItems.map(i => i.content).join(' '), icon: 'location_on' }
    ];
  }

  if (hasImage) {
    return [
      { category: 'Understand', label: 'Search with Lens', prompt: 'Identify and search what this image depicts in detail.', icon: 'search' },
      { category: 'Transform', label: 'Create image variation', prompt: 'Create prompt descriptions to generate complementary images for this.', icon: 'auto_awesome' },
      { category: 'Execute', label: 'Buy or find similar', prompt: 'Where can I find or purchase items similar to this?', icon: 'shopping_bag' }
    ];
  }

  if (hasApp) {
    return [
      { category: 'Understand', label: 'Explain this app', prompt: 'Explain the main features and purpose of ' + contextItems.map(i => i.content).join(', '), icon: 'help_outline' },
      { category: 'Transform', label: 'Quick shortcuts guide', prompt: 'Provide key shortcut keys and productivity tips for ' + contextItems.map(i => i.content).join(', '), icon: 'tips_and_updates' },
      { category: 'Execute', label: 'Launch & perform task', prompt: 'Suggest helpful tasks I can run in ' + contextItems.map(i => i.content).join(', '), icon: 'play_arrow' }
    ];
  }

  // Text context
  return [
    { category: 'Understand', label: 'Key points summary', prompt: 'Provide concise key points of the following text:\n\n' + contextItems.map(i => i.content).join('\n'), icon: 'subject' },
    { category: 'Transform', label: 'Translate to Japanese/English', prompt: 'Translate this text fluently (English to Japanese or Japanese to English):\n\n' + contextItems.map(i => i.content).join('\n'), icon: 'translate' },
    { category: 'Execute', label: 'Create actionable tasks', prompt: 'Extract todos and actionable items from:\n\n' + contextItems.map(i => i.content).join('\n'), icon: 'task_alt' }
  ];
}

async function updateSuggestionChips() {
  const chipsTray = document.getElementById('magic_pointer_chips');
  if (!chipsTray) return;

  // Use fallback chips first for instant responsiveness
  const chips = generateFallbackChips(magicPointerContextItems);
  renderChips(chips);

  // If Gemini API is available, request dynamic context actions in background
  if (magicPointerContextItems.length > 0 && window.electronAPI && window.electronAPI.askGemini) {
    try {
      const summaryContext = magicPointerContextItems.map(i => `[${i.type}]: ${i.content}`).join('\n');
      const dynamicPrompt = `Based on the selected screen context below, predict up to 3 next actions the user likely wants to perform.
Choose actions across the 4 categories: Understand, Transform, Ideate, Execute.
Return ONLY a valid JSON array of objects, each with:
"label": a short action label (under 30 characters),
"category": one of "Understand", "Transform", "Ideate", "Execute",
"icon": a Material icon name (e.g. search, reply, calendar_month, auto_awesome, shopping_bag, subject, translate),
"prompt": the prompt to run.
No explanation or markdown fence.

Context:
${summaryContext}`;

      const res = await window.electronAPI.askGemini(dynamicPrompt);
      if (res && res.success && res.text) {
        const clean = res.text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(clean);
        if (Array.isArray(parsed) && parsed.length > 0) {
          renderChips(parsed.slice(0, 3));
        }
      }
    } catch (e) {
      // Keep using fallback chips
    }
  }
}

function renderChips(chips) {
  const chipsTray = document.getElementById('magic_pointer_chips');
  if (!chipsTray) return;
  chipsTray.innerHTML = '';

  chips.forEach(chip => {
    const btn = document.createElement('m3e-suggestion-chip');
    btn.setAttribute('variant', 'elevated');
    btn.className = 'magic-pointer-chip';
    btn.innerHTML = `<m3e-icon slot="icon" name="${chip.icon || 'auto_awesome'}"></m3e-icon>${escapeHTML(chip.label)}`;
    btn.addEventListener('click', () => {
      executeChipAction(chip);
    });
    chipsTray.appendChild(btn);
  });
}

async function executeChipAction(chip) {
  const input = document.getElementById('ai_prompt_input');
  if (input) {
    input.value = chip.label;
  }
  await submitAIPrompt(chip.prompt);
}

function showAIPromptCard(x, y, initialItems = []) {
  const card = document.getElementById('ai_prompt_card');
  if (!card) return;

  if (initialItems && initialItems.length > 0) {
    magicPointerContextItems = [...initialItems];
  } else {
    magicPointerContextItems = [];
  }

  card.style.display = 'flex';
  card.style.left = `${x}px`;
  card.style.top = `${y}px`;

  const input = document.getElementById('ai_prompt_input');
  if (input) {
    input.value = '';
    input.style.height = 'auto';
  }

  const panel = document.getElementById('ai_response_panel');
  if (panel) panel.style.display = 'none';

  const content = document.getElementById('ai_response_content');
  if (content) content.innerHTML = '';

  renderMagicPointerContextItems();
  updateSuggestionChips();
  repositionAIPromptCard(x, y);

  setTimeout(() => {
    card.classList.add('visible');
    if (input) input.focus();
  }, 10);
}

function closeAIPromptCard() {
  const card = document.getElementById('ai_prompt_card');
  if (!card) return;
  card.classList.remove('visible');
  if (magicPointerSelectingMode) toggleSelectMode();
  setTimeout(() => {
    if (!card.classList.contains('visible')) {
      card.style.display = 'none';
      card.classList.remove('expanded');
    }
  }, 230);
}

function repositionAIPromptCard(x, y) {
  const card = document.getElementById('ai_prompt_card');
  if (!card || card.style.display === 'none') return;
  
  const cardWidth = card.offsetWidth || 340;
  const cardHeight = card.offsetHeight || 140;
  
  let left = x !== undefined ? x + 10 : parseInt(card.style.left) || 0;
  let top = y !== undefined ? y + 10 : parseInt(card.style.top) || 0;
  
  if (left + cardWidth > window.innerWidth) {
    left = window.innerWidth - cardWidth - 15;
  }
  if (left < 15) left = 15;
  
  if (top + cardHeight > window.innerHeight) {
    top = window.innerHeight - cardHeight - 15;
  }
  if (top < 15) top = 15;
  
  card.style.left = `${left}px`;
  card.style.top = `${top}px`;
}

async function submitAIPrompt(customPrompt) {
  const input = document.getElementById('ai_prompt_input');
  if (!input && !customPrompt) return;
  const prompt = customPrompt || (input ? input.value.trim() : '');
  if (!prompt) return;

  const content = document.getElementById('ai_response_content');
  const panel = document.getElementById('ai_response_panel');
  if (!content || !panel) return;

  panel.style.display = 'block';
  content.innerHTML = `<div class="ai-thinking-spinner"><span>${window.i18n ? window.i18n.t('ai_thinking') : 'Thinking...'}</span></div>`;
  
  repositionAIPromptCard();

  try {
    let finalPrompt = prompt;
    if (magicPointerContextItems.length > 0) {
      const contextStr = magicPointerContextItems.map(i => `[${i.type}]: ${i.content}`).join('\n');
      finalPrompt = `Context:\n${contextStr}\n\nUser Request: ${prompt}`;
    }

    const response = await window.electronAPI.askGemini(finalPrompt);
    if (response.success) {
      content.innerHTML = renderMarkdown(response.text);
    } else {
      let errMsg = window.i18n ? window.i18n.t('ai_error') : 'An error occurred.';
      if (response.error && response.error.includes('not configured')) {
        errMsg = window.i18n ? window.i18n.t('ai_key_missing') : 'Please configure Gemini API Key in settings.';
      } else if (response.error) {
        errMsg += `<br><small style="opacity:0.7;">${response.error}</small>`;
      }
      content.innerHTML = `<span style="color:var(--error-color);">${errMsg}</span>`;
    }
  } catch (e) {
    const errMsg = window.i18n ? window.i18n.t('ai_error') : 'An error occurred.';
    content.innerHTML = `<span style="color:var(--error-color);">${errMsg}<br><small style="opacity:0.7;">${e.message}</small></span>`;
  }
  
  repositionAIPromptCard();
}

function escapeHTML(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderMarkdown(md) {
  if (!md) return '';
  
  let html = escapeHTML(md);
  
  // Parse code blocks (```code```)
  const codeBlocks = [];
  html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
    codeBlocks.push(code.trim());
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });
  
  // Parse inline code (`code`)
  const inlineCodes = [];
  html = html.replace(/`([^`\n]+)`/g, (match, code) => {
    inlineCodes.push(code);
    return `__INLINE_CODE_${inlineCodes.length - 1}__`;
  });
  
  // Parse bold (**text**)
  html = html.replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>');
  
  // Parse bullet lists (lines starting with - or *)
  const lines = html.split('\n');
  let inList = false;
  let resultLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    const match = line.match(/^([-*]|\d+\.)\s+(.*)$/);
    
    if (match) {
      if (!inList) {
        inList = true;
        resultLines.push('<ul>');
      }
      resultLines.push(`<li>${match[2]}</li>`);
    } else {
      if (inList) {
        inList = false;
        resultLines.push('</ul>');
      }
      resultLines.push(lines[i]);
    }
  }
  if (inList) {
    resultLines.push('</ul>');
  }
  
  html = resultLines.join('\n');
  
  // Restore inline code
  html = html.replace(/__INLINE_CODE_(\d+)__/g, (match, index) => {
    return `<code>${inlineCodes[index]}</code>`;
  });
  
  // Restore code blocks
  html = html.replace(/__CODE_BLOCK_(\d+)__/g, (match, index) => {
    return `<pre><code>${codeBlocks[index]}</code></pre>`;
  });
  
  // Parse line breaks (except within pre tags)
  const parts = html.split(/(<pre>[\s\S]*?<\/pre>)/);
  for (let i = 0; i < parts.length; i++) {
    if (!parts[i].startsWith('<pre>')) {
      parts[i] = parts[i].replace(/\n/g, '<br>');
    }
  }
  html = parts.join('');
  
  return html;
}

// ========================================
// Spotlight Search
// ========================================

const SPOTLIGHT_SETTINGS_SECTIONS = [
  { id: 'design_style',         icon: 'palette',       label_key: 'design_style' },
  { id: 'icon_settings',        icon: 'category',      label_key: 'icon_settings' },
  { id: 'system_settings',      icon: 'settings',      label_key: 'system_settings' },
  { id: 'performance_settings', icon: 'speed',         label_key: 'performance_settings' },
  { id: 'security_privacy',     icon: 'security',      label_key: 'security_privacy' },
  { id: 'data_management',      icon: 'storage',       label_key: 'data_management' },
  { id: 'ai_settings',          icon: 'auto_awesome',  label_key: 'ai_settings' },
  { id: 'developer_settings',   icon: 'code',          label_key: 'developer_settings' },
  { id: 'about',                icon: 'info',          label_key: 'about' },
];

function getSpotlightApps() {
  const customApps    = JSON.parse(localStorage.getItem(LS_KEYS.CUSTOM_APPS)      || '[]');
  const linuxApps     = JSON.parse(localStorage.getItem(LS_KEYS.LINUX_APPS)       || '[]');
  const fileShortcuts = JSON.parse(localStorage.getItem(LS_KEYS.FILE_SHORTCUTS)   || '[]');
  const folderShortcuts = JSON.parse(localStorage.getItem(LS_KEYS.FOLDER_SHORTCUTS) || '[]');
  return [
    ...customApps.map(a    => ({ ...a, _type: 'webapp'  })),
    ...linuxApps.map(a     => ({ ...a, _type: 'linux'   })),
    ...fileShortcuts.map(a => ({ ...a, _type: 'file'    })),
    ...folderShortcuts.map(a => ({ ...a, _type: 'folder' })),
  ];
}

function spotlightTypeIcon(type) {
  switch (type) {
    case 'webapp':  return '🌐';
    case 'linux':   return '🖥️';
    case 'file':    return '📄';
    case 'folder':  return '📁';
    default:        return '📌';
  }
}

function spotlightTypeLabel(type) {
  switch (type) {
    case 'webapp':  return 'Web App';
    case 'linux':   return 'Linux App';
    case 'file':    return 'File';
    case 'folder':  return 'Folder';
    default:        return '';
  }
}

function initSpotlight() {
  const overlay     = document.getElementById('spotlight_overlay');
  const input       = document.getElementById('spotlight_input');
  const closeBtn    = document.getElementById('spotlight_close_btn');
  const appsList    = document.getElementById('spotlight_apps_list');
  const settingsList = document.getElementById('spotlight_settings_list');
  const aiList      = document.getElementById('spotlight_ai_list');
  const catApps     = document.getElementById('spotlight_cat_apps');
  const catSettings = document.getElementById('spotlight_cat_settings');
  const catAI       = document.getElementById('spotlight_cat_ai');
  const aiResponse  = document.getElementById('spotlight_ai_response');
  const aiResponseContent = document.getElementById('spotlight_ai_response_content');

  if (!overlay || !input) return;

  let keyboardIndex = -1;
  let allItems = [];

  // --- Open / Close ---
  function openSpotlight() {
    overlay.classList.remove('spotlight-hidden');
    renderResults('');
    setTimeout(() => {
      if (input) {
        input.value = '';
        input.focus();
      }
    }, 50);
  }

  function closeSpotlight() {
    overlay.classList.add('spotlight-hidden');
    if (input) input.value = '';
    if (aiResponse) aiResponse.style.display = 'none';
    if (aiResponseContent) aiResponseContent.innerHTML = '';
    keyboardIndex = -1;
    allItems = [];
  }

  // Alt+Space でSpotlightをトグル（ウィンドウフォーカス時のみ動作）
  document.addEventListener('keydown', (e) => {
    if (e.key === ' ' && e.altKey && !e.ctrlKey && !e.metaKey) {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      e.preventDefault();
      if (overlay.classList.contains('spotlight-hidden')) {
        openSpotlight();
      } else {
        closeSpotlight();
      }
    }
  });

  // Close on overlay background click
  overlay.addEventListener('mousedown', (e) => {
    if (e.target === overlay) closeSpotlight();
  });

  // Close button
  if (closeBtn) closeBtn.addEventListener('click', closeSpotlight);

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.classList.contains('spotlight-hidden')) {
      e.stopPropagation();
      closeSpotlight();
    }
  }, true);

  // --- Rendering ---
  function makeAppItem(app) {
    const item = document.createElement('div');
    item.className = 'spotlight-result-item';
    item.setAttribute('tabindex', '-1');

    let iconHTML;
    if (app.image) {
      iconHTML = `<img class="spotlight-result-icon" src="${escapeHTML(app.image)}" alt="" />`;
    } else {
      iconHTML = `<div class="spotlight-result-icon icon-symbol">${spotlightTypeIcon(app._type)}</div>`;
    }

    item.innerHTML = `
      ${iconHTML}
      <div class="spotlight-result-text">
        <div class="spotlight-result-label">${escapeHTML(app.name || '')}</div>
        <div class="spotlight-result-sublabel">${spotlightTypeLabel(app._type)}</div>
      </div>
    `;

    item.addEventListener('click', () => launchSpotlightApp(app));
    return item;
  }

  function makeSettingsItem(section) {
    const item = document.createElement('div');
    item.className = 'spotlight-result-item';
    item.setAttribute('tabindex', '-1');

    const label = window.i18n ? window.i18n.t(section.label_key) : section.label_key;
    item.innerHTML = `
      <div class="spotlight-result-icon icon-symbol"><m3e-icon name="${section.icon}"></m3e-icon></div>
      <div class="spotlight-result-text">
        <div class="spotlight-result-label">${escapeHTML(label)}</div>
        <div class="spotlight-result-sublabel">${window.i18n ? window.i18n.t('spotlight_cat_settings') : 'Settings'}</div>
      </div>
    `;

    item.addEventListener('click', () => {
      openSettingsSection(section.id);
      closeSpotlight();
    });
    return item;
  }

  function makeAIItem(query) {
    const item = document.createElement('div');
    item.className = 'spotlight-result-item';
    item.setAttribute('tabindex', '-1');

    const prefix = window.i18n ? window.i18n.t('spotlight_ask_ai') : 'Ask AI: ';
    item.innerHTML = `
      <div class="spotlight-result-icon icon-symbol"><m3e-icon name="auto_awesome"></m3e-icon></div>
      <div class="spotlight-result-text">
        <div class="spotlight-result-label">${escapeHTML(prefix)}${escapeHTML(query)}</div>
        <div class="spotlight-result-sublabel">Gemini AI</div>
      </div>
    `;

    item.addEventListener('click', () => spotlightAskAI(query));
    return item;
  }

  function renderResults(query) {
    const q = query.trim().toLowerCase();
    const apps = getSpotlightApps();

    // Filter apps
    const filteredApps = q
      ? apps.filter(a => (a.name || '').toLowerCase().includes(q))
      : apps;

    // Filter settings
    const filteredSettings = SPOTLIGHT_SETTINGS_SECTIONS.filter(s => {
      if (!q) return false; // Only show settings when searching
      const label = window.i18n ? window.i18n.t(s.label_key) : s.label_key;
      return label.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
    });

    // Build app items
    appsList.innerHTML = '';
    filteredApps.slice(0, 8).forEach(app => {
      const item = makeAppItem(app);
      appsList.appendChild(item);
    });
    catApps.classList.toggle('visible', filteredApps.length > 0);

    // Build settings items
    settingsList.innerHTML = '';
    filteredSettings.forEach(s => {
      const item = makeSettingsItem(s);
      settingsList.appendChild(item);
    });
    catSettings.classList.toggle('visible', filteredSettings.length > 0);

    // AI item (only shown when there's a query)
    aiList.innerHTML = '';
    if (q) {
      const aiItem = makeAIItem(query.trim());
      aiList.appendChild(aiItem);
      catAI.classList.add('visible');
    } else {
      catAI.classList.remove('visible');
    }

    // Reset AI response when query changes
    if (aiResponse) aiResponse.style.display = 'none';
    if (aiResponseContent) aiResponseContent.innerHTML = '';

    // Rebuild keyboard nav index
    allItems = Array.from(overlay.querySelectorAll('.spotlight-result-item'));
    keyboardIndex = -1;
  }

  // --- Input event ---
  input.addEventListener('input', () => {
    renderResults(input.value);
  });

  // --- Keyboard navigation ---
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setKeyboardActive(keyboardIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setKeyboardActive(keyboardIndex - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (keyboardIndex >= 0 && allItems[keyboardIndex]) {
        allItems[keyboardIndex].click();
      } else if (input.value.trim()) {
        // Enter with no selection → ask AI
        spotlightAskAI(input.value.trim());
      }
    }
  });

  function setKeyboardActive(idx) {
    allItems.forEach(i => i.classList.remove('keyboard-active'));
    if (idx < 0) {
      keyboardIndex = -1;
      input.focus();
      return;
    }
    if (idx >= allItems.length) idx = 0;
    keyboardIndex = idx;
    allItems[keyboardIndex].classList.add('keyboard-active');
    allItems[keyboardIndex].scrollIntoView({ block: 'nearest' });
  }

  // --- App launch ---
  function launchSpotlightApp(app) {
    closeSpotlight();
    if (!window.electronAPI) return;

    if (app._type === 'linux') {
      window.electronAPI.launchLinuxApp(app.command).catch(e => console.error('Spotlight launch error:', e));
    } else if (app._type === 'file' || app._type === 'folder') {
      window.electronAPI.openFileOrFolder(app.path).catch(e => console.error('Spotlight open error:', e));
    } else if (app._type === 'webapp') {
      // Web apps open via the existing desktop icon click mechanism — find and click it
      const saveKey = app.saveKey;
      if (saveKey) {
        const el = document.querySelector(`[data-savekey="${saveKey}"]`);
        if (el) { el.click(); return; }
      }
      // Fallback: open URL externally if available
      if (app.url && window.openURL) {
        window.openURL(app.url);
      }
    }
  }

  // --- Settings navigation ---
  function openSettingsSection(sectionId) {
    const overlay = document.getElementById('settingsmenu_modal_overlay');
    if (overlay) overlay.style.display = 'flex';
    if (typeof showSettingsSection === 'function') showSettingsSection(sectionId);
  }

  // --- AI query ---
  async function spotlightAskAI(query) {
    if (!window.electronAPI || !window.electronAPI.askGemini) return;

    // Show AI section and spinner
    catAI.classList.add('visible');
    if (aiResponse) aiResponse.style.display = 'block';
    if (aiResponseContent) {
      aiResponseContent.innerHTML = `<div class="ai-thinking-spinner"><m3e-icon name="autorenew"></m3e-icon><span>${window.i18n ? window.i18n.t('ai_thinking') : 'Thinking...'}</span></div>`;
    }

    // Scroll to AI response
    if (aiResponse) aiResponse.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    try {
      const response = await window.electronAPI.askGemini(query);
      if (response.success) {
        if (aiResponseContent) aiResponseContent.innerHTML = renderMarkdown(response.text);
      } else {
        let errMsg = window.i18n ? window.i18n.t('ai_error') : 'An error occurred.';
        if (response.error && response.error.includes('not configured')) {
          errMsg = window.i18n ? window.i18n.t('ai_key_missing') : 'Please configure Gemini API Key in settings.';
        }
        if (aiResponseContent) aiResponseContent.innerHTML = `<span style="color:var(--error-color);">${errMsg}</span>`;
      }
    } catch (e) {
      const errMsg = window.i18n ? window.i18n.t('ai_error') : 'An error occurred.';
      if (aiResponseContent) aiResponseContent.innerHTML = `<span style="color:var(--error-color);">${errMsg}<br><small style="opacity:0.7;">${e.message}</small></span>`;
    }
  }

  // i18n re-render on language change
  document.addEventListener('i18n:loaded', () => {
    renderResults(input ? input.value : '');
  });
}
