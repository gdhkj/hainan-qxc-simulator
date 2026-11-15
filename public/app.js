const API_BASE = '/api';

const state = {
  currentUser: null,
  selectedNumbers: [],
  issueList: [],
  currentIssue: null
};

const elements = {
  username: document.getElementById('username'),
  activeUser: document.getElementById('active-user'),
  pointsBalance: document.getElementById('pointsBalance'),
  roleLabel: document.getElementById('roleLabel'),
  ledgerList: document.getElementById('ledgerList'),
  currentIssue: document.getElementById('currentIssue'),
  issueStatus: document.getElementById('issueStatus'),
  numberGrid: document.getElementById('numberGrid'),
  playType: document.getElementById('playType'),
  stakeInput: document.getElementById('stakeInput'),
  betList: document.getElementById('betList'),
  issueNoInput: document.getElementById('issueNoInput'),
  startAtInput: document.getElementById('startAtInput'),
  endAtInput: document.getElementById('endAtInput'),
  issueSelect: document.getElementById('issueSelect'),
  drawCodeInput: document.getElementById('drawCodeInput'),
  grantAmountInput: document.getElementById('grantAmountInput'),
  reportBox: document.getElementById('reportBox')
};

function numberOptions() {
  return Array.from({ length: 10 }, (_, i) => String(i));
}

function renderNumberGrid() {
  elements.numberGrid.innerHTML = '';
  numberOptions().forEach((n) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'number-btn';
    btn.textContent = n;
    btn.addEventListener('click', () => {
      if (state.selectedNumbers.includes(n)) {
        state.selectedNumbers = state.selectedNumbers.filter((item) => item !== n);
      } else if (state.selectedNumbers.length < 7) {
        state.selectedNumbers.push(n);
      }
      renderNumberGrid();
    });

    if (state.selectedNumbers.includes(n)) {
      btn.classList.add('selected');
    }

    elements.numberGrid.appendChild(btn);
  });
}

async function fetchJson(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || '请求失败');
  }

  return data;
}

function setActiveUser(user) {
  state.currentUser = user;
  elements.activeUser.textContent = user ? '当前用户：' + user.username : '未登录';
  elements.pointsBalance.textContent = user ? user.pointsBalance : '0';
  elements.roleLabel.textContent = user ? user.role : '-';
}

function renderLedger(items) {
  if (!items || !items.length) {
    elements.ledgerList.innerHTML = '<li>暂无账变</li>';
    return;
  }

  elements.ledgerList.innerHTML = items.map((item) => `
    <li>
      <strong>${item.type}</strong>：${item.amount > 0 ? '+' : ''}${item.amount}<br>
      ${item.reason}<br>
      ${new Date(item.createdAt).toLocaleString()}
    </li>
  `).join('');
}

function renderBetList(items) {
  if (!items || !items.length) {
    elements.betList.innerHTML = '<li>暂无投注</li>';
    return;
  }

  elements.betList.innerHTML = items.map((bet) => `
    <li>
      ${bet.playType}：${bet.numbers.join(', ')}<br>
      金额：${bet.stake}，状态：${bet.status}<br>
      ${new Date(bet.createdAt).toLocaleString()}
    </li>
  `).join('');
}

async function loadAccount() {
  if (!state.currentUser) {
    setActiveUser(null);
    renderLedger([]);
    renderBetList([]);
    return;
  }

  const payload = await fetchJson(`/account/${state.currentUser.id}`);
  setActiveUser(payload.user);
  renderLedger(payload.ledger);
  renderBetList(payload.bets);
  elements.pointsBalance.textContent = payload.user.pointsBalance;
}

async function loadIssues() {
  const issues = await fetchJson('/issues');
  state.issueList = issues;

  const current = issues.find((item) => item.status === 'open') || issues[0] || null;
  state.currentIssue = current;

  elements.currentIssue.textContent = current ? current.issueNo : '-';
  elements.issueStatus.textContent = current ? current.status : '-';

  elements.issueSelect.innerHTML = issues.map((issue) => `
    <option value="${issue.id}">${issue.issueNo} (${issue.status})</option>
  `).join('');

  if (current) {
    elements.issueSelect.value = String(current.id);
  }
}

async function loadReports() {
  const report = await fetchJson('/admin/reports');
  const items = [
    ['用户数', report.totalUsers],
    ['期号数', report.totalIssues],
    ['投注笔数', report.totalBets],
    ['总投注额', report.totalStake],
    ['总派彩', report.totalPayout],
    ['开放期号', report.openIssues]
  ];

  elements.reportBox.innerHTML = items
    .map(([label, value]) => `<div class="stat"><small>${label}</small><strong>${value}</strong></div>`)
    .join('');
}

async function loginOrRegister(type) {
  const username = elements.username.value.trim();
  if (!username) {
    alert('请输入用户名');
    return;
  }

  const payload = await fetchJson(`/users/${type}`, {
    method: 'POST',
    body: JSON.stringify({ username })
  });

  setActiveUser(payload);
  await loadAccount();
  await loadReports();
}

document.getElementById('loginBtn').addEventListener('click', () => loginOrRegister('login'));
document.getElementById('registerBtn').addEventListener('click', () => loginOrRegister('register'));

async function createIssue() {
  const issueNo = elements.issueNoInput.value.trim();
  const startAt = elements.startAtInput.value;
  const endAt = elements.endAtInput.value;

  if (!issueNo || !startAt || !endAt) {
    alert('期号、开始时间和截止时间不能为空');
    return;
  }

  await fetchJson('/issues', {
    method: 'POST',
    body: JSON.stringify({ issueNo, startAt, endAt })
  });

  elements.issueNoInput.value = '';
  elements.startAtInput.value = '';
  elements.endAtInput.value = '';
  await loadIssues();
  await loadReports();
}

document.getElementById('createIssueBtn').addEventListener('click', createIssue);

async function setResult() {
  const issueId = elements.issueSelect.value;
  const raw = elements.drawCodeInput.value.trim();
  const numbers = raw.split(/\s+/).filter(Boolean);

  if (!issueId || numbers.length !== 7) {
    alert('请选择期号并输入 7 个开奖号码');
    return;
  }

  await fetchJson('/admin/result', {
    method: 'POST',
    body: JSON.stringify({ issueId, numbers })
  });

  elements.drawCodeInput.value = '';
  await loadIssues();
  await loadReports();
  alert('开奖结果已录入并结算完成');
}

document.getElementById('setResultBtn').addEventListener('click', setResult);

async function grantPoints() {
  if (!state.currentUser || state.currentUser.role !== 'admin') {
    alert('仅管理员能发放积分');
    return;
  }

  const amount = Number(elements.grantAmountInput.value || 0);
  if (!amount || amount <= 0) {
    alert('发放金额必须大于 0');
    return;
  }

  await fetchJson(`/users/${state.currentUser.id}/grant-points`, {
    method: 'POST',
    body: JSON.stringify({ amount, reason: '管理员模拟发放虚拟积分' })
  });

  await loadAccount();
  await loadReports();
  alert('发放成功');
}

document.getElementById('grantBtn').addEventListener('click', grantPoints);

async function submitBet() {
  if (!state.currentUser) {
    alert('请先登录');
    return;
  }

  const currentIssue = state.currentIssue;
  if (!currentIssue) {
    alert('当前没有开放期号');
    return;
  }

  if (state.selectedNumbers.length !== 7) {
    alert('请先选择 7 个数字');
    return;
  }

  const stake = Number(elements.stakeInput.value || 0);
  await fetchJson('/bets', {
    method: 'POST',
    body: JSON.stringify({
      userId: state.currentUser.id,
      issueId: currentIssue.id,
      playType: elements.playType.value,
      numbers: state.selectedNumbers,
      stake
    })
  });

  state.selectedNumbers = [];
  renderNumberGrid();
  await loadAccount();
  await loadReports();
  alert('模拟投注提交成功');
}

document.getElementById('betBtn').addEventListener('click', submitBet);

async function init() {
  renderNumberGrid();
  await loadIssues();
  await loadReports();

  const demoUser = { id: 1, username: 'demo', role: 'user', pointsBalance: 5000 };
  setActiveUser(demoUser);
  await loadAccount();
}

init();
