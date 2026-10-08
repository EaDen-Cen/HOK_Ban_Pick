import type { MatchState, Side } from './types.js';

export const validPlayerSlotOrder = (value: unknown): value is number[] =>
  Array.isArray(value) && value.length === 5 && new Set(value).size === 5 &&
  value.every(index => Number.isInteger(index) && index >= 0 && index < 5);
export const normalizePlayerSlotOrder = (value: unknown) =>
  validPlayerSlotOrder(value) ? [...value] : [0,1,2,3,4];
export function playerAtSlot(state: MatchState, side: Side, slot: number) {
  const team = state[`${side}Team`];
  const index = normalizePlayerSlotOrder(state[`${side}PlayerSlotOrder`])[slot];
  return { index, id: team.players[index] || '', role: team.playerRoles[index], portrait: team.playerPortraits[index] || '' };
}

// Preserve punctuation for exact matching; confusion folding only affects similarity.
export const normalizePlayerText = (value: string) => value.normalize('NFKC').toLowerCase().replace(/\s/g,'');
function similarity(a: string, b: string) {
  if (!a || !b) return 0;
  const exactA = normalizePlayerText(a), exactB = normalizePlayerText(b);
  if (exactA === exactB) return 1;
  const fold = (value: string) => value.replace(/[0o]/g,'o').replace(/[1il|]/g,'l').replace(/[5s]/g,'s').replace(/[8b]/g,'b');
  const x = [...fold(exactA)], y = [...fold(exactB)];
  let row = y.map((_,i)=>i+1); row.unshift(0);
  for (let i=1;i<=x.length;i++) {
    const next=[i];
    for (let j=1;j<=y.length;j++) next[j]=Math.min(next[j-1]+1,row[j]+1,row[j-1]+(x[i-1]===y[j-1]?0:1));
    row=next;
  }
  return Math.max(0, 1-row[y.length]/Math.max(x.length,y.length)) * .96;
}
const permutations = (values: number[]): number[][] => values.length <= 1 ? [values] :
  values.flatMap((value,index)=>permutations(values.filter((_,i)=>i!==index)).map(rest=>[value,...rest]));
const orders = permutations([0,1,2,3,4]);
export interface PlayerSlotSolution { order: number[]; confidence: number[]; average: number; margin: number; automatic: boolean; anomalies: number[] }
/** Globally solve all 120 bijections, rejecting blank/out-of-roster and ambiguous IDs. */
export function solvePlayerSlots(texts: string[], players: string[], ocrConfidence: number[] = [1,1,1,1,1]): PlayerSlotSolution | undefined {
  if (texts.length !== 5 || players.length !== 5 || players.some(p=>!normalizePlayerText(p)) || new Set(players.map(normalizePlayerText)).size !== 5) return;
  const matrix = texts.map(text=>players.map(player=>similarity(text,player)));
  const ranked = orders.map(order=>{
    const confidence=order.map((index,slot)=>matrix[slot][index]);
    return {order,confidence,average:confidence.reduce((a,b)=>a+b,0)/5};
  }).sort((a,b)=>b.average-a.average);
  const best=ranked[0], margin=best.average-ranked[1].average;
  const anomalies=best.confidence.flatMap((score,i)=>score<.80 || (ocrConfidence[i]??0)<.65 ? [i] : []);
  // A confusion-equivalent ID must still beat the runner-up; two I/l/1 IDs fail safely.
  const confidence=best.confidence.map((score,index)=>Math.min(score,ocrConfidence[index]??0));
  const average=confidence.reduce((a,b)=>a+b,0)/5;
  return {...best,confidence,average,margin,anomalies,automatic:anomalies.length===0 && average>=.90 && margin>=.06};
}
