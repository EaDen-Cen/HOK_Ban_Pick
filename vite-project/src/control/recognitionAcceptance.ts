/** Only called after stable-frame and lock checks. Scores are similarities, not calibrated probabilities. */
export function shouldAutoAcceptRecognition(enabled:boolean|undefined,threshold:number|undefined,scores:readonly number[]) {
  const minimum=threshold ?? 90;
  return enabled===true && Number.isInteger(minimum) && minimum>=50 && minimum<=100 && scores.length>0 && scores.every(score=>Number.isFinite(score)&&score<=1&&score*100>minimum);
}
