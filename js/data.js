/* CoffeeBuddy Lab · 数据层
   真实数据来自 coffeebuddy MCP（get_device_context），其余为 mock */

const MACHINE = {
  id: "C49E7E0C22D8",
  name: "光明 17 楼办公室",
  online: true,
  boiler: { current: 36, target: 88 },
  caps: {
    pressure: [1, 12],
    temp: [85, 98],
    grams: [5, 14],
    grind: [1, 7],
    maxStages: 6,
    milkMax: 300,
  },
};

const BEANS = [
  {
    id: "qinglan",
    name: "青岚",
    nameEn: "QINGLAN",
    origin: "埃塞俄比亚",
    process: "水洗 + 日晒",
    roast: "中烘焙",
    altitude: "1,900–2,200 m",
    variety: "原生种 Heirloom",
    flavors: ["蜜桃", "红茶", "洋甘菊"],
    image: "assets/bean_qinglan_hi.jpg",
    brewed: 3,
    last: "2026-11-24",
    mock: false,
  },
  {
    id: "yehang",
    name: "夜航",
    nameEn: "NIGHT CRUISE",
    origin: "巴西 · 米纳斯吉拉斯",
    process: "日晒",
    roast: "深烘焙",
    altitude: "900–1,200 m",
    variety: "黄波旁",
    flavors: ["黑巧克力", "烤坚果", "烟熏"],
    image: null,
    gradient: ["#3c2a1e", "#7a5638", "#b98a5e"],
    brewed: 0,
    last: "—",
    mock: true,
  },
  {
    id: "wushan",
    name: "雾山",
    nameEn: "MIST RIDGE",
    origin: "哥伦比亚 · 慧兰",
    process: "水洗",
    roast: "浅烘焙",
    altitude: "1,700–1,950 m",
    variety: "卡杜拉",
    flavors: ["柑橘", "佛手柑", "茉莉"],
    image: null,
    gradient: ["#9fae8e", "#cfd6bd", "#efe9da"],
    brewed: 0,
    last: "—",
    mock: true,
  },
];

/* 配方基线来自机器 baseline recipe（espresso 12g/刻度4/三段 4-9-5 bar） */
const DRINKS = [
  {
    key: "espresso", name: "Espresso", cn: "浓缩",
    cover: "assets/cover_espresso.jpg", accent: "#b0763f", bean: "qinglan",
    blockImg: "assets/layer/block_espresso.jpg",
    layer: { cup: "assets/layer/cup_espresso.png", scatter: "assets/layer/scatter_espresso.png" },
    params: {
      grams: 12, grind: 4, temp: 93,
      stages: [
        { p: 4, vol: 8, rest: 8 },
        { p: 9, vol: 25 },
        { p: 5, vol: 24 },
      ],
      yield: 30, time: 25, note: "蜜桃与红茶尾韵",
    },
  },
  {
    key: "americano", name: "Americano", cn: "美式",
    cover: "assets/cover_americano.jpg", accent: "#a9814e", bean: "qinglan",
    blockImg: "assets/layer/block_americano.jpg",
    layer: { cup: "assets/layer/cup_americano.png", scatter: "assets/layer/scatter_americano.png", block: { left: 2, right: 2, top: 47, bottom: 3.5 } },
    params: {
      grams: 12, grind: 4, temp: 93,
      stages: [
        { p: 4, vol: 8, rest: 8 },
        { p: 9, vol: 25 },
        { p: 5, vol: 24 },
      ],
      water: { vol: 150, temp: 88 },
      yield: 30, time: 32,
    },
  },
  {
    key: "lungo", name: "Lungo", cn: "长萃",
    cover: "assets/cover_lungo.jpg", accent: "#c08a3e", bean: "qinglan",
    blockImg: "assets/layer/block_lungo.jpg",
    layer: { cup: "assets/layer/cup_lungo.png", scatter: "assets/layer/scatter_lungo.png", block: { left: 5.5, right: 5.5, top: 49, bottom: 3.5 } },
    params: {
      grams: 12, grind: 5, temp: 92,
      stages: [
        { p: 3, vol: 10, rest: 6 },
        { p: 7, vol: 45 },
        { p: 4, vol: 25 },
      ],
      yield: 56, time: 38,
    },
  },
  {
    key: "latte", name: "Latte", cn: "拿铁",
    cover: "assets/cover_latte.jpg", accent: "#c9a68a", bean: "qinglan",
    blockImg: "assets/layer/block_latte.jpg",
    layer: { cup: "assets/layer/cup_latte.png", scatter: "assets/layer/scatter_latte.png", block: { left: 2.5, right: 2.5, top: 40, bottom: 3.5 } },
    params: {
      grams: 12, grind: 4, temp: 93,
      stages: [
        { p: 4, vol: 8, rest: 8 },
        { p: 9, vol: 25 },
        { p: 5, vol: 24 },
      ],
      milk: { vol: 180, density: 2 },
      yield: 30, time: 30,
    },
  },
  {
    key: "cappuccino", name: "Cappuccino", cn: "卡布奇诺",
    cover: "assets/cover_cappuccino.jpg", accent: "#8a5a3b", bean: "qinglan",
    blockImg: "assets/layer/block_cappuccino.jpg",
    layer: { cup: "assets/layer/cup_cappuccino.png", scatter: "assets/layer/scatter_cappuccino.png", block: { left: 2, right: 2, top: 49.5, bottom: 4 } },
    params: {
      grams: 12, grind: 4, temp: 93,
      stages: [
        { p: 4, vol: 8, rest: 8 },
        { p: 9, vol: 25 },
        { p: 5, vol: 24 },
      ],
      milk: { vol: 120, density: 4 },
      yield: 30, time: 30,
    },
  },
  {
    key: "macchiato", name: "Macchiato", cn: "玛奇朵",
    cover: "assets/cover_macchiato.jpg", accent: "#9c6b45", bean: "qinglan",
    blockImg: "assets/layer/block_macchiato.jpg",
    layer: { cup: "assets/layer/cup_macchiato.png", scatter: "assets/layer/scatter_macchiato.png", block: { left: 4.5, right: 4.5, top: 37, bottom: 9.5 }, labelBottom: 13.5 },
    params: {
      grams: 12, grind: 4, temp: 93,
      stages: [
        { p: 4, vol: 8, rest: 8 },
        { p: 9, vol: 25 },
        { p: 5, vol: 24 },
      ],
      milk: { vol: 30, density: 3 },
      yield: 30, time: 27,
    },
  },
  {
    key: "coldbrew", name: "Cold Brew", cn: "冷萃",
    cover: "assets/cover_coldbrew.jpg", accent: "#5e7482", bean: "qinglan",
    blockImg: "assets/layer/block_coldbrew.jpg",
    layer: { cup: "assets/layer/cup_coldbrew.png", scatter: "assets/layer/scatter_coldbrew.png", block: { left: 4, right: 4, top: 52, bottom: 4.5 } },
    params: {
      grams: 12, grind: 6, temp: 20,
      coldBrew: { vol: 200, minutes: 8 },
      yield: 180, time: 480,
    },
  },
];

const beanOf = (id) => BEANS.find((b) => b.id === id);

/* 浅色色块上的标签用深字，保证对比度 */
const LABEL_DARK = { latte: "#4a3527" };

/* 每张卡的随手贴角度 —— 像被人手贴在冰箱上的磁铁 */
const TILT = {
  espresso: -1.7, americano: 1.3, lungo: -0.9, latte: 1.8,
  cappuccino: -1.2, macchiato: 0.8, coldbrew: -2.0,
};

/* 冲煮记录（localStorage 持久化） */
const BrewLog = {
  KEY: "coffeelab_brewlog_v1",
  all() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || []; }
    catch { return []; }
  },
  add(entry) {
    const list = this.all();
    list.unshift(entry);
    localStorage.setItem(this.KEY, JSON.stringify(list.slice(0, 20)));
  },
};
