# 海南七星彩模拟盘

这是一个纯模拟版的彩票演示项目，目标是展示用户在线提交模拟投注、管理员维护虚拟积分、录入开奖结果和查看报表的流程。

特点：
- 不涉及真实资金
- 不涉及充值、提现、支付或兑换
- 仅使用虚拟积分
- 仅用于演示和学习

## 功能概览

- 用户注册 / 登录
- 查看当前期号和历史开奖
- 提交模拟投注单
- 管理员发放虚拟积分
- 管理员维护期号
- 管理员录入开奖结果并进行模拟结算
- 查看账户、账变记录和后台报表

## 技术栈

- Node.js
- Express
- Vanilla JavaScript + HTML + CSS

## 运行方式

1. 安装依赖

```bash
npm install
```

2. 启动服务

```bash
npm start
```

3. 打开浏览器访问

```bash
http://localhost:3000
```

## API 示例

- `GET /api/health`
- `GET /api/issues`
- `POST /api/issues`
- `POST /api/bets`
- `GET /api/bets`
- `POST /api/admin/result`
- `GET /api/admin/reports`

## 说明

这是一个演示项目，不提供真实赌博、交易、支付、派奖或结算流程。所有积分均为虚拟积分，仅用于内部演示调用。
