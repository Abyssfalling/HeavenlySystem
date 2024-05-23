// ==UserScript==
// @name         天理管理系统
// @author       临咕
// @version      1.0.0
// @description  支持多人参与的水岩同人游戏
// @license      MIT
// ==/UserScript==

// 游戏规则描述
const ruleText = `
系统指令：
    .createworld        创建世界
    .showrole           查看角色分配
    .distroyallroles    重置所有角色
    .distroyworld       摧毁世界

    .startgame          开始游戏

    .startday           开始这一天
    .endday             结算这一天


玩家指令：
    .createrole X   创建角色，X为自选的神之眼属性
    .distroyrole    删除角色
    
    .showmap    查询大地图
    .showmyrole 查询自身属性
    .showbag    查看背包

    .explore    探索当前区域
    .useheal X  使用背包中存在的恢复类道具，X为道具名称

`;

let ext = seal.ext.find('gameWorld');
if (!ext) {
  ext = seal.ext.new('gameWorld', '用户', '1.0.0');
  seal.ext.register(ext);
}

// 定义有效的神之眼属性
var validElements = ['无', '风', '岩', '雷', '草', '水', '火', '冰'];


function initGameComponents() {
    // 初始化背包数据结构
    initBagData();

    // 初始化待处理事件组
    pendingDecisions = {};

    roleCardsCopy = [...roleCards];  // 确保在游戏初始化时重置角色卡副本
    ext.storageSet('roleCardsCopy', JSON.stringify(roleCardsCopy));
  }


var roleCards = [
      { role_id: 1, role_name: '战车', role_HP_Max: 50, role_SP_Max: 40, role_attack: 7, role_skill_active: 1, role_skill_cost: 10, role_round_Max: 5 },
      { role_id: 2, role_name: '女祭司', role_HP_Max: 50, role_SP_Max: 60, role_attack: 5, role_skill_active: 1, role_skill_cost: 0, role_round_Max: 5 },
      { role_id: 3, role_name: '高塔', role_HP_Max: 80, role_SP_Max: 0, role_attack: 9, role_skill_active: 0, role_skill_cost: 0, role_round_Max: 5 },
      { role_id: 4, role_name: '命运之轮', role_HP_Max: 50, role_SP_Max: 70, role_attack: 6, role_skill_active: 1, role_skill_cost: 0, role_round_Max: 5 },
      { role_id: 5, role_name: '女皇', role_HP_Max: 60, role_SP_Max: 70, role_attack: 6, role_skill_active: 1, role_skill_cost: 10, role_round_Max: 5 },
      { role_id: 6, role_name: '倒吊人', role_HP_Max: 60, role_SP_Max: 40, role_attack: 7, role_skill_active: 0, role_skill_cost: 0, role_round_Max: 5 },
      { role_id: 7, role_name: '教皇', role_HP_Max: 45, role_SP_Max: 60, role_attack: 3, role_skill_active: 1, role_skill_cost: 30, role_round_Max: 5 },
      { role_id: 8, role_name: '死神', role_HP_Max: 60, role_SP_Max: 60, role_attack: 6, role_skill_active: 1, role_skill_cost: 15, role_round_Max: 5 },
      { role_id: 9, role_name: '愚者', role_HP_Max: 70, role_SP_Max: 60, role_attack: 7, role_skill_active: 1, role_skill_cost: 0, role_round_Max: 5 }
  ]   


let roleCardsCopy = [...roleCards];  // 创建角色卡的副本


var mapData = [
    {
      map_id: 1,
      map_name: "须弥沼泽",
      map_discri_normal: "一片宽广到望不到尽头的沼泽，这里看似平静，有着各种各样的生物来往，但小路狭窄，行走不便。",
      map_discri_forbid: "上涌的混浊水位、交错的危险植物，都似乎十分的不妙，这里的危险隔绝了来自未曾受到旧日神明所注视之人的探索。",
      map_discri_eye: "草,冰",
      map_heart: "草"
    },
    {
      map_id: 2,
      map_name: "至冬宫",
      map_discri_normal: "屹立于风雪的宫殿，风霜不灭、无神垂怜，反叛天理的旗帜曾在此处高举，而今只剩下冻结冰封的血。",
      map_discri_forbid: "极寒之冰将整座宫殿封成了冰棺，却与女皇的恩赐仁慈再也无关，尖利冰凌直指每一位擅闯者，隔绝了来自未曾受到旧日神明所注视之人的探索。",
      map_discri_eye: "火,冰",
      map_heart: "冰"
    },
    {
      map_id: 3,
      map_name: "冰原",
      map_discri_normal: "至冬国广袤无垠的冰原，曾经有过深渊裂口的痕迹波动，如今野兽足迹遍布，不多时就会被风雪抹除，仿佛从未来过。",
      map_discri_forbid: "雪虐风饕，深渊张开裂口重现世间，被污染的狼横行其上，隔绝了来自未曾受到旧日神明所注视之人的探索。",
      map_discri_eye: "火,冰",
      map_heart: "冰"
    },
    {
      map_id: 4,
      map_name: "金苹果群岛",
      map_discri_normal: "安宁静谧的海边群岛，似乎高山都是蒙德曾经的山峰，被吹到此处落下了，这里虽然人迹罕至，但环境优美、气氛祥和。",
      map_discri_forbid: "来自世界外的力量封锁了这里，似乎出自一位女士之手，海水静谧、植物低垂，隔绝了来自未曾受到旧日神明所注视之人的探索。",
      map_discri_eye: "水,草",
      map_heart: "风"
    },
    {
      map_id: 5,
      map_name: "水天丛林",
      map_discri_normal: "一天里有三分之二的时间在降水的雨林，潮湿、闷热，几乎没有什么人工的痕迹。可以远眺到一棵巨树，那似乎是曾经的人文象征。",
      map_discri_forbid: "昏黑的天色和活跃起来的危险植物密布于此，即使是老练的冒险家也难以全身而退，它们组成了一道道防线，隔绝了来自未曾受到旧日神明所注视之人的探索。",
      map_discri_eye: "草,雷",
      map_heart: "草"
    },
    {
      map_id: 6,
      map_name: "欧庇克莱",
      map_discri_normal: "曾经上演数百年戏剧的歌剧院谢幕已久，唯有历史见证一切。",
      map_discri_forbid: "银白长钉代替铡刀砸下歌剧院，砖石倾颓、古海漫卷，隔绝了来自未曾受到旧日神明所注视之人的探索。",
      map_discri_eye: "水,岩",
      map_heart: "水"
    },
    {
      map_id: 7,
      map_name: "风神像",
      map_discri_normal: "巨型的神像还伫立在此处向远方眺望，但曾经漂亮的广场早已没有人来往，荒芜遍地、杂草丛生。",
      map_discri_forbid: "巨石滚落，神像坍塌，猛烈的暴风雪几乎埋葬了这里的一切，隔绝了来自未曾受到旧日神明所注视之人的探索。",
      map_discri_eye: "风,火,冰",
      map_heart: "风"
    },
    {
      map_id: 8,
      map_name: "千风神殿",
      map_discri_normal: "石柱歪斜、广场破碎。曾经的神殿已经不复昔日的荣光，在时间的长河里长出厚厚的青苔。这里荒废已久。",
      map_discri_forbid: "遗留的神殿残骸被怒号悲鸣的狂风包裹，隔绝了来自未曾受到旧日神明所注视之人的探索。",
      map_discri_eye: "风",
      map_heart: "风"
    },
    {
      map_id: 9,
      map_name: "沙漠戈壁",
      map_discri_normal: "一望无垠的沙漠戈壁，嶙峋的风化石伫立于此，沙丘连绵起伏，一派荒凉又震撼的景象。",
      map_discri_forbid: "近乎没有停歇的烈日直射，高温、滚烫的沙子、缺少水源和方向标都会成为致命的因素，它们隔绝了来自未曾受到旧日神明所注视之人的探索。",
      map_discri_eye: "水,冰",
      map_heart: "火"
    },
    {
      map_id: 10,
      map_name: "枫丹廷",
      map_discri_normal: "水之国土的交通枢纽汇集之地，一切神与人留存的痕迹都在停止运作后逐渐消失，如今只剩下断裂的石柱。",
      map_discri_forbid: "漫涨的胎海之水吞没一切，将一切戏剧埋藏水底，隔绝了来自未曾受到旧日神明所注视之人的探索。",
      map_discri_eye: "水",
      map_heart: "水"
    },
    {
      map_id: 11,
      map_name: "璃月港",
      map_discri_normal: "曾经繁荣的海港已经人去楼空。所有的房屋和设施都静默地伫立在这里，因时间的流逝变得陈旧、破败，依稀能窥见曾经的模样。",
      map_discri_forbid: "海水倒灌、水位突涨，原本就脆弱的建筑在海水的冲刷下颓唐地四分五裂，汹涌的湍流和漩涡隔绝了来自未曾受到旧日神明所注视之人的探索。",
      map_discri_eye: "水,岩",
      map_heart: "岩"
    },
    {
      map_id: 12,
      map_name: "孤云阁",
      map_discri_normal: "传闻由岩枪化成的山体沉默地伫立在海面，它的一切似乎都没有变化，但却是再也无人踏足之处。",
      map_discri_forbid: "山体开裂，巨大的岩枪抵抗奔涌的潮汐，重新展露出峥嵘的模样，震荡的共鸣逸散，隔绝了来自未曾受到旧日神明所注视之人的探索。",
      map_discri_eye: "岩",
      map_heart: "岩"
    },
    {
      map_id: 13,
      map_name: "烬寂海",
      map_discri_normal: "一座沉寂已久的火山。这里是令曾经的冒险家闻风丧胆的无风之地，厚厚的灰烬堆积在四周，足以掩盖一切。",
      map_discri_forbid: "沉寂的火山似乎在宣泄它不知向着谁的怒火，黑烟滚滚、岩浆奔流，滚烫的温度和熔岩隔绝了来自未曾受到旧日神明所注视之人的探索。",
      map_discri_eye: "风",
      map_heart: "火"
    },
    {
      map_id: 14,
      map_name: "层岩巨渊",
      map_discri_normal: "传闻由天星砸落造成的巨渊，有人工开采的痕迹。只是如今木制的一切框架都在时间的流逝下腐朽了，似乎踩上去就会坠入深渊。",
      map_discri_forbid: "不知从哪里疯狂涌出的黑泥淹没了这里，过往的一切岩石都被埋藏黑泥的掩盖之下，隔绝了来自未曾受到旧日神明所注视之人的探索。",
      map_discri_eye: "岩,风",
      map_heart: "岩"
    },
    {
      map_id: 15,
      map_name: "无想狭刃间",
      map_discri_normal: "一条狭长壮阔的裂谷笔直切断岛屿，雷神斩落巨蛇魔神之时造就的奇观，因雷神武艺极致「无想的一刀」命名。",
      map_discri_forbid: "失去了那一刀的镇压，崇神之乱再起，蔓延的雷祸如巨蛇盘踞整条裂谷，隔绝了来自未曾受到旧日神明所注视之人的探索。",
      map_discri_eye: "雷",
      map_heart: "雷"
    },
    {
      map_id: 16,
      map_name: "鸣神大社",
      map_discri_normal: "被巨大的神樱树所笼罩的神社，灰尘弥漫，曾供奉的御建鸣神主尊大御所大人的神龛也快认不出外貌。",
      map_discri_forbid: "神樱曾常开不败，而今却不再永恒，枯死的巨树枝条垂落，魔神遗骸使得此处十方雷鸣不得安歇，隔绝了来自未曾受到旧日神明所注视之人的探索。",
      map_discri_eye: "雷",
      map_heart: "雷"
    }
  ];

/**
 * 功能函数：通过mapId获取map信息
 * @param {number} mapId 地图ID
 * @returns {Object|null} 返回map对象，如果未找到则返回null
 */
function getMapById(mapId) {
  return mapData.find(map => map.map_id === mapId) || null;
}

/**
 * 功能函数：检查玩家的神之眼属性是否在地图的特定描述中
 * @param {string} playerColor 玩家的神之眼属性
 * @param {string} mapDiscriEye 地图的特定描述
 * @returns {boolean} 如果属性存在于描述中则返回true，否则返回false
 */
function isColorInMapDescription(playerColor, mapDiscriEye) {
  const colors = mapDiscriEye.split(',');
  return colors.includes(playerColor.trim());
}


var itemData = [
    {
        "item_id": 1,
        "item_name": "一枚暗淡的草神瞳",
        "item_discribe": "虽然它似乎马上就要风化消失了，但还能在无尽的沼泽里庇护你找到生路吧。"
    },
    {
        "item_id": 2,
        "item_name": "一枚执行官的徽记",
        "item_discribe": "标识着执行官身份的徽记，具体属于的是哪一位却无法辨识，十一位执行官总数不变，更迭者却不计其数，但只要持有它，就是为女皇效忠的证明。"
    },
    {
        "item_id": 3,
        "item_name": "一枚折断的狼牙",
        "item_discribe": "散发着不详的深渊气息的狼牙，也许是另一个世界的入侵者，断口平整光滑，足以证明折断它的刀刃更胜一筹，也许能起到威慑作用。"
    },
    {
        "item_id": 4,
        "item_name": "一枚半损坏的嘟嘟可",
        "item_discribe": "火芯已经拔除，它不会再爆炸了。触碰它时会有一阵小女孩的笑声模糊传来，它能带你前往和平的世外之地。"
    },
    {
        "item_id": 5,
        "item_name": "一朵奇异的彩色蘑菇",
        "item_discribe": "不能吃，可能具有毒素，有一定躺板板的概率。携带它可以让你从容地行走在危险的雨林里。"
    },
    {
        "item_id": 6,
        "item_name": "一枚源水之滴",
        "item_discribe": "已然暗淡的某种至纯元素凝结物，所谓天之大权的纷争在此刻失去意义，但它依旧不溶于原始胎海之中。"
    },
    {
        "item_id": 7,
        "item_name": "地脉的新芽",
        "item_discribe": "通体银白的奇异枝芽，它能短暂修补被切断的地脉，让咆哮的暴风雪为之暂停一段时间。"
    },
    {
        "item_id": 8,
        "item_name": "布满灰尘的捕风瓶",
        "item_discribe": "看上去似乎就要彻底损坏了，但还能再一次送你越过狂风的封锁，前往曾经千风汇聚之处。"
    },
    {
        "item_id": 9,
        "item_name": "一张地图",
        "item_discribe": "标示着起伏的沙丘之间的绿洲所在，可以指引陷入无尽迷途的人逃出沙漠。"
    },
    {
        "item_id": 10,
        "item_name": "一枚源水之滴",
        "item_discribe": "已然暗淡的某种至纯元素凝结物，所谓天之大权的纷争在此刻失去意义，但它依旧不溶于原始胎海之中。"
    },
    {
        "item_id": 11,
        "item_name": "一本名为《……尘游记》的书",
        "item_discribe": "曾经装帧精美，但具体内容似乎因为被水淹过而不可深究了，但翻开扉页，它可以带你回到它所记录的故去繁荣之地。"
    },
    {
        "item_id": 12,
        "item_name": "一块岩枪碎片",
        "item_discribe": "由相当纯粹的岩元素力构造而成，不知为什么破碎却没有消失。是谁构造出它的？它似乎能引开周身的共鸣。"
    },
    {
        "item_id": 13,
        "item_name": "一根天空之琴的弦",
        "item_discribe": "弹奏它的诗人已然远去，而无论有风的存在与否，高天之歌依旧能为任何子民奏响。"
    },
    {
        "item_id": 14,
        "item_name": "一块流明晶石",
        "item_discribe": "足够耀眼的蓝色晶石，它可以驱逐黑暗、净化腥臭的黑色不明物质。"
    },
    {
        "item_id": 15,
        "item_name": "将军的断刀碎片之一",
        "item_discribe": "昔日影武者武艺极致的证明，曾经劈山断海、斩灭一切，而今碎为千片散落，也许能为你再一次斩开封锁之地。"
    },
    {
        "item_id": 16,
        "item_name": "一片枯朽的花瓣",
        "item_discribe": "也许它曾庇佑一方，可漫长时间后，零星的粉色也快要褪尽，在它破碎之前，或许能将你带回它落下之地。"
    },
    {
        "item_id": 101,
        "item_name": "日落果",
        "item_discribe": "使用后 +4HP",
    },
    {
      "item_id": 102,
      "item_name": "树莓",
      "item_discribe": "使用后 +3HP",
    },
    {
      "item_id": 103,
      "item_name": "薄荷",
      "item_discribe": "使用后 +5SP",
    },
    {
      "item_id": 104,
      "item_name": "应急伤药",
      "item_discribe": "使用后 +5HP， 解除所有负面状态",
    }

];
  
/**
 * 功能函数：通过itemId获取item信息
 * @param {number} itemId 道具ID
 * @returns {Object|null} 返回道具对象，如果未找到则返回null
 */
function getItemById(itemId) {
  return itemData.find(item => item.item_id === itemId) || null;
}


var weaponData = [
    {
        "weapon_id": 1,
        "weapon_name": "无",
        "weapon_attack": 0,
        "weapon_hit": 98,
        "weapon_broken": 100
    },
    {
        "weapon_id": 2,
        "weapon_name": "反曲弓",
        "weapon_attack": 4,
        "weapon_hit": 82,
        "weapon_broken": 98
    },
    {
        "weapon_id": 3,
        "weapon_name": "以理服人",
        "weapon_attack": 5,
        "weapon_hit": 80,
        "weapon_broken": 95
    },
    {
        "weapon_id": 4,
        "weapon_name": "黎明神剑",
        "weapon_attack": 4,
        "weapon_hit": 85,
        "weapon_broken": 97
    },
    {
        "weapon_id": 5,
        "weapon_name": "黑缨枪",
        "weapon_attack": 4,
        "weapon_hit": 90,
        "weapon_broken": 96
    },
    {
        "weapon_id": 6,
        "weapon_name": "讨龙",
        "weapon_attack": 3,
        "weapon_hit": 95,
        "weapon_broken": 99
    },
    {
        "weapon_id": 7,
        "weapon_name": "弓藏",
        "weapon_attack": 5,
        "weapon_hit": 88,
        "weapon_broken": 96
    },
    {
        "weapon_id": 8,
        "weapon_name": "螭骨",
        "weapon_attack": 6,
        "weapon_hit": 93,
        "weapon_broken": 95
    },
    {
        "weapon_id": 9,
        "weapon_name": "试作斩岩",
        "weapon_attack": 5,
        "weapon_hit": 97,
        "weapon_broken": 97
    },
    {
        "weapon_id": 10,
        "weapon_name": "千岩长枪",
        "weapon_attack": 5,
        "weapon_hit": 92,
        "weapon_broken": 97
    },
    {
        "weapon_id": 11,
        "weapon_name": "昭心",
        "weapon_attack": 4,
        "weapon_hit": 96,
        "weapon_broken": 98
    },
    {
        "weapon_id": 12,
        "weapon_name": "天空之刃",
        "weapon_attack": 6,
        "weapon_hit": 95,
        "weapon_broken": 99
    },
    {
        "weapon_id": 13,
        "weapon_name": "破碎的极星",
        "weapon_attack": 7,
        "weapon_hit": 95,
        "weapon_broken": 100
    }
];

/**
 * 根据 weaponId 获取 weapon
 * @param {number} weaponId 武器id
 * @returns {Object} weapon 武器，如果未找到则返回null
 */
function getWeaponById(weaponId) {
  const weapon = weaponData.find(w => w.weapon_id === weaponId);
  return weapon ? weapon : null;
}


let pendingDecisions = {};


// 在初始化脚本时加载 pendingDecisions
function loadPendingDecisions(ctx) {
    const groupId = ctx.group.groupId;
    const pendingDecisionsRaw = ext.storageGet(`pendingDecisions_${groupId}`);
    pendingDecisions = pendingDecisionsRaw ? JSON.parse(pendingDecisionsRaw) : {};
}


// 功能函数：保存待处理决定
function savePendingDecisions(ctx) {
    const groupId = ctx.group.groupId;
    ext.storageSet(`pendingDecisions_${groupId}`, JSON.stringify(pendingDecisions));
}


// 功能函数：增加待处理决定
function addPendingDecision(ctx, playerId, decision) {
  loadPendingDecisions(ctx); // 加载当前的 pendingDecisions

  // 检查当前玩家是否已有待定状态
  if (pendingDecisions[playerId]) {
      // 如果已有待定状态，删除旧的待定状态
      delete pendingDecisions[playerId];
  }

  // 添加新的待定状态
  pendingDecisions[playerId] = decision;

  // 保存更新后的待定状态
  savePendingDecisions(ctx);
}


/**
 * 功能函数：检查当前玩家是否有待处理事件
 * @param {Object} ctx 上下文对象，包含调用环境和用户信息
 * @return {boolean} 如果有待处理事件，返回 true；否则返回 false
 */
function hasPendingDecision(ctx) {
  const playerId = ctx.player.userId;
  loadPendingDecisions(ctx); // 加载当前的 pendingDecisions
  return !!pendingDecisions[playerId];
}


/**
 * 功能函数：初始化背包
 */
function initBagData() {
  const bag = [];
  ext.storageSet('bagData', JSON.stringify(bag));
}


/**
 * 功能函数：更新并保存玩家数据
 * @param {Object} ctx 上下文对象，包含调用环境和用户信息
 * @param {Object} playerData 玩家的数据对象
 * @returns {boolean} 返回是否成功保存
 */
function updateAndSavePlayerData(ctx, playerData) {
  // 获取群组ID
  const groupId = ctx.group.groupId;
  // 尝试获取 playersData
  const playersDataRaw = ext.storageGet(`playersData_${groupId}`);
  if (!playersDataRaw) {
      console.error("Failed to retrieve playersData from storage.");
      return false;
  }

  let playersData = JSON.parse(playersDataRaw);
  // 更新指定玩家的数据
  playersData[`player${playerData.player_id}`] = playerData;
  // 存储更新后的玩家数据
  ext.storageSet(`playersData_${groupId}`, JSON.stringify(playersData));
  return true;
}


/**
 * 功能函数：更新并保存玩家背包数据
 * @param {Object} ctx 上下文对象，包含调用环境和用户信息
 * @param {number} playerId 玩家的ID
 * @param {number} itemId 道具ID
 * @param {number} itemCount 道具数量变化量，可以为负数
 */
function updateAndSaveBagData(ctx, playerId, itemId, itemCount) {
  const bagDataRaw = ext.storageGet('bagData');
  let bagData = bagDataRaw ? JSON.parse(bagDataRaw) : [];
  const itemEntry = bagData.find(entry => entry.bag_vs_player === playerId && entry.bag_vs_item === itemId);

  if (itemEntry) {
      itemEntry.bag_item_num += itemCount;
      if (itemEntry.bag_item_num <= 0) {
          // 删除道具
          bagData = bagData.filter(entry => !(entry.bag_vs_player === playerId && entry.bag_vs_item === itemId));
      }
  } 
  else {
      if (itemCount > 0) {
          const item = itemData.find(item => item.item_id === itemId);
          if (item) {
              bagData.push({
                  bag_vs_player: playerId,
                  bag_vs_item: itemId,
                  item_name: item.item_name,
                  item_discribe: item.item_discribe,
                  bag_item_num: itemCount
              });
          } 
          else {
              console.error(`Item with ID ${itemId} not found in itemData.`);
              return;
          }
      }
  }

  ext.storageSet('bagData', JSON.stringify(bagData));
}

/**
 * 添加道具到背包
 * @param {Object} ctx 上下文对象
 * @param {number} playerId 玩家ID
 * @param {number} itemId 道具ID
 */
function addItemToBag(ctx, playerId, itemId) {
  updateAndSaveBagData(ctx, playerId, itemId, 1);
}

/**
 * 移除道具从背包
 * @param {Object} ctx 上下文对象
 * @param {number} playerId 玩家ID
 * @param {number} itemId 道具ID
 */
function removeItemFromBag(ctx, playerId, itemId) {
  updateAndSaveBagData(ctx, playerId, itemId, -1);
}


  
/**
   * 功能函数：处死玩家
   * @param {Object} player 玩家对象
   */
function killPlayer(player) {
  // distroyrole
  // player.player_living = 0;
  // player.player_color = 0;
  // player.player_HP = 0;
  // player.player_SP = 0;
  // player.player_round = 0;
  // player.player_weapon_id = 0;
  // player.player_map_id = 0;
  // player.player_fight_skip = 0;
  // player.player_fight_drainLife = 0;
  // player.player_fight_strengthen = 0;
  // player.player_fight_weaken = 0;
  // player.player_fight_rebound = 0;
  // player.player_fight_hunt = 0;
  // player.player_fight_creativeHP = 0;
  seal.replyToSender(ctx, msg, `玩家HP归零，死亡`);

  //死神技能检查？
}


/**
 * 功能函数：更新玩家HP
 * @param {Object} ctx 上下文对象，包含调用环境和用户信息
 * @param {Object} msg 信息对象
 * @param {Object} playerData 玩家的数据对象
 * @param {number} amount 要改变的HP量，可以是正数或负数
 */
function updatePlayerHP(ctx, msg, playerData, amount) {
  playerData.player_HP += amount;

  // 打印处理后的HP
  console.log(`Updated HP for player ${playerData.player_id}: ${playerData.player_HP}`);

  // 确保HP不超过最大值也不低于0
  if (playerData.player_HP > playerData.role_HP_Max) {
      playerData.player_HP = playerData.role_HP_Max;
  } else if (playerData.player_HP < 0) {
      playerData.player_HP = 0;
      killPlayer(ctx, msg, playerData);
  }

  updateAndSavePlayerData(ctx, playerData);

  return true;  // 返回 true 表示成功
}


/**
 * 功能函数：更新玩家SP
 * @param {Object} ctx 上下文对象，包含调用环境和用户信息
 * @param {Object} playerData 玩家的数据对象
 * @param {number} amount 要改变的SP量，可以是正数或负数
 */
function updatePlayerSP(ctx, msg, playerData, amount) {
  playerData.player_SP += amount;

  // 打印处理后的SP
  console.log(`Updated SP for player ${playerData.player_id}: ${playerData.player_SP}`);

  // 确保SP不超过最大值也不低于0
  if (playerData.player_SP > playerData.role_SP_Max) {
      playerData.player_SP = playerData.role_SP_Max;
  } else if (playerData.player_SP < 0) {
      playerData.player_SP = 0;
      // 需要检查是倒吊人的特殊情况
  }

  updateAndSavePlayerData(ctx, playerData);

  return true;  // 返回 true 表示成功
}


/**
 * 功能函数：更新玩家受伤轮次
 * @param {Object} ctx 上下文对象，包含调用环境和用户信息
 * @param {Object} playerData 玩家的数据对象
 * @param {number} amount 要改变的SP量，可以是正数或负数
 */
function updatePlayerHunt(ctx, msg, playerData, amount) {
  playerData.player_fight_hunt += amount;

  // 打印处理后的hunt
  console.log(`Updated SP for player ${playerData.player_id}: ${playerData.player_fight_hunt}`);

  // 确保hunt不低于0
  if (playerData.player_fight_hunt < 0) {
      playerData.player_fight_hunt = 0;
  }

  // 检查死神技能情况

  updateAndSavePlayerData(ctx, playerData);

  return true;  // 返回 true 表示成功
}


/**
 * 功能函数：更新玩家武器
 * @param {Object} ctx 上下文对象，包含调用环境和用户信息
 * @param {Object} msg 消息对象
 * @param {number} weaponId 武器id
 */
function updatePlayerWeapon(ctx, msg, weaponId) {
  const groupId = ctx.group.groupId;
  const playerData = ctx.player;
  const playerId = playerData.userId;

  // 尝试获取 playersData
  const playersDataRaw = ext.storageGet(`playersData_${groupId}`);
  if (!playersDataRaw) {
      console.error("Failed to retrieve playersData from storage.");
      seal.replyToSender(ctx, msg, "无法获取玩家数据，请检查游戏是否正确初始化。");
      return;
  }

  let playersData = JSON.parse(playersDataRaw);

  if (!playerData) {
      console.error("Player data is null or undefined.");
      seal.replyToSender(ctx, msg, "更新武器时，玩家数据无效，请检查游戏是否正确初始化。");
      return;
  }

  playerData.player_weapon_id = weaponId;

  // 获取武器名称
  const weapon = getWeaponById(weaponId);

  if(weapon){
    // 更新指定玩家的数据
    playersData[`player${playerId}`] = playerData;

    // 存储更新后的玩家数据
    ext.storageSet(`playersData_${groupId}`, JSON.stringify(playersData));

    seal.replyToSender(ctx, msg, `<${playerData.role_name}>：你已经更换到新武器：${weapon.weapon_name}。`);
  }
  else{
    seal.replyToSender(ctx, msg, `<${playerData.role_name}>：武器id超出预计不正确，为${weaponId}`);
  }
}

/**
 * 功能函数：更新玩家神之眼属性
 * @param {Object} ctx 上下文对象，包含调用环境和用户信息
 * @param {Object} msg 消息对象
 * @param {Object} eyeColor 神之眼属性
 * @returns 
 */
function updatePlayerEyeColor(ctx, msg, eyeColor){
  const groupId = ctx.group.groupId;
  const playerData = ctx.player;
  const playerId = playerData.userId;

  // 尝试获取 playersData
  const playersDataRaw = ext.storageGet(`playersData_${groupId}`);
  if (!playersDataRaw) {
      console.error("Failed to retrieve playersData from storage.");
      seal.replyToSender(ctx, msg, "无法获取玩家数据，请检查游戏是否正确初始化。");
      return;
  }

  let playersData = JSON.parse(playersDataRaw);

  if (!playerData) {
      console.error("Player data is null or undefined.");
      seal.replyToSender(ctx, msg, "更新神之眼时，玩家数据无效，请检查游戏是否正确初始化。");
      return;
  }

  playerData.player_color = eyeColor;

  // 更新指定玩家的数据
  playersData[`player${playerId}`] = playerData;

  // 存储更新后的玩家数据
  ext.storageSet(`playersData_${groupId}`, JSON.stringify(playersData));

  seal.replyToSender(ctx, msg, `神之眼已更换至：${eyeColor}`);
}


/**
 * 功能函数：处理玩家回复【是】
 * @param {Object} ctx 上下文对象
 * @param {Object} msg 消息对象
 */
function confirmDecision(ctx, msg) {
    const playerData = ctx.player;
    const playerId = playerData.userId;

    // 加载待处理的决定数据
    loadPendingDecisions(ctx);

    if (pendingDecisions[playerId]) {
      const decisionType = pendingDecisions[playerId].type;
      const playersData = JSON.parse(ext.storageGet(`playersData_${ctx.group.groupId}`) || '{}');

      switch (decisionType) {
          case 'weaponDecision':
            const weaponId = pendingDecisions[playerId].weaponId;
            
            // 执行更换武器
            updatePlayerWeapon(ctx, msg, weaponId);
            break;

          case 'eyeDecision':
            const weaponMessage = `<${playerData.role_name}>：
有水流自【天理代行】的指间流转而出，在你反应过来前被赋予了武器的形状，随后冰霜冻结，刀刃铸锋。
————武器已赋予————
获取武器：天空之刃`;
            seal.replyToSender(ctx, msg, weaponMessage);
          
            // 修改玩家数据
            updatePlayerWeapon(ctx, msg, 12);
            updatePlayerEyeColor(ctx, msg, validElements[0]);
      
            const goodbyeMessage = `【天理代行】收走了你的神之眼，一言不发转身离去。
————神之眼已收缴————`;
            seal.replyToSender(ctx, msg, goodbyeMessage);
              break;
          default:
              seal.replyToSender(ctx, msg, "当前没有相关的决定需要处理。");
              break;
      }
      // 清除玩家的待决定状态
      delete pendingDecisions[playerId];
      savePendingDecisions(ctx); // 保存更新后的待决定数据
  } 
  else {
      seal.replyToSender(ctx, msg, "没有待处理的决定或回复已失效。");
  }
}


/**
 * 功能函数：处理玩家回复【否】
 * @param {Object} ctx 上下文对象
 * @param {Object} msg 消息对象
 */
function rejectDecision(ctx, msg) {
    const playerData = ctx.player;
    const playerId = playerData.userId;

    // 加载待处理的决定数据
    loadPendingDecisions(ctx);

    // 检查是否有待处理的决定
    if (pendingDecisions[playerId]) {
        const decisionType = pendingDecisions[playerId].type;

        switch (decisionType) {
            case 'weaponDecision':
              seal.replyToSender(ctx, msg, `<${playerData.role_name}>：你决定放弃该武器让它留在原地。`);
              // 清除玩家的待决定状态
              delete pendingDecisions[playerId];
              break;
            case 'eyeDecision':
              const questionMessage = `<${playerData.role_name}>：
你看见兜帽遮面的【天理代行】陷入沉默，在你以为祂不会说话的瞬间，你听见了截然不同的沙哑声线。
 “一个问题。”祂说。
 “你可以问我一个问题。
（系统提示：可使用.ask <询问内容> 指令发问)”`;
              // 记录玩家的决定待定状态
              addPendingDecision(ctx, playerId, {
              type: 'askDecision'
              });
              seal.replyToSender(ctx, msg, questionMessage);
              break;
            default:
              seal.replyToSender(ctx, msg, `<${playerData.role_name}>：当前没有相关的决定需要处理。`);
              break;
        }

        
        savePendingDecisions(ctx); // 保存更新后的待决定数据
    } 
    else {
        seal.replyToSender(ctx, msg, `<${playerData.role_name}>：没有待处理的决定或回复已失效。`);
    }
}


/**
 * 探索函数： 非禁区 1~16 处理特殊道具获取
 * @param {Object} ctx 上下文对象
 * @param {Object} msg 消息对象
 * @param {Object} playerData 玩家数据
 */
function handleSpecialItem(ctx, msg, playerData) {
  const itemID = Math.floor(Math.random() * 16) + 1;
  const item = getItemById(itemID);
  if (!item) {
      seal.replyToSender(ctx, msg, `<${playerData.role_name}>：未找到对应的特殊道具。`);
      return;
  }

  addItemToBag(ctx, playerData.player_id, itemID);

  seal.replyToSender(ctx, msg, `<${playerData.role_name}>：你获得了特殊道具: ${item.item_name} —— ${item.item_discribe}`);
}


/**
   * 探索函数：非禁区 17~50 处理日常物品获取
   * @param {Object} ctx 上下文对象
   * @param {Object} msg 消息对象  
   * @param {Object} playerData 玩家数据
   * @param {number} randomResult 随机数结果
   */
function handleCommonItem(ctx, msg, playerData) {
  // 17-50 获取日常物品处理

  const itemID = Math.floor(Math.random() * 4) + 101;
  const item = getItemById(itemID);
  let response = `<${playerData.role_name}>：你获得了恢复类食物：${item.item_name}。`;
  let healAmount = 0;

  if (itemID == 101) {
    healAmount = 4;
    response += `使用后可 +${healAmount}HP`
  } 
  else if (itemID == 102) {
    healAmount = 3;
    response += `使用后可 +${healAmount}HP`
  } 
  else if (itemID == 103) {
    healAmount = 5;
    response += `使用后可 +${healAmount}SP`
  } 
  else if (itemID == 104) {
    healAmount = 4;
    response += `使用后可 +${healAmount}HP，并解除负面状态`
  }

  // 将物品添加到背包
  addItemToBag(ctx, playerData.player_id, itemID);

  seal.replyToSender(ctx, msg, response);
}

/**
   * 探索函数：非禁区 51~77 处理武器发现逻辑
   * @param {Object} ctx 上下文对象
   * @param {Object} msg 消息对象
   * @param {Object} playerData 玩家数据
   * @param {number} randomResult 随机结果，用于确定发现哪种武器
   */
function handleWeaponDiscovery(ctx, msg, playerData) {
  let weaponId = Math.floor(Math.random() * 5) + 2;

  // 获取武器信息
  const weapon = weaponData.find(w => w.weapon_id === weaponId);
  const weaponInfo = weapon 
      ? `武器名称: ${weapon.weapon_name}\n攻击力: ${weapon.weapon_attack}\n命中率: ${weapon.weapon_hit}\n耐久: ${weapon.weapon_broken}`
      : "武器: 无";

  const message = `<${playerData.role_name}>：你找到了${weaponInfo}\n是否要更换当前武器？请回复指令 .yes 或 .no 。`;
    seal.replyToSender(ctx, msg, message);

    // 记录玩家的决定待定状态
    addPendingDecision(ctx, playerData.player_id, {
      type: 'weaponDecision',
      weaponId: weaponId,
  });
}


/**
   * 探索函数：非禁区 78~97 处理遭遇玩家逻辑
   * @param {Object} ctx 上下文对象
   * @param {Object} msg 消息对象
   * @param {Object} playerData 玩家数据
   */
function handlePlayerEncounter(ctx, msg, playerData) {
    // 78-97 遭遇其他玩家
    
    // 获取群组ID和当前游戏数据
    const groupId = ctx.group.groupId;
    const playersData = JSON.parse(ext.storageGet(`playersData_${groupId}`) || '{}');

    // 找到除当前玩家外同一地图的其他活跃玩家
    const otherPlayers = Object.values(playersData).filter(p =>
      p.player_id !== ctx.player.userId && // 确保不是当前玩家
      p.player_map_id === playerData.player_map_id && // 同一地图
      p.player_living === 1 // 仍活着
    );
  
    if (otherPlayers.length > 0) {
      const encounteredPlayer = otherPlayers[Math.floor(Math.random() * otherPlayers.length)]; // 随机遭遇一个玩家
      seal.replyToSender(ctx, msg, `你遭遇了玩家 ${encounteredPlayer.role_name}，是否发起战斗？回复【是】或【否】`);
  
      // 存储等待玩家的回复
      awaitingResponses[player_id] = {
        type: 'battleDecision',
        opponentId: encounteredPlayer.player_id,
        initiator: true
      };
    } 
    else {
      seal.replyToSender(ctx, msg, "你一无所获。");
    }
  }
  

/**
   * 探索函数：非禁区 98~100 遭遇天理代行事件
   * @param {Object} ctx 上下文对象
   * @param {Object} msg 消息对象
   * @param {Object} playerData 玩家数据
   */
function handleExploreEncounterAgent(ctx, msg, playerData) {
    let promptMessage = `<${playerData.role_name}>：
————兜帽遮面的【天理代行】降临在你的面前————\n`;

    if(playerData.player_color != '无'){
      promptMessage += `【天理代行】向你伸出手，你发觉祂在看你的神之眼。
是否交出神之眼？请回复指令.yes/.no`;

    // 记录玩家的决定待定状态
    addPendingDecision(ctx, playerData.player_id, {
      type: 'eyeDecision'
  });
    }
    else{
      promptMessage += `【天理代行】向你伸出手，像是对你勇气与幸运的嘉许。
HP+20，SP+20
————【天理代行】一言不发地转身离去————`
      updatePlayerHP(ctx, playerData, 20);
    }

    seal.replyToSender(ctx, msg, promptMessage);
  }
    

const cmdShowRules = seal.ext.newCmdItemInfo();
cmdShowRules.name = 'rules';
cmdShowRules.help = '显示游戏规则';
cmdShowRules.solve = (ctx, msg, cmdArgs) => {
  seal.replyToSender(ctx, msg, ruleText);
};
ext.cmdMap['rules'] = cmdShowRules;
  

const cmdCreateWorld = seal.ext.newCmdItemInfo();
cmdCreateWorld.name = 'createworld';
cmdCreateWorld.help = '系统指令： .createworld 创建世界';
cmdCreateWorld.solve = (ctx, msg, cmdArgs) => {
    // 使用 ctx.group.groupId 来检查是否在群聊中
    if (!ctx.group || !ctx.group.groupId) {
      seal.replyToSender(ctx, msg, "当前环境不满足指令条件。");
      return seal.ext.newCmdExecuteResult(true);
    }
  
    const groupId = ctx.group.groupId;  // 获取群ID
    const existingGameData = ext.storageGet(`gameData_${groupId}`);
    // 检查游戏数据是否存在且有效
    if (existingGameData && existingGameData !== "{}" && existingGameData !== "null") {
      seal.replyToSender(ctx, msg, "世界已存在，无法重复创建。");
      return seal.ext.newCmdExecuteResult(true);
    }
  
    // 从存储获取最后一个游戏ID并递增
    let lastGameId = parseInt(ext.storageGet('lastGameId') || '0');
    lastGameId += 1;
    
    // 初始化游戏数据
    const gameData = {
      game_id: lastGameId,
      game_agent_index: 0,
      game_covert_index: 0,
      game_day: 0,
      game_heart1: 0,
      game_heart2: 0,
      game_heart3: 0,
      game_heart4: 0,
      game_heart5: 0,
      game_heart6: 0,
      game_map1: 0,
      game_map2: 0,
      game_map3: 0,
      game_map4: 0,
      game_map5: 0,
      game_map6: 0,
      game_map7: 0,
      game_map8: 0,
      game_map9: 0,
      game_map10: 0,
      game_map11: 0,
      game_map12: 0,
      game_map13: 0,
      game_map14: 0,
      game_map15: 0,
      game_map16: 0,
      game_admin: ctx.player.userId  // 记录创建者作为天理代行
    };
  
    initGameComponents();

    // 初始化 pendingDecisions
    pendingDecisions = {};
    savePendingDecisions(ctx);
  
    // 存储更新后的游戏ID
    ext.storageSet('lastGameId', lastGameId.toString());

    // 存储游戏数据
    ext.storageSet(`gameData_${groupId}`, JSON.stringify(gameData));
    seal.replyToSender(ctx, msg, "——世界创建成功——");
    return seal.ext.newCmdExecuteResult(true);
  };
ext.cmdMap['createworld'] = cmdCreateWorld;


const cmdViewGameState = seal.ext.newCmdItemInfo();
cmdViewGameState.name = 'showworld';
cmdViewGameState.help = '系统指令： .showworld 查看当前游戏状态';
cmdViewGameState.solve = (ctx, msg, cmdArgs) => {
    if (!ctx.group || !ctx.group.groupId) {
      seal.replyToSender(ctx, msg, "当前环境不满足指令条件。");
      return seal.ext.newCmdExecuteResult(true);
    }
  
    const groupId = ctx.group.groupId;
    const gameData = JSON.parse(ext.storageGet(`gameData_${groupId}`) || '{}');
    
    if (!gameData || !gameData.game_admin) {
      seal.replyToSender(ctx, msg, "当前世界不存在。");
      return seal.ext.newCmdExecuteResult(true);
    }
  
    if (gameData.game_admin !== ctx.player.userId) {
      seal.replyToSender(ctx, msg, "仅天理代行拥有该权限。");
      return seal.ext.newCmdExecuteResult(true);
    }
  
    // 构造表格展示信息
    const hearts = Array.from({ length: 6 }, (_, i) => gameData[`game_heart${i + 1}`]).join(', ');
    const maps = [];
    for (let i = 0; i < 16; i += 4) {
      maps.push(gameData[`game_map${i + 1}`] + ", " + gameData[`game_map${i + 2}`] + ", " + gameData[`game_map${i + 3}`] + ", " + gameData[`game_map${i + 4}`]);
    }
  
    const gameStateInfo = `游戏ID: ${gameData.game_id}
天理代行: ${gameData.game_admin}
游戏天数: ${gameData.game_day}
禁区地图:
${maps.join('\n')}
暗线开放状态：${gameData.game_covert_index}
天理代行下放状态：${gameData.game_agent_index}
神之心持有状态: [${hearts}]
  `;
  
    seal.replyToSender(ctx, msg, `当前游戏状态：\n${gameStateInfo}`);
    return seal.ext.newCmdExecuteResult(true);
  };
ext.cmdMap['showworld'] = cmdViewGameState;


const cmdViewRole = seal.ext.newCmdItemInfo();
cmdViewRole.name = 'showrole';
cmdViewRole.help = '系统指令： .showrole 查看角色分配情况';
cmdViewRole.solve = (ctx, msg, cmdArgs) => {
  if (!ctx.group || !ctx.group.groupId) {
    seal.replyToSender(ctx, msg, "此命令只能在群聊中使用。");
    return seal.ext.newCmdExecuteResult(true);
  }

  const groupId = ctx.group.groupId;
  const playersData = JSON.parse(ext.storageGet(`playersData_${groupId}`) || '{}');

  let response = "当前角色分配情况：\n";
  let assignedIds = new Set(Object.values(playersData).map(player => player.role_id));  // 已分配的角色卡IDs

  // 显示已分配的角色卡
  Object.values(playersData).forEach(player => {
    response += `玩家ID: ${player.player_id}, 角色: ${player.role_name}, 神之眼属性: ${player.player_color}, HP: ${player.player_HP}, SP: ${player.player_SP}\n`;
  });

  // 显示未分配的角色卡
  roleCards.forEach(card => {
    if (!assignedIds.has(card.role_id)) {
      response += `角色: ${card.role_name}, 分配状态: 无\n`;
    }
  });

  // 如果没有任何角色信息
  if (Object.keys(playersData).length === 0 && roleCards.length === 0) {
    response += "无";
  }

  seal.replyToSender(ctx, msg, response);
  return seal.ext.newCmdExecuteResult(true);
};
ext.cmdMap['showrole'] = cmdViewRole;


const cmdForceUnassignRole = seal.ext.newCmdItemInfo();
cmdForceUnassignRole.name = 'forcedistroyrole';
cmdForceUnassignRole.help = '系统指令： .forcedistroyrole <ID> 重置该角色';
cmdForceUnassignRole.solve = (ctx, msg, cmdArgs) => {
  if (!ctx.group || !ctx.group.groupId) {
    seal.replyToSender(ctx, msg, "此命令只能在群聊中使用。");
    return seal.ext.newCmdExecuteResult(true);
  }

  const groupId = ctx.group.groupId;
  const gameData = JSON.parse(ext.storageGet(`gameData_${groupId}`) || '{}');
  if (!gameData || gameData.game_admin !== ctx.player.userId) {
    seal.replyToSender(ctx, msg, "只有游戏管理员可以执行此操作。");
    return seal.ext.newCmdExecuteResult(true);
  }

  const targetPlayerId = cmdArgs.getArgN(1); // 需要管理员输入目标玩家的ID
  const playersData = JSON.parse(ext.storageGet(`playersData_${groupId}`) || '{}');
  const playerData = playersData[`player${targetPlayerId}`];
  if (!playerData) {
    seal.replyToSender(ctx, msg, "目标玩家没有绑定角色。");
    return seal.ext.newCmdExecuteResult(true);
  }

  // 重置角色卡并放回角色卡池的副本
  const resetRole = {...playerData, player_id: undefined, player_HP: playerData.role_HP_Max, player_SP: playerData.role_SP_Max};
  roleCardCopy.push(resetRole);
  ext.storageSet('roleCards', JSON.stringify(roleCardCopy));

  // 删除目标玩家的角色信息
  delete playersData[`player${targetPlayerId}`];
  ext.storageSet(`playersData_${groupId}`, JSON.stringify(playersData));

  seal.replyToSender(ctx, msg, `玩家${targetPlayerId}的角色卡已被强制解绑并重置。`);
  return seal.ext.newCmdExecuteResult(true);
};
ext.cmdMap['forcedistroyrole'] = cmdForceUnassignRole;


const cmdResetAllRoles = seal.ext.newCmdItemInfo();
cmdResetAllRoles.name = 'distroyallroles';
cmdResetAllRoles.help = '系统指令： .distoryallroles 重置所有角色';
cmdResetAllRoles.solve = (ctx, msg, cmdArgs) => {
  if (!ctx.group || !ctx.group.groupId) {
    seal.replyToSender(ctx, msg, "此命令只能在群聊中使用。");
    return seal.ext.newCmdExecuteResult(true);
  }

  const groupId = ctx.group.groupId;
  const gameData = JSON.parse(ext.storageGet(`gameData_${groupId}`) || '{}');
  if (!gameData || gameData.game_admin !== ctx.player.userId) {
    seal.replyToSender(ctx, msg, "只有游戏管理员可以执行此操作。");
    return seal.ext.newCmdExecuteResult(true);
  }

  let playersData = JSON.parse(ext.storageGet(`playersData_${groupId}`) || '{}');
  let bagData = JSON.parse(ext.storageGet('bagData') || '[]');
  let weaponData = JSON.parse(ext.storageGet('weaponData') || '[]'); // 如果需要清空武器数据

  // 重置所有角色卡并清除对应的背包和武器数据
  Object.keys(playersData).forEach(playerId => {
    // 清除背包数据
    bagData = bagData.filter(entry => entry.bag_vs_player !== playerId);

    // 清除武器数据 - 根据具体实现确定是否需要清除或重置
    // weaponData = weaponData.filter(entry => entry.weapon_owner !== playerId); // 示例代码，如果有需要清除特定武器所有者的逻辑

    // 你可以在这里根据需要执行其他清除操作
  });

  // 更新存储
  ext.storageSet(`playersData_${groupId}`, '{}');
  ext.storageSet('bagData', JSON.stringify(bagData));
  // ext.storageSet('weaponData', JSON.stringify(weaponData)); // 如果清除武器数据

  seal.replyToSender(ctx, msg, "所有角色卡已成功解绑并重置，现在可供新玩家抽取。");
  return seal.ext.newCmdExecuteResult(true);
};
ext.cmdMap['distroyallroles'] = cmdResetAllRoles;


const cmdDestroyWorld = seal.ext.newCmdItemInfo();
cmdDestroyWorld.name = 'distroyworld';
cmdDestroyWorld.help = '系统指令： .distroyworld 销毁该世界';
cmdDestroyWorld.solve = (ctx, msg, cmdArgs) => {
  if (!ctx.group || !ctx.group.groupId) {
    seal.replyToSender(ctx, msg, "当前环境不满足指令条件。");
    return seal.ext.newCmdExecuteResult(true);
  }

  const groupId = ctx.group.groupId;
  const gameData = JSON.parse(ext.storageGet(`gameData_${groupId}`) || '{}');

  if (!gameData || !gameData.game_admin) {
    seal.replyToSender(ctx, msg, "当前世界不存在。");
    return seal.ext.newCmdExecuteResult(true);
  }

  if (gameData.game_admin !== ctx.player.userId) {
    seal.replyToSender(ctx, msg, "仅天理代行拥有该权限。");
    return seal.ext.newCmdExecuteResult(true);
  }

  // 清空所有与当前游戏世界相关的动态数据
  ext.storageSet(`playersData_${groupId}`, '{}');
  ext.storageSet(`gameData_${groupId}`, "{}");
  
  // 重置副本数组到初始状态
  // roleCardCopy = JSON.parse(JSON.stringify(roleCards));

  seal.replyToSender(ctx, msg, "——世界销毁成功，所有动态数据已重置——");
  return seal.ext.newCmdExecuteResult(true);
};
ext.cmdMap['distroyworld'] = cmdDestroyWorld;


const cmdStartGame = seal.ext.newCmdItemInfo();
cmdStartGame.name = 'startgame';
cmdStartGame.help = '系统指令： .startgame 开始游戏';
cmdStartGame.solve = (ctx, msg, cmdArgs) => {
  if (!ctx.group || !ctx.group.groupId) {
    seal.replyToSender(ctx, msg, "此命令只能在群聊中使用。");
    return seal.ext.newCmdExecuteResult(true);
  }

  const groupId = ctx.group.groupId;
  const gameData = JSON.parse(ext.storageGet(`gameData_${groupId}`) || '{}');

  if (!gameData || !gameData.game_admin) {
    seal.replyToSender(ctx, msg, "当前游戏世界不存在。");
    return seal.ext.newCmdExecuteResult(true);
  }

  if (gameData.game_admin !== ctx.player.userId) {
    seal.replyToSender(ctx, msg, "仅天理代行持有启动游戏权限。");
    return seal.ext.newCmdExecuteResult(true);
  }

  const playersData = JSON.parse(ext.storageGet(`playersData_${groupId}`) || '{}');
  if (Object.keys(playersData).length < 1) {
    seal.replyToSender(ctx, msg, "还未分配足够的角色卡。");
    return seal.ext.newCmdExecuteResult(true);
  }

  Object.keys(playersData).forEach(playerId => {
    playersData[playerId].player_map_id = Math.floor(Math.random() * 16) + 1;
  });

  ext.storageSet(`playersData_${groupId}`, JSON.stringify(playersData));

  seal.replyToSender(ctx, msg, "————随机出生点分配完毕————");

  const startInfo = `
  你从混沌中醒来，手边只有一枚散发着暗淡光芒的神之眼，记忆与时间都变得模糊不清，唯一清晰的，是女声冰冷的通告：
  “僭越之人，为时七天，在此以厮杀证明你们的价值。唯有存活到最后一位的胜者，拥有重新回归世界、登上新神神座的权利。”
`;

  seal.replyToSender(ctx, msg, `${startInfo}`);

  return seal.ext.newCmdExecuteResult(true);
};
ext.cmdMap['startgame'] = cmdStartGame;


const cmdStartDay = seal.ext.newCmdItemInfo();
cmdStartDay.name = 'startday';
cmdStartDay.help = '系统指令： .startday 开始当天';
cmdStartDay.solve = (ctx, msg, cmdArgs) => {
  if (!ctx.group || !ctx.group.groupId) {
    seal.replyToSender(ctx, msg, "此命令只能在群聊中使用。");
    return seal.ext.newCmdExecuteResult(true);
  }

  const groupId = ctx.group.groupId;
  let gameData = JSON.parse(ext.storageGet(`gameData_${groupId}`) || '{}');
  if (!gameData || !gameData.game_admin) {
    seal.replyToSender(ctx, msg, "当前游戏世界不存在。");
    return seal.ext.newCmdExecuteResult(true);
  }

  gameData.game_day = (gameData.game_day || 0) + 1;
  const totalDays = 7;  // 设置游戏总天数
  const daysLeft = totalDays - gameData.game_day;

  // 随机指定两块区域成为预告禁区
  const possibleAreas = [];
  for (let i = 1; i <= 16; i++) {
    if (gameData[`game_map${i}`] === 0) {
      possibleAreas.push(i);
    }
  }
  const selectedAreas = possibleAreas.sort(() => 0.5 - Math.random()).slice(0, 2);
  selectedAreas.forEach(area => {
    gameData[`game_map${area}`] = -1;
  });

  // 重置玩家行动点为最大值，清点存活玩家人数
  const playersData = JSON.parse(ext.storageGet(`playersData_${groupId}`) || '{}');
  let livingPlayersCount = 0;
  Object.values(playersData).forEach(player => {
    player.player_round = player.role_round_Max;
    if (player.player_living === 1) {
      livingPlayersCount += 1;
    }
  });
  ext.storageSet(`playersData_${groupId}`, JSON.stringify(playersData));

  // 存储数据
  ext.storageSet(`gameData_${groupId}`, JSON.stringify(gameData));

  // 发布预告
  const areaNames = selectedAreas.map(area => mapData[area - 1].map_name);
  const warningMessage = `预告：${areaNames.join(' 、 ')} 即将关闭`;
  const welcomeMessage = `欢迎进入第 ${gameData.game_day} 天，距离全员淘汰还有 ${daysLeft} 天，存活玩家 ${livingPlayersCount} 人。\n请各位玩家加紧厮杀。`;

  seal.replyToSender(ctx, msg, `${warningMessage}\n${welcomeMessage}`);
  return seal.ext.newCmdExecuteResult(true);
};
ext.cmdMap['startday'] = cmdStartDay;


const cmdEndDay = seal.ext.newCmdItemInfo();
cmdEndDay.name = 'endday';
cmdEndDay.help = '系统指令： .endday 结算当天';
cmdEndDay.solve = (ctx, msg, cmdArgs) => {
  if (!ctx.group || !ctx.group.groupId) {
    seal.replyToSender(ctx, msg, "此命令只能在群聊中使用。");
    return seal.ext.newCmdExecuteResult(true);
  }

  const groupId = ctx.group.groupId;
  const playersData = JSON.parse(ext.storageGet(`playersData_${groupId}`) || '{}');
  const gameData = JSON.parse(ext.storageGet(`gameData_${groupId}`) || '{}');

  // 查看是否还有玩家未完成行动点
  const activePlayers = Object.values(playersData).filter(player => player.player_round > 0);
  if (activePlayers.length > 0) {
    let response = "玩家行动尚未完成：\n";
    activePlayers.forEach(player => {
      response += `${player.role_name}: 剩余行动 ${player.player_round} 次\n`;
    });
    seal.replyToSender(ctx, msg, response);
    return seal.ext.newCmdExecuteResult(true);
  }

  // 关闭禁区，清理玩家
  for (let i = 1; i <= 16; i++) {
    if (gameData[`game_map${i}`] === -1) {
      gameData[`game_map${i}`] = 1;  // Close the area
      const areaName = mapData[i-1].map_name;
      seal.replyToSender(ctx, msg, `【${areaName}】已关闭。${mapData[i-1].map_discri_forbid}`);

      // 清理玩家
      Object.values(playersData).forEach(player => {
        if (player.player_map_id === i) {
          killPlayer(player);
          seal.replyToSender(ctx, msg, `${player.role_name}因未及时离开禁区，死亡。`);
        }
      });
    }
  }

  ext.storageSet(`gameData_${groupId}`, JSON.stringify(gameData));
  ext.storageSet(`playersData_${groupId}`, JSON.stringify(playersData));

  const delay = 3000;
  setTimeout(() => {
    seal.replyToSender(ctx, msg, `当前天数：${gameData.game_day}；结算完毕，禁区滞留玩家已清理。`);
  }, delay);

  return seal.ext.newCmdExecuteResult(true);
};
ext.cmdMap['endday'] = cmdEndDay;


const cmdCreateRole = seal.ext.newCmdItemInfo();
cmdCreateRole.name = 'createrole';
cmdCreateRole.help = '玩家指令： .createRole <神之眼属性> 创建角色，神之眼属性自选';
cmdCreateRole.solve = (ctx, msg, cmdArgs) => {
  if (!ctx.group || !ctx.group.groupId) {
        seal.replyToSender(ctx, msg, "此命令只能在群聊中使用。");
        return seal.ext.newCmdExecuteResult(true);
    }

    const groupId = ctx.group.groupId;
    const gameData = JSON.parse(ext.storageGet(`gameData_${groupId}`) || '{}');

    if (!gameData || !gameData.game_admin) {
        seal.replyToSender(ctx, msg, "当前世界不存在。");
        return seal.ext.newCmdExecuteResult(true);
    }

    const playersData = JSON.parse(ext.storageGet(`playersData_${groupId}`) || '{}');
    if (playersData[`player${ctx.player.userId}`]) {
        seal.replyToSender(ctx, msg, "你已经拥有一个角色，不能再创建新角色。");
        return seal.ext.newCmdExecuteResult(true);
    }

    if (Object.keys(playersData).length >= 9) {
        seal.replyToSender(ctx, msg, "已达到玩家上限，无法创建更多角色。");
        return seal.ext.newCmdExecuteResult(true);
    }

    const roleCardsCopy = JSON.parse(ext.storageGet('roleCardsCopy') || '[]');
    if (roleCardsCopy.length === 0) {
        seal.replyToSender(ctx, msg, "没有更多可用的角色卡。");
        return seal.ext.newCmdExecuteResult(true);
    }

    const randomIndex = Math.floor(Math.random() * roleCardsCopy.length);
    const selectedCard = roleCardsCopy.splice(randomIndex, 1)[0];
    ext.storageSet('roleCardsCopy', JSON.stringify(roleCardsCopy));  // 更新角色卡副本存储

    const element = cmdArgs.getArgN(1);
    if (!validElements.includes(element)) {
        seal.replyToSender(ctx, msg, "神之眼属性无效，请选择风、岩、雷、草、水、火、冰之一。");
        return seal.ext.newCmdExecuteResult(true);
    }

    const newPlayerData = {
        ...selectedCard,
        player_id: ctx.player.userId,
        player_living: 1,
        player_color: element,
        player_HP: selectedCard.role_HP_Max,
        player_SP: selectedCard.role_SP_Max,
        player_round: selectedCard.role_round_Max,
        player_weapon_id: 1,
        player_map_id: 0,
        player_fight_skip: 0,
        player_fight_drainLife: 0,
        player_fight_strengthen: 0,
        player_fight_weaken: 0,
        player_fight_rebound: 0,
        player_fight_hunt: 0,
        player_fight_creativeHP: 0
    };

    playersData[`player${ctx.player.userId}`] = newPlayerData;  // 使用玩家ID作为键
  ext.storageSet(`playersData_${groupId}`, JSON.stringify(playersData));  // 更新玩家数据存储
  seal.replyToSender(ctx, msg, `玩家初始化完毕。你的角色：${selectedCard.role_name}，神之眼属性：${element}`);
  return seal.ext.newCmdExecuteResult(true);
};
ext.cmdMap['createrole'] = cmdCreateRole;


const cmdViewMyRole = seal.ext.newCmdItemInfo();
cmdViewMyRole.name = 'showmyrole';
cmdViewMyRole.help = '玩家指令： .showmyrole 查看角色信息';
cmdViewMyRole.solve = (ctx, msg, cmdArgs) => {
  if (!ctx.group || !ctx.group.groupId) {
    seal.replyToSender(ctx, msg, "此命令只能在群聊中使用。");
    return seal.ext.newCmdExecuteResult(true);
  }

  const groupId = ctx.group.groupId;
  const gameData = JSON.parse(ext.storageGet(`gameData_${groupId}`) || '{}');
  if (!gameData || !gameData.game_admin) {
    seal.replyToSender(ctx, msg, "当前游戏世界不存在。");
    return seal.ext.newCmdExecuteResult(true);
  }

  const playersData = JSON.parse(ext.storageGet(`playersData_${groupId}`) || '{}');
  const playerData = playersData[`player${ctx.player.userId}`];
  if (!playerData) {
    seal.replyToSender(ctx, msg, "你还没有绑定任何角色。");
    return seal.ext.newCmdExecuteResult(true);
  }

  let battleSkills = [];
  if (playerData.player_fight_skip) battleSkills.push(`闪避: ${playerData.player_fight_skip}`);
  if (playerData.player_fight_drainLife) battleSkills.push(`吸血: ${playerData.player_fight_drainLife}`);
  if (playerData.player_fight_strengthen) battleSkills.push(`强化: ${playerData.player_fight_strengthen}`);
  if (playerData.player_fight_weaken) battleSkills.push(`弱化: ${playerData.player_fight_weaken}`);
  if (playerData.player_fight_rebound) battleSkills.push(`反弹: ${playerData.player_fight_rebound}`);
  if (playerData.player_fight_hunt) battleSkills.push(`狩猎: ${playerData.player_fight_hunt}`);
  if (playerData.player_fight_creativeHP) battleSkills.push(`创生HP: ${playerData.player_fight_creativeHP}`);

  let battleSkillsInfo = battleSkills.length > 0 ? `战斗技能:\n  - ${battleSkills.join('\n  - ')}` : "无特殊战斗状态";



  // 获取当前地图信息
  const currentMap = mapData.find(map => map.map_id === playerData.player_map_id);
  let areaDescription = "无描述";
  if (currentMap) {
    const mapStatusKey = `game_map${currentMap.map_id}`;
    const mapStatus = gameData[mapStatusKey];
    areaDescription = mapStatus === 1 ? currentMap.map_discri_forbid : currentMap.map_discri_normal;
  }

  const playerInfo = `
角色名称: ${playerData.role_name}
HP: ${playerData.player_HP} / ${playerData.role_HP_Max}
SP: ${playerData.player_SP} / ${playerData.role_SP_Max}
神之眼属性: ${playerData.player_color}
行动点数: ${playerData.player_round}
${battleSkillsInfo}
所在区域: ${currentMap ? currentMap.map_name : "未知区域"}
区域描述: ${areaDescription}
`;

  seal.replyToSender(ctx, msg, `你的角色信息：\n${playerInfo}`);
  return seal.ext.newCmdExecuteResult(true);
};
ext.cmdMap['showmyrole'] = cmdViewMyRole;


const cmdUnassignRole = seal.ext.newCmdItemInfo();
cmdUnassignRole.name = 'distroyrole';
cmdUnassignRole.help = '玩家指令： .distroyrole 重置当前角色';
cmdUnassignRole.solve = (ctx, msg, cmdArgs) => {
    if (!ctx.group || !ctx.group.groupId) {
        seal.replyToSender(ctx, msg, "此命令只能在群聊中使用。");
        return seal.ext.newCmdExecuteResult(true);
    }

    const groupId = ctx.group.groupId;
    const gameData = JSON.parse(ext.storageGet(`gameData_${groupId}`) || '{}');
    if (!gameData || !gameData.game_admin) {
        seal.replyToSender(ctx, msg, "当前游戏世界不存在。");
        return seal.ext.newCmdExecuteResult(true);
    }

    const playersData = JSON.parse(ext.storageGet(`playersData_${groupId}`) || '{}');
    const playerId = ctx.player.userId;
    const playerData = playersData[`player${playerId}`];
    if (!playerData) {
        seal.replyToSender(ctx, msg, "你当前没有绑定任何角色。");
        return seal.ext.newCmdExecuteResult(true);
    }

    // 重置角色卡并放回角色卡池（修改为使用 roleCardsCopy）
    let roleCardsCopy = JSON.parse(ext.storageGet('roleCardsCopy') || '[]');
    const resetRole = { ...playerData, player_id: undefined, player_HP: playerData.role_HP_Max, player_SP: playerData.role_SP_Max };
    roleCardsCopy.push(resetRole);
    ext.storageSet('roleCardsCopy', JSON.stringify(roleCardsCopy));

    // 删除玩家当前的角色信息
    delete playersData[`player${playerId}`];

    // 删除玩家的背包物品
    let bagData = JSON.parse(ext.storageGet('bagData') || '[]');
    bagData = bagData.filter(entry => entry.bag_vs_player !== playerId);
    ext.storageSet('bagData', JSON.stringify(bagData));

    // 如果需要删除玩家的武器数据，可以在这里添加相关逻辑
    // 示例代码：
    // let weaponData = JSON.parse(ext.storageGet('weaponData') || '[]');
    // weaponData = weaponData.filter(entry => entry.weapon_owner !== playerId);
    // ext.storageSet('weaponData', JSON.stringify(weaponData));

    // 更新并保存玩家数据
    ext.storageSet(`playersData_${groupId}`, JSON.stringify(playersData));

    seal.replyToSender(ctx, msg, "你的角色卡已解绑并重置，现在可供其他玩家抽取。");
    return seal.ext.newCmdExecuteResult(true);
};
ext.cmdMap['distroyrole'] = cmdUnassignRole;


const cmdShowMap = seal.ext.newCmdItemInfo();
cmdShowMap.name = 'showmap';
cmdShowMap.help = '玩家指令： .showmap 查看大地图';
cmdShowMap.solve = (ctx, msg, cmdArgs) => {
  if (!ctx.group || !ctx.group.groupId) {
    seal.replyToSender(ctx, msg, "此命令只能在群聊中使用。");
    return seal.ext.newCmdExecuteResult(true);
  }

  const groupId = ctx.group.groupId;
  const gameData = JSON.parse(ext.storageGet(`gameData_${groupId}`) || '{}');
  const playersData = JSON.parse(ext.storageGet(`playersData_${groupId}`) || '{}');

  // 添加区域的禁区/预告禁区/非禁区标识
  const mapGrid = Array.from({ length: 16 }, () => "");
  Object.values(playersData).forEach(player => {
    const mapIndex = player.player_map_id - 1;
    mapGrid[mapIndex] += (mapGrid[mapIndex] ? ", " : "") + (player.role_name || "Unknown Player");
  });

  let gridDisplay = "————天理地图读取中————\n";
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const cellIndex = i * 4 + j;
      const mapName = mapData[cellIndex].map_name;
      const statusSymbol = gameData[`game_map${cellIndex + 1}`] === -1 ? " !" :
                           gameData[`game_map${cellIndex + 1}`] === 1 ? " ×" : "";
      gridDisplay += `${mapName}${statusSymbol}`.padEnd(10);
    }
    gridDisplay += '\n';
  }

  // 打表有玩家所在的地图
  mapGrid.forEach((players, index) => {
    if (players) {
      gridDisplay += `${mapData[index].map_name}: ${players}\n`;
    }
  });

  gridDisplay += "————天理地图读取完毕————";
  seal.replyToSender(ctx, msg, gridDisplay);
  return seal.ext.newCmdExecuteResult(true);
};
ext.cmdMap['showmap'] = cmdShowMap;


const cmdViewBag = seal.ext.newCmdItemInfo();
cmdViewBag.name = 'showbag';
cmdViewBag.help = '玩家指令： .showbag 查看背包物品';
cmdViewBag.solve = (ctx, msg, cmdArgs) => {
  if (!ctx.group || !ctx.group.groupId) {
    seal.replyToSender(ctx, msg, "此命令只能在群聊中使用。");
    return seal.ext.newCmdExecuteResult(true);
  }

  const groupId = ctx.group.groupId;
  const bagData = JSON.parse(ext.storageGet('bagData') || '[]');

  const playersData = JSON.parse(ext.storageGet(`playersData_${groupId}`) || '{}');
  const playerData = playersData[`player${ctx.player.userId}`];
  if (!playerData) {
    seal.replyToSender(ctx, msg, "你还没有绑定任何角色。");
    return seal.ext.newCmdExecuteResult(true);
  }

  const playerItems = bagData.filter(item => item.bag_vs_player === ctx.player.userId);
  playerItems.sort((a, b) => a.bag_vs_item - b.bag_vs_item);

  // 获取武器信息
  const weapon = weaponData.find(w => w.weapon_id === playerData.player_weapon_id);
  const weaponInfo = weapon 
      ? `武器名称: ${weapon.weapon_name}\n攻击力: ${weapon.weapon_attack}\n命中率: ${weapon.weapon_hit}\n耐久: ${weapon.weapon_broken}`
      : "武器: 无";

  let response = `<${playerData.role_name}>：
持有武器：\n`;
  response += `${weaponInfo}\n`;

  response += `背包中的物品：\n`;
  if (playerItems.length > 0) {
    playerItems.forEach(item => {
      const itemInfo = itemData.find(it => it.item_id === item.bag_vs_item);
      response += `【${itemInfo.item_name}】 *${item.bag_item_num}\n${itemInfo.item_discribe}\n`;
    });
  } else {
    response += "背包为空。\n";
  }

  seal.replyToSender(ctx, msg, response);
  return seal.ext.newCmdExecuteResult(true);
};
ext.cmdMap['showbag'] = cmdViewBag;


const cmdUseHealItem = seal.ext.newCmdItemInfo();
cmdUseHealItem.name = 'use';
cmdUseHealItem.help = '玩家指令： .use <item> 使用指定的道具';
cmdUseHealItem.solve = (ctx, msg, cmdArgs) => {
    if (!ctx.group || !ctx.group.groupId) {
        seal.replyToSender(ctx, msg, "此命令只能在群聊中使用。");
        return seal.ext.newCmdExecuteResult(true);
    }

    const groupId = ctx.group.groupId;
    const itemName = cmdArgs.getArgN(1);

    const playersData = JSON.parse(ext.storageGet(`playersData_${groupId}`) || '{}');
    const playerData = playersData[`player${ctx.player.userId}`];
    if (!playerData) {
        seal.replyToSender(ctx, msg, "你还没有绑定任何角色。");
        return seal.ext.newCmdExecuteResult(true);
    }

    const bagData = JSON.parse(ext.storageGet('bagData') || '[]');
    const itemEntry = bagData.find(entry => entry.bag_vs_player === ctx.player.userId && entry.item_name === itemName);

    if (!itemEntry || itemEntry.bag_item_num <= 0) {
        seal.replyToSender(ctx, msg, `<${playerData.role_name}>：你没有该道具或数量不足。`);
        return seal.ext.newCmdExecuteResult(true);
    }

    let response = `<${playerData.role_name}>：`;
    let itemId = 0;

    switch (itemName) {
        case "日落果":
            updatePlayerHP(ctx, msg, playerData, 4);
            response = "你使用了日落果，+4 HP。";
            itemId = 101;
            break;
        case "树莓":
            updatePlayerHP(ctx, msg, playerData, 3);
            response = "你使用了树莓，+3 HP。";
            itemId = 102;
            break;
        case "薄荷":
            updatePlayerSP(ctx, msg, playerData, 5);
            response = "你使用了薄荷，+5 SP。";
            itemId = 103;
            break;
        case "应急伤药":
            updatePlayerHP(ctx, msg, playerData, 5);
            updatePlayerHunt(ctx, msg, playerData, -5);
            response = "你使用了应急伤药，+5 HP，解除了所有负面状态。";
            itemId = 104;
            break;
        default:
            seal.replyToSender(ctx, msg, "该道具不能使用。");
            return seal.ext.newCmdExecuteResult(true);
    }

    // 使用道具
    removeItemFromBag(ctx, playerData.player_id, itemId);

    seal.replyToSender(ctx, msg, response);
    return seal.ext.newCmdExecuteResult(true);
};
ext.cmdMap['use'] = cmdUseHealItem;


const cmdConfirm = seal.ext.newCmdItemInfo();
cmdConfirm.name = 'yes';
cmdConfirm.help = '玩家指令： .yes 答复当前所需状态';
cmdConfirm.solve = (ctx, msg, cmdArgs) => {
  confirmDecision(ctx, msg);
  return seal.ext.newCmdExecuteResult(true);
};
ext.cmdMap['yes'] = cmdConfirm;


const cmdRejectDecision = seal.ext.newCmdItemInfo();
cmdRejectDecision.name = 'no';
cmdRejectDecision.help = '玩家指令：.no 拒绝当前的决定';
cmdRejectDecision.solve = (ctx, msg, cmdArgs) => {
    rejectDecision(ctx, msg);
    return seal.ext.newCmdExecuteResult(true);
};
ext.cmdMap['no'] = cmdRejectDecision;


const cmdExplore = seal.ext.newCmdItemInfo();
cmdExplore.name = 'explore';
cmdExplore.help = '玩家指令： .explore 探索当前区域';
cmdExplore.solve = (ctx, msg, cmdArgs) => {
  if (!ctx.group || !ctx.group.groupId) {
    seal.replyToSender(ctx, msg, "此命令只能在群聊中使用。");
    return seal.ext.newCmdExecuteResult(true);
  }

  const groupId = ctx.group.groupId;
  const gameData = JSON.parse(ext.storageGet(`gameData_${groupId}`) || '{}');
  const playersData = JSON.parse(ext.storageGet(`playersData_${groupId}`) || '{}');
  const playerData = playersData[`player${ctx.player.userId}`];
  if (!playerData) {
    seal.replyToSender(ctx, msg, "无法找到玩家数据。");
    return seal.ext.newCmdExecuteResult(true);
  }
  // seal.replyToSender(ctx, msg, `当前玩家：${playerData.role_name}`);

  // 检查当前玩家是否有待处理事件
  if (hasPendingDecision(ctx)) {
    seal.replyToSender(ctx, msg, `<${playerData.role_name}>：你有未处理的事件，请先回复该事件再继续探索。`);
    return seal.ext.newCmdExecuteResult(true);
}

  const playerMapIndex = playerData.player_map_id - 1;
  const mapStatus = gameData[`game_map${playerMapIndex + 1}`];

  // 行动点是否充足
  if (playerData.player_round > 0) {
    ext.storageSet(`playersData_${groupId}`, JSON.stringify(playersData));

    // 非禁区探索
    if (mapStatus !== 1) {
      const randomResult = Math.floor(Math.random() * 100) + 1;

      if (randomResult <= 16) {
        // 1-16 获取特殊道具逻辑
        handleSpecialItem(ctx, msg, playerData);
      } 
      else if (randomResult <= 50) {
        // 17-50 获取日常物品逻辑
        handleCommonItem(ctx, msg, playerData);
      } 
      else if (randomResult <= 100) {
        // 51-78 获取武器逻辑
        handleWeaponDiscovery(ctx, msg, playerData);
      } 
    //   else if (randomResult <= 97) {
    //     // 78-97 遭遇其他玩家
    //     handlePlayerEncounter(ctx, msg, playerData);
    //   } 
      else if (randomResult <= 100){
        // 98-100 遭遇【天理代行】
        handleExploreEncounterAgent(ctx, msg, playerData);
      }
      else{
        seal.replyToSender(ctx, msg, `测试结果：一无所获。`);
      }

    } 
    else {
      seal.replyToSender(ctx, msg, `当前区域是禁区，无法探索。`);
    }
  
    // playerData.player_round -= 1;
  } 
  else {
    seal.replyToSender(ctx, msg, `当前行动点数不足。`);
  }

  return seal.ext.newCmdExecuteResult(true);
};
ext.cmdMap['explore'] = cmdExplore;


const cmdGo = seal.ext.newCmdItemInfo();
cmdGo.name = 'go';
cmdGo.help = '玩家指令： .go <方向> 移动至指定方向的相邻区域，方向为上/下/左/右';
cmdGo.solve = (ctx, msg, cmdArgs) => {
    if (!ctx.group || !ctx.group.groupId) {
        seal.replyToSender(ctx, msg, "此命令只能在群聊中使用。");
        return seal.ext.newCmdExecuteResult(true);
    }

    const groupId = ctx.group.groupId;
    const direction = cmdArgs.getArgN(1); // 获取方向参数
    const playersData = JSON.parse(ext.storageGet(`playersData_${groupId}`) || '{}');
    const playerData = playersData[`player${ctx.player.userId}`];

    if (!playerData) {
        seal.replyToSender(ctx, msg, "你还没有绑定任何角色。");
        return seal.ext.newCmdExecuteResult(true);
    }

    const mapIndex = playerData.player_map_id - 1; // map_id 是从1开始的，需要转换为0-based index
    let row = Math.floor(mapIndex / 4); // 获取行号
    let col = mapIndex % 4; // 获取列号

    switch (direction) {
        case '上':
            row--;
            break;
        case '下':
            row++;
            break;
        case '左':
            col--;
            break;
        case '右':
            col++;
            break;
        default:
            seal.replyToSender(ctx, msg, "无效的方向，必须是：上、下、左、右之一。");
            return seal.ext.newCmdExecuteResult(true);
    }

    // 检查边界
    if (row < 0 || row > 3 || col < 0 || col > 3) {
        seal.replyToSender(ctx, msg, "移动失败：超出地图边界。");
        return seal.ext.newCmdExecuteResult(true);
    }

    // 更新位置
    const Map = getMapById(playerData.player_map_id);
    const new_mapId = row * 4 + col + 1;
    playerData.player_map_id = new_mapId; // 计算新的 map_id
    playersData[`player${ctx.player.userId}`] = playerData;
    ext.storageSet(`playersData_${groupId}`, JSON.stringify(playersData));

    const newMap = getMapById(new_mapId);

    response = `<${playerData.role_name}>：
————已从${Map.map_name}移出————
————已向${direction}移入${newMap.map_name}————`;
    
    const playerColor = playerData.player_color; // 玩家的神之眼属性
    const mapDescription = newMap.map_discri_eye; // 当前地图的神之眼特定描述

    if (isColorInMapDescription(playerColor, mapDescription)) {
      response += `\n<${playerData.role_name}>：在踏入【目标地点】的瞬间，你发现你随身的【神之眼】微弱地闪了闪`;
    } 

    seal.replyToSender(ctx, msg, response);
    return seal.ext.newCmdExecuteResult(true);
};

ext.cmdMap['go'] = cmdGo;


const cmdViewPendingDecisions = seal.ext.newCmdItemInfo();
cmdViewPendingDecisions.name = 'showlist';
cmdViewPendingDecisions.help = '系统指令： .viewpending 查看当前游戏内待处理的事件与事件对应的玩家角色名';
cmdViewPendingDecisions.solve = (ctx, msg, cmdArgs) => {
    if (!ctx.group || !ctx.group.groupId) {
        seal.replyToSender(ctx, msg, "此命令只能在群聊中使用。");
        return seal.ext.newCmdExecuteResult(true);
    }

    loadPendingDecisions(ctx); // 加载当前的 pendingDecisions

    const playersDataRaw = ext.storageGet(`playersData_${ctx.group.groupId}`);
    if (!playersDataRaw) {
        console.error("Failed to retrieve playersData from storage.");
        seal.replyToSender(ctx, msg, "无法获取玩家数据，请检查游戏是否正确初始化。");
        return seal.ext.newCmdExecuteResult(true);
    }

    let playersData = JSON.parse(playersDataRaw);
    let response = "当前待处理的事件：\n";

    for (let playerId in pendingDecisions) {
        const decision = pendingDecisions[playerId];
        const playerData = playersData[`player${playerId}`];
        if (playerData) {
            response += `玩家: ${playerData.role_name}, 事件类型: ${decision.type}\n`;
        }
    }

    seal.replyToSender(ctx, msg, response);
    return seal.ext.newCmdExecuteResult(true);
};
ext.cmdMap['showlist'] = cmdViewPendingDecisions;


const cmdAskQuestion = seal.ext.newCmdItemInfo();
cmdAskQuestion.name = 'ask';
cmdAskQuestion.help = '玩家指令： .ask <问题内容> 向游戏系统提问，根据待决定状态回复';
cmdAskQuestion.solve = (ctx, msg, cmdArgs) => {
    if (!ctx.group || !ctx.group.groupId) {
        seal.replyToSender(ctx, msg, "此命令只能在群聊中使用。");
        return seal.ext.newCmdExecuteResult(true);
    }

    const groupId = ctx.group.groupId;
    const playerId = ctx.player.userId;
    const question = cmdArgs.getArgN(1);

    // 加载待处理的决定数据
    loadPendingDecisions(ctx);

    // 检查是否有待处理的决定且类型为 "askDecision"
    if (pendingDecisions[playerId] && pendingDecisions[playerId].type === 'askDecision') {
        let response = ``;
        if (question.includes("钟离")) {
            response += `在你又一次认为祂不会开口之时，你猛然看见有血泪自兜帽下的阴影中流下，四肢关节渗出鲜血似人偶般扭曲，像是耗尽全力般一字一顿：“用眼……去神注视的……禁区。”
尾音落下，那破碎身形瞬间消失在空中，仿佛从未来过。
————【天理代行】已离去————`;
        } else {
            response = "……";
        }

        // 发送回复
        seal.replyToSender(ctx, msg, response);

        // 清除玩家的待决定状态
        delete pendingDecisions[playerId];
        savePendingDecisions(ctx);
    } else {
        seal.replyToSender(ctx, msg, "当前没有相关的问答决定需要处理。");
    }

    return seal.ext.newCmdExecuteResult(true);
};

ext.cmdMap['ask'] = cmdAskQuestion;