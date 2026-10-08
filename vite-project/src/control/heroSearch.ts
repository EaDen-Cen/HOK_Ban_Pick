import type { Hero } from '../data/heroTypes.js';
import type { Language } from '../shared/types.js';

// Curated initials for the current Chinese roster, keyed by canonical release-order ID.
// When hero IDs are deliberately migrated, this table must migrate with them. New heroes
// still fall back to Chinese/English/alias text until their initials are reviewed.
export const chineseInitialsByHeroId: Record<number,string> = {
  72:'agd',59:'lxa',71:'yl',30:'aql',12:'gsl',25:'ys',3:'zbj',17:'ydn',89:'dsm',64:'kt',
  78:'dfbb',16:'cwj',94:'xs',62:'xlt',57:'yzj',20:'yj',63:'dq',49:'dj',67:'dm',34:'drj',
  38:'dw',31:'dc',76:'dly',15:'dhty',41:'bq',75:'xhd',92:'ssy',73:'al',32:'lfz',
  2:'gjmx',44:'gjl',83:'jl',58:'gy',82:'ggz',29:'hx',77:'hn',23:'hy',80:'hz',5:'j',
  13:'k',14:'zgl',19:'zk',48:'ssx',60:'zj',6:'l',36:'lb',8:'lx',53:'lp',66:'zl',
  91:'lb',81:'lb',45:'ls',88:'ay',40:'lb',86:'ll',47:'lbqh',70:'ln',54:'bzhw',35:'mkbl',
  65:'jxm',93:'my',56:'mq',10:'mld',68:'msy',50:'mz',26:'hml',37:'gbwc',55:'nkll',85:'nz',
  18:'nw',11:'pqh',27:'llw',28:'wzj',79:'sgwe',69:'blsy',74:'smy',42:'sb',7:'sc',61:'jyj',
  24:'swk',43:'zwy',33:'xy',52:'xq',1:'yj',87:'y',9:'y',84:'yyh',21:'lyf',22:'zf',
  39:'zy',46:'zz',51:'zy',90:'jzy',4:'yy',95:'my',114:'yg',104:'ylzztk',110:'jll',98:'ak',
  102:'bq',103:'fth',109:'y',107:'ylzzss',111:'lplp',101:'c',97:'blxc',115:'ant',96:'yx',99:'sq',
  113:'hy',118:'dfl',100:'f',112:'cc',116:'fll',117:'lla',105:'ylzzfs',
  106:'ylzzck',108:'ylzzfz',119:'ww',
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
