import additionalHeroes from '../data/additionalHeroes.js';
import autoSyncedHeroes from '../data/autoSyncedHeroes.js';
import heroSyncOverrides from '../data/heroSyncOverrides.js';
import heroArtSourceOverrides from '../data/heroArtSourceOverrides.js';
import type { Hero } from '../data/heroTypes.js';
import { legacyAssetIdByReleaseId } from '../data/heroIdOrder.js';

const legacyHeroes: Hero[] = [
  {
    id: 72,
    englishName: "Agudo",
    chineseName: "阿古朵",
    imageLink: "/commons/images/f/f8/Agudo_Hero_Icon.jpg",
    occupation: "Jungling",
    altOccupation: '',
    counter:[66,50],
    beCountered:[79,48]
  },
  {
    id: 59,
    englishName: "Alessio",
    chineseName: "莱西奥",
    imageLink: "/commons/images/6/63/Alessio_Hero_Icon.jpg",
    occupation: "Farm Lane",
    altOccupation: '',
    counter:[39,16,73],
    beCountered:[85],
    combo:[68]
  },
  {
    id: 71,
    englishName: "Allain",
    chineseName: "亚连",
    imageLink: "/commons/images/5/5f/Allain_Hero_Icon.jpg",
    occupation: "Clash Lane",
    altOccupation: '',
    counter:[80,38,1],//黄忠，典韦
    beCountered:[12,35],//被阿离，马可克制
  },
  {
    id: 30,
    englishName: "Angela",
    chineseName: "安琪拉",
    imageLink: "/commons/images/5/5a/Angela_Hero_Icon.png",
    occupation: "Mid Lane",
    altOccupation: '',
    counter:[47],
    beCountered:[87,85]
  },
  {
    id: 12,
    englishName: "Arli",
    chineseName: "公孙离",
    imageLink: "/commons/images/5/5c/Gong_Sun_Li_Hero_Icon.png",
    occupation: "Farm Lane",
    altOccupation: '',
    counter:[79,2,18],
    combo:[9,92,63],
    beCountered:[41,25]//扁鹊，亚瑟
  },
  {
    id: 25,
    englishName: "Arthur",
    chineseName: "亚瑟",
    imageLink: "/commons/images/b/b5/Arthur_HOK_Hero_Icon.png",
    occupation: "Clash Lane",
    altOccupation: 'Jungling',
    counter:[54,12],//蒙犽，公孙离
    beCountered:[38,71,40]//被典韦，亚连，吕布克制
  },
  {
    id: 3,
    englishName: "Ata",
    chineseName: "猪八戒",
    imageLink: "/commons/images/3/35/Ata_Hero_Icon.jpg",
    occupation: "Clash Lane",
    altOccupation: '',
    combo:[42],
    counter:[7],
    beCountered:[57,47,11]
  },
  {
    id: 17,
    englishName: "Athena",
    chineseName: "雅典娜",
    imageLink: "/commons/images/4/45/Athena_Hero_Icon.png",
    occupation: "Jungling",
    altOccupation: '',
    counter:[19],
    beCountered:[56,31],
    combo:[93]
  },
  {
    id: 89,
    englishName: "Augran",
    chineseName: "大司命",
    imageLink: "/commons/images/5/5f/Da_Siming_Hero_Icon.jpg",
    occupation: "Jungling",
    altOccupation: 'Clash Lane',
    counter:[64],
    beCountered:[54,72,37],//不知火舞,宫本
    combo:[39]//周瑜
  },
  {
    id: 64,
    englishName: "Biron",
    chineseName: "狂铁",
    imageLink: "/commons/images/1/12/Kuang_Tie_Hero_Icon.png",
    occupation: "Clash Lane",
    altOccupation: '',
    counter:[74],
    beCountered:[38,89,75]
  },
  {
    id: 78,
    englishName: "Butterfly",
    chineseName: "刀锋宝贝",
    imageLink: "/commons/images/3/3f/Butterfly_Hero_Icon_2019.png",
    occupation: "Jungling",
    altOccupation: '',
    counter:[83,13],
    beCountered:[74,82],

  },
  {
    id: 16,
    englishName: "Cai Yan",
    chineseName: "蔡文姬",
    imageLink: "/commons/images/f/f8/Cai_Wenji_Hero_Icon.png",
    occupation: "Roaming",
    altOccupation: '',
    beCountered:[37], //宫本
    counter:[14,84,69]//克诸葛亮，杨玉环，守约
  },
  {
    id: 94,
    englishName: "Shi",
    chineseName: "西施",
    imageLink: "/commons/images/0/00/Cao_Cao_Hero_Icon.png",
    occupation: "Mid Lane",
    altOccupation: '',
    counter:[72,41],
    beCountered:[12,46,54]
  },
  {
    id: 62,
    englishName: "Charlotte",
    chineseName: "夏洛特",
    imageLink: "/commons/images/b/b2/Charlotte_Hero_Icon.jpg",
    occupation: "Clash Lane",
    altOccupation: '',
    counter:[74],
    beCountered:[25,66]
  },
  {
    id: 57,
    englishName: "Cirrus",
    chineseName: "云中君",
    imageLink: "/commons/images/1/1f/Yun_Zhongjun_Hero_Icon.jpg",
    occupation: "Jungling",
    altOccupation: '',
    counter:[3],
    beCountered:[84]
  },
  {
    id: 20,
    englishName: "Consort Yu",
    chineseName: "虞姬",
    imageLink: "/commons/images/1/14/Yu_Ji_Hero_Icon.png",
    occupation: "Farm Lane",
    altOccupation: '',
    combo:[63],//大乔
    counter:[24,55,12],
    beCountered:[72,79,54]
  },
  {
    id: 63,
    englishName: "Da Qiao",
    chineseName: "大乔",
    imageLink: "/commons/images/3/30/Da_Qiao_Hero_Icon.png",
    occupation: "Roaming",
    altOccupation: 'Mid Lane',
    counter:[34,72,77],
    beCountered:[12,58],
    combo:[20,32,37]//虞姬，老夫子，宫本

  },
  {
    id: 49,
    englishName: "Daji",
    chineseName: "妲己",
    imageLink: "/commons/images/3/39/Daji_Hero_Icon.png",
    occupation: "Mid Lane",
    altOccupation: '',
    counter:[54,44],
    beCountered:[72,53]
  },
  {
    id: 67,
    englishName: "Dharma",
    chineseName: "达摩",
    imageLink: "/commons/images/c/c8/Dharma_Hero_Icon.png",
    occupation: "Jungling",
    altOccupation: 'Clash Lane',
    counter:[74,90,73],
    beCountered:[33,38,13]
  },
  {
    id: 34,
    englishName: "Di Renjie",
    chineseName: "狄仁杰",
    imageLink: "/commons/images/9/92/Di_Renjie_Hero_Icon.png",
    occupation: "Farm Lane",
    altOccupation: '',
    counter:[19],
    beCountered:[14,73,2],
    combo:[16]
  },
  {
    id: 38,
    englishName: "Dian Wei",
    chineseName: "典韦",
    imageLink: "/commons/images/e/ec/Dian_Wei_Hero_Icon.png",
    occupation: "Clash Lane",
    altOccupation: 'Jungling',
    counter:[37,58],
    beCountered:[71,73,70]
  },
  {
    id: 31,
    englishName: "Diaochan",
    chineseName: "貂蝉",
    imageLink: "/commons/images/a/a9/KOG_Diaochan_Hero_Icon.png",
    occupation: "Mid Lane",
    altOccupation: '',
    beCountered:[68],
    counter:[27,46],
  },
  {
    id: 76,
    englishName: "Dolia",
    chineseName: "朵莉亚",
    imageLink: "/commons/images/4/43/Doria_Hero_Icon.jpg",
    occupation: "Roaming",
    altOccupation: '',
    counter:[46,84],
    combo:[89,75,79,84,37] //亚连，夏侯，婉儿，杨玉环
  },
  {
    id: 15,
    englishName: "Donghuang",
    chineseName: "东皇太一",
    imageLink: "/commons/images/7/73/East_Emperor_Taiyi_Hero_Icon.png",
    occupation: "Roaming",
    altOccupation: '',
    counter:[26],
    beCountered:[85,75]//哪吒，夏侯
  },
  {
    id: 41,
    englishName: "Dr. Bian",
    chineseName: "扁鹊",
    imageLink: "/commons/images/2/26/Bian_Que_Hero_Icon.png",
    occupation: "Mid Lane",
    altOccupation: '',
    combo:[42,75,89],//孙膑，夏侯,猪八戒
    beCountered:[28,82],//王昭君，鬼谷子
    counter:[69,85]//克守约，哪吒
  },
  {
    id: 75,
    englishName: "Dun",
    chineseName: "夏侯惇",
    imageLink: "/commons/images/5/56/Xiahou_Dun_Hero_Icon.png",
    occupation: "Clash Lane",
    altOccupation: 'Roaming',
    combo:[76,42], //朵莉亚
    counter:[44,32,64],
    beCountered:[60,40,77]
  },
  {
    id: 92,
    englishName: "Dyadia",
    chineseName: "少司缘",
    imageLink: "/commons/images/b/be/Shao_Siyuan_Hero_Icon.jpg",
    occupation: "Roaming",
    altOccupation: '',
    counter:[12],
    combo:[12,48]
  },
  {
    id: 73,
    englishName: "Erin",
    chineseName: "艾琳",
    imageLink: "/commons/images/8/87/Ailin_Hero_Icon.png",
    occupation: "Farm Lane",
    altOccupation: '',
    counter:[34,46,38],
    beCountered:[68],
    combo:[68]
  },
  {
    id: 29,
    englishName: " ",
    chineseName: " ",
    imageLink: "/commons/images/c/cb/Li_Yuanfang_Hero_Icon.png",
    occupation: "Farm Lane",
    altOccupation: 'Jungling'
  },
  {
    id: 32,
    englishName: "Fuzi",
    chineseName: "老夫子",
    imageLink: "/commons/images/7/7b/Lao_Fu_Zi_Hero_Icon.png",
    occupation: "Clash Lane",
    altOccupation: '',
    combo:[63,16],//大乔，蔡文姬
    counter:[84,42], //杨玉环
    beCountered:[75,45] //刘禅，夏侯
  },
  {
    id: 2,
    englishName: "Gan & Mo",
    chineseName: "干将莫邪",
    imageLink: "/commons/images/6/6d/Ganjiang_Moye_Hero_Icon.png",
    occupation: "Mid Lane",
    altOccupation: '',
    counter:[72,46,6],
    beCountered:[12,58]
  },
  {
    id: 44,
    englishName: "Gao",
    chineseName: "高渐离",
    imageLink: "/commons/images/d/db/Gao_Jianli_Hero_Icon.png",
    occupation: "Mid Lane",
    altOccupation: '',
    counter:[10],
    beCountered:[56]
  },
  {
    id: 83,
    englishName: "Garo",
    chineseName: "伽罗",
    imageLink: "/commons/images/b/b8/Jia_Luo_Hero_Icon.png",
    occupation: "Farm Lane",
    altOccupation: '',
    counter:[9],
    beCountered:[27,78],
    combo:[68]
  },
  {
    id: 58,
    englishName: "Guan Yu",
    chineseName: "关羽",
    imageLink: "/commons/images/2/21/Guan_Yu_Hero_Icon.png",
    occupation: "Clash Lane",
    altOccupation: '',
    counter:[2],
    beCountered:[38,65] //典韦
  },
  {
    id: 82,
    englishName: "Guiguzi",
    chineseName: "鬼谷子",
    imageLink: "/commons/images/b/bd/Gui_Guzi_Hero_Icon.png",
    occupation: "Roaming",
    altOccupation: '',
    combo:[81,28,52],//刘备，王昭君
    counter:[16,68,27],
    beCountered:[9,46,74]//瑶，庄周
  },
  {
    id: 29,
    englishName: "Han Xin",
    chineseName: "韩信",
    imageLink: "/commons/images/a/af/Han_Xin_Hero_Icon.png",
    occupation: "Jungling",
    altOccupation: '',
    counter:[18,94,28],
  },
  {
    id: 77,
    englishName: "Heino",
    chineseName: "海诺",
    imageLink: "/commons/images/4/47/Heino_Hero_Icon.jpg",
    occupation: "Mid Lane",
    altOccupation: 'Clash Lane',
    counter:[46,72],//鱼，阿古朵
    beCountered:[12,37]//阿离
  },
  {
    id: 23,
    englishName: "Hou Yi",
    chineseName: "后羿",
    imageLink: "/commons/images/4/49/Hou_Yi_Hero_Icon.png",
    occupation: "Farm Lane",
    altOccupation: '',
    counter:[],
    combo:[68]

  },
  {
    id: 80,
    englishName: "Huang Zhong",
    chineseName: "黄忠",
    imageLink: "/commons/images/0/0a/Huang_Zhong_Hero_Icon.png",
    occupation: "Farm Lane",
    altOccupation: '',
    counter:[14,83],
    beCountered:[82,35]
  },
  {
    id: 5,
    englishName: "Jing",
    chineseName: "镜",
    imageLink: "/commons/images/6/6f/Jing_HOK_Hero_Icon.jpg",
    occupation: "Jungling",
    altOccupation: '',
    counter:[71],
    beCountered:[25],
    combo:[12]
  },
  {
    id: 13,
    englishName: "Kaizer",
    chineseName: "凯",
    imageLink: "/commons/images/a/aa/Kai_Hero_Icon.png",
    occupation: "Jungling",
    altOccupation: 'Clash Lane',
    counter:[81],
    beCountered:[55,77]
  },
  {
    id: 14,
    englishName: "Kongming",
    chineseName: "诸葛亮",
    imageLink: "/commons/images/4/4e/Zhuge_Liang_Hero_Icon.png",
    occupation: "Mid Lane",
    altOccupation: '',
    counter:[81,29,38],
    beCountered:[80,41,16],//黄忠，扁鹊，蔡文姬
    combo:[68]//明世隐
  },
  {
    id: 19,
    englishName: "Kui",
    chineseName: "钟馗",
    imageLink: "/commons/images/b/b4/Zhong_Kui_Hero_Icon.png",
    occupation: "Roaming",
    altOccupation: '',
    beCountered:[46,34],
    counter:[68,80]
  },
  {
    id: 48,
    englishName: "Lady Sun",
    chineseName: "孙尚香",
    imageLink: "/commons/images/4/40/Sun_Shangxiang_Hero_Icon.png",
    occupation: "Farm Lane",
    altOccupation: '',
    counter:[11,74,69],
    beCountered:[],
    combo:[68,92]
  },
  {
    id: 60,
    englishName: "Lady Zhen",
    chineseName: "甄姬",
    imageLink: "/commons/images/c/c1/Zhen_Ji_2019.jpg",
    occupation: "Mid Lane",
    altOccupation: '',
    counter:[3],
    beCountered:[10,36]
  },
  {
    id: 6,
    englishName: "Lam",
    chineseName: "澜",
    imageLink: "/commons/images/c/c2/Lan_Hero_Icon.jpg",
    occupation: "Jungling",
    altOccupation: '',
    counter:[72,77,90],
    beCountered:[2]
  },
  {
    id: 36,
    englishName: "Li Bai",
    chineseName: "李白",
    imageLink: "/commons/images/9/9e/Li_Bai_Hero_Icon.png",
    occupation: "Jungling",
    altOccupation: '',
    counter:[60,90,55],
    beCountered:[25]
  },
  {
    id: 8,
    englishName: "Li Xin",
    chineseName: "李信",
    imageLink: "/commons/images/4/4d/Li_Xin_Hero_Icon.png",
    occupation: "Clash Lane",
    altOccupation: '',
    counter:[40,39],//吕布，甄姬
    beCountered:[1,2] //杨戬，干将
  },
  {
    id: 53,
    englishName: "Lian Po",
    chineseName: "廉颇",
    imageLink: "/commons/images/2/20/Lian_Po_Hero_Icon.png",
    occupation: "Clash Lane",
    altOccupation:'Roaming',
    counter:[7,49],
    beCountered:[46,77]
  },
  {
    id: 66,
    englishName: "Liang",
    chineseName: "张良",
    imageLink: "/commons/images/b/bd/Zhang_Liang_2019.jpg",
    occupation: "Mid Lane",
    altOccupation: "Roaming",
    beCountered:[91], //刘邦
    combo:[28],//王昭君
    counter:[12,36]//克阿离，李白
  },
  {
    id: 91,
    englishName: "Liu Bang",
    chineseName: "刘邦",
    imageLink: "/commons/images/6/67/Liu_Bang_Hero_Icon.png",
    occupation: "Clash Lane",
    altOccupation: "Roaming",
    combo:[85],//哪吒
    beCountered:[32,56,70], //被老夫子，梦奇，露娜克
    counter:[66,44]//克张良
  },
  {
    id: 81,
    englishName: "Liu Bei",
    chineseName: "刘备",
    imageLink: "/commons/images/4/42/Liu_Bei_Hero_Icon.png",
    occupation: "Jungling",
    altOccupation: "",
    counter:[24,74,67],
    beCountered:[14,13],
    combo:[82]
  },
  {
    id: 45,
    englishName: "Liu Shan",
    chineseName: "刘禅",
    imageLink: "/commons/images/7/76/Liu_Shan_Hero_Icon.png",
    occupation: "Roaming",
    altOccupation: "",
    counter:[32,80],
    beCountered:[46,34,85],
    combo:[10,72]
  },
  {
    id: 88,
    englishName: "Loong",
    chineseName: "敖隐",
    imageLink: "/commons/images/d/d0/Aoyin_Hero_Icon.jpg",
    occupation: "Farm Lane",
    altOccupation: "",
    counter:[79,35,71],
    beCountered:[68,10]
  },
  {
    id: 40,
    englishName: "Lu Bu",
    chineseName: "吕布",
    imageLink: "/commons/images/2/2f/Lu_Bu_2022_Hero_Icon.png",
    occupation: "Clash Lane",
    altOccupation: "",
    combo:[76],//朵莉亚
    counter:[56,75],//梦奇，夏侯	
    beCountered:[71,8,77]//亚连，李信
  },
  {
    id: 86,
    englishName: "Luara",
    chineseName: "劳拉",
    imageLink: "/commons/images/thumb/8/82/Luara_Hero_Icon.jpg/180px-Luara_Hero_Icon.jpg",
    occupation: "Farm Lane",
    altOccupation: ""
  },
  {
    id: 47,
    englishName: "Luban No.7",
    chineseName: "鲁班七号",
    imageLink: "/commons/images/3/3a/Luban_No.7_Hero_Icon.png",
    occupation: "Farm Lane",
    altOccupation: "",
    counter:[3],
    beCountered:[30,81]
  },
  {
    id: 70,
    englishName: "Luna",
    chineseName: "露娜",
    imageLink: "/commons/images/7/74/Luna_2019.jpg",
    occupation: "Jungling",
    altOccupation: "Clash Lane",
    counter:[82,46],
    beCountered:[49,25]
  },
  {
    id: 54,
    englishName: "Mai Shiranui",
    chineseName: "不知火舞",
    imageLink: "/commons/images/1/13/Mai_Shiranui_Hero_Icon.png",
    occupation: "Mid Lane",
    altOccupation: "",
    counter:[18,90],
    beCountered:[25,49]

  },
  {
    id: 35,
    englishName: "Marco Polo",
    chineseName: "马可波罗",
    imageLink: "/commons/images/5/58/Marco_Polo_Hero_Icon.png",
    occupation: "Farm Lane",
    altOccupation: "",
    counter:[80,71],
    beCountered:[9,88],
    combo:[9]
  },
  {
    id: 65,
    englishName: "Mayene",
    chineseName: "姬小满",
    imageLink: "/commons/images/d/d2/Ji_Xiaoman_Hero_Icon.png",
    occupation: "Clash Lane",
    altOccupation: "",
    counter:[11,58,18],
    beCountered:[25,7,33,64]
  },
  {
    id: 93,
    englishName: "Meng Ya",
    chineseName: "蒙犽",
    imageLink: "/commons/images/6/67/Meng_Ya_Hero_Icon.png",
    occupation: "Farm Lane",
    altOccupation: "",
    counter:[72,22],
    beCountered:[27,58,35],
    combo:[17]
  },
  {
    id: 56,
    englishName: "Menki",
    chineseName: "梦奇",
    imageLink: "/commons/images/8/8a/Meng_Qi_Hero_Icon.png",
    occupation: "Clash Lane",
    altOccupation: "",
    counter:[37,44,74],//克宫本
    beCountered:[40,72]
  },
  {
    id: 10,
    englishName: "Milady",
    chineseName: "米莱狄",
    imageLink: "/commons/images/0/03/Milady_Hero_Icon.png",
    occupation: "Mid Lane",
    altOccupation: "",
    counter:[39,66],
    beCountered:[79,44,90],
    combo:[72]
  },
  {
    id: 68,
    englishName: "Ming",
    chineseName: "明世隐",
    imageLink: "/commons/images/c/c4/Ming_Shiyin_Hero_Icon.png",
    occupation: "Roaming",
    altOccupation: "",
    combo:[14,48,23,83,73],//诸葛亮，孙尚香
    counter:[46,74,73],
    beCountered:[82,19]

  },
  {
    id: 50,
    englishName: "Mozi",
    chineseName: "墨子",
    imageLink: "/commons/images/5/5f/Mozi_Hero_Icon.png",
    occupation: "Mid Lane",
    altOccupation: "Roaming",
    counter:[32,24,90],
    beCountered:[72,89,43],
    combo:[74]
  },
  {
    id: 26,
    englishName: "Mulan",
    chineseName: "花木兰",
    imageLink: "/commons/images/d/d4/Hua_Mulan_Hero_Icon.png",
    occupation: "Clash Lane",
    altOccupation: "",
    counter:[32,28,90],
    beCountered:[15,66]
  },
  {
    id: 37,
    englishName: "Musashi",
    chineseName: "宫本武藏",
    imageLink: "/commons/images/6/6c/Miyamoto_Musashi_Hero_Icon.png",
    occupation: "Jungling",
    altOccupation: "Clash Lane",
    counter:[3,89,16,18,77], //猪八戒,大司命,蔡文姬，女娲
    beCountered:[56,39,38], //梦奇,周瑜
    combo:[63,76]//大桥
  },
  {
    id: 55,
    englishName: "Nakoruru",
    chineseName: "娜可露露",
    imageLink: "/commons/images/a/ab/Nakoruru_Hero_Icon.png",
    occupation: "Jungling",
    altOccupation: "",
    counter:[81,13,3],
    beCountered:[24,36,20]
  },
  {
    id: 85,
    englishName: "Nezha",
    chineseName: "哪吒",
    imageLink: "/commons/images/d/d7/Nezha_Hero_Icon.png",
    occupation: "Jungling",
    altOccupation: "Clash Lane",
    combo:[91],//刘邦
    beCountered:[14],//被扁鹊克
    counter:[23]
  },
  {
    id: 18,
    englishName: "Nuwa",
    chineseName: "女娲",
    imageLink: "/commons/images/0/03/Nuwa_Hero_Icon.png",
    occupation: "Mid Lane",
    altOccupation: "",
    counter:[69,80,36,53],
    beCountered:[12,54]
  },
  {
    id: 11,
    englishName: "Pei",
    chineseName: "裴擒虎",
    imageLink: "/commons/images/1/16/Pei_Qin_Hu_Hero_Icon.png",
    occupation: "Jungling",
    altOccupation: "",
    counter:[85,18],
    beCountered:[65,23,51]
  },
  {
    id: 27,
    englishName: "Prince of Lanling",
    chineseName: "兰陵王",
    imageLink: "/commons/images/c/c6/Lan_Ling_Wan_Hero_Icon.png",
    occupation: "Jungling",
    altOccupation: "",
    counter:[83,18,2],
    beCountered:[69,82]
  },
  {
    id: 28,
    englishName: "Princess Frost",
    chineseName: "王昭君",
    imageLink: "/commons/images/1/1f/Wang_Zhaojun_Hero_Icon.png",
    occupation: "Mid Lane",
    altOccupation: "",
    combo:[66], //张良
    counter:[41,68],//扁鹊
    beCountered:[29,26,46,42]//韩信,木兰，鱼
  },
  {
    id: 79,
    englishName: "Shangguan",
    chineseName: "上官婉儿",
    imageLink: "/commons/images/0/0a/Shangguan_Wan%27er_Hero_Icon.png",
    occupation: "Mid Lane",
    altOccupation: "",
    counter:[90,72,10],
    beCountered:[88,12]//熬隐
  },
  {
    id: 69,
    englishName: "Shouyue",
    chineseName: "百里守约",
    imageLink: "/commons/images/9/9c/BaiLi_ShouYue_Hero_Icon.png",
    occupation: "Farm Lane",
    altOccupation: "",
    counter:[82,27],
    beCountered:[10,41],
    combo:[50]

  },
  {
    id: 74,
    englishName: "Sima Yi",
    chineseName: "司马懿",
    imageLink: "/commons/images/d/d9/Sima_Yi_Hero_Icon.png",
    occupation: "Jungling",
    altOccupation: "",
    combo:[82,22],
    counter:[82,95],
    beCountered:[22]

  },
  {
    id: 42,
    englishName: "Sun Bin",
    chineseName: "孙膑",
    imageLink: "/commons/images/d/d9/Sun_Bin_Hero_Icon.png",
    occupation: "Roaming",
    altOccupation: "",
    counter:[28,46,71],
    beCountered:[32],
    combo:[41,75,89,3]//扁鹊，夏侯,猪八戒
  },
  {
    id: 7,
    englishName: "Sun Ce",
    chineseName: "孙策",
    imageLink: "/commons/images/d/d9/Sun_Ce_Hero_Icon.png",
    occupation: "Jungling",
    altOccupation: "Clash Lane",
    counter:[68],
    beCountered:[46,3]//庄周，猪八戒
  },
  {
    id: 61,
    englishName: "Ukyo Tachibana",
    chineseName: "橘右京",
    imageLink: "/commons/images/b/b3/Ukyo_Tachibana_Hero_Icon.png",
    occupation: "Jungling",
    altOccupation: "Clash Lane",
    counter:[11,56],
    beCountered:[25,65]
  },
  {
    id: 24,
    englishName: "Wukong",
    chineseName: "孙悟空",
    imageLink: "/commons/images/6/6f/Sun_Wukong_Hero_Icon.png",
    occupation: "Jungling",
    altOccupation: "",
    counter:[55,12],
    beCountered:[45,20,43]
  },
  {
    id: 43,
    englishName: "Wuyan",
    chineseName: "钟无艳",
    imageLink: "/commons/images/e/e2/Zhong_Wu_Yan_Hero_Icon.png",
    occupation: "Jungling",
    altOccupation: "Clash Lane",
    counter:[54],
    beCountered:[85,40,77]
  },
  {
    id: 33,
    englishName: "Xiang Yu",
    chineseName: "项羽",
    imageLink: "/commons/images/a/ac/Xiang_Yu_Hero_Icon.png",
    occupation: "Clash Lane",
    altOccupation: "",
    combo:[80],//黄忠
    counter:[12,54,67],//克阿离，火舞，达摩
    beCountered:[89,77,3]//大司命，海诺，猪八戒
  },
  {
    id: 52,
    englishName: "Xiao Qiao",
    chineseName: "小乔",
    imageLink: "/commons/images/f/f9/Xiao_Qiao_Hero_Icon.png",
    occupation: "Mid Lane",
    altOccupation: "",
    counter:[12],
    beCountered:[80,3],
    combo:[82]
  },
  {
    id: 1,
    englishName: "Yang Jian",
    chineseName: "杨戬",
    imageLink: "/commons/images/8/86/Yang_Jian_Hero_Icon.png",
    occupation: "Jungling",
    altOccupation: "Clash Lane",
    counter:[50],
    beCountered:[3,38,71]
  },
  {
    id: 87,
    englishName: "Yao",
    chineseName: "曜",
    imageLink: "/commons/images/4/4d/Yao_Male_Hero_Icon.png",
    occupation: "Clash Lane",
    altOccupation: "Jungling",
    counter:[72,71,30],
    beCountered:[25,49]
  },
  {
    id: 9,
    englishName: "Yaria",
    chineseName: "瑶",
    imageLink: "/commons/images/d/d3/Yao_Hero_Icon.png",
    occupation: "Roaming",
    altOccupation: "",
    counter:[82,35,85],
    combo:[35,12,5],
    beCountered:[83]
  },
  {
    id: 84,
    englishName: "Yuhuan",
    chineseName: "杨玉环",
    imageLink: "/commons/images/7/76/Yang_Yuhuan_Hero_Icon.png",
    occupation: "Mid Lane",
    altOccupation: "Jungling",
    combo:[76],
    beCountered:[32,47,16],
    counter:[2,57,53]//干将
  },
  {
    id: 21,
    englishName: "Fang",
    chineseName: "李元芳",
    imageLink: "/commons/images/c/cb/Li_Yuanfang_Hero_Icon.png",
    occupation: "Farm Lane",
    altOccupation: "",
    counter:[27,82,78],
    beCountered:[37]
  },
  {
    id: 22,
    englishName: "Zhang Fei",
    chineseName: "张飞",
    imageLink: "/commons/images/9/9e/Zhang_Fei_Hero_Icon.png",
    occupation: "Roaming",
    altOccupation: "",
    counter:[10,74],
    beCountered:[93,34,41]
  },

  {
    id: 39,
    englishName: "Zhou Yu",
    chineseName: "周瑜",
    imageLink: "/commons/images/4/4a/Zhou_Yu_Hero_Icon.png",
    occupation: "Mid Lane",
    altOccupation: "",
    combo:[89],//大司命,
    counter:[37,3],
    beCountered:[59]
  },
  {
    id: 46,
    englishName: "Zhuang Zhou",
    chineseName: "庄周",
    imageLink: "/commons/images/3/31/Zhuang_Zhou_Hero_Icon.png",
    occupation: "Roaming",
    altOccupation: "Clash Lane",
    counter:[19,7,82],//克钟馗，孙策，鬼,
    beCountered:[77,68]//海诺，小明
  },
  {
    id: 51,
    englishName: "Zilong",
    chineseName: "赵云",
    imageLink: "/commons/images/9/97/Zhao_Yun_Hero_Icon.png",
    occupation: "Jungling",
    altOccupation: "Clash Lane",
    counter:[11],
    beCountered:[6,82]
  },
  {
    id: 90,
    englishName: "Ziya",
    chineseName: "姜子牙",
    imageLink: "/commons/images/3/33/Jiang_Ziya_Hero_Icon_2022.jpg",
    occupation: "Mid Lane",
    altOccupation: "Roaming",
    combo:[],
    counter:[10,72],
    beCountered:[79,54]
  },
  {
    id: 4,
    englishName: "Ying",
    chineseName: "云樱",
    imageLink: "/commons/images/3/33/Jiang_Ziya_Hero_Icon_2022.jpg",
    occupation: "Jungling",
    altOccupation: "Clash Lane",
    combo:[],
    counter:[50,32],
    beCountered:[46,13]
  },
  {
    id: 95,
    englishName: "Mi Yue",
    chineseName: "芈月",
    imageLink: "/commons/images/3/33/Jiang_Ziya_Hero_Icon_2022.jpg",
    occupation: "Clash Lane",
    altOccupation: "Jungling",
    combo:[],
    counter:[85],
    beCountered:[58,74]
  }
];
const updatedNames: Record<number, string> = {
  41: 'Dr Bian',
  88: "Ao'yin",
  27: 'Gao Changgong',
  28: 'Wang Zhaojun',
  46: 'Zhuangzi',
};

// Icon asset filenames intentionally keep their pre-migration numbers so the
// director's freshly curated image set does not need a destructive binary rename.
const baseHeroes: Hero[] = [
  ...legacyHeroes.filter(h => h.englishName.trim() && h.chineseName.trim()).map(h => ({
    ...h,
    imageLink: `/heroesImg/${legacyAssetIdByReleaseId[h.id]}.png`,
    englishName: updatedNames[h.id] || h.englishName,
    aliases: updatedNames[h.id] ? [h.englishName] : [],
  })),
  ...additionalHeroes,
  ...autoSyncedHeroes,
];

const heroes: Hero[] = baseHeroes.map(hero => {
  const override = heroSyncOverrides[hero.id];
  const artOverride = heroArtSourceOverrides[hero.id];
  if (!override && !artOverride) return hero;

  // Automated sync may update safe identity/display metadata, but never overwrites
  // manually curated relationship arrays. Reviewed artwork overrides are applied
  // last so a future scheduled sync cannot reintroduce a known-bad broadcast image.
  return {
    ...hero,
    ...override,
    ...artOverride,
    aliases: [...new Set([...(hero.aliases || []), ...(override?.aliases || [])])],
    combo: hero.combo,
    counter: hero.counter,
    beCountered: hero.beCountered,
  };
}).sort((a, b) => a.id - b.id);

export default heroes;
