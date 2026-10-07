import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
/** Keep capture geometry in a fixed design space; scale the entire canvas together. */
export function ViewportCanvas({children,width=1920,height=1080,className=''}:{children:ReactNode;width?:number;height?:number;className?:string}) {
  const viewport=useRef<HTMLDivElement>(null);
  const [scale,setScale]=useState(1);
  useLayoutEffect(()=>{
    const element=viewport.current;if(!element) return;
    const fit=()=>setScale(Math.min(element.clientWidth/width,element.clientHeight/height));
    fit();const observer=new ResizeObserver(fit);observer.observe(element);
    return()=>observer.disconnect();
  },[width,height]);
  return <div ref={viewport} className="viewport-canvas"><div className={className} style={{position:'absolute',width,height,left:'50%',top:'50%',transform:`translate(-50%,-50%) scale(${scale})`,transformOrigin:'center'}}>{children}</div></div>;
}
