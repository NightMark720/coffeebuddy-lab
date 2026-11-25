#!/usr/bin/env python3
"""CoffeeBuddy Lab 桥接服务器
静态服务 + 冲煮队列：
  POST /api/brew        页面提交真机冲煮任务
  GET  /api/status?id=  页面轮询任务状态
  GET  /api/queue       定时任务读取队列
队列与状态以文件形式落在 bridge/ 下，供 Kimi 定时任务消费。
"""
import json, os, time, uuid
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

ROOT = os.path.dirname(os.path.abspath(__file__))
BRIDGE = os.path.join(ROOT, "bridge")
QUEUE = os.path.join(BRIDGE, "queue.jsonl")
STATUS = os.path.join(BRIDGE, "status.json")
os.makedirs(BRIDGE, exist_ok=True)


def read_queue():
    if not os.path.exists(QUEUE):
        return []
    jobs = []
    with open(QUEUE, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    jobs.append(json.loads(line))
                except json.JSONDecodeError:
                    pass
    return jobs


def write_queue(jobs):
    tmp = QUEUE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        for j in jobs:
            f.write(json.dumps(j, ensure_ascii=False) + "\n")
    os.replace(tmp, QUEUE)


def read_status():
    if not os.path.exists(STATUS):
        return {}
    try:
        with open(STATUS, encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return {}


def write_status(st):
    tmp = STATUS + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(st, f, ensure_ascii=False)
    os.replace(tmp, STATUS)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def log_message(self, *a):
        pass

    def _json(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path == "/api/brew":
            try:
                n = int(self.headers.get("Content-Length", 0))
                payload = json.loads(self.rfile.read(n) or b"{}")
            except (ValueError, json.JSONDecodeError):
                return self._json(400, {"ok": False, "error": "bad json"})

            # 已有未完成任务时不允许重复提交
            for j in read_queue():
                if j.get("phase") in ("pending", "claimed"):
                    return self._json(409, {"ok": False, "error": "busy", "job": j.get("id")})

            job = {
                "id": payload.get("id") or str(uuid.uuid4()),
                "ts": round(time.time(), 3),
                "phase": "pending",
                "drinkKey": payload.get("drinkKey", "custom"),
                "name": payload.get("name", "Custom"),
                "cn": payload.get("cn", "自定义"),
                "recipeKey": payload.get("recipeKey"),
                "recipe": payload.get("recipe"),
                "deviceId": payload.get("deviceId", "C49E7E0C22D8"),
            }
            jobs = read_queue()
            jobs.append(job)
            write_queue(jobs)

            st = read_status()
            st[job["id"]] = {"state": "queued", "at": round(time.time(), 3)}
            write_status(st)
            return self._json(200, {"ok": True, "id": job["id"]})
        self._json(404, {"ok": False, "error": "not found"})

    def do_GET(self):
        if self.path == "/api/queue":
            return self._json(200, {"ok": True, "jobs": read_queue()})
        if self.path.startswith("/api/status"):
            from urllib.parse import urlparse, parse_qs
            q = parse_qs(urlparse(self.path).query)
            jid = (q.get("id") or [""])[0]
            st = read_status()
            return self._json(200, {"ok": True, "status": st.get(jid, {"state": "unknown"})})
        super().do_GET()


if __name__ == "__main__":
    ThreadingHTTPServer(("127.0.0.1", 7100), Handler).serve_forever()
