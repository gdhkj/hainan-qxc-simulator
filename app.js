const STORAGE_KEY = 'hainan-qxc-static-demo-v1';

const defaultData = {
  users: [
    { id: 1, username: 'demo', role: 'user', pointsBalance: 5000 },
    { id: 2, username: 'admin', role: 'admin', pointsBalance: 100000 }
  ],
  currentUserId: 1,
  issues: [
    {
      id: 1,
      issueNo: '20261115-001',
      status: 'closed',
      drawCode: ['1', '2', '3', '4', '5', '6', '7'],
      createdAt: '2026-11-15T08:50:00.000Z'
    },
    {
      id: 2,
      issueNo: '20261115-002',
      status: 'open',
      drawCode: null,
      createdAt: '2026-11-15T09:30:00.000Z'
    }
  ],
  bets: [
    {
      id: 'bet_1',
      userId: 1,
      issueId: 1,
      playType: '直选',
      numbers: ['1', '2', '3', '4', '5', '6', '7'],
      stake: 100,
      status: 'settled',
      createdAt: '2026-11-15T09:00:10.000Z'
    }
  ],
  ledger: [
    {
      id: 'ledger_1',
      userId: 1,
      type: 'grant',
      amount: 5000,
      reason: '初始化虚拟积分',
      createdAt: '2026-11-15T08:00:00.000Z'
    }
  ],
  settlements: [
    {
      id: 'settlement_1',
      betId: 'bet_1',
      issueId: 1,
      userId: 1,
      payout: 1000,
      matchType: '全中',
      createdAt: '2026-11-15T09:31:00.000Z'
    }
  ]
};

const state = loadState();
const selectedNumbers = [];

const els = {
  activeUser: document.getElementById('activeUser'),
  usernameInput: document.getElementById('usernameInput'),
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

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.warn('localStorage data invalid, fallback to default');
    }
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
  return JSON.parse(JSON.stringify(defaultData));
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getCurrentUser() {
  return state.users.find((u) => u.id === state.currentUserId) || null;
}

function renderNumberGrid() {
  els.numberGrid.innerHTML = '';
  for (let i = 0; i <= 9; i += 1) {
    const n = String(i);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = n;
    btn.className = 'number-btn' + (selectedNumbers.includes(n) ? ' selected' : '');
    btn.addEventListener('click', () => {
      if (selectedNumbers.includes(n)) {
        const idx = selectedNumbers.indexOf(n);
        selectedNumbers.splice(idx, 1);
      } else if (selectedNumbers.length < 7) {
        selectedNumbers.push(n);
      }
      renderNumberGrid();
    });
    els.numberGrid.appendChild(btn);
  }
}

function renderUser() {
  const user = getCurrentUser();
  if (!user) {
    els.activeUser.textContent = '未登录';
    els.pointsBalance.textContent = '0';
    els.roleLabel.textContent = '-';
    return;
  }

  els.activeUser.textContent = `当前用户：${user.username}`;
  els.pointsBalance.textContent = String(user.pointsBalance);
  els.roleLabel.textContent = user.role;
}

function renderLedger() {
  const user = getCurrentUser();
  if (!user) {
    els.ledgerList.innerHTML = '<li>暂无账变</li>';
    return;
  }

  const list = state.ledger.filter((item) => item.userId === user.id).slice(-10).reverse();
  if (!list.length) {
    els.ledgerList.innerHTML = '<li>暂无账变</li>';
    return;
  }

  els.ledgerList.innerHTML = list.map((item) => `
    <li>
      <strong>${item.type}</strong>：${item.amount > 0 ? '+' : ''}${item.amount}<br>
      ${item.reason}<br>
      ${new Date(item.createdAt).toLocaleString()}
    </li>
  `).join('');
}

function renderBets() {
  const user = getCurrentUser();
  if (!user) {
    els.betList.innerHTML = '<li>暂无投注</li>';
    return;
  }

  const list = state.bets.filter((bet) => bet.userId === user.id).slice(-10).reverse();
  if (!list.length) {
    els.betList.innerHTML = '<li>暂无投注</li>';
    return;
  }

  els.betList.innerHTML = list.map((bet) => `
    <li>
      ${bet.playType}：${bet.numbers.join(', ')}<br>
      金额：${bet.stake}，状态：${bet.status}<br>
      ${new Date(bet.createdAt).toLocaleString()}
    </li>
  `).join('');
}

function renderIssues() {
  const options = state.issues
    .slice()
    .sort((a, b) => Number(b.id) - Number(a.id))
    .map((issue) => `<option value="${issue.id}">${issue.issueNo} (${issue.status})</option>`)
    .join('');

  els.issueSelect.innerHTML = options;
  const openIssue = state.issues.find((issue) => issue.status === 'open') || state.issues[0];
  if (openIssue) {
    els.currentIssue.textContent = openIssue.issueNo;
    els.issueStatus.textContent = openIssue.status;
    els.issueSelect.value = String(openIssue.id);
  } else {
    els.currentIssue.textContent = '-';
    els.issueStatus.textContent = '-';
  }
}

function renderReport() {
  const totalUsers = state.users.length;
  const totalIssues = state.issues.length;
  const totalBets = state.bets.length;
  const totalStake = state.bets.reduce((sum, bet) => sum + Number(bet.stake || 0), 0);
  const totalPayout = state.settlements.reduce((sum, item) => sum + Number(item.payout || 0), 0);
  const openIssues = state.issues.filter((item) => item.status === 'open').length;

  const rows = [
    ['用户数', totalUsers],
    ['期号数', totalIssues],
    ['投注笔数', totalBets],
    ['总投注额', totalStake],
    ['总派彩', totalPayout],
    ['开放期号', openIssues]
  ];

  els.reportBox.innerHTML = rows
    .map(([label, value]) => `<div class="stat"><small>${label}</small><strong>${value}</strong></div>`)
    .join('');
}

function grantPoints(userId, amount, reason) {
  const user = state.users.find((item) => item.id === userId);
  if (!user) return;
  const before = user.pointsBalance;
  user.pointsBalance = before + amount;
  state.ledger.push({
    id: `ledger_${Date.now()}`,
    userId,
    type: amount > 0 ? 'grant' : 'deduct',
    amount,
    reason,
    createdAt: new Date().toISOString()
  });
  saveState();
}

function settleIssue(issueId, drawCode) {
  const issue = state.issues.find((item) => Number(item.id) === Number(issueId));
  if (!issue) return;

  const bets = state.bets.filter((bet) => Number(bet.issueId) === Number(issueId) && bet.status === 'pending');
  bets.forEach((bet) => {
    const match = JSON.stringify(bet.numbers) === JSON.stringify(drawCode);
    const payout = match ? bet.stake * 10 : 0;

    bet.status = 'settled';
    state.settlements.push({
      id: `settlement_${Date.now()}`,
      betId: bet.id,
      issueId,
      userId: bet.userId,
      payout,
      matchType: match ? '全中' : '未中',
      createdAt: new Date().toISOString()
    });

    if (payout > 0) {
      grantPoints(bet.userId, payout, '模拟中奖结算');
    }
  });

  issue.status = 'closed';
  issue.drawCode = drawCode;
  saveState();
}

function refreshAll() {
  renderUser();
  renderLedger();
  renderBets();
  renderIssues();
  renderReport();
  renderNumberGrid();
}

function loginUser() {
  const username = els.usernameInput.value.trim();
  if (!username) {
    alert('请输入用户名');
    return;
  }

  const user = state.users.find((item) => item.username.toLowerCase() === username.toLowerCase());
  if (!user) {
    alert('用户不存在，请先注册');
    return;
  }

  state.currentUserId = user.id;
  saveState();
  refreshAll();
}

function registerUser() {
  const username = els.usernameInput.value.trim();
  if (!username) {
    alert('请输入用户名');
    return;
  }

  if (state.users.some((item) => item.username.toLowerCase() === username.toLowerCase())) {
    alert('用户名已存在');
    return;
  }

  const user = {
    id: Date.now(),
    username,
    role: 'user',
    pointsBalance: 5000
  };

  state.users.push(user);
  state.currentUserId = user.id;
  state.ledger.push({
    id: `ledger_${Date.now()}`,
    userId: user.id,
    type: 'grant',
    amount: 5000,
    reason: '新用户初始化虚拟积分',
    createdAt: new Date().toISOString()
  });
  saveState();
  refreshAll();
}

function createIssue() {
  const issueNo = els.issueNoInput.value.trim();
  const startAt = els.startAtInput.value;
  const endAt = els.endAtInput.value;

  if (!issueNo || !startAt || !endAt) {
    alert('期号、开始时间和截止时间不能为空');
    return;
  }

  const issue = {
    id: Date.now(),
    issueNo,
    status: 'open',
    drawCode: null,
    createdAt: new Date().toISOString()
  };

  state.issues.push(issue);
  saveState();
  refreshAll();
}

function setResult() {
  const issueId = Number(els.issueSelect.value);
  const raw = els.drawCodeInput.value.trim();
  const numbers = raw.split(/\s+/).filter(Boolean).map(String);

  if (!issueId || numbers.length !== 7) {
    alert('请选择期号并输入 7 个开奖号码');
    return;
  }

  settleIssue(issueId, numbers);
  els.drawCodeInput.value = '';
  refreshAll();
  alert('开奖记录已录入并模拟结算');
}

function grantAmount() {
  const user = getCurrentUser();
  if (!user || user.role !== 'admin') {
    alert('只有管理员才能发放虚拟积分');
    return;
  }

  const amount = Number(els.grantAmountInput.value || 0);
  if (!amount || amount <= 0) {
    alert('发放金额必须大于 0');
    return;
  }

  grantPoints(user.id, amount, '管理员手动发放虚拟积分');
  refreshAll();
  alert('发放成功');
}

function submitBet() {
  const user = getCurrentUser();
  if (!user) {
    alert('请先登录');
    return;
  }

  const issue = state.issues.find((item) => item.status === 'open') || state.issues[0];
  if (!issue) {
    alert('当前没有可投注期号');
    return;
  }

  if (selectedNumbers.length !== 7) {
    alert('请先从 0-9 中选 7 个号码');
    return;
  }

  const stake = Number(els.stakeInput.value || 0);
  if (!stake || stake <= 0) {
    alert('投注金额必须大于 0');
    return;
  }

  if (user.pointsBalance < stake) {
    alert('虚拟积分不足');
    return;
  }

  user.pointsBalance -= stake;
  const bet = {
    id: `bet_${Date.now()}`,
    userId: user.id,
    issueId: issue.id,
    playType: els.playType.value,
    numbers: [...selectedNumbers],
    stake,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  state.bets.push(bet);
  state.ledger.push({
    id: `ledger_${Date.now()}`,
    userId: user.id,
    type: 'bet',
    amount: -stake,
    reason: '模拟投注扣减虚拟积分',
    createdAt: new Date().toISOString()
  });

  selectedNumbers.length = 0;
  saveState();
  refreshAll();
  alert('模拟投注成功');
}

document.getElementById('loginBtn').addEventListener('click', loginUser);
document.getElementById('registerBtn').addEventListener('click', registerUser);
document.getElementById('createIssueBtn').addEventListener('click', createIssue);
document.getElementById('setResultBtn').addEventListener('click', setResult);
document.getElementById('grantBtn').addEventListener('click', grantAmount);
document.getElementById('betBtn').addEventListener('click', submitBet);

const demoUser = getCurrentUser();
if (demoUser) {
  els.usernameInput.value = demoUser.username;
}

refreshAll();
renderNumberGrid();
