import { useCallback, useEffect, useState } from 'react';
import type { Role } from './types';
export const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/,'');
function savedToken(role: Role) {
  const fragment=new URLSearchParams(location.hash.slice(1)).get('token');
  if(fragment) { sessionStorage.setItem(`hok-${role}`,fragment); history.replaceState(null,'',location.pathname+location.search); }
  return fragment || sessionStorage.getItem(`hok-${role}`) || '';
}
export function useAccess(role: Role) {
  const [token,setToken]=useState(()=>savedToken(role));
  const [local,setLocal]=useState(false);
  const [checking,setChecking]=useState(true);
  const [accessError,setAccessError]=useState('');
  const saveToken=useCallback((value:string)=>{sessionStorage.setItem(`hok-${role}`,value);setToken(value);},[role]);
  useEffect(()=>{
    const abort=new AbortController();
    void fetch(`${apiBase}/api/access?role=${role}`,{signal:abort.signal,cache:'no-store'})
      .then(async response=>{if(!response.ok) throw new Error('Access service unavailable'); return response.json();})
      .then(data=>{setLocal(data.local===true);if(data.local&&data.token) saveToken(data.token);})
      .catch(error=>{if(!abort.signal.aborted) setAccessError(error.message);})
      .finally(()=>{if(!abort.signal.aborted) setChecking(false);});
    return()=>abort.abort();
  },[role,saveToken]);
  const login=async(password:string)=>{
    setAccessError('');
    try {
      const response=await fetch(`${apiBase}/api/access?role=${role}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});
      const data=await response.json();
      if(!response.ok) throw new Error(data.error);
      saveToken(data.token);
    }catch(error){setAccessError(error instanceof Error?error.message:'Login failed');}
  };
  return {token,saveToken,local,checking,accessError,login};
}
