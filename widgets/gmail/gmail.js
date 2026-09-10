/**
 * Soul Widgets Manager - Gmail Widget (OAuth2)
 */

'use strict';

const gmailWidget = document.getElementById('gmail_widget');
const gmailContent = document.getElementById('gmail_content');
const gmailRefreshBtn = document.getElementById('gmail_refresh_btn');
const gmailSettingsBtn = document.getElementById('gmail_settings_btn');
const gmailSettingsModal = document.getElementById('gmail_settings_modal_overlay');

const gmailClientIdInput = document.getElementById('gmail_client_id_input');
const gmailClientSecretInput = document.getElementById('gmail_client_secret_input');
const gmailLoginBtn = document.getElementById('gmail_login_btn');

/**
 * トークンの有効性を確認し、必要ならリフレッシュ
 */
async function ensureValidToken() {
  const refreshToken = localStorage.getItem(LS_KEYS.GMAIL_REFRESH_TOKEN);
  const clientId = localStorage.getItem(LS_KEYS.GMAIL_CLIENT_ID);
  const clientSecret = localStorage.getItem(LS_KEYS.GMAIL_CLIENT_SECRET);
  
  if (!refreshToken || !clientId || !clientSecret) return null;

  const expiresAt = parseInt(localStorage.getItem(LS_KEYS.GMAIL_TOKEN_EXPIRES_AT) || '0');
  const buffer = 5 * 60 * 1000; // 5分前に更新

  if (Date.now() + buffer < expiresAt) {
    return localStorage.getItem(LS_KEYS.GMAIL_TOKEN);
  }

  // トークンリフレッシュ
  console.log('[Gmail] Refreshing access token...');
  if (window.electronAPI && window.electronAPI.gmailRefreshToken) {
    const data = await window.electronAPI.gmailRefreshToken(clientId, clientSecret, refreshToken);
    if (data && data.access_token) {
      localStorage.setItem(LS_KEYS.GMAIL_TOKEN, data.access_token);
      localStorage.setItem(LS_KEYS.GMAIL_TOKEN_EXPIRES_AT, Date.now() + (data.expires_in * 1000));
      return data.access_token;
    }
  }
  return null;
}

/**
 * Gmail APIからメールを取得
 */
async function fetchGmailMessages() {
  const token = await ensureValidToken();
  if (!token) return { error: 'no_token' };

  try {
    const listUrl = 'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=8';
    const response = await fetch(listUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch message list');
    }

    const data = await response.json();
    if (!data.messages || data.messages.length === 0) {
      return { messages: [] };
    }

    const detailsPromises = data.messages.map(msg => 
      fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).then(res => res.json())
    );

    const messages = await Promise.all(detailsPromises);
    return { messages };
  } catch (error) {
    console.error('Gmail API error:', error);
    return { error: 'fetch_failed' };
  }
}

/**
 * メッセージをパース
 */
function parseGmailMessage(msg) {
  const headers = msg.payload.headers;
  const subject = headers.find(h => h.name === 'Subject')?.value || '(No Subject)';
  const fromRaw = headers.find(h => h.name === 'From')?.value || 'Unknown';
  const dateRaw = headers.find(h => h.name === 'Date')?.value;
  
  let from = fromRaw;
  const fromMatch = fromRaw.match(/^(.*?)\s*<.*>$/);
  if (fromMatch) from = fromMatch[1].replace(/"/g, '');

  let dateStr = '';
  if (dateRaw) {
    const date = new Date(dateRaw);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      dateStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }

  return {
    id: msg.id,
    subject,
    from,
    date: dateStr
  };
}

/**
 * Gmailウィジェットを更新
 */
async function updateGmailWidget() {
  if (!gmailContent) return;

  const refreshToken = localStorage.getItem(LS_KEYS.GMAIL_REFRESH_TOKEN);
  if (!refreshToken) {
    gmailContent.innerHTML = `
      <div class="gmail-empty">
        <m3e-icon name="login"></m3e-icon>
        <span data-i18n="gmail_oauth_desc">${i18n.t('gmail_oauth_desc')}</span>
      </div>
    `;
    return;
  }

  gmailContent.innerHTML = `
    <div class="gmail-loading">
      <m3e-loading-indicator></m3e-loading-indicator>
      <span data-i18n="loading">${i18n.t('loading')}</span>
    </div>
  `;

  const result = await fetchGmailMessages();

  if (result.error) {
    let msg = i18n.t('fetch_error');
    let icon = 'error';
    if (result.error === 'no_token') {
      msg = i18n.t('gmail_oauth_desc');
      icon = 'login';
    }
    gmailContent.innerHTML = `
      <div class="gmail-error">
        <m3e-icon name="${icon}"></m3e-icon>
        <span>${msg}</span>
      </div>
    `;
    return;
  }

  if (result.messages.length === 0) {
    gmailContent.innerHTML = `
      <div class="gmail-empty">
        <m3e-icon name="mail_outline"></m3e-icon>
        <span data-i18n="no_emails">${i18n.t('no_emails')}</span>
      </div>
    `;
    return;
  }

  gmailContent.innerHTML = '';
  const fragment = document.createDocumentFragment();

  result.messages.forEach(msgData => {
    const msg = parseGmailMessage(msgData);
    const item = document.createElement('div');
    item.className = 'gmail-item';
    item.innerHTML = `
      <div class="gmail-item-top">
        <span class="gmail-item-from">${msg.from}</span>
        <span class="gmail-item-date">${msg.date}</span>
      </div>
      <div class="gmail-item-subject">${msg.subject}</div>
    `;
    
    item.onclick = (e) => {
      e.stopPropagation();
      const url = `https://mail.google.com/mail/u/0/#inbox/${msg.id}`;
      window.open(url, '_blank');
    };
    
    item.onpointerdown = (e) => e.stopPropagation();
    fragment.appendChild(item);
  });

  gmailContent.appendChild(fragment);
}

// ログインボタン
if (gmailLoginBtn) {
  gmailLoginBtn.onclick = async () => {
    const clientId = gmailClientIdInput?.value?.trim();
    const clientSecret = gmailClientSecretInput?.value?.trim();

    if (!clientId || !clientSecret) {
      if (window.UIUtils) window.UIUtils.showAlertDialog(i18n.t('credentials_required'));
      return;
    }

    if (!window.electronAPI || !window.electronAPI.gmailStartAuth) return;

    // 設定を保存
    localStorage.setItem(LS_KEYS.GMAIL_CLIENT_ID, clientId);
    localStorage.setItem(LS_KEYS.GMAIL_CLIENT_SECRET, clientSecret);

    const result = await window.electronAPI.gmailStartAuth(clientId);
    if (result && result.code) {
      const tokens = await window.electronAPI.gmailExchangeCode(clientId, clientSecret, result.code);
      if (tokens && tokens.access_token) {
        localStorage.setItem(LS_KEYS.GMAIL_TOKEN, tokens.access_token);
        localStorage.setItem(LS_KEYS.GMAIL_REFRESH_TOKEN, tokens.refresh_token);
        localStorage.setItem(LS_KEYS.GMAIL_TOKEN_EXPIRES_AT, Date.now() + (tokens.expires_in * 1000));
        
        if (window.UIUtils) window.UIUtils.showAlertDialog(i18n.t('login_success'));
        updateGmailWidget();
      } else {
        const errorMsg = tokens?.error || i18n.t('fetch_error');
        if (window.UIUtils) window.UIUtils.showAlertDialog(`${i18n.t('login_failed')}: ${errorMsg}`);
      }
    } else if (result && result.error && result.error !== 'closed') {
      if (window.UIUtils) window.UIUtils.showAlertDialog(`${i18n.t('login_failed')}: ${result.error}`);
    }
  };
}

// 更新ボタン
if (gmailRefreshBtn) {
  gmailRefreshBtn.onpointerdown = (e) => e.stopPropagation();
  gmailRefreshBtn.onclick = (e) => {
    e.stopPropagation();
    updateGmailWidget();
  };
}

// 設定ボタン
if (gmailSettingsBtn) {
  gmailSettingsBtn.onpointerdown = (e) => e.stopPropagation();
  gmailSettingsBtn.onclick = (e) => {
    e.stopPropagation();
    if (typeof closeAllModals === 'function') closeAllModals();
    
    if (gmailClientIdInput) gmailClientIdInput.value = localStorage.getItem(LS_KEYS.GMAIL_CLIENT_ID) || '';
    if (gmailClientSecretInput) gmailClientSecretInput.value = localStorage.getItem(LS_KEYS.GMAIL_CLIENT_SECRET) || '';
    
    if (gmailSettingsModal) gmailSettingsModal.style.display = 'flex';
  };
}

// 保存ボタン
document.getElementById('save_gmail_settings')?.addEventListener('click', () => {
  localStorage.setItem(LS_KEYS.GMAIL_CLIENT_ID, gmailClientIdInput?.value?.trim() || '');
  localStorage.setItem(LS_KEYS.GMAIL_CLIENT_SECRET, gmailClientSecretInput?.value?.trim() || '');
  if (gmailSettingsModal) gmailSettingsModal.style.display = 'none';
});

document.getElementById('close_gmail_settings_modal')?.addEventListener('click', () => {
  if (gmailSettingsModal) gmailSettingsModal.style.display = 'none';
});

// 初期化
setTimeout(updateGmailWidget, 1500);
setInterval(updateGmailWidget, 5 * 60 * 1000);
