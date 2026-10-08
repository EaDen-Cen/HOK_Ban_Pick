export interface NeutralObjective { id:string; name:string; icon:string; blue:number; red:number }
export interface LiveGameStats { blueKills:number; redKills:number; blueTowers:number; redTowers:number; neutralObjectives:NeutralObjective[]; density:'compact'|'full' }
export const initialLiveGameStats=():LiveGameStats=>({blueKills:0,redKills:0,blueTowers:0,redTowers:0,neutralObjectives:[],density:'full'});
export function nextLiveGameStats(previous:LiveGameStats):LiveGameStats {return {...initialLiveGameStats(),density:previous.density,neutralObjectives:previous.neutralObjectives.map(item=>({...item,blue:0,red:0}))};}
