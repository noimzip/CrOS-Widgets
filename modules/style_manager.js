/**
 * Soul Widgets Manager - Style Manager
 */

'use strict';

window.StyleManager = {
  colorSchemes: ['blue', 'red', 'green', 'purple', 'orange', 'teal', 'pink'],

  /**
   * カラースキームを更新
   */
  updateColorScheme(scheme, customColor = null) {
    window.StyleManager.colorSchemes.forEach(s => {
      document.body.classList.remove(`color-scheme-${s}`);
    });
    document.body.classList.remove('color-scheme-custom');
    
    if (scheme === 'custom' && customColor) {
      document.body.classList.add('color-scheme-custom');
      window.StyleManager.applyCustomColor(customColor);
      localStorage.setItem(LS_KEYS.COLOR_SCHEME, 'custom');
      localStorage.setItem(LS_KEYS.CUSTOM_COLOR, customColor);
    } else {
      document.body.classList.add(`color-scheme-${scheme}`);
      localStorage.setItem(LS_KEYS.COLOR_SCHEME, scheme);
    }
    
    document.querySelectorAll('.color-swatch').forEach(swatch => {
      if (scheme === 'custom') {
        swatch.classList.toggle('selected', swatch.classList.contains('color-picker-swatch'));
      } else {
        swatch.classList.toggle('selected', swatch.dataset.color === scheme);
      }
    });
  },

  /**
   * カスタムカラーを適用
   */
  applyCustomColor(hexColor) {
    const rgb = window.UIUtils.hexToRgb(hexColor);
    if (!rgb) return;
    
    const hsl = window.StyleManager.rgbToHsl(rgb.r, rgb.g, rgb.b);
    
    const primaryLight = window.StyleManager.hslToHex(hsl.h, Math.min(hsl.s + 10, 100), Math.min(hsl.l + 15, 85));
    const primaryDark = window.StyleManager.hslToHex(hsl.h, hsl.s, Math.max(hsl.l - 15, 15));
    const clockPrimary = window.StyleManager.hslToHex(hsl.h, Math.min(hsl.s + 5, 100), Math.min(hsl.l + 10, 70));
    const clockSecondary = window.StyleManager.hslToHex(hsl.h, hsl.s, Math.max(hsl.l - 20, 20));
    const clockAccent = window.StyleManager.hslToHex(hsl.h, Math.max(hsl.s - 30, 20), Math.min(hsl.l + 30, 90));
    const clockBackground = window.StyleManager.hslToHex(hsl.h, Math.max(hsl.s - 20, 10), Math.max(hsl.l - 40, 10));
    const primaryContainer = window.StyleManager.hslToHex(hsl.h, Math.max(hsl.s - 40, 20), 90);
    
    const bgRgb = window.UIUtils.hexToRgb(clockBackground);
    const clockTextColor = window.UIUtils.getContrastColor(bgRgb.r, bgRgb.g, bgRgb.b);
    const onPrimaryColor = window.UIUtils.getContrastColor(rgb.r, rgb.g, rgb.b);
    const containerRgb = window.UIUtils.hexToRgb(primaryContainer);
    const onPrimaryContainerColor = window.UIUtils.getContrastColor(containerRgb.r, containerRgb.g, containerRgb.b);
    
    const root = document.documentElement;
    root.style.setProperty('--md-sys-color-primary', hexColor);
    root.style.setProperty('--md-sys-color-on-primary', onPrimaryColor);
    root.style.setProperty('--md-sys-color-tertiary', primaryDark);
    root.style.setProperty('--md-sys-color-primary-container', primaryContainer);
    root.style.setProperty('--md-sys-color-on-primary-container', onPrimaryContainerColor);
    root.style.setProperty('--primary-color', hexColor);
    root.style.setProperty('--primary-dark', primaryDark);
    root.style.setProperty('--primary-light', primaryLight);
    root.style.setProperty('--clock-primary', clockPrimary);
    root.style.setProperty('--clock-secondary', clockSecondary);
    root.style.setProperty('--clock-accent', clockAccent);
    root.style.setProperty('--clock-background', clockBackground);
    root.style.setProperty('--clock-text-color', clockTextColor);
    
    const pickerSwatch = document.querySelector('.color-picker-swatch');
    if (pickerSwatch) {
      pickerSwatch.style.setProperty('--custom-color', hexColor);
      pickerSwatch.style.background = hexColor;
    }
  },

  /**
   * アイコン形状を更新
   */
  updateIconShape(shape) {
    document.body.classList.remove('icon-shape-circle', 'icon-shape-square', 'icon-shape-custom');

    if (shape === 'square' || shape === 'circle') {
      document.body.classList.add(`icon-shape-${shape}`);
      if (typeof window.applyShapeToAll === 'function') window.applyShapeToAll(shape);
    } else {
      document.body.classList.add('icon-shape-custom');
      if (typeof window.applyShapeToAll === 'function') window.applyShapeToAll(shape);
    }

    localStorage.setItem(LS_KEYS.ICON_SHAPE, shape);

    const iconShapeSelector = document.getElementById('icon_shape_selector');
    if (iconShapeSelector) {
      window.setSelectValue(iconShapeSelector, shape);
    }
  },

  /**
   * 時計の形状を更新
   */
  updateClockShape(shape) {
    if (typeof window.applyClockShape === 'function') {
      window.applyClockShape(shape);
    }
    localStorage.setItem(LS_KEYS.CLOCK_SHAPE, shape);
  },

  /**
   * メディアプレーヤーのパーツ表示・非表示を更新
   */
  updateMediaPlayerVisibility(part, isVisible) {
    const player = document.getElementById('media_player_widget');
    if (!player) return;

    switch (part) {
      case 'seekbar':
        const seekbar = player.querySelector('.media-seekbar');
        if (seekbar) seekbar.style.display = isVisible ? '' : 'none';
        localStorage.setItem(LS_KEYS.MEDIA_PLAYER_SHOW_SEEKBAR, isVisible);
        break;
      case 'shuffle':
        const shuffle = document.getElementById('media_shuffle');
        if (shuffle) shuffle.style.display = isVisible ? '' : 'none';
        localStorage.setItem(LS_KEYS.MEDIA_PLAYER_SHOW_SHUFFLE, isVisible);
        break;
      case 'repeat':
        const repeat = document.getElementById('media_repeat');
        if (repeat) repeat.style.display = isVisible ? '' : 'none';
        localStorage.setItem(LS_KEYS.MEDIA_PLAYER_SHOW_REPEAT, isVisible);
        break;
    }
  },

  /**
   * テーマを適用（ライト/ダーク/システム）
   */
  applyTheme(mode) {
    const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)');
    let isDark = false;
    if (mode === 'system') {
      isDark = systemDarkMode.matches;
    } else if (mode === 'dark') {
      isDark = true;
    } else {
      isDark = false;
    }

    if (isDark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    
    localStorage.setItem(LS_KEYS.DARK_MODE_SETTING, mode);
  },

  /**
   * アニメーション無効化状態を更新
   */
  updateAnimationsDisabled(isDisabled) {
    if (isDisabled) {
      document.body.classList.add('no-animations');
    } else {
      document.body.classList.remove('no-animations');
    }
    localStorage.setItem(LS_KEYS.ANIMATIONS_DISABLED, isDisabled);
  },

  // Color utilities
  rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  },

  hslToHex(h, s, l) {
    s /= 100; l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  },

  resetCustomColorVars() {
    const vars = [
      '--md-sys-color-primary', '--md-sys-color-on-primary', '--md-sys-color-tertiary', 
      '--md-sys-color-primary-container', '--md-sys-color-on-primary-container',
      '--primary-color', '--primary-dark', '--primary-light',
      '--clock-primary', '--clock-secondary', '--clock-accent', '--clock-background', '--clock-text-color'
    ];
    vars.forEach(v => document.documentElement.style.removeProperty(v));
  }
};