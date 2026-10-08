import type { MatchState } from '../shared/types';
import { heroForState } from '../shared/heroData';
import { highlightStats, postGameMetricLabel, reliableField, type PostGameMetric } from '../shared/postGame';
import './mvpOverlay.css';
export function MvpOverlay({state}:{state:MatchState}){
  const report=state.postGameReports.find(r=>r.id===state.activePostGameReportId),zh=state.language==='zh';
  const player=report?.players.find(p=>p.rowId===report.selectedMvpRowId);
  if(!player||!report)return null;
  const hero=heroForState(state,player.heroId);
  const value=(key:PostGameMetric)=>reliableField(player.fields[key])?player.fields[key]!.value.toLocaleString(): '—';
  return <article className={`mvp-card ${player.side}`}>
    <div className="mvp-portrait">{player.portrait?<img src={player.portrait} alt={player.playerId}/>:<div className="mvp-portrait-placeholder">{player.playerId.slice(0,2).toUpperCase()||`P${player.slot+1}`}</div>}<span>MVP</span></div>
    <div className="mvp-details"><small>{report.stage} · {zh?'第':'Game '}{report.gameNumber}{zh?'局':''} · {report.seriesFormat}</small>
      <p>{player.teamName}</p><h1>{player.playerId||`P${player.slot+1}`}</h1>
      <div className="mvp-hero">{hero&&<img src={hero.imageLink} alt=""/>}<b>{zh?hero?.chineseName:hero?.englishName}</b></div>
      <div className="mvp-kda"><b>{value('kills')} / {value('deaths')} / {value('assists')}</b><span>K / D / A</span><b>{value('rating')}</b><span>{zh?'游戏评分':'Rating'}</span></div>
      <div className="mvp-highlights">{highlightStats(player).map(({key,field})=><div key={key}><b>{field.value.toLocaleString()}{['damageShare','participation'].includes(key)?'%':''}</b><span>{postGameMetricLabel(key,zh)}</span></div>)}</div>
    </div>
  </article>;
}
