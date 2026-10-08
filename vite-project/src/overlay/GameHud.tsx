import type { MatchState, Side } from '../shared/types';
import { currentGame, displaySides } from '../shared/draftRules';
import { stageName } from '../shared/display';
import './gameHud.css';
export function GameHud({state}:{state:MatchState}){
  const zh=state.language==='zh',stats=state.liveGameStats;
  const [left,right]=displaySides(state);
  function team(side:Side){const data=state[`${side}Team`];return <div className={`game-hud-team ${side}`}>
    {data.logo&&<img className="game-hud-logo" src={data.logo} alt=""/>}<strong>{data.name}</strong>
    <span className="game-hud-series" aria-label={zh?'系列赛比分':'Series score'}>{state[`${side}Score`]}</span>
  </div>;}
  return <div className={`game-hud ${stats.density}`}>
    <header>{team(left)}<div className="game-hud-center"><b>{zh?'第':'Game '}{currentGame(state)}{zh?'局':''} · {state.seriesFormat}</b><small>{stageName(state.stage,state.language)}</small></div>{team(right)}</header>
    <div className="game-hud-stats"><span><b>{stats[`${left}Kills`]}</b> {zh?'人头':'Kills'} <b>{stats[`${right}Kills`]}</b></span>
      <span><b>{stats[`${left}Towers`]}</b> {zh?'推塔':'Towers'} <b>{stats[`${right}Towers`]}</b></span>
      {stats.density==='full'&&stats.neutralObjectives.map(item=><span key={item.id}><b>{item[left]}</b>{item.icon&&<img src={item.icon} alt=""/>}<em title={item.name}>{item.name}</em><b>{item[right]}</b></span>)}
    </div>
  </div>;
}
