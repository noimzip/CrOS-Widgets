/**
 * Soul Widgets Manager - Constants
 */

'use strict';

// ビルトインアイコン (index.html にある `appicon-...`) の既定 URL マップ
const builtinIconUrls = {
  'appicon-chrome': 'chrome://newtab',
  'appicon-files': 'chrome://file-manager',
  'appicon-settings': 'chrome://os-settings'
};

// localStorageで使用するキーを一元管理
const LS_KEYS = {
  WIDGET_POSITIONS: 'widgetPositions',
  CUSTOM_APPS: 'customApps',
  LINUX_APPS: 'linuxApps',
  FILE_SHORTCUTS: 'fileShortcuts',
  FOLDER_SHORTCUTS: 'folderShortcuts',
  APP_FOLDERS: 'appFolders',
  LANGUAGE: 'language',
  GRID_MODE_ENABLED: 'gridModeEnabled',
  ICON_SHAPE: 'iconShape',
  CLOCK_SHAPE: 'clockShape',
  CUSTOM_SHAPES: 'customShapes',
  COLOR_SCHEME: 'colorScheme',
  CUSTOM_COLOR: 'customColor',
  SHOW_SETTINGS_FAB: 'showSettingsFab',
  DARK_MODE_ENABLED: 'darkModeEnabled',
  DARK_MODE_SETTING: 'darkModeSetting',
  GITHUB_USERNAME: 'githubUsername',
  GOOGLE_CALENDAR_URL: 'googleCalendarUrl',
  GMAIL_TOKEN: 'gmailToken',
  GMAIL_REFRESH_TOKEN: 'gmailRefreshToken',
  GMAIL_CLIENT_ID: 'gmailClientId',
  GMAIL_CLIENT_SECRET: 'gmailClientSecret',
  GMAIL_TOKEN_EXPIRES_AT: 'gmailTokenExpiresAt',
  MEDIA_PLAYER_SHOW_SEEKBAR: 'mediaPlayerShowSeekbar',
  MEDIA_PLAYER_SHOW_SHUFFLE: 'mediaPlayerShowShuffle',
  MEDIA_PLAYER_SHOW_REPEAT: 'mediaPlayerShowRepeat',
  WIDGET_VISIBILITY: 'widgetVisibility',
  WIDGET_SIZE_PREFIX: 'widgetSize:',
  GRID_SIZE_X: 'gridSizeX',
  GRID_SIZE_Y: 'gridSizeY',
  LOCK_MOVEMENT: 'lockMovement',
  ICON_SIZE: 'iconSize',
  SECURITY_MODE: 'securityMode',
  SHOW_CHROME_ICON: 'showChromeIcon',
  SHOW_FILES_ICON: 'showFilesIcon',
  SHOW_SETTINGS_ICON: 'showSettingsIcon',
  UPDATE_CHANNEL: 'updateChannel',
  ANIMATIONS_DISABLED: 'animationsDisabled',
  MEDIA_POLLING_INTERVAL: 'mediaPollingInterval',
  MEDIA_SMART_POLLING: 'mediaSmartPolling',
};

const SHAPES = [
  "square", "circle", "rounded", "cut",
  "4-leaf-clover", "4-sided-cookie", "6-sided-cookie", "7-sided-cookie", "8-leaf-clover", "9-sided-cookie", "12-sided-cookie",
  "arch", "arrow", "boom", "bun", "burst", "diamond", "fan", "flower", "gem", "ghost-ish", "heart", "hexagon", "oval", "pentagon", "pill", "pixel-circle", "pixel-triangle", "puffy", "puffy-diamond", "semicircle", "slanted", "soft-boom", "soft-burst", "sunny", "triangle", "very-sunny"
];

// グリッド設定
let GRID_SIZE_X = parseInt(localStorage.getItem(LS_KEYS.GRID_SIZE_X)) || 80;
let GRID_SIZE_Y = parseInt(localStorage.getItem(LS_KEYS.GRID_SIZE_Y)) || 90;
let ICON_SIZE = parseInt(localStorage.getItem(LS_KEYS.ICON_SIZE)) || 80;
const GRID_OFFSET = 20;
const OVERLAP_THRESHOLD = 800;
