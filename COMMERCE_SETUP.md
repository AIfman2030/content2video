# 商业功能配置

当前代码已经包含首页、邮箱注册登录、四档套餐、Creem 托管结账、会员状态和服务端支付回调。

## 本地检查

```bash
pnpm dev
```

没有填写 Creem 服务端环境变量时，页面会正常展示，选择套餐后会明确提示支付尚未配置，不会伪造会员权限。

## Supabase

1. 执行迁移 `supabase/migrations/20260905000100_create_commerce.sql`。
2. 在 Authentication 的 URL Configuration 中加入本地地址和正式域名。
3. 部署 `creem-checkout`、`creem-customer-portal` 和公开回调函数 `creem-webhook --no-verify-jwt`。
4. 为函数设置 `CREEM_API_KEY`、`CREEM_WEBHOOK_SECRET`、`CREEM_ENVIRONMENT`、`APP_URL` 和四个 `CREEM_PRODUCT_*`。
5. 密钥只能写入 Supabase Secrets，不能写入任何 `VITE_` 变量、代码或 Git。

## Creem Test Mode

1. 创建月度、季度、年度三个订阅产品和一个永久买断产品。
2. Webhook 地址填写 `https://<project-ref>.supabase.co/functions/v1/creem-webhook`。
3. 订阅 `checkout.completed`、`subscription.*`、`refund.created` 和 `dispute.created`。
4. 在 Test Mode 完成支付后，必须同时核对 Creem 订单、Webhook 日志、`memberships` 数据和账户页状态。

## 上线前

- 将 `CREEM_ENVIRONMENT` 切换到 `production`，替换正式 API Key、Webhook Secret 和 Product ID。
- 完成 Creem 的个人身份与收款账户验证，同时补全用户协议、隐私政策和退款政策中的经营者信息。
- 绑定域名后更新 Supabase 登录回调地址和 `APP_URL`。
- 完成一笔真实小额付款和退款测试后再公开销售。
