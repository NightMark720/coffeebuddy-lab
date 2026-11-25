# CoffeeBuddy Lab

Citaly 咖啡机的可视化仪表盘：纯白编辑风 + 冰箱贴风饮品卡片。

## 功能

- **饮品卡片**：CSS 3D 翻卡，封面为锡箔纸压印质感（AI 生成），卡面标注名字与液重
- **参数调节**：压力曲线 / 粉量 / 研磨度 / 液重 / 温度可视化调节，模拟冲煮动效
- **豆仓**：咖啡豆风格化卡片
- **真机冲煮**：页面提交 → 本地队列（`server.py`）→ 定时任务认领 → CoffeeBuddy MCP 执行 → 进度实时回传页面

## 运行

```bash
python3 server.py   # 静态服务 + 冲煮队列，http://127.0.0.1:7100
```

真机冲煮需要一个每分钟轮询 `bridge/queue.jsonl` 的执行器（通过 CoffeeBuddy MCP 下发冲煮指令），页面本身只做提交与进度展示。

## 结构

```
index.html        页面骨架
css/style.css     样式（瑞士编辑风 + 冰箱贴卡片）
js/data.js        饮品/机器数据
js/app.js         交互、3D 翻卡、模拟动效、真机冲煮提交
server.py         桥接服务器（静态 + /api/brew /api/status /api/queue）
assets/           AI 生成封面图
vendor/           qrcode.min.js
bridge/           运行时队列与状态（不入库）
```

## 配方约束

自定义配方需满足机器校验：浓缩各段水量之和 = 目标液重 + 2 × 粉量（咖啡粉吸水肿胀补偿）。页面提交时已自动配平。

## 分享给朋友

朋友有自己的 Citaly 咖啡机和 CoffeeBuddy 账号就能完整使用（真机冲煮需要任意支持 MCP 的 agent）。上手步骤见 [docs/friend-setup.md](docs/friend-setup.md)，执行器提示词见 [docs/executor-prompt.md](docs/executor-prompt.md)。
