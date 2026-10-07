let sharedStream:MediaStream|undefined;
const listeners=new Set<(stream:MediaStream|undefined)=>void>();

export function getSharedWindowCaptureStream(){
  return sharedStream;
}

export function setSharedWindowCaptureStream(stream:MediaStream|undefined){
  if(sharedStream===stream) return;
  sharedStream=stream;
  for(const listener of listeners) listener(stream);
}

export function subscribeSharedWindowCapture(listener:(stream:MediaStream|undefined)=>void){
  listeners.add(listener);
  return()=>listeners.delete(listener);
}
