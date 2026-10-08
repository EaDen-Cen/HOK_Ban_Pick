import type { MatchState, PlayerRole, Side } from './types.js';
export const postGameMetrics=['kills','deaths','assists','rating','damageShare','gold','totalDamage','participation','healing','damageTaken'] as const;
export type PostGameMetric=typeof postGameMetrics[number];
export type PostGamePage='overview'|'survival'|'damage'|'team';
export interface PostGameField { value:number; sourcePage:PostGamePage; confidence:number; manual:boolean; evidence?:string }
export interface PostGamePlayer { rowId:string; playerId:string; side:Side; slot:number; rosterIndex:number; teamName:string; portrait:string; role:PlayerRole; heroId:number; fields:Partial<Record<PostGameMetric,PostGameField>> }
export interface PostGameReport { id:string; gameNumber:number; seriesFormat:MatchState['seriesFormat']; stage:string; players:PostGamePlayer[]; selectedMvpPlayerId:string|null; selectedMvpRowId:string|null }
export const postGameMetricLabel=(key:PostGameMetric,zh:boolean)=>({kills:['击杀','Kills'],deaths:['死亡','Deaths'],assists:['助攻','Assists'],rating:['游戏评分','Rating'],damageShare:['输出占比','Damage share'],gold:['经济','Gold'],totalDamage:['总输出','Total damage'],participation:['参团率','Participation'],healing:['治疗','Healing'],damageTaken:['承受伤害','Damage taken']}[key][zh?0:1]);
export function reliableField(field:PostGameField|undefined){return !!field&&(field.manual||field.confidence>=.85);}
/** Display priorities only: this never selects or scores MVP candidates. */
export function highlightStats(player:PostGamePlayer){
  const priority:PostGameMetric[]=player.role==='roam'?['participation','healing','damageTaken','gold','totalDamage','damageShare']:player.role==='clash'?['damageTaken','totalDamage','participation','gold','damageShare','healing']:['damageShare','gold','totalDamage','participation','damageTaken','healing'];
  return priority.filter(key=>reliableField(player.fields[key])).slice(0,3).map(key=>({key,field:player.fields[key]!}));
}
