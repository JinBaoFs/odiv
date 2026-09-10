# 加密货币价格助手 / Crypto Price Assistant

页面：`/zh/price-agent`、`/en/price-agent`。支持 BTC/USDT、ETH/USDT、SOL/USDT 当前最优卖价（买入参考价）与最近七个完整 UTC 自然日收盘价。每次查询一个币种，可以同时查该币种当前价格和历史。没有账户读取、购买量计算或下单功能。

币种与名称别名集中维护在 `config/price-agent.ts`。例如“比特币”“以太坊”“Solana”由模型根据别名映射到对应交易对。未指定币种时由模型询问，不默认查询 BTC；不支持的币种不能替换为其他币种。页面币种按钮仅改变快捷问题，实际查询以输入框的文字为准。

工具定义、服务端校验和页面单位均使用同一配置；已经验证的 symbol 必须传到行情请求，返回报价的 symbol 必须与请求一致。同一轮或不同轮提出多个币种时，执行器会拒绝新增的混合查询，保留此前结果，不覆盖为另一个币种。价格使用最多十位有效数字展示，避免低价显示成 0.00。

## 本地配置

将以下配置填入 `.env.local`，保留原有环境变量：

```dotenv
PRICE_AGENT_ENABLED=true
DEEPSEEK_API_KEY=自行填写真实Key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-flash
MARKET_DATA_BASE_URL=https://data-api.binance.vision
```

重新启动 `pnpm dev`。模型和行情请求都在 Next.js Node.js 服务端执行。密钥不使用 `NEXT_PUBLIC_`，也不会返回浏览器。DeepSeek API 按用量计费，赠送额度以账户实际状态为准。实现验证不需要使用真实 API Key：自动测试拦截所有外部请求。

模型 ID 可配置，不自动回退到其他模型。DeepSeek 部分文档仍使用 `deepseek-v4-flash`；以账户 `/models` 返回的 ID 为准。代码明确使用非思考模式、`stream: false` 和 800 输出 token 上限。

## 运行流程与限制

浏览器发送 `{message, locale}` → `/api/price-agent` 校验配置、请求来源及输入 → DeepSeek 选择工具 → 服务端白名单与参数校验 → 查询 Binance → 将结果按工具调用 ID 交回 DeepSeek → 返回说明、结构化数据和执行记录。

- 每次提问独立运行，不接受客户端自带 system 消息、工具定义或历史工具结果。
- 最多 500 字符、4 KB 请求体、3 次模型请求、4 次工具执行。
- 整体执行 45 秒超时；单次模型请求 20 秒，行情请求 8 秒。部署平台必须支持 Node.js Route Handlers，且执行时限满足要求（路由声明 `maxDuration = 60`）。
- 记录在查询结束后一次性返回，不是实时进度流。不会展示模型内部推理。
- 模型或网络失败时保留已验证的行情，返回 `partial`。模型返回异常结束原因或截断内容时不会当成成功回答。
- 当前报价使用 `bookTicker.askPrice`；`fetchedAt` 是本服务抓取时间，不是交易所报价时间。
- 日线查询使用 UTC 和结束时间前一毫秒，排除当天未收盘数据；缺失日期保留空缺。数值直接来自结构化数据，模型只提供说明。
- 浏览器取消会中断 fetch，服务端通过请求信号传递取消；代理断开检测依赖部署环境，整体超时始终作为兜底。已经发出的模型调用可能仍计费。

## 生产环境访问

价格助手公开供访客匿名使用，无需输入访问码或发送 Authorization 请求头。`PRICE_AGENT_ACCESS_TOKEN` 已不再读取，可以从本地和 Vercel 环境变量中删除；旧值仍存在也不会影响调用。

Vercel 生产环境仍需配置 `PRICE_AGENT_ENABLED=true` 和服务端 `DEEPSEEK_API_KEY`，模型与地址配置按需设置。更新环境变量后重新部署。生产部署需 HTTPS，模型 Key 不得带 `NEXT_PUBLIC_` 前缀或传给浏览器，访客调用消耗站点的 DeepSeek 账户额度。

接口保留请求来源检查、输入校验、进程内单并发和两秒间隔保护，以及调用次数与超时上限。来源检查不等于身份认证，进程内保护也不是跨实例限流或全站预算；当前没有每用户、每 IP 或全站每日额度控制。如需控制公开使用的总量，需要另外接入共享限流存储和总额度控制。

服务器必须能够访问 DeepSeek 与 Binance 公共行情地址。遇到地区或网络限制时应返回明确错误，不自动替换成模拟数据。地址配置仅由部署管理员控制，不接受用户或模型传入 URL。

## 验证

```powershell
node --import ./tests/register-price-agent.mjs --test ./tests/price-agent.test.ts
pnpm exec tsc --noEmit --incremental false
```

测试已在 Node.js 24 验证，使用其 TypeScript 类型擦除和模块解析钩子，不需要新增测试依赖。`register-price-agent.mjs` 仅为测试解析 `@/` 导入。

手动检查：中英页面、明暗主题、窄屏布局，分别输入“获取当前 BTC 价格”“查询以太坊最近七天价格”“获取当前 SOL 价格”，确认无需访问码，卡片、图表和记录的币种及单位正确；再检查未知币种、多币种请求、跨站来源、缺失配置、工具失败与取消。真实模型联调需要有效额度；构建使用 `pnpm build`，由项目维护者手动执行。

## English setup

Add the configuration above to `.env.local`, supply your DeepSeek key and available model ID, and set `PRICE_AGENT_ENABLED=true`. Restart the development server. DeepSeek usage is metered; public market endpoints do not require an exchange key.

The frontend submits one question. A Next.js server runner performs up to three model requests and four tool calls. BTC/USDT, ETH/USDT, and SOL/USDT are supported, one coin per query, with current best asks and seven completed UTC daily candles. The shared market configuration supplies aliases, tool enums, validation, and UI labels. Missing coins prompt clarification; unsupported coins are not replaced with BTC. Runtime checks reject mixed-market batches and market switches across rounds. Tool results are paired with their call IDs, and verified symbols flow through to actual API requests. Valid market data survives explanation failures, and charts preserve missing days. Prices use up to ten significant digits. Coin buttons change example questions; the submitted text determines the requested coin.

The assistant accepts anonymous requests without an access code or Authorization header. `PRICE_AGENT_ACCESS_TOKEN` is no longer read and can be deleted from local and Vercel environments; existing values have no effect. Production still requires `PRICE_AGENT_ENABLED=true` and a server-side `DEEPSEEK_API_KEY`. Configure the model and provider URLs as needed, then redeploy after environment changes. Use HTTPS and never expose the model key through `NEXT_PUBLIC_` variables or browser props. All visitors use the site's DeepSeek credits.

Origin and input checks, per-process backpressure, call limits, and timeouts remain. Origin checks do not authenticate users, and in-memory backpressure does not enforce quotas across instances. There are currently no per-user, per-IP, or daily site-wide quotas; shared rate limiting and a total budget require separate implementation.

Run the test and type-check commands above without real API calls. Verify the bilingual UI, themes, mobile layout, network failures, and cancellation manually. The maintainer runs the production build.

## 官方参考 / Official references

- [DeepSeek Chat Completions](https://api-docs.deepseek.com/api/create-chat-completion/)
- [DeepSeek Tool Calls](https://api-docs.deepseek.com/guides/tool_calls/)
- [DeepSeek Models](https://api-docs.deepseek.com/api/list-models/)
- [DeepSeek Pricing](https://api-docs.deepseek.com/quick_start/pricing/)
- [Binance public market data](https://developers.binance.com/en/docs/products/spot/faqs/market_data_only)
