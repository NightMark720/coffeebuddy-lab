# 朋友上手指南

把 CoffeeBuddy Lab 跑在自己的 Citaly 咖啡机上，只需要三步：改配置 → 起服务 → 连 agent。

## 第 0 步：改配置（可跳过）

编辑 `js/data.js` 里的 `MACHINE`（设备 ID 在 CoffeeBuddy App「设备信息」页可以看到）。不改也能跑：执行器会自动发现你账号下绑定的咖啡机，多台机器时才需要指定。

## 第 1 步：起桥接服务（必做）

```bash
python3 server.py   # 打开 http://127.0.0.1:7100
```

- 只用卡片 / 参数调节 / 模拟冲煮：到此为止，不用配 agent。
- 要真机冲煮：继续下面第 2 步，三条路选一条。

## 第 2 步：真机冲煮，三条路选一条

所有路径都依赖同一个 coffeebuddy MCP 服务：`https://cmap.citaly.com/mcp`（Streamable HTTP + OAuth，首次连接会引导登录你自己的 CoffeeBuddy 账号）。

### 路径 A：对话直控（任何 MCP 客户端，最省心）

适合 Codex、WorkBuddy 等没有定时任务的平台。机器自动发现，无需填设备 ID。

1. 在 agent 里添加 MCP 服务 `https://cmap.citaly.com/mcp`，完成 OAuth 登录
2. 用六位配对码绑定自己的机器（在机器的配对界面找）
3. 粘贴这段启动词：

```
你是我的咖啡机助手。我的 Citaly 咖啡机已绑定在 coffeebuddy 里。
我说「冲一杯 XX」时：
1. list_devices 找到我的机器（只有一台就直接用），get_device_context 检查在线、空闲、就绪（ready=true 且无 blockers），不通过就告诉我原因
2. prepare_brew（recipe_key 用菜单里的名字，如 espresso；自定义配方我再给你 JSON）
3. 等我确认杯子放好，start_brew 开始
4. 每 3 秒 get_command_result 报进度，完成后告诉我用时
安全要求：任何提交不确定时只重查不重复提交。
```

之后说「冲一杯浓缩」即可。

### 路径 B：agent 自带定时任务（页面点按钮全自动）

适合 Kimi Work、WorkBuddy 等支持定时任务 + MCP 的平台。

1. 在 agent 平台添加 coffeebuddy 服务（同路径 A 的第 1、2 步）
2. 新建定时任务：每分钟执行，提示词直接粘贴 [`docs/executor-prompt.md`](./executor-prompt.md) 里的代码块（无需修改，机器自动发现）
3. 若定时任务有「工作目录」设置，设为项目根目录；没有的话，把提示词里所有 `bridge/` 相对路径改成项目根的绝对路径
4. 页面点「真机冲煮」→ 确认杯子 → 等进度遮罩走完

注意：任务每分钟运行一次检查队列，空闲一轮约 7 秒。不冲咖啡时建议停用任务（点任务卡片或叫 Kimi 停用），页面提交的任务会在队列里等着，重新启用后 1 分钟内接走，不会丢。

### 路径 C：系统 cron + 任意 agent（页面点按钮全自动）

适合会一点命令行的朋友。以 Codex 为例：

1. `~/.codex/config.toml` 添加：

```toml
[mcp_servers.coffeebuddy]
url = "https://cmap.citaly.com/mcp"
```

2. 首次在 Codex 里调用 coffeebuddy 工具完成 OAuth 登录和机器绑定
3. crontab 加一条（把路径换成你的项目路径）：

```
* * * * * cd /你的路径/coffee-lab && codex exec --sandbox read-only "你是 CoffeeBuddy Lab 真机冲煮执行器。严格按 docs/executor-prompt.md 的【执行器提示词】执行一轮队列消费，机器自动发现，不要有多余动作。" >> /tmp/coffee-executor.log 2>&1
```

页面体验和路径 B 一致。

### 路径 D：本地 agent 钩子（WorkBuddy / Codex CLI，秒级全自动）

适合 WorkBuddy（CodeBuddy CLI）等定时粒度太粗、但支持非交互执行的平台。**零定时任务，点击后秒级下发**。

1. 完成路径 A 第 1、2 步（MCP 登录 + 绑定机器）
2. 启用钩子：

```bash
cp bridge/agent-hook.example.sh bridge/agent-hook.sh
chmod +x bridge/agent-hook.sh
```

3. 打开页面点「真机冲煮」→ `server.py` 收到请求后立即唤起本地 agent 执行，进度照常回传页面

注意：

- 钩子与路径 B/C 的定时执行器**二选一**，同时开启可能导致同一任务被重复消费
- 示例脚本里 `codebuddy -p -y` 的 `-y` 表示跳过执行权限确认，请知悉含义后使用；Codex 用户脚本里有现成备选行

## 常见问题

- **页面缩略图裂了？** 确认是从仓库完整克隆的，`assets/` 目录在。
- **真机冲煮报错「水量与目标液重不匹配」？** 自定义配方需满足：各段水量之和 = 目标液重 + 2 × 粉量。页面侧已自动配平；路径 A 手搓配方时自己算一下。
- **不想用了？** 停掉 `server.py` 和定时任务即可，机器不受影响。
