/**
 * Soul Widgets Manager - GitHub Widget
 */

'use strict';

const githubContributionWidget = document.getElementById('github_contribution_widget');
const githubGraph = document.getElementById('github_contribution_graph');
const githubTotalContributions = document.getElementById('github_total_contributions');
const githubCurrentStreak = document.getElementById('github_current_streak');
const githubLongestStreak = document.getElementById('github_longest_streak');
const githubUsernameDisplay = document.getElementById('github_username_display');
const githubSettingsBtn = document.getElementById('github_settings_btn');
const githubRefreshBtn = document.getElementById('github_refresh_btn');
const githubSettingsModal = document.getElementById('github_settings_modal_overlay');
const githubUsernameInput = document.getElementById('github_username_input');
const githubYearSelect = document.getElementById('github_year_select');
const githubDetailsModal = document.getElementById('github_details_modal_overlay');
const githubDetailsDate = document.getElementById('github_details_date');
const githubDetailsCount = document.getElementById('github_details_count');
const githubDetailsLevelText = document.getElementById('github_details_level_text');
const githubDetailsLevelIcon = document.getElementById('github_details_level_icon');
const openGitHubActivityBtn = document.getElementById('open_github_activity');
let currentDetailDate = null;

let githubData = null;
let currentGitHubYear = 'last';

/**
 * GitHub コントリビューションデータを取得
 * @param {string} username - GitHubユーザー名
 * @returns {Promise<Object>}
 */
async function fetchGitHubContributions(username) {
  if (!username) return null;
  
  try {
    // GitHub GraphQL API または スクレイピング用のプロキシサービスを使用
    // ここでは github-contributions-api を使用
    const url = `https://github-contributions-api.jogruber.de/v4/${username}`;
    if (window.SecurityManager && !window.SecurityManager.isUrlAllowed(url)) {
      if (window.UIUtils) {
        window.UIUtils.showAlertDialog(i18n.t('blocked_url'));
      }
      return null;
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch GitHub data');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('GitHub API error:', error);
    return null;
  }
}

/**
 * コントリビューションレベルを計算（0-4）
 * @param {number} count - コントリビューション数
 * @returns {number}
 */
function getContributionLevel(count) {
  if (count === 0) return 0;
  if (count <= 3) return 1;
  if (count <= 6) return 2;
  if (count <= 9) return 3;
  return 4;
}

/**
 * ストリーク（連続日数）を計算
 * @param {Array} contributions - コントリビューションデータの配列
 * @returns {{current: number, longest: number}}
 */
function calculateStreaks(contributions) {
  if (!contributions || contributions.length === 0) {
    return { current: 0, longest: 0 };
  }
  
  // 日付順にソート（新しい順）
  const sorted = [...contributions].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 現在のストリークを計算
  for (let i = 0; i < sorted.length; i++) {
    const date = new Date(sorted[i].date);
    date.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today - date) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === i || (daysDiff === i + 1 && i === 0)) {
      if (sorted[i].count > 0) {
        currentStreak++;
      } else if (daysDiff > 0) {
        break;
      }
    } else {
      break;
    }
  }
  
  // 最長ストリークを計算
  const chronological = [...contributions].sort((a, b) => new Date(a.date) - new Date(b.date));
  for (const day of chronological) {
    if (day.count > 0) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }
  
  return { current: currentStreak, longest: longestStreak };
}

/**
 * GitHubツールチップを表示
 */
function showGitHubTooltip(targetEl, dateStr, count) {
  const tooltip = document.getElementById('github_tooltip');
  if (!tooltip) return;
  
  const date = new Date(dateStr);
  // ユーザーのロケールに合わせて日付をフォーマット
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  const formattedDate = date.toLocaleDateString(undefined, options);
  
  const countText = count === 0 ? i18n.t('no_contributions') : `${count} ${i18n.t(count !== 1 ? 'contributions' : 'contribution')}`;
  
  tooltip.innerHTML = '';
  const countEl = document.createElement('div');
  countEl.style.fontWeight = '600';
  countEl.style.marginBottom = '2px';
  countEl.textContent = countText;
  const dateEl = document.createElement('div');
  dateEl.style.color = '#ccc';
  dateEl.textContent = formattedDate;
  tooltip.appendChild(countEl);
  tooltip.appendChild(dateEl);
  tooltip.style.display = 'block';
  
  const rect = targetEl.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  
  // 中央揃え
  let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
  let top = rect.top - tooltipRect.height - 8;
  
  // 画面端の調整
  if (left < 10) left = 10;
  if (left + tooltipRect.width > window.innerWidth - 10) {
    left = window.innerWidth - tooltipRect.width - 10;
  }
  
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

/**
 * GitHubツールチップを非表示
 */
function hideGitHubTooltip() {
  const tooltip = document.getElementById('github_tooltip');
  if (tooltip) {
    tooltip.style.display = 'none';
  }
}

/**
 * GitHub詳細モーダルを表示
 */
function showGitHubDetailsModal(dateStr, count, level) {
  closeAllModals();
  if (!githubDetailsModal) return;
  const lang = getCurrentLanguage();
  
  currentDetailDate = dateStr;
  
  const date = new Date(dateStr);
  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
  if (githubDetailsDate) {
    githubDetailsDate.textContent = date.toLocaleDateString(undefined, options);
  }
  
  if (githubDetailsCount) {
    githubDetailsCount.textContent = count === 0 
      ? i18n.t('no_contributions')
      : `${count} ${i18n.t(count !== 1 ? 'contributions' : 'contribution')}`;
  }
  
  let levelText = i18n.t('no_activity');
  let iconName = 'sentiment_neutral';
  let iconColor = 'var(--on-surface-variant)';
  
  if (count > 0) {
    levelText = i18n.t('good_job');
    iconName = 'check_circle';
    iconColor = 'var(--primary-color)';
  }
  if (level >= 3) {
    levelText = i18n.t('excellent');
    iconName = 'local_fire_department';
    iconColor = '#ff6d00'; // Orange
  }
  
  if (githubDetailsLevelText) githubDetailsLevelText.textContent = levelText;
  if (githubDetailsLevelIcon) {
    githubDetailsLevelIcon.setAttribute('name', iconName);
    githubDetailsLevelIcon.style.color = iconColor;
  }
  
  githubDetailsModal.style.display = 'flex';
}

/**
 * GitHubコントリビューショングラフを描画
 * @param {Object} data - GitHubのコントリビューションデータ
 * @param {string|number} year - 表示する年 ('last' または西暦)
 */
function renderGitHubGraph(data, year = 'last') {
  if (!githubGraph) return;
  const lang = getCurrentLanguage();
  
  githubGraph.innerHTML = '';

  // グラフエリアでのポインターイベントがウィジェットのドラッグを開始させないようにする
  githubGraph.onpointerdown = (e) => {
    e.stopPropagation();
  };
  
  if (!data || !data.contributions) {
    githubGraph.innerHTML = `
      <div class="github-error">
        <m3e-icon name="error"></m3e-icon>
        <span>${i18n.t('fetch_failed')}</span>
      </div>
    `;
    return;
  }
  
  const contributions = data.contributions;
  let total = 0;
  let startDate, endDate;
  
  if (year === 'last') {
    // 過去1年分
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    endDate = todayUTC;
    startDate = new Date(todayUTC);
    startDate.setUTCDate(startDate.getUTCDate() - 365);

    // totalを計算
    if (data.total && typeof data.total.lastYear === 'number') {
      total = data.total.lastYear;
    } else {
      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];
      total = contributions.reduce((sum, day) => {
        if (day.date >= startStr && day.date <= endStr) {
          return sum + day.count;
        }
        return sum;
      }, 0);
    }
  } else {
    // 特定の年
    const yearNum = parseInt(year);
    if (data.total && data.total[year]) {
      total = data.total[year];
    } else if (data.years) {
      const yData = data.years.find(y => y.year === year.toString());
      if (yData) total = yData.total;
    }
    
    startDate = new Date(Date.UTC(yearNum, 0, 1));
    endDate = new Date(Date.UTC(yearNum, 11, 31));
  }
  
  // 表示開始日を週の始め（日曜日）に調整
  const dayOfWeek = startDate.getUTCDay();
  const displayStartDate = new Date(startDate);
  displayStartDate.setUTCDate(displayStartDate.getUTCDate() - dayOfWeek);

  // 日付でインデックスを作成
  const contributionMap = {};
  contributions.forEach(day => {
    contributionMap[day.date] = day.count;
  });
  
  // グラフを描画（週ごと列、日ごと行）
  const fragment = document.createDocumentFragment();
  let currentDate = new Date(displayStartDate);
  
  for (let week = 0; week < 53; week++) {
    for (let day = 0; day < 7; day++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const count = contributionMap[dateStr] || 0;
      const level = getContributionLevel(count);
      
      const dayEl = document.createElement('div');
      dayEl.className = 'github-day';
      dayEl.dataset.level = level;
      dayEl.dataset.date = dateStr;
      dayEl.dataset.count = count;
      
      dayEl.onmouseenter = () => showGitHubTooltip(dayEl, dateStr, count);
      dayEl.onmouseleave = hideGitHubTooltip;
      dayEl.onclick = (e) => {
        e.stopPropagation();
        showGitHubDetailsModal(dateStr, count, level);
      };
      
      // 特定の年の場合、その年以外の日は非表示にする
      if (year !== 'last') {
        const d = new Date(dateStr);
        if (d.getUTCFullYear() !== parseInt(year)) {
          dayEl.style.visibility = 'hidden';
        }
      }

      fragment.appendChild(dayEl);
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
  }
  
  githubGraph.appendChild(fragment);
  
  // 統計を更新
  let statsContributions = contributions;
  if (year !== 'last') {
    statsContributions = contributions.filter(c => c.date.startsWith(year));
  }
  
  const streaks = calculateStreaks(statsContributions);
  
  if (githubTotalContributions) {
    githubTotalContributions.textContent = total.toLocaleString();
  }
  if (githubCurrentStreak) {
    githubCurrentStreak.textContent = streaks.current;
  }
  if (githubLongestStreak) {
    githubLongestStreak.textContent = streaks.longest;
  }
}

/**
 * 年選択肢を生成
 */
function populateGitHubYearSelect(data) {
  if (!githubYearSelect) return;
  
  githubYearSelect.innerHTML = '';
  
  // Last Year
  const lastOption = document.createElement('m3e-option');
  lastOption.value = 'last';
  lastOption.textContent = i18n.t('last_year');
  githubYearSelect.appendChild(lastOption);
  
  // Years
  let years = [];
  if (data.years) {
    years = data.years.map(y => y.year);
  } else if (data.total) {
    years = Object.keys(data.total).filter(k => k !== 'lastYear');
  }
  
  // 降順ソート
  years.sort((a, b) => b - a);
  
  years.forEach(year => {
    const option = document.createElement('m3e-option');
    option.value = year.toString();
    option.textContent = year.toString();
    githubYearSelect.appendChild(option);
  });
  
  if (window.setSelectValue) {
    window.setSelectValue(githubYearSelect, currentGitHubYear.toString());
  } else {
    githubYearSelect.value = currentGitHubYear;
  }
  githubYearSelect.style.display = 'block';
  
  githubYearSelect.addEventListener('change', (e) => {
    currentGitHubYear = e.target.value;
    renderGitHubGraph(githubData, currentGitHubYear);
  });

  // セレクトボックスでのポインターイベントがウィジェットのドラッグを開始させないようにする
  githubYearSelect.onpointerdown = (e) => {
    e.stopPropagation();
  };
}

/**
 * GitHubウィジェットを更新
 */
async function updateGitHubWidget() {
  const username = localStorage.getItem(LS_KEYS.GITHUB_USERNAME);
  const lang = getCurrentLanguage();
  
  if (!username) {
    if (githubGraph) {
      githubGraph.innerHTML = `
        <div class="github-no-user">
          <m3e-icon name="person_add"></m3e-icon>
          <span>${i18n.t('set_username')}</span>
        </div>
      `;
    }
    if (githubUsernameDisplay) {
      githubUsernameDisplay.textContent = i18n.t('set_username');
    }
    return;
  }
  
  if (githubUsernameDisplay) {
    githubUsernameDisplay.textContent = `@${username}`;
  }
  
  // ローディング表示
  if (githubGraph) {
    githubGraph.innerHTML = `
      <div class="github-loading">
        <m3e-loading-indicator></m3e-loading-indicator>
        <span>${i18n.t('loading')}</span>
      </div>
    `;
  }
  
  const data = await fetchGitHubContributions(username);
  githubData = data;
  populateGitHubYearSelect(data);
  renderGitHubGraph(data, currentGitHubYear);
}

// GitHub更新ボタン
if (githubRefreshBtn) {
  githubRefreshBtn.onpointerdown = (e) => e.stopPropagation();
  githubRefreshBtn.onclick = (e) => {
    e.stopPropagation();
    updateGitHubWidget();
  };
}

// GitHub設定モーダル
if (githubSettingsBtn) {
  // ドラッグイベントとの競合を防ぐ
  githubSettingsBtn.onpointerdown = (e) => {
    e.stopPropagation();
  };
  
  githubSettingsBtn.onclick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    closeAllModals();
    const savedUsername = localStorage.getItem(LS_KEYS.GITHUB_USERNAME) || '';
    if (githubUsernameInput) {
      githubUsernameInput.value = savedUsername;
    }
    if (githubSettingsModal) {
      githubSettingsModal.style.display = 'flex';
    }
  };
}

document.getElementById('close_github_settings_modal')?.addEventListener('click', () => {
  if (githubSettingsModal) {
    githubSettingsModal.style.display = 'none';
  }
});

document.getElementById('save_github_settings')?.addEventListener('click', async () => {
  let username = githubUsernameInput?.value?.trim();
  if (window.SecurityManager) {
    username = await window.SecurityManager.sanitizeInput(username);
  }
  if (username) {
    localStorage.setItem(LS_KEYS.GITHUB_USERNAME, username);
  } else {
    localStorage.removeItem(LS_KEYS.GITHUB_USERNAME);
  }
  
  if (githubSettingsModal) {
    githubSettingsModal.style.display = 'none';
  }
  
  await updateGitHubWidget();
});

// GitHub詳細モーダルのイベント
document.getElementById('close_github_details_modal')?.addEventListener('click', () => {
  if (githubDetailsModal) githubDetailsModal.style.display = 'none';
});

openGitHubActivityBtn?.addEventListener('click', () => {
  if (currentDetailDate) {
    const username = localStorage.getItem(LS_KEYS.GITHUB_USERNAME);
    if (username) {
      const url = `https://github.com/${username}?tab=overview&from=${currentDetailDate}&to=${currentDetailDate}`;
      if (window.SecurityManager && !window.SecurityManager.isUrlAllowed(url)) {
        if (window.UIUtils) {
          window.UIUtils.showAlertDialog(i18n.t('blocked_url'));
        }
      } else {
        window.open(url, '_blank');
      }
    }
  }
  if (githubDetailsModal) githubDetailsModal.style.display = 'none';
});

// 初期化時にGitHubウィジェットを更新
setTimeout(updateGitHubWidget, 1000);

// 1時間ごとにGitHubウィジェットを更新
setInterval(updateGitHubWidget, 60 * 60 * 1000);
