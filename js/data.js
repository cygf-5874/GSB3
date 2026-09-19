/* ================= 游戏数据 ================= */

const QUALITY = {
  white:  { name: "普通", cls: "q-white"  },
  green:  { name: "精良", cls: "q-green"  },
  blue:   { name: "稀有", cls: "q-blue"   },
  purple: { name: "史诗", cls: "q-purple" },
  gold:   { name: "传说", cls: "q-gold"   },
  orange: { name: "远古", cls: "q-orange" }
};
/* 金色（传说）及以上解锁装备技能 */

const HEROES = [
  {
    id: "nun", sprite: "hero_nun", name: "修女 · 赛琳娜", tag: "开荒首选",
    desc: "治疗 + 护盾 + 复活，生存能力拉满",
    skill: { name: "圣光复苏", icon: "sk_nun", cd: 8, cost: 30,
             text: "为自己与队友恢复 200 生命并附加护盾" },
    passive: "受到致命伤时每 60 秒自动复活一次"
  },
  {
    id: "gugu", sprite: "hero_gugu", name: "咕咕", tag: "远程特化",
    desc: "远程武器加成 + 无敌被动",
    skill: { name: "羽刃风暴", icon: "sk_gugu", cd: 7, cost: 25,
             text: "射出旋转羽刃，对路径敌人造成多段伤害" },
    passive: "每 20 秒获得 1.5 秒无敌"
  },
  {
    id: "devil", sprite: "hero_devil", name: "小恶魔", tag: "火系/控制",
    desc: "火系伤害强势，附带灼烧与眩晕",
    skill: { name: "陨星火海", icon: "sk_devil", cd: 9, cost: 35,
             text: "降下火球，灼烧并眩晕范围内敌人" },
    passive: "攻击附带灼烧，每秒造成火焰伤害"
  },
  {
    id: "necro", sprite: "hero_necro", name: "亡灵术师", tag: "召唤流",
    desc: "召唤恶魔替你承担伤害",
    skill: { name: "恶魔契约", icon: "sk_necro", cd: 12, cost: 40,
             text: "召唤一只小恶魔协同作战 20 秒" },
    passive: "恶魔存活期间自身减伤 30%"
  },
  {
    id: "eng", sprite: "hero_eng", name: "工程师", tag: "自动清怪",
    desc: "部署炮台自动攻击周围怪物",
    skill: { name: "自动炮台", icon: "sk_eng", cd: 10, cost: 30,
             text: "部署一座炮台，自动射击最近的敌人" },
    passive: "炮台每 4 次射击触发一次榴弹"
  }
];

/* 两套武器配置 —— 一键换装 */
const LOADOUTS = [
  {
    name: "套装A · 均衡流",
    weapons: [
      { icon: "w_sword",  name: "烈焰巨剑", q: "gold",   cost: 12, dmg: 46, active: "旋风斩", passive: "灼烧敌人", range: 46,  type: "melee",  cd: .55 },
      { icon: "w_bow",    name: "游侠长弓", q: "purple", cost: 8,  dmg: 30, active: "穿透箭", passive: "暴击+20%", range: 300, type: "ranged", cd: .45 },
      { icon: "w_staff",  name: "学徒法杖", q: "blue",   cost: 10, dmg: 34, active: "火球术", passive: "攻击回能", range: 260, type: "ranged", cd: .6 }
    ]
  },
  {
    name: "套装B · 爆发流",
    weapons: [
      { icon: "w_hammer", name: "碎山者战锤", q: "orange", cost: 16, dmg: 72, active: "大地震击", passive: "破甲", range: 52,  type: "melee",  cd: .8 },
      { icon: "w_dagger", name: "影牙短匕",   q: "purple", cost: 6,  dmg: 24, active: "三连刺",   passive: "攻速+40%", range: 38, type: "melee", cd: .25 },
      { icon: "w_bow",    name: "风语者之弓", q: "gold",   cost: 9,  dmg: 38, active: "箭雨",     passive: "金色·追踪箭（装备技能）", range: 320, type: "ranged", cd: .4 }
    ]
  }
];

const PETS = [
  { sprite: "pet_blue",   name: "水灵灵", q: "blue",   text: "协助攻击，偶尔治疗主人" },
  { sprite: "pet_purple", name: "幽影蝠", q: "purple", text: "攻击降低敌人防御" },
  { sprite: "pet_orange", name: "炎龙崽", q: "orange", text: "喷吐火焰，范围灼烧" }
];

/* 背包内容 */
const BAG_ITEMS = [
  { icon:"w_hammer", name:"碎山者战锤", q:"orange", slot:"武器", cnt:1, skill:"远古品质 · 解锁装备技能：大地震击：震碎前方护甲" },
  { icon:"it_helmet", name:"龙鳞战盔", q:"gold", slot:"头部", cnt:1, skill:"金色品质 · 解锁装备技能：受到攻击时反弹伤害" },
  { icon:"it_armor", name:"圣光铠甲", q:"purple", slot:"胸甲", cnt:1, skill:"防御 +42" },
  { icon:"it_ring", name:"能量之戒", q:"blue", slot:"饰品", cnt:1, skill:"体能恢复速度 +15%" },
  { icon:"it_gem", name:"深海宝石", q:"purple", slot:"材料", cnt:7, skill:"团队副本强化材料" },
  { icon:"it_scroll", name:"技能卷轴", q:"green", slot:"消耗品", cnt:3, skill:"重置技能冷却" },
  { icon:"it_key", name:"宝箱钥匙", q:"white", slot:"消耗品", cnt:12, skill:"开启野外宝箱" },
  { icon:"it_potion", name:"大型治疗药水", q:"green", slot:"消耗品", cnt:24, skill:"恢复 300 生命值" },
  { icon:"it_coin", name:"金币袋", q:"white", slot:"材料", cnt:6, skill:"打开可获得 500 金币" }
];

const EQUIPPED = [
  { icon:"it_helmet", label:"头盔" },
  { icon:"it_armor",  label:"胸甲" },
  { icon:"it_ring",   label:"饰品" }
];

/* 副本 / PVE 入口 */
const DUNGEONS = [
  { key:"dungeon", emoji:"🏰", name:"普通副本 · 幽暗矿洞", desc:"专属 Boss 矿洞巨魔，掉落史诗武器与防具。Boss 可无限刷，开宝箱消耗副本券（今日剩 10 张）。",
    go:"进入副本" },
  { key:"sandbox", emoji:"🗺️", name:"沙盒副本 · 风车草原", desc:"即当前野外地图。世界 Boss 按 石头人 → 沙虫 → 牛头人 → 独眼巨人 顺序刷新，更有深海入侵等世界事件。",
    go:"传送到草原" },
  { key:"tower", emoji:"🗼", name:"无尽爬塔", desc:"共 80 层，每层怪物递增，每 10 层一个守层 Boss 与稀有奖励。当前进度：第 47 层。",
    go:"继续爬塔（47层）" },
  { key:"team", emoji:"👥", name:"团队副本 · 深海入侵", desc:"3-5 人组队挑战潮汐守卫，限时世界事件，掉落远古品质装备。",
    go:"快速匹配" },
  { key:"trial", emoji:"⚔️", name:"荣誉试炼", desc:"公平属性 1v1 / 3v3 对战，胜负不消耗资源，产出荣誉币兑换限定外观。",
    go:"开始匹配" }
];

/* 世界 Boss 序列 */
const WORLD_BOSSES = ["石头人", "沙虫", "牛头人", "独眼巨人"];

