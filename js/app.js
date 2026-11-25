/* CoffeeBuddy Lab · 交互层 */
"use strict";

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const NS = "http://www.w3.org/2000/svg";

let currentDrink = DRINKS[0];
let currentIndex = 0;

/* ============ 视图切换 ============ */
$$(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    $$(".nav-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    $$(".view").forEach((v) => v.classList.remove("active"));
    $(`#view-${btn.dataset.view}`).classList.add("active");
    if (btn.dataset.view === "lab") renderLab();
    if (btn.dataset.view === "beans") renderBeans();
  });
});

/* ============ 平滑曲线路径（Catmull-Rom → Bezier） ============ */
function smoothPath(pts) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/* ============ 饮品卡 ============ */
function renderThumbs() {
  $("#thumbs").innerHTML = DRINKS.map((d, i) => `
    <button class="thumb ${i === currentIndex ? "active" : ""}" data-i="${i}" title="${d.name}">
      <img src="${d.cover}" alt="${d.name}">
    </button>`).join("");
  $$(".thumb").forEach((t) => t.addEventListener("click", () => switchDrink(+t.dataset.i)));
}

function specLine(p) {
  const yieldTotal = p.water ? p.yield + p.water.vol : p.yield;
  return [`${p.grams}g`, `研磨 ${p.grind}`, `${yieldTotal}ml 液重`, `${p.temp}°C`].join(" · ");
}

function applyTilt() {
  $("#card3d").style.setProperty("--tilt", (TILT[currentDrink.key] ?? -1.2) + "deg");
}

function switchDrink(i) {
  if (i === currentIndex) return;
  closeSpread(true);
  const card = $("#card3d");
  card.classList.add("hide");
  setTimeout(() => {
    currentIndex = i;
    currentDrink = DRINKS[i];
    card.classList.add("enter");
    card.classList.remove("hide");
    $("#cover-img").src = currentDrink.cover;
    applyTilt();
    renderCaption();
    renderThumbs();
    applyFrontLayers();
    requestAnimationFrame(() => requestAnimationFrame(() => card.classList.remove("enter")));
  }, 300);
}

/* 正面呈现：有 layer 素材的饮品走分层磁贴，其余保持整张封面 */
function applyFrontLayers() {
  const layered = !!currentDrink.layers;
  $("#magnet").hidden = !layered;
  $("#cover-img").style.display = layered ? "none" : "";
  if (layered) {
    $("#magnet").style.setProperty("--block", currentDrink.block || "#bc3a1d");
    playAssemble();
  } else {
    const img = $("#cover-img");
    img.classList.remove("drop");
    void img.offsetWidth;
    img.classList.add("drop");
  }
}

/* 装配动效：卡片落位后，杯子先落下，咖啡豆逐颗落下（悬浮不做任何调整） */
function playAssemble() {
  const cup = $("#m-cup"), beans = $$(".m-bean");
  [cup, ...beans].forEach((el) => { el.classList.remove("drop"); el.style.animationDelay = ""; });
  void cup.offsetWidth;
  cup.style.animationDelay = ".18s";
  cup.classList.add("drop");
  beans.forEach((b, i) => {
    b.style.animationDelay = (0.5 + i * 0.08) + "s";
    b.classList.add("drop");
  });
}

function renderCaption() {
  const p = currentDrink.params;
  const yieldTotal = p.water ? p.yield + p.water.vol : p.yield;
  $("#cl-name").innerHTML = `${currentDrink.name}<span>${currentDrink.cn}</span>`;
  $("#cl-spec").textContent = `${yieldTotal}ml`;
  $("#card3d").style.setProperty("--label", LABEL_DARK[currentDrink.key] || "#ffffff");
  document.documentElement.style.setProperty("--accent", currentDrink.accent);
}

/* ---- 展开内页 ---- */
function renderCurve(svg, stages, { w = 320, h = 200, pad = 14 } = {}) {
  const maxP = 12, n = stages.length;
  const pts = stages.map((s, i) => ({
    x: pad + (i * (w - pad * 2)) / Math.max(1, n - 1),
    y: h - pad - (s.p / maxP) * (h - pad * 2),
  }));
  // 区域填充
  const area = `${smoothPath(pts)} L ${pts[pts.length - 1].x} ${h - pad} L ${pts[0].x} ${h - pad} Z`;
  svg.innerHTML = `
    ${[3, 6, 9, 12].map((v) => {
      const y = h - pad - (v / maxP) * (h - pad * 2);
      return `<line x1="${pad}" y1="${y}" x2="${w - pad}" y2="${y}" stroke="#e5ded2" stroke-width="1"/>
              <text x="${pad - 4}" y="${y + 3}" font-size="7" fill="#b6ad9f" text-anchor="end">${v}</text>`;
    }).join("")}
    <path d="${area}" fill="rgba(176,118,63,.07)"/>
    <path d="${smoothPath(pts)}" fill="none" stroke="#8a8378" stroke-width="1.8" stroke-linecap="round"/>
    ${pts.map((p, i) => `
      <circle cx="${p.x}" cy="${p.y}" r="4" fill="#fff" stroke="#111" stroke-width="1.4"/>
      <text x="${p.x}" y="${p.y - 9}" font-size="8.5" fill="#4a4a4a" text-anchor="middle" font-weight="600">${stages[i].p} bar</text>
    `).join("")}
    <text x="${w - pad}" y="${h - 2}" font-size="7" fill="#b6ad9f" text-anchor="end">PRESSURE PROFILE</text>`;
}

function openSpread() {
  const p = currentDrink.params;
  const bean = beanOf(currentDrink.bean);
  $("#sp-drink-name").textContent = currentDrink.name;
  $("#sp-drink-cn").textContent = `${currentDrink.cn} _`;
  $("#sp-drink-bean").innerHTML = `咖啡豆 <b>${bean.name}</b> · ${bean.origin} · ${bean.roast}`;

  if (p.stages) renderCurve($("#curve-svg"), p.stages);

  $("#stage-chips").innerHTML = p.stages
    ? p.stages.map((s, i) => `<span class="chip">P${i + 1} <b>${s.p} bar</b> · ${s.vol}ml${s.rest ? ` · 静置${s.rest}s` : ""}</span>`).join("")
    : `<span class="chip"><b>${p.coldBrew.vol}ml</b> · 冰酿 ${p.coldBrew.minutes}h · 刻度 ${p.grind}</span>`;

  const water = p.stages ? p.stages.reduce((a, s) => a + s.vol, 0) : p.coldBrew.vol;
  const rows = [
    ["DOSE 粉量", `${p.grams} g`],
    ["GRIND 研磨度", `Level ${p.grind}`],
    ["TEMP 水温", `${p.temp} °C`],
    ["WATER 总水量", `${water} ml`],
  ];
  if (p.stages) {
    rows.push(["PRE-INFUSION 预浸", `${p.stages[0].vol} ml @ ${p.stages[0].p} bar`]);
    if (p.stages[0].rest) rows.push(["REST 静置", `${p.stages[0].rest} s`]);
  }
  if (p.milk) rows.push(["MILK 奶泡", `${p.milk.vol} ml · 密度 ${p.milk.density}/5`]);
  if (p.water) rows.push(["HOT WATER 热水", `${p.water.vol} ml @ ${p.water.temp} °C`]);
  rows.push(["YIELD 出品", `≈ ${p.yield} ml`], ["TIME 总时长", `${p.time} s`]);
  $("#sp-spec").innerHTML = rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("");

  const extSec = p.stages ? 12 : Math.min(60, p.time / 4);
  $("#timeline").innerHTML = `
    <div class="tl-row"><span style="width:52px">研磨</span><span class="bar"><i style="width:52%"></i></span><span style="width:38px;text-align:right">13s</span></div>
    <div class="tl-row"><span style="width:52px">萃取</span><span class="bar"><i style="width:${Math.min(96, extSec * 5)}%"></i></span><span style="width:38px;text-align:right">${p.stages ? extSec + "s" : p.coldBrew.minutes + "h"}</span></div>
    <div class="tl-row"><span style="width:52px">退渣</span><span class="bar"><i style="width:18%"></i></span><span style="width:38px;text-align:right">2s</span></div>`;

  $("#card3d").classList.add("flipped");
  setTimeout(() => {
    $("#card3d").style.opacity = "0";
    $("#spread").classList.add("open");
    $("#spread").setAttribute("aria-hidden", "false");
  }, 380);
}

function closeSpread(instant = false) {
  $("#spread").classList.remove("open");
  $("#spread").setAttribute("aria-hidden", "true");
  const card = $("#card3d");
  card.style.opacity = "";
  card.classList.remove("flipped");
  if (instant) return;
}

$("#card-front").addEventListener("click", openSpread);
$("#btn-close-spread").addEventListener("click", () => closeSpread());
$("#btn-tune").addEventListener("click", () => {
  loadIntoLab(currentDrink);
  closeSpread();
  $('.nav-btn[data-view="lab"]').click();
});
$("#btn-brew").addEventListener("click", () => brewReal(currentDrink));
$("#btn-brew-sim").addEventListener("click", () => startBrew(currentDrink));

/* ============ 冲煮动效（模拟） ============ */
let brewTimer = null;
let pollTimer = null;

function brewStepsOf(drink) {
  const p = drink.params;
  if (p.coldBrew) {
    return [
      { name: "研磨", dur: 2.5, tempTo: 20 },
      { name: "冰酿浸泡", dur: 9, tempTo: 8 },
      { name: "过滤出品", dur: 3, tempTo: 12 },
      { name: "退渣", dur: 1.6, tempTo: 12 },
    ];
  }
  const ext = p.stages.reduce((a, s) => a + s.vol, 0);
  const steps = [
    { name: "研磨", dur: 2.5, tempTo: 62 },
    { name: "预浸", dur: 2 + (p.stages[0].rest || 5) / 4, tempTo: p.temp - 4, curveStart: 0 },
    { name: "萃取", dur: 9, tempTo: p.temp - 1, curveDraw: true },
  ];
  if (p.milk || p.water) steps.push({ name: p.milk ? "注入奶泡" : "注入热水", dur: 3, tempTo: p.milk ? 62 : p.water.temp });
  steps.push({ name: "退渣", dur: 1.6, tempTo: p.temp - 6 });
  return steps;
}

function startBrew(drink) {
  const p = drink.params;
  const steps = brewStepsOf(drink);
  const total = steps.reduce((a, s) => a + s.dur, 0);
  const overlay = $("#brew-overlay");
  $("#brew-title").textContent = `${drink.name} · ${drink.cn}`;
  $("#brew-tag").textContent = "模拟数据";
  $("#btn-brew-cancel").textContent = "取消";
  $("#brew-bar").style.width = "0";
  $("#bm-temp").textContent = MACHINE.boiler.current.toFixed(1) + "°C";
  $("#bm-time").textContent = "00:00";
  overlay.classList.add("open", "brewing");
  overlay.setAttribute("aria-hidden", "false");

  // 预渲染完整曲线
  const svg = $("#brew-curve");
  const W = 640, H = 300, PAD = 30;
  let curvePath = "", curveLen = 0;
  if (p.stages) {
    const n = p.stages.length;
    const pts = p.stages.map((s, i) => ({
      x: PAD + (i * (W - PAD * 2)) / Math.max(1, n - 1),
      y: H - PAD - (s.p / 12) * (H - PAD * 2),
    }));
    curvePath = smoothPath(pts);
    const measure = document.createElementNS(NS, "path");
    measure.setAttribute("d", curvePath);
    curveLen = measure.getTotalLength ? measure.getTotalLength() : 1000;
  }
  svg.innerHTML = `
    ${[3, 6, 9, 12].map((v) => {
      const y = H - PAD - (v / 12) * (H - PAD * 2);
      return `<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="#eee9e1" stroke-width="1"/>
              <text x="${PAD - 8}" y="${y + 4}" font-size="11" fill="#c4bcb0" text-anchor="end">${v}</text>`;
    }).join("")}
    ${p.stages ? `
      <path d="${curvePath}" fill="none" stroke="#d8d0c2" stroke-width="2"/>
      <path id="brew-live" d="${curvePath}" fill="none" stroke="${drink.accent}" stroke-width="3" stroke-linecap="round"
        stroke-dasharray="${curveLen}" stroke-dashoffset="${curveLen}"/>` : `
      <text x="${W / 2}" y="${H / 2}" font-size="14" fill="#a0a0a0" text-anchor="middle" letter-spacing="4">COLD BREW · 冰酿曲线待接入</text>`}
    <text x="${W - PAD}" y="${H - 8}" font-size="10" fill="#c4bcb0" text-anchor="end">bar</text>`;

  let elapsed = 0, acc = 0, cur = 0, temp = MACHINE.boiler.current;
  const extIdx = steps.findIndex((s) => s.curveDraw);
  const t0 = performance.now();

  clearInterval(brewTimer);
  brewTimer = setInterval(() => {
    elapsed = (performance.now() - t0) / 1000;
    const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const ss = String(Math.floor(elapsed % 60)).padStart(2, "0");
    $("#bm-time").textContent = `${mm}:${ss}`;
    $("#brew-bar").style.width = `${Math.min(100, (elapsed / total) * 100)}%`;

    while (cur < steps.length - 1 && elapsed > acc + steps[cur].dur) { acc += steps[cur].dur; cur++; }
    const st = steps[cur];
    const prog = Math.min(1, (elapsed - acc) / st.dur);
    $("#bm-step").textContent = `${st.name} ${cur + 1}/${steps.length}`;

    const from = cur === 0 ? MACHINE.boiler.current : steps[cur - 1].tempTo;
    temp = from + (st.tempTo - from) * prog;
    $("#bm-temp").textContent = temp.toFixed(1) + "°C";

    const live = $("#brew-live");
    if (live && cur === extIdx) {
      const draw = Math.min(1, prog * 1.15);
      live.style.strokeDashoffset = curveLen * (1 - draw);
    }
    if (cur === extIdx) $("#cup-fill").style.opacity = Math.min(0.85, prog * 1.2);

    if (elapsed >= total) {
      clearInterval(brewTimer);
      $("#bm-step").textContent = "完成";
      setTimeout(() => { overlay.classList.remove("open", "brewing"); showDone(drink, elapsed); }, 700);
    }
  }, 90);
}

$("#btn-brew-cancel").addEventListener("click", () => {
  clearInterval(brewTimer);
  if (realJob) {
    // 真机任务已下发，遮罩只退到后台，轮询继续
    $("#brew-overlay").classList.remove("open", "brewing");
    return;
  }
  $("#brew-overlay").classList.remove("open", "brewing");
  $("#brew-overlay").setAttribute("aria-hidden", "true");
});

/* ============ 真机冲煮（经桥接队列） ============ */
let realJob = null; // {id, drink, timer}

const RECIPE_KEY_MAP = { coldbrew: "cold_brew" };

function fmtTime(sec) {
  sec = Math.max(0, Math.floor(sec || 0));
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
}

/* 把饮品参数映射为 coffeebuddy 自定义配方（菜单饮品走 recipe_key 更稳） */
function customRecipeFromParams(p) {
  if (!p.stages) return null;
  // 机器硬校验：浓缩阶段总水量 = 目标液重 + 2 × 粉量（咖啡粉吸水肿胀补偿）。
  // 以压力曲线各段为准，把差值并入最后一段，再反推目标液重，保证配方必过校验。
  const required = p.yield + p.grams * 2;
  const stages = p.stages.map((s) => ({ ...s }));
  const sum0 = stages.reduce((a, s) => a + s.vol, 0);
  if (stages.length && sum0 !== required) {
    const last = stages[stages.length - 1];
    last.vol = Math.max(5, last.vol + (required - sum0));
  }
  const yieldMl = stages.reduce((a, s) => a + s.vol, 0) - p.grams * 2;
  const steps = [
    { step: 1, action: "grind_beans", params: { grams: p.grams, grind_level: p.grind } },
    {
      step: 2, action: "brew_espresso",
      params: {
        stages: stages.map((s) => ({
          pressure: s.p, volume_ml: s.vol, temperature: p.temp,
          ...(s.rest ? { rest_seconds: s.rest, timeout_seconds: s.rest + 20 } : {}),
        })),
      },
      target_coffee_yield_ml: yieldMl,
    },
  ];
  let n = 3;
  if (p.milk) steps.push({ step: n++, action: "make_milk_foam", params: { volume_ml: p.milk.vol, ...(p.milk.density ? { foam_density: p.milk.density } : {}), temperature: 60 } });
  if (p.water) steps.push({ step: n++, action: "dispense_hot_water", params: { volume_ml: p.water.vol, temperature: p.water.temp || 88 } });
  steps.push({ step: n, action: "eject_grounds", params: {} });
  return { recipe_name: "CoffeeLab Custom", description: "CoffeeBuddy Lab 仪表盘配方", steps };
}

async function brewReal(drink) {
  const ok = confirm(`即将在「${MACHINE.name}」上冲煮 ${drink.name}（${drink.cn}）。\n\n请确认杯子已放在出液口下方，点击确定提交。`);
  if (!ok) return;
  closeSpread(true);

  let jobId;
  try {
    const res = await fetch("/api/brew", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        drinkKey: drink.key,
        name: drink.name,
        cn: drink.cn,
        recipeKey: RECIPE_KEY_MAP[drink.key] || drink.key,
        recipe: customRecipeFromParams(drink.params),
        deviceId: MACHINE.id,
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      alert(data.error === "busy" ? "机器忙 —— 已有进行中的冲煮任务" : "提交失败：" + (data.error || ""));
      return;
    }
    jobId = data.id;
  } catch {
    alert("桥接服务未启动 —— 请在项目目录运行 npm run dev");
    return;
  }

  openRealOverlay(drink, jobId);
}

function openRealOverlay(drink, jobId) {
  realJob = { id: jobId, drink, started: Date.now() };
  $("#brew-title").textContent = `${drink.name} · ${drink.cn}`;
  $("#brew-tag").textContent = "真机 · 待开始";
  $("#brew-bar").style.width = "0";
  $("#bm-step").textContent = "已排队 · 对聊天窗口说「开始」";
  $("#bm-temp").textContent = "—";
  $("#bm-time").textContent = "00:00";
  $("#cup-fill").style.opacity = "0";

  // 预渲染完整曲线（真机数据回传前静态展示）
  renderBrewCurve(drink, 0);

  const overlay = $("#brew-overlay");
  overlay.classList.add("open", "brewing");
  overlay.setAttribute("aria-hidden", "false");
  $("#btn-brew-cancel").textContent = "后台运行";

  pollReal(jobId);
}

function renderBrewCurve(drink, progress) {
  const svg = $("#brew-curve");
  const p = drink.params;
  const W = 640, H = 300, PAD = 30;
  if (!p.stages) {
    svg.innerHTML = `<text x="${W / 2}" y="${H / 2}" font-size="14" fill="#a0a0a0" text-anchor="middle" letter-spacing="4">COLD BREW</text>`;
    return;
  }
  const n = p.stages.length;
  const pts = p.stages.map((s, i) => ({
    x: PAD + (i * (W - PAD * 2)) / Math.max(1, n - 1),
    y: H - PAD - (s.p / 12) * (H - PAD * 2),
  }));
  const path = smoothPath(pts);
  const probe = document.createElementNS(NS, "path");
  probe.setAttribute("d", path);
  const len = probe.getTotalLength();
  const off = len * (1 - Math.min(1, progress));
  const dot = probe.getPointAtLength(len * Math.min(1, progress));
  svg.innerHTML = `
    ${[3, 6, 9, 12].map((v) => {
      const y = H - PAD - (v / 12) * (H - PAD * 2);
      return `<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="#eee9e1" stroke-width="1"/>
              <text x="${PAD - 8}" y="${y + 4}" font-size="11" fill="#c4bcb0" text-anchor="end">${v}</text>`;
    }).join("")}
    <path d="${path}" fill="none" stroke="#d8d0c2" stroke-width="2"/>
    <path d="${path}" fill="none" stroke="${drink.accent}" stroke-width="3" stroke-linecap="round"
      stroke-dasharray="${len}" stroke-dashoffset="${off}"/>
    <circle cx="${dot.x}" cy="${dot.y}" r="5" fill="#fff" stroke="#111" stroke-width="2"/>
    <text x="${W - PAD}" y="${H - 8}" font-size="10" fill="#c4bcb0" text-anchor="end">bar</text>`;
}

function updateRealOverlay(drink, s) {
  const tag = $("#brew-tag"), step = $("#bm-step");
  if (s.state === "queued") { tag.textContent = "真机 · 待开始"; step.textContent = "已排队 · 对聊天窗口说「开始」"; }
  else if (s.state === "claimed") { tag.textContent = "真机 · 已接单"; step.textContent = "已接单 · 连接机器"; }
  else if (s.state === "preparing") { tag.textContent = "真机"; step.textContent = s.detail || "预备冲煮方案"; }
  else if (s.state === "brewing") {
    tag.textContent = "真机执行中";
    step.textContent = s.step || "冲煮中";
    if (s.temp) $("#bm-temp").textContent = Number(s.temp).toFixed(1) + "°C";
    if (s.detail) step.textContent += ` · ${s.detail}`;
  }
  if (s.elapsed != null) $("#bm-time").textContent = fmtTime(s.elapsed);
  if (s.progress != null) {
    $("#brew-bar").style.width = `${Math.round(s.progress * 100)}%`;
    $("#cup-fill").style.opacity = Math.min(0.85, s.progress * 1.1);
    renderBrewCurve(drink, s.progress);
  }
}

function pollReal(jobId) {
  clearInterval(pollTimer);
  pollTimer = setInterval(async () => {
    try {
      const r = await fetch("/api/status?id=" + jobId, { cache: "no-store" });
      const data = await r.json();
      const s = data.status || {};
      if (!realJob || realJob.id !== jobId) return clearInterval(pollTimer);
      const drink = realJob.drink;
      if (s.state === "done") {
        clearInterval(pollTimer);
        updateRealOverlay(drink, { ...s, progress: 1 });
        $("#bm-step").textContent = "完成";
        setTimeout(() => {
          $("#brew-overlay").classList.remove("open", "brewing");
          $("#btn-brew-cancel").textContent = "取消";
          showDone(drink, s.elapsed ?? drink.params.time);
          realJob = null;
        }, 900);
      } else if (s.state === "error") {
        clearInterval(pollTimer);
        $("#bm-step").textContent = "失败：" + (s.detail || s.error || "未知原因");
        $("#brew-tag").textContent = "错误";
        $("#btn-brew-cancel").textContent = "关闭";
        realJob = null;
      } else {
        updateRealOverlay(drink, s);
      }
    } catch { /* 网络抖动，下一轮再试 */ }
  }, 1500);
}

/* ============ 完成卡 & 分享 ============ */
function recipeJSON(drink) {
  return JSON.stringify({
    app: "coffeebuddy-lab", v: 1, drink: drink.name, cn: drink.cn,
    bean: beanOf(drink.bean).name, params: drink.params,
  });
}

function showDone(drink, elapsed) {
  const p = drink.params;
  $("#done-overlay").classList.add("open");
  $("#done-overlay").setAttribute("aria-hidden", "false");
  $("#done-cover").src = drink.cover;
  $("#done-name").textContent = drink.name;
  $("#done-cn").textContent = `${drink.cn} · 萃取完成 · ${p.note || "风味峰值"}`;

  const water = p.stages ? p.stages.reduce((a, s) => a + s.vol, 0) : p.coldBrew.vol;
  const rows = [
    ["BEAN 咖啡豆", beanOf(drink.bean).name],
    ["DOSE 粉量", `${p.grams} g · 刻度 ${p.grind}`],
    ["PROFILE 压力", p.stages ? p.stages.map((s) => s.p).join(" - ") + " bar" : `${p.coldBrew.vol}ml 冷萃`],
    ["TEMP 水温", `${p.temp} °C`],
    ["TIME 用时", `${elapsed.toFixed(1)} s`],
    ["DATE 日期", new Date().toLocaleDateString("zh-CN")],
  ];
  $("#done-spec").innerHTML = rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("");

  const qr = $("#done-qr");
  qr.innerHTML = "";
  try {
    if (window.QRCode) new QRCode(qr, { text: recipeJSON(drink), width: 88, height: 88, correctLevel: QRCode.CorrectLevel.M });
  } catch (e) { /* 二维码失败不阻塞完成卡 */ }

  try {
    BrewLog.add({ drink: drink.key, name: drink.name, cn: drink.cn, at: Date.now(), recipe: drink.params });
  } catch (e) { /* 隐私模式下 localStorage 不可用 */ }
  renderRecent();
}

$("#btn-done-close").addEventListener("click", () => {
  $("#done-overlay").classList.remove("open");
  $("#done-overlay").setAttribute("aria-hidden", "true");
});
$("#btn-copy-recipe").addEventListener("click", async (e) => {
  await navigator.clipboard.writeText(JSON.stringify(JSON.parse(recipeJSON(currentDrink)), null, 2));
  e.target.textContent = "已复制 ✓";
  setTimeout(() => (e.target.textContent = "复制配方 JSON"), 1500);
});
$("#btn-share").addEventListener("click", async () => {
  const text = `${currentDrink.name} 配方 —— ${specLine(currentDrink.params)}\n\n${recipeJSON(currentDrink)}`;
  if (navigator.share) {
    try { await navigator.share({ title: `${currentDrink.name} 冲煮配方`, text }); } catch {}
  } else {
    await navigator.clipboard.writeText(text);
    $("#btn-share").textContent = "已复制 ✓";
    setTimeout(() => ($("#btn-share").textContent = "分享参数"), 1500);
  }
});

/* ============ 最近冲煮 ============ */
function renderRecent() {
  const log = BrewLog.all();
  const row = $("#recent-row");
  if (!log.length) {
    row.innerHTML = `<span class="recent-empty">还没有记录 —— 点一张卡片，冲第一杯。</span>`;
    return;
  }
  row.innerHTML = log.slice(0, 6).map((e) => {
    const d = DRINKS.find((x) => x.key === e.drink);
    const t = new Date(e.at);
    return `<button class="recent-chip" data-key="${e.drink}">
      <img src="${d ? d.cover : "assets/cover_espresso.jpg"}" alt="">
      <span class="rc-name">${e.name}</span>
      <span class="rc-time">${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}</span>
    </button>`;
  }).join("");
  $$(".recent-chip").forEach((c) => c.addEventListener("click", () => {
    const d = DRINKS.find((x) => x.key === c.dataset.key);
    if (d) showDone(d, d.params.time);
  }));
}

/* ============ 豆仓 ============ */
function renderBeans() {
  $("#bean-count").textContent = BEANS.length;
  $("#bean-row").innerHTML = BEANS.map((b) => `
    <article class="bean-card">
      ${b.mock ? `<span class="mock-tag">占位</span>` : ""}
      <div class="bc-top">
        <div class="bc-name">${b.name} <span class="sym">*</span></div>
        <div class="bc-name-en">${b.nameEn}</div>
        <div class="bc-sub"><span class="sym">+</span> ${b.origin} _</div>
      </div>
      <div class="bc-spec">
        <div><div class="k">PROCESS</div><div class="v">${b.process}</div></div>
        <div><div class="k">ROAST</div><div class="v">${b.roast}</div></div>
        <div><div class="k">ALTITUDE</div><div class="v">${b.altitude}</div></div>
        <div><div class="k">VARIETY</div><div class="v">${b.variety}</div></div>
      </div>
      <div class="bc-flavors">${b.flavors.map((f) => `<span class="flavor">${f}</span>`).join("")}</div>
      <div class="bc-img">
        ${b.image
          ? `<img src="${b.image}" alt="${b.name}">`
          : `<div class="ph blend" style="background:
              radial-gradient(120% 90% at 30% 100%, ${b.gradient[0]} 0%, transparent 60%),
              radial-gradient(120% 100% at 80% 90%, ${b.gradient[1]} 0%, transparent 55%),
              linear-gradient(180deg, #ffffff 8%, ${b.gradient[2]} 130%)"></div>`}
      </div>
      <div class="bc-meta"><span>已冲煮 ${b.brewed} 次</span><span>最近 ${b.last}</span></div>
    </article>`).join("");
}

/* ============ 参数编辑器 ============ */
const lab = {
  grams: 12, grind: 4, temp: 93, nodes: [], yield: 30, source: "espresso",
};

function loadIntoLab(drink) {
  const p = drink.params;
  lab.source = drink.key;
  if (p.stages) {
    lab.grams = p.grams; lab.grind = p.grind; lab.temp = p.temp;
    lab.nodes = p.stages.map((s) => ({ p: s.p, vol: s.vol, rest: s.rest || 0 }));
    lab.yield = p.yield;
  }
}

const SLIDERS = [
  { k: "grams", label: "粉量 DOSE", min: 5, max: 14, step: 0.5, unit: " g" },
  { k: "grind", label: "研磨度 GRIND", min: 1, max: 7, step: 1, unit: "" },
  { k: "temp", label: "水温 TEMP", min: 85, max: 98, step: 1, unit: " °C" },
  { k: "yield", label: "目标出品 YIELD", min: 20, max: 60, step: 1, unit: " ml" },
];

function renderSliders() {
  $("#sliders").innerHTML = SLIDERS.map((s) => `
    <div class="slider">
      <label>${s.label}<b id="sv-${s.k}">${lab[s.k]}${s.unit}</b></label>
      <input type="range" min="${s.min}" max="${s.max}" step="${s.step}" value="${lab[s.k]}" data-k="${s.k}">
    </div>`).join("");
  $$("#sliders input").forEach((inp) => inp.addEventListener("input", () => {
    lab[inp.dataset.k] = +inp.value;
    $("#sv-" + inp.dataset.k).textContent = lab[inp.dataset.k] + SLIDERS.find((s) => s.k === inp.dataset.k).unit;
    renderLabReadout();
  }));
}

function renderNodeVols() {
  $("#node-vols").innerHTML = lab.nodes.map((n, i) => `
    <div class="node-vol">
      <span class="nv-p">P${i + 1} · ${n.p} bar</span>
      <button data-i="${i}" data-d="-5">−</button><b>${n.vol} ml</b><button data-i="${i}" data-d="5">+</button>
      ${i === 0 ? `<button class="rest-btn" data-i="${i}" title="静置秒数">${n.rest ? `静置${n.rest}s` : "+静置"}</button>` : ""}
    </div>`).join("");
  $$("#node-vols button[data-d]").forEach((b) => b.addEventListener("click", () => {
    const n = lab.nodes[+b.dataset.i];
    n.vol = Math.max(5, Math.min(200, n.vol + +b.dataset.d));
    renderNodeVols(); renderEditor(); renderLabReadout();
  }));
  $$("#node-vols .rest-btn").forEach((b) => b.addEventListener("click", () => {
    const n = lab.nodes[0];
    n.rest = n.rest >= 20 ? 0 : Math.max(5, n.rest + 5);
    renderNodeVols(); renderLabReadout();
  }));
}

const ED = { w: 640, h: 340, pad: 36 };
let draggingNode = -1;

function edX(i) { return ED.pad + (i * (ED.w - ED.pad * 2)) / Math.max(1, lab.nodes.length - 1); }
function edY(p) { return ED.h - ED.pad - (p / 12) * (ED.h - ED.pad * 2); }
function pFromY(y) { return Math.max(0, Math.min(12, ((ED.h - ED.pad - y) / (ED.h - ED.pad * 2)) * 12)); }

function renderEditor() {
  const svg = $("#editor-svg");
  const pts = lab.nodes.map((n, i) => ({ x: edX(i), y: edY(n.p) }));
  const path = smoothPath(pts);
  const area = `${path} L ${pts[pts.length - 1].x} ${ED.h - ED.pad} L ${pts[0].x} ${ED.h - ED.pad} Z`;
  svg.innerHTML = `
    ${[0, 3, 6, 9, 12].map((v) => {
      const y = edY(v);
      return `<line x1="${ED.pad}" y1="${y}" x2="${ED.w - ED.pad}" y2="${y}" stroke="#efe9e1" stroke-width="1"/>
              <text x="${ED.pad - 10}" y="${y + 4}" font-size="12" fill="#c4bcb0" text-anchor="end">${v}</text>`;
    }).join("")}
    <line x1="${ED.pad}" y1="${ED.h - ED.pad}" x2="${ED.w - ED.pad}" y2="${ED.h - ED.pad}" stroke="#d8d0c2" stroke-width="1.5"/>
    <path d="${area}" fill="rgba(176,118,63,.06)"/>
    <path d="${path}" fill="none" stroke="#111" stroke-width="2.2" stroke-linecap="round"/>
    ${lab.nodes.map((n, i) => `
      <g class="ed-node" data-i="${i}" style="cursor:grab">
        <circle cx="${edX(i)}" cy="${edY(n.p)}" r="11" fill="transparent"/>
        <circle cx="${edX(i)}" cy="${edY(n.p)}" r="7" fill="#fff" stroke="#111" stroke-width="2"/>
        <text x="${edX(i)}" y="${edY(n.p) - 16}" font-size="13" font-weight="600" fill="#111" text-anchor="middle">${n.p}</text>
        ${n.rest ? `<text x="${edX(i)}" y="${edY(n.p) + 26}" font-size="11" fill="#a0a0a0" text-anchor="middle">rest ${n.rest}s</text>` : ""}
      </g>`).join("")}
    <text x="${ED.w - ED.pad}" y="${ED.h - 10}" font-size="11" fill="#c4bcb0" text-anchor="end">bar → · 首段建议 4 bar</text>`;

  $$("#editor-svg .ed-node").forEach((g) => {
    g.addEventListener("pointerdown", (e) => {
      draggingNode = +g.dataset.i;
      g.setPointerCapture(e.pointerId);
    });
    g.addEventListener("pointermove", (e) => {
      if (draggingNode < 0) return;
      const rect = svg.getBoundingClientRect();
      const y = ((e.clientY - rect.top) / rect.height) * ED.h;
      lab.nodes[draggingNode].p = Math.round(pFromY(y) * 10) / 10;
      renderEditor(); renderNodeVols(); renderLabReadout();
    });
    g.addEventListener("pointerup", () => (draggingNode = -1));
    g.addEventListener("dblclick", () => {
      if (lab.nodes.length > 2) {
        lab.nodes.splice(+g.dataset.i, 1);
        renderEditor(); renderNodeVols(); renderLabReadout();
      }
    });
  });
}

function waterTotal() { return lab.nodes.reduce((a, n) => a + n.vol, 0); }

function renderLabReadout() {
  const expected = lab.yield + lab.grams * 2;
  const actual = waterTotal();
  const drift = actual - expected;
  $("#lab-readout").innerHTML = `
    <table class="spec">
      <tr><td>WATER 总进水量</td><td>${actual} ml</td></tr>
      <tr><td>粉水比</td><td>1 : ${(actual / lab.grams).toFixed(1)}</td></tr>
      <tr><td>理论匹配值</td><td>${expected} ml${Math.abs(drift) <= 4 ? " ✓" : `（差 ${drift > 0 ? "+" : ""}${drift}）`}</td></tr>
      <tr><td>段数</td><td>${lab.nodes.length} / 6</td></tr>
    </table>
    <div style="font-size:10.5px;color:#a0a0a0;margin-top:10px;line-height:1.7">
      机器约束：首段 4 bar 预浸并静置 ≥ 5 s；总水量 = 目标出品 + 2 ml × 粉量。
    </div>`;
}

$("#btn-add-node").addEventListener("click", () => {
  if (lab.nodes.length >= MACHINE.caps.maxStages) return;
  const last = lab.nodes[lab.nodes.length - 1];
  lab.nodes.push({ p: Math.max(1, last.p - 1), vol: 15, rest: 0 });
  renderEditor(); renderNodeVols(); renderLabReadout();
});
$("#btn-reset-curve").addEventListener("click", () => {
  loadIntoLab(DRINKS.find((d) => d.key === "espresso"));
  renderLab();
});
$("#btn-save-drink").addEventListener("click", () => {
  const n = (DRINKS.filter((d) => d.key.startsWith("custom")).length + 1);
  const src = DRINKS.find((d) => d.key === lab.source) || DRINKS[0];
  DRINKS.push({
    key: `custom-${Date.now()}`, name: `Custom ${n}`, cn: "自定义",
    cover: src.cover, accent: src.accent, bean: "qinglan",
    params: {
      grams: lab.grams, grind: lab.grind, temp: lab.temp,
      stages: lab.nodes.map((x) => ({ p: x.p, vol: x.vol, rest: x.rest || undefined })),
      yield: lab.yield, time: 25 + lab.nodes.length * 4,
    },
  });
  currentIndex = DRINKS.length - 1;
  currentDrink = DRINKS[currentIndex];
  $("#cover-img").src = currentDrink.cover;
  applyTilt();
  renderThumbs(); renderCaption(); applyFrontLayers();
  $('.nav-btn[data-view="drinks"]').click();
});

function renderLabPresets() {
  $("#lab-presets").innerHTML = DRINKS.filter((d) => d.params.stages)
    .map((d) => `<button class="preset-chip" data-k="${d.key}">${d.name}</button>`).join("");
  $$(".preset-chip").forEach((c) => c.addEventListener("click", () => {
    loadIntoLab(DRINKS.find((d) => d.key === c.dataset.k));
    renderLab();
  }));
}

function renderLab() {
  if (!lab.nodes.length) loadIntoLab(currentDrink);
  renderSliders();
  renderEditor();
  renderNodeVols();
  renderLabReadout();
  renderLabPresets();
}

/* ============ 初始化 ============ */
renderThumbs();
renderCaption();
renderRecent();
loadIntoLab(currentDrink);
applyTilt();
applyFrontLayers();

/* 调试 / 深链参数：?view=lab|beans&open=1&brew=1&done=1&i=3 */
const qp = new URLSearchParams(location.search);
if (qp.get("view")) { const b = $(`.nav-btn[data-view="${qp.get("view")}"]`); if (b) b.click(); }
if (qp.get("i") !== null && DRINKS[+qp.get("i")]) {
  currentIndex = +qp.get("i");
  currentDrink = DRINKS[currentIndex];
  $("#cover-img").src = currentDrink.cover;
  applyTilt(); renderCaption(); renderThumbs(); applyFrontLayers();
}
if (qp.get("open") === "1") setTimeout(openSpread, 400);
if (qp.get("done") === "1") setTimeout(() => showDone(currentDrink, currentDrink.params.time), 400);
