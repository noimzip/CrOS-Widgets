/**
 * Soul Widgets Manager - Media Player Widget
 */

'use strict';

// メディアソース: 'linux' (playerctl) または 'browser' (Chrome拡張機能)
let currentMediaSource = 'linux';
let browserMediaInfo = null;

/**
 * Linuxメディア情報を取得する（playerctl）
 * @returns {Promise<Object>}
 */
async function getLinuxMediaInfo() {
  if (window.electronAPI && window.electronAPI.getMediaInfo) {
    return await window.electronAPI.getMediaInfo();
  }
  return null;
}

/**
 * ブラウザメディア情報を取得する
 * @returns {Object}
 */
function getBrowserMediaInfo() {
  if (window.electronAPI && window.electronAPI.getBrowserMediaInfo) {
    return window.electronAPI.getBrowserMediaInfo();
  }
  return null;
}

/**
 * 最適なメディアソースを選択してメディア情報を取得する
 * @returns {Promise<Object>}
 */
async function getMediaInfo() {
  // ブラウザのメディア情報を取得
  const browserInfo = getBrowserMediaInfo();
  const hasBrowserMedia = browserInfo && 
    browserInfo.status !== 'No player' && 
    browserInfo.status !== 'Stopped' &&
    browserInfo.title;
  
  // Linuxのメディア情報を取得
  const linuxInfo = await getLinuxMediaInfo();
  const hasLinuxMedia = linuxInfo && 
    linuxInfo.status !== 'No player' && 
    linuxInfo.player !== '';
  
  // 再生中のソースを優先
  if (hasBrowserMedia && browserInfo.status === 'Playing') {
    currentMediaSource = 'browser';
    return { ...browserInfo, source: 'browser' };
  }
  
  if (hasLinuxMedia && linuxInfo.status === 'Playing') {
    currentMediaSource = 'linux';
    return { ...linuxInfo, source: 'linux' };
  }
  
  // どちらも再生中でない場合、情報がある方を返す
  if (hasBrowserMedia) {
    currentMediaSource = 'browser';
    return { ...browserInfo, source: 'browser' };
  }
  
  if (hasLinuxMedia) {
    currentMediaSource = 'linux';
    return { ...linuxInfo, source: 'linux' };
  }
  
  // どちらもない場合
  currentMediaSource = 'none';
  return { status: 'No player', title: '', artist: '', artUrl: '', source: 'none' };
}

/**
 * メディアを制御する
 * @param {string} action - 'play-pause', 'next', 'previous', 'seek'
 * @param {number} value - シークの場合の秒数
 * @returns {Promise<{success: boolean}>}
 */
async function mediaControl(action, value) {
  // 現在のメディアソースに応じて制御
  if (currentMediaSource === 'browser') {
    if (window.electronAPI && window.electronAPI.browserMediaControl) {
      return window.electronAPI.browserMediaControl(action, value);
    }
  } else {
    if (window.electronAPI && window.electronAPI.mediaControl) {
      return await window.electronAPI.mediaControl(action, value);
    }
  }
  return { success: false };
}

// メディアプレイヤーUI要素
const mediaPlayerWidget = document.getElementById('media_player_widget');
const mediaTitle = document.getElementById('media_title');
const mediaArtist = document.getElementById('media_artist');
const mediaArt = document.getElementById('media_art');
const mediaPlayIcon = document.getElementById('media_play_icon');
const mediaPrevBtn = document.getElementById('media_prev');
const mediaPlayPauseBtn = document.getElementById('media_play_pause');
const mediaNextBtn = document.getElementById('media_next');
const mediaShuffleBtn = document.getElementById('media_shuffle');
const mediaRepeatBtn = document.getElementById('media_repeat');
const mediaSeekbar = document.getElementById('media_seekbar');
const mediaTimeCurrent = document.getElementById('media_time_current');
const mediaTimeTotal = document.getElementById('media_time_total');

let currentMediaStatus = 'Stopped';
let currentDuration = 0; // 曲の長さ（秒）
let currentShuffle = 'Off';
let currentLoop = 'None';
let isSeeking = false; // シーク中フラグ

/**
 * 秒数を mm:ss 形式にフォーマット
 */
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

let lastMediaJson = '';

/**
 * メディアプレイヤーUIを更新
 */
async function updateMediaPlayer() {
  const info = await getMediaInfo();
  if (!info) return;
  
  // 変更がない場合はスキップ
  const currentJson = JSON.stringify(info);
  if (currentJson === lastMediaJson && !isSeeking) return;
  lastMediaJson = currentJson;
  
  const hasPlayer = info.status !== 'No player' && info.source !== 'none';
  
  if (mediaPlayerWidget) {
    mediaPlayerWidget.classList.toggle('no-player', !hasPlayer);
    // ソースに応じてスタイルを変更（オプション）
    mediaPlayerWidget.dataset.source = info.source || 'none';
  }
  
  if (!hasPlayer) {
    if (mediaTitle) mediaTitle.textContent = i18n.t('no_music_playing');
    if (mediaArtist) mediaArtist.textContent = '';
    if (mediaArt) mediaArt.style.display = 'none';
    if (mediaPlayIcon) mediaPlayIcon.setAttribute('name', 'play_arrow');
    document.querySelector('.media-player-placeholder')?.style.setProperty('display', 'block');
    return;
  }
  
  // タイトルとアーティストを更新
  if (mediaTitle) {
    mediaTitle.textContent = info.title || 'Unknown Title';
  }
  if (mediaArtist) {
    mediaArtist.textContent = info.artist || '';
  }
  
  // アルバムアートを更新
  if (mediaArt && info.artUrl) {
    if (mediaArt.src !== info.artUrl) {
      mediaArt.src = info.artUrl;
    }
    mediaArt.style.display = 'block';
    mediaArt.onerror = () => {
      mediaArt.style.display = 'none';
      document.querySelector('.media-player-placeholder')?.style.setProperty('display', 'block');
    };
    document.querySelector('.media-player-placeholder')?.style.setProperty('display', 'none');
  } else if (mediaArt) {
    mediaArt.style.display = 'none';
    document.querySelector('.media-player-placeholder')?.style.setProperty('display', 'block');
  }
  
  // 再生状態に応じてアイコンを更新
  currentMediaStatus = info.status;
  if (mediaPlayIcon) {
    mediaPlayIcon.setAttribute('name', info.status === 'Playing' ? 'pause' : 'play_arrow');
  }
  
  // シークバーを更新（シーク中でない場合のみ）
  if (!isSeeking) {
    // position と length を取得（Linuxの場合）
    let position = 0;
    let duration = 0;
    
    if (info.position !== undefined) {
      position = parseFloat(info.position) || 0;
    }
    if (info.length !== undefined) {
      // mpris:length はマイクロ秒
      duration = parseFloat(info.length) / 1000000 || 0;
    }
    if (info.duration !== undefined) {
      // ブラウザからの場合は秒
      duration = parseFloat(info.duration) || 0;
    }
    if (info.currentTime !== undefined) {
      position = parseFloat(info.currentTime) || 0;
    }
    
    currentDuration = duration;
    
    // シークバーの値を更新
    if (mediaSeekbar && duration > 0) {
      const percent = (position / duration) * 100;
      const thumb = mediaSeekbar.querySelector('m3e-slider-thumb');
      if (thumb) thumb.value = percent;
      mediaSeekbar.disabled = false;
    } else if (mediaSeekbar) {
      const thumb = mediaSeekbar.querySelector('m3e-slider-thumb');
      if (thumb) thumb.value = 0;
      mediaSeekbar.disabled = true;
    }
    
    // 時間表示を更新
    if (mediaTimeCurrent) {
      mediaTimeCurrent.textContent = formatTime(position);
    }
    if (mediaTimeTotal) {
      mediaTimeTotal.textContent = formatTime(duration);
    }
    
    // シャッフル・リピート状態の更新
    if (info.shuffle) {
      currentShuffle = info.shuffle;
      if (mediaShuffleBtn) {
        const isShuffleOn = currentShuffle === 'On';
        mediaShuffleBtn.classList.toggle('active', isShuffleOn);
        mediaShuffleBtn.setAttribute('variant', isShuffleOn ? 'filled-tonal' : 'standard');
        mediaShuffleBtn.title = `Shuffle: ${currentShuffle}`;
        mediaShuffleBtn.disabled = false;
      }
    } else if (mediaShuffleBtn) {
      mediaShuffleBtn.disabled = true;
      mediaShuffleBtn.classList.remove('active');
      mediaShuffleBtn.setAttribute('variant', 'standard');
      mediaShuffleBtn.title = 'Shuffle';
    }

    if (info.loop) {
      currentLoop = info.loop;
      if (mediaRepeatBtn) {
        const loopStatus = currentLoop.toLowerCase();
        const isTrack = loopStatus === 'track' || loopStatus === 'one';
        const isPlaylist = loopStatus === 'playlist' || loopStatus === 'all';
        const isActive = isTrack || isPlaylist;
        
        mediaRepeatBtn.classList.toggle('active', isActive);
        mediaRepeatBtn.classList.toggle('repeat-one', isTrack);
        mediaRepeatBtn.setAttribute('variant', isActive ? 'filled-tonal' : 'standard');
        
        const icon = mediaRepeatBtn.querySelector('m3e-icon');
        if (icon) {
          const iconName = isTrack ? 'repeat_one' : 'repeat';
          icon.setAttribute('name', iconName);
          icon.name = iconName; // プロパティも更新
        }
        
        // ツールチップ更新
        let title = 'Repeat: Off';
        if (isPlaylist) title = 'Repeat: All';
        if (isTrack) title = 'Repeat: One';
        mediaRepeatBtn.title = title;
        
        mediaRepeatBtn.disabled = false;
      }
    } else if (mediaRepeatBtn) {
      mediaRepeatBtn.disabled = true;
      mediaRepeatBtn.classList.remove('active');
      mediaRepeatBtn.classList.remove('repeat-one');
      mediaRepeatBtn.setAttribute('variant', 'standard');
      mediaRepeatBtn.title = 'Repeat';
    }
  }
}

// メディアコントロールボタンのイベント
// ドラッグイベントと干渉しないように pointerdown + pointerup で処理
function setupMediaButton(btn, action) {
  if (!btn) return;
  
  let isPointerDown = false;
  let startX, startY;
  
  btn.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); // ウィジェットのドラッグを防止
    isPointerDown = true;
    startX = e.clientX;
    startY = e.clientY;
  });
  
  btn.addEventListener('pointerup', async (e) => {
    e.stopPropagation();
    if (!isPointerDown) return;
    isPointerDown = false;
    
    // ドラッグでないことを確認（5px以内の移動ならクリックとみなす）
    const dx = Math.abs(e.clientX - startX);
    const dy = Math.abs(e.clientY - startY);
    if (dx > 5 || dy > 5) return;
    
    // アクションを実行
    if (typeof action === 'function') {
      await action();
    }
    setTimeout(updateMediaPlayer, 300);
  });
  
  btn.addEventListener('pointercancel', () => {
    isPointerDown = false;
  });
}

if (mediaPrevBtn) {
  setupMediaButton(mediaPrevBtn, async () => {
    await mediaControl('previous');
  });
}

if (mediaPlayPauseBtn) {
  setupMediaButton(mediaPlayPauseBtn, async () => {
    if (currentMediaSource === 'browser') {
      await mediaControl('playPause');
    } else {
      await mediaControl('play-pause');
    }
  });
}

if (mediaNextBtn) {
  setupMediaButton(mediaNextBtn, async () => {
    await mediaControl('next');
  });
}

if (mediaShuffleBtn) {
  setupMediaButton(mediaShuffleBtn, async () => {
    const newValue = currentShuffle === 'On' ? 'Off' : 'On';
    await mediaControl('shuffle', newValue);
  });
}

if (mediaRepeatBtn) {
  setupMediaButton(mediaRepeatBtn, async () => {
    let newValue = 'None';
    if (currentLoop === 'None') newValue = 'Playlist';
    else if (currentLoop === 'Playlist') newValue = 'Track';
    else newValue = 'None';
    
    await mediaControl('loop', newValue);
  });
}

// シークバーのイベント
if (mediaSeekbar) {
  // ドラッグ中はUIの自動更新を止める
  mediaSeekbar.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); // ウィジェットのドラッグを防止
    isSeeking = true;
  });

  // スライド操作中もイベントの伝播を止める
  mediaSeekbar.addEventListener('pointermove', (e) => {
    e.stopPropagation();
  });

  // シーク中の値変更（リアルタイムプレビュー）
  mediaSeekbar.addEventListener('input', (e) => {
    e.stopPropagation();
    if (currentDuration > 0 && mediaTimeCurrent) {
      const position = (e.target.value / 100) * currentDuration;
      mediaTimeCurrent.textContent = formatTime(position);
    }
  });

  // シーク完了（実際にシーク）
  mediaSeekbar.addEventListener('change', async (e) => {
    e.stopPropagation();
    if (currentDuration > 0) {
      const seekPosition = (e.target.value / 100) * currentDuration;
      await mediaControl('seek', seekPosition);
    }
    isSeeking = false;
    setTimeout(updateMediaPlayer, 300);
  });
}

// ブラウザからのメディア更新を受信
if (window.electronAPI && window.electronAPI.onBrowserMediaUpdate) {
  window.electronAPI.onBrowserMediaUpdate((info) => {
    browserMediaInfo = info;
    updateMediaPlayer();
  });
}

// Linuxからのメディア更新を受信 (Push型)
if (window.electronAPI && window.electronAPI.onLinuxMediaUpdate) {
  window.electronAPI.onLinuxMediaUpdate(() => {
    updateMediaPlayer();
  });
}

// 操作性を考慮し、1秒ごとにUIを更新（シークバーの同期など）
setInterval(updateMediaPlayer, 1000);

// 初回更新
setTimeout(updateMediaPlayer, 500);
// ブラウザメディア情報をリクエスト
setTimeout(() => {
  if (window.electronAPI && window.electronAPI.requestBrowserMediaInfo) {
    window.electronAPI.requestBrowserMediaInfo();
  }
}, 1000);
