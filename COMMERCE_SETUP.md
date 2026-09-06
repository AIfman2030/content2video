# 商业功能配置

当前代码已经包含首页、邮箱免密码登录、四档套餐、Paddle 托管结账、会员状态和服务端支付回调。

## 本地检查

```bash
pnpm dev
```

没有填写 Paddle 环境变量时，页面会正常展示，选择套餐后会明确提示支付尚未配置，不会伪造会员权限。

## Supabase

1. 执行迁移 `supabase/migrations/20260905000100_create_commerce.sql`。
2. 在 Authentication 的 URL Configuration 中加入本地地址和正式域名。
3. 部署函数：`supabase functions deploy paddle-webhook --no-verify-jwt`。
4. 部署账户门户：`supabase functions deploy paddle-customer-portal`。
5. 为函数设置 `PADDLE_WEBHOOK_SECRET`、`PADDLE_API_KEY`、`PADDLE_ENVIRONMENT` 和四个 `PADDLE_PRICE_*`。

## Paddle Sandbox

1. 创建月度、季度、年度三个订阅价格和一个永久买断价格。
2. 将 `.env.example` 复制为 `.env.local` 并填写客户端令牌与 Price ID。
3. Webhook 地址填写 Supabase 函数公开地址，至少订阅 `transaction.completed` 与 `subscription.*` 事件。
4. 在 Sandbox 完成支付后，必须同时核对 Paddle 订单、Webhook 日志、`memberships` 数据和账户页状态。

## 上线前

- 将 Paddle 环境切换到 production，并替换正式客户端令牌和 Price ID。
- 在 Paddle 审核域名，同时补全用户协议、隐私政策和退款政策中的经营者信息。
- 绑定域名后更新 Supabase 登录回调地址和 Paddle 默认付款链接。
- 完成一笔真实小额付款和退款测试后再公开销售。
