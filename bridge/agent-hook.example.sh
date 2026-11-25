#!/bin/bash
# CoffeeBuddy Lab 本地 agent 钩子
# 页面提交冲煮任务后，server.py 会立即以本脚本消费该任务（无需定时任务，秒级下发）。
#
# 启用方式：
#   cp bridge/agent-hook.example.sh bridge/agent-hook.sh
#   chmod +x bridge/agent-hook.sh
# 注意：启用钩子后不要再配置定时执行器（docs/friend-setup.md 路径 B/C），二者二选一，
# 同时开启可能导致同一任务被重复消费。

JOB_ID="$1"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROMPT="你是 CoffeeBuddy Lab 真机冲煮执行器。严格按 docs/executor-prompt.md 的【执行器提示词】消费队列中 id 为 ${JOB_ID} 的 job：机器自动发现，进度写入 bridge/status.json，完成后结束。除该 job 外不要执行任何其他任务。"

# WorkBuddy / CodeBuddy CLI（-p 非交互执行；-y 跳过权限确认，请知悉含义后使用）：
codebuddy -p -y "$PROMPT"

# Codex 用户改用这一行（注释掉上面那行）：
# codex exec --full-auto "$PROMPT"
