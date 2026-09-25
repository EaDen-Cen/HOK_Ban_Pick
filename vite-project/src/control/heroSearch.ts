import type { Hero } from '../data/heroTypes.js';
import type { Language } from '../shared/types.js';

// Curated initials for the current Chinese roster. IDs are stable in persisted drafts,
// so keeping this table keyed by hero ID avoids depending on browser pinyin libraries.
// When new heroes are added, search still works by Chinese/English/alias text; add the
// new initials here as part of roster review.
export const chineseInitialsByHeroId: Record<number,string> = {
  1:'agd',2:'lxa',3:'yl',4:'aql',5:'gsl',6:'ys',7:'zbj',8:'ydn',9:'dsm',10:'kt',
  11:'dfbb',12:'cwj',13:'xs',14:'xlt',15:'yzj',16:'yj',17:'dq',18:'dj',19:'dm',20:'drj',
  21:'dw',22:'dc',23:'dly',24:'dhty',25:'bq',26:'xhd',27:'ssy',28:'al',30:'lfz',
  31:'gjmx',32:'gjl',33:'jl',34:'gy',35:'ggz',36:'hx',37:'hn',38:'hy',39:'hz',40:'j',
  41:'k',42:'zgl',43:'zk',44:'ssx',45:'zj',46:'l',47:'lb',48:'lx',49:'lp',50:'zl',
  51:'lb',52:'lb',53:'ls',54:'ay',55:'lb',56:'ll',57:'lbqh',58:'ln',59:'bzhw',60:'mkbl',
  61:'jxm',62:'my',63:'mq',64:'mld',65:'msy',66:'mz',67:'hml',68:'gbwc',69:'nkll',70:'nz',
  71:'nw',72:'pqh',73:'llw',74:'wzj',75:'sgwe',76:'blsy',77:'smy',78:'sb',79:'sc',80:'jyj',
  81:'swk',82:'zwy',83:'xy',84:'xq',85:'yj',86:'y',87:'y',88:'yyh',89:'lyf',90:'zf',
  91:'zy',92:'zz',93:'zy',94:'jzy',95:'yy',96:'my',97:'yg',98:'ylzztk',99:'jll',100:'ak',
  101:'bq',102:'fth',103:'y',104:'ylzzss',105:'lplp',106:'c',107:'blxc',108:'ant',109:'yx',110:'sq',
  111:'hy',112:'dfl',113:'f',114:'cc',115:'fll',116:'lla',117:'ylzzfs',
};

const aliasInitials: Record<string,string> = {
  '蚩姹':'cc',
  '弗洛倫':'fll',
};

export function normalizeHeroSearch(value:string) {
  return value.trim().toLowerCase().replace(/[\s·._'’"“”()（）\-—&/]+/g,'');
}

function consonantSignature(value:string) {
  return normalizeHeroSearch(value).replace(/[aeiou]/g,'');
}

export function heroMatchesSearch(hero:Hero, query:string, language:Language) {
  const normalized=normalizeHeroSearch(query);
  if(!normalized) return true;

  const names=[hero.englishName,hero.chineseName,...(hero.aliases||[])];
  if(names.some(name=>normalizeHeroSearch(name).includes(normalized))) return true;

  if(language==='zh' && /^[a-z]+$/.test(normalized)) {
    const initials=chineseInitialsByHeroId[hero.id]||'';
    if(initials.includes(normalized)) return true;
    if((hero.aliases||[]).some(alias=>(aliasInitials[alias]||'').includes(normalized))) return true;

    // Useful for transliterated one-word global names such as Lapulapu -> lplp.
    if(consonantSignature(hero.englishName).includes(normalized)) return true;
  }
  return false;
}

export function enterTarget<T extends {id:number}>(eligible:T[], query:string) {
  return normalizeHeroSearch(query) ? eligible[0] : undefined;
}
