# Agent 一键安装提示词

把下面整段粘贴给你的 agent（WorkBuddy / Codex / Kimi Work 均可），它会自动完成部署。遇到必须人工操作的步骤（配对码、OAuth 授权）它会停下来问你。

```text
帮我部署 CoffeeBuddy Lab（一个 Citaly 咖啡机的可视化仪表盘）：

项目仓库：https://github.com/NightMark720/coffeebuddy-lab
参考文档：仓库内的 docs/friend-setup.md（部署细节以它为准，本指令是流程概要）

我的环境：[在这里注明你用的是 WorkBuddy / Codex / 其他]

请按以下步骤执行，每步完成向我简报结果，必须人工操作的步骤停下来等我：

1. 克隆仓库到我的家目录下，进入项目目录
2. 添加 coffeebuddy MCP 服务（https://cmap.citaly.com/mcp，Streamable HTTP + OAuth）。
   按我的平台配置：WorkBuddy 用它支持的 MCP 配置方式，Codex 加到 ~/.codex/config.toml。
   首次授权需要我点浏览器登录，引导我完成
3. 运行 list_devices 确认绑定状态；如果为空，让我读咖啡机配对界面上的六位码给你，用 bind_device 绑定
4. 运行 python3 server.py 并保持在后台运行（告诉我访问地址 http://127.0.0.1:7100）
5. 启用本地 agent 钩子：
   cp bridge/agent-hook.example.sh bridge/agent-hook.sh && chmod +x bridge/agent-hook.sh
   我是 WorkBuddy 用户保持默认 codebuddy 命令即可；Codex 用户切换到脚本里的备选行
   注意：脚本里的 -y / --full-auto 表示跳过执行权限确认，启用前先向我说明含义，我同意再继续
6. 自检：调用 get_device_context 确认我的机器在线、菜单可读，把机器名和当前咖啡豆告诉我
7. 全部完成后告诉我：页面地址、真机冲煮使用方法（页面点「真机冲煮」→ 确认杯子 → 等进度走完）

安全要求：除上述步骤外不要修改仓库其他内容；不确定的操作先问我。
```

## 使用说明

- 方括号 `[在这里注明...]` 让朋友填自己用的平台
- 第 3 步的配对码、第 2 步的 OAuth 授权是唯二需要人工的地方
- 部署完成后，真机冲煮走「路径 D：本地 agent 钩子」，秒级下发，无需定时任务
