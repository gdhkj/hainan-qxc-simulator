const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const state = {
  users: [
    { id: 1, username: 'demo', role: 'user', pointsBalance: 5000, createdAt: new Date().toISOString() },
    { id: 2, username: 'admin', role: 'admin', pointsBalance: 100000, createdAt: new Date().toISOString() }
  ],
  issues: [
    {
      id: 1,
      issueNo: '20261115-001',
      status: 'closed',
      startAt: '2026-11-15T09:00:00.000Z',
      endAt: '2026-11-15T09:30:00.000Z',
      drawCode: ['1', '2', '3', '4', '5', '6', '7'],
      createdAt: '2026-11-15T08:50:00.000Z'
    },
    {
      id: 2,
      issueNo: '20261115-002',
      status: 'open',
      startAt: '2026-11-15T09:40:00.000Z',
      endAt: '2026-11-15T10:10:00.000Z',
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
      createdAt: '2026-11-15T09:00:10.000Z',
      settledAt: '2026-11-15T09:31:00.000Z'
    }
  ],
  ledger: [
    {
      id: 'ledger_1',
      userId: 1,
      type: 'grant',
      amount: 5000,
      beforeBalance: 0,
      afterBalance: 5000,
      reason: '初始化虚拟积分',
      referenceId: 'seed',
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

function findUser(userId) {
  return state.users.find((u) => u.id === Number(userId));
}

function adjustPoints(userId, delta, type, reason, referenceId) {
  const user = findUser(userId);
  if (!user) {
    throw new Error('用户不存在');
  }

  const beforeBalance = user.pointsBalance;
  const afterBalance = beforeBalance + delta;
  user.pointsBalance = afterBalance;

  state.ledger.push({
    id: `ledger_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    userId,
    type,
    amount: delta,
    beforeBalance,
    afterBalance,
    reason,
    referenceId,
    createdAt: new Date().toISOString()
  });

  return { user, beforeBalance, afterBalance };
}

function issueCurrentStatus(issue) {
  if (!issue) return 'unknown';
  return issue.status;
}

function settleIssue(issueId, drawCode) {
  const issue = state.issues.find((item) => item.id === Number(issueId));
  if (!issue) {
    throw new Error('期号不存在');
  }

  const pendingBets = state.bets.filter((bet) => bet.issueId === Number(issueId) && bet.status === 'pending');

  pendingBets.forEach((bet) => {
    const isExactMatch = JSON.stringify(bet.numbers) === JSON.stringify(drawCode);
    const payout = isExactMatch ? bet.stake * 10 : 0;
    const result = {
      id: `settlement_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      betId: bet.id,
      issueId: Number(issueId),
      userId: bet.userId,
      payout,
      matchType: isExactMatch ? '全中' : '未中',
      createdAt: new Date().toISOString()
    };

    state.settlements.push(result);
    bet.status = 'settled';
    bet.settledAt = result.createdAt;

    if (payout > 0) {
      adjustPoints(bet.userId, payout, 'win', '模拟中奖结算', bet.id);
    }
  });

  issue.status = 'closed';
  issue.drawCode = drawCode;
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, name: 'hainan-qxc-simulator' });
});

app.get('/api/users', (req, res) => {
  res.json(state.users.map((user) => ({
    id: user.id,
    username: user.username,
    role: user.role,
    pointsBalance: user.pointsBalance,
    createdAt: user.createdAt
  })));
});

app.post('/api/users/register', (req, res) => {
  const { username } = req.body || {};

  if (!username || !username.trim()) {
    return res.status(400).json({ message: '用户名不能为空' });
  }

  if (state.users.some((user) => user.username.toLowerCase() === username.trim().toLowerCase())) {
    return res.status(400).json({ message: '用户名已存在' });
  }

  const user = {
    id: Date.now(),
    username: username.trim(),
    role: 'user',
    pointsBalance: 5000,
    createdAt: new Date().toISOString()
  };

  state.users.push(user);
  adjustPoints(user.id, 5000, 'grant', '新用户初始化虚拟积分', 'register');

  res.status(201).json({
    id: user.id,
    username: user.username,
    role: user.role,
    pointsBalance: user.pointsBalance
  });
});

app.post('/api/users/login', (req, res) => {
  const { username } = req.body || {};
  const user = state.users.find((item) => item.username.toLowerCase() === String(username || '').trim().toLowerCase());

  if (!user) {
    return res.status(404).json({ message: '用户不存在' });
  }

  res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    pointsBalance: user.pointsBalance
  });
});

app.get('/api/account/:userId', (req, res) => {
  const user = findUser(req.params.userId);
  if (!user) {
    return res.status(404).json({ message: '用户不存在' });
  }

  const ledger = state.ledger.filter((item) => item.userId === Number(req.params.userId)).slice(-20).reverse();
  const bets = state.bets.filter((bet) => bet.userId === Number(req.params.userId)).slice(-20).reverse();

  res.json({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      pointsBalance: user.pointsBalance
    },
    ledger,
    bets
  });
});

app.post('/api/users/:userId/grant-points', (req, res) => {
  const userId = Number(req.params.userId);
  const { amount, reason } = req.body || {};
  const value = Number(amount || 0);

  if (!Number.isFinite(value) || value <= 0) {
    return res.status(400).json({ message: '金额必须为正数' });
  }

  const user = findUser(userId);
  if (!user) {
    return res.status(404).json({ message: '用户不存在' });
  }

  const result = adjustPoints(userId, value, 'grant', reason || '管理员发放虚拟积分', `grant_${Date.now()}`);
  res.json({
    message: '发放成功',
    user: {
      id: user.id,
      username: user.username,
      pointsBalance: result.user.pointsBalance
    },
    delta: value,
    afterBalance: result.afterBalance
  });
});

app.get('/api/issues', (req, res) => {
  res.json(state.issues.slice().sort((a, b) => Number(b.id) - Number(a.id)));
});

app.post('/api/issues', (req, res) => {
  const { issueNo, startAt, endAt } = req.body || {};
  if (!issueNo || !startAt || !endAt) {
    return res.status(400).json({ message: '期号、开始时间和结束时间不能为空' });
  }

  const issue = {
    id: Date.now(),
    issueNo: String(issueNo),
    status: 'open',
    startAt: new Date(startAt).toISOString(),
    endAt: new Date(endAt).toISOString(),
    drawCode: null,
    createdAt: new Date().toISOString()
  };

  state.issues.push(issue);
  res.status(201).json(issue);
});

app.get('/api/results/history', (req, res) => {
  const results = state.issues
    .filter((issue) => issue.drawCode)
    .map((issue) => ({
      issueId: issue.id,
      issueNo: issue.issueNo,
      drawCode: issue.drawCode,
      status: issue.status
    }));

  res.json(results.reverse());
});

app.post('/api/admin/result', (req, res) => {
  const { issueId, numbers } = req.body || {};
  const normalized = Array.isArray(numbers) ? numbers.map(String) : [];

  if (!issueId || normalized.length !== 7) {
    return res.status(400).json({ message: '开奖必须传入 7 个号码' });
  }

  const issue = state.issues.find((item) => item.id === Number(issueId));
  if (!issue) {
    return res.status(404).json({ message: '期号不存在' });
  }

  if (issue.status === 'closed' && issue.drawCode) {
    return res.status(400).json({ message: '该期已经开奖过，不能重复录入' });
  }

  settleIssue(Number(issueId), normalized);

  res.json({
    issueId: Number(issueId),
    issueNo: issue.issueNo,
    drawCode: normalized,
    status: 'closed'
  });
});

app.get('/api/bets', (req, res) => {
  const userId = req.query.userId ? Number(req.query.userId) : null;
  const bets = userId
    ? state.bets.filter((bet) => bet.userId === userId)
    : [...state.bets];

  res.json(bets.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

app.post('/api/bets', (req, res) => {
  const { userId, issueId, playType, numbers, stake } = req.body || {};
  const user = findUser(userId);
  const issue = state.issues.find((item) => item.id === Number(issueId));

  if (!user) {
    return res.status(404).json({ message: '用户不存在' });
  }

  if (!issue) {
    return res.status(404).json({ message: '期号不存在' });
  }

  if (issue.status !== 'open') {
    return res.status(400).json({ message: '当前期号不能投注' });
  }

  const normalizedNumbers = Array.isArray(numbers) ? numbers.map(String) : [];
  const amount = Number(stake || 0);

  if (normalizedNumbers.length !== 7) {
    return res.status(400).json({ message: '每注必须选择 7 个号码' });
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ message: '投注金额必须大于 0' });
  }

  if (user.pointsBalance < amount) {
    return res.status(400).json({ message: '虚拟积分不足' });
  }

  const bet = {
    id: `bet_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    userId: Number(userId),
    issueId: Number(issueId),
    playType: playType || '直选',
    numbers: normalizedNumbers,
    stake: amount,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  state.bets.push(bet);
  adjustPoints(user.id, -amount, 'bet', '模拟投注扣减虚拟积分', bet.id);

  res.status(201).json(bet);
});

app.get('/api/admin/reports', (req, res) => {
  const totalUsers = state.users.length;
  const totalIssues = state.issues.length;
  const totalBets = state.bets.length;
  const totalStake = state.bets.reduce((sum, bet) => sum + Number(bet.stake || 0), 0);
  const totalPayout = state.settlements.reduce((sum, item) => sum + Number(item.payout || 0), 0);
  const openIssues = state.issues.filter((issue) => issue.status === 'open').length;

  res.json({
    totalUsers,
    totalIssues,
    totalBets,
    totalStake,
    totalPayout,
    openIssues,
    users: state.users.map((u) => ({ id: u.id, username: u.username, pointsBalance: u.pointsBalance }))
  });
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`海南七星彩模拟盘已启动，端口：${PORT}`);
});
