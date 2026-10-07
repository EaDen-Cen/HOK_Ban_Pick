import { useState } from 'react';
import { apiBase } from '../shared/access';
export function AccessSettings({token,onToken,zh}:{token:string;onToken:(token:string)=>void;zh:boolean}) {
  const [links,setLinks]=useState<Record<string,string>>({});
  const [password,setPassword]=useState('');
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const [publicURL,setPublicURL]=useState(()=>localStorage.getItem('hok-public-url')||'');
  return <section className="panel"><h2>{zh?'访问与网站设置':'Access and website settings'}</h2>
    <form onSubmit={async event=>{event.preventDefault();setBusy(true);setMessage('');try {
      const response=await fetch(`${apiBase}/api/access`,{method:'PUT',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({password})});
      const data=await response.json();if(!response.ok) throw new Error(data.error);
      onToken(data.token);setLinks({});setPassword('');setMessage(zh?'密码已保存，已连接页面同步更新。':'Password saved; connected pages updated.');
    }catch(error){setMessage(error instanceof Error?error.message:'Save failed');}finally{setBusy(false);}}}>
      <label>{zh?'远程访问密码（自动生成各端 token）':'Remote password (generates role tokens)'}<input type="password" minLength={8} maxLength={256} required autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/></label>
      <button disabled={busy}>{zh?'保存密码':'Save password'}</button>
    </form>
    <button type="button" onClick={async()=>{try {
      const response=await fetch(`${apiBase}/api/access`,{headers:{Authorization:`Bearer ${token}`}});
      const data=await response.json(); if(!response.ok||!data.tokens) throw new Error('Access settings unavailable');
      const base=(publicURL || location.origin).replace(/\/$/,'');
      setLinks({caster:`${base}/caster#token=${encodeURIComponent(data.tokens.caster)}`,overlay:`${base}/overlay/draft#token=${encodeURIComponent(data.tokens.overlay)}`});
    }catch(error){setMessage(error instanceof Error?error.message:'Could not load links');}}}>{zh?'生成只读分享链接':'Generate read-only sharing links'}</button>
    {Object.entries(links).map(([role,url])=><label key={role}>{role}<input readOnly value={url} onFocus={event=>event.currentTarget.select()}/></label>)}
    <label>{zh?'未来公网网址' :'Future public website URL'}<input type="url" placeholder="https://broadcast.example.com" value={publicURL} onChange={e=>{setPublicURL(e.target.value);localStorage.setItem('hok-public-url',e.target.value);}}/></label>
    <p className="muted">{zh?'本机 localhost / 127.0.0.1 由服务器验证后免登录；公网网址仅用于打开页面，部署仍需域名与服务器配置。':'Server-verified loopback access skips login. Public URL opens pages; hosting still requires domain and server configuration.'}</p>
    {/^https?:\/\//.test(publicURL)&&<div className="toolbar">{['control','caster','overlay/draft'].map(path=><a key={path} href={`${publicURL.replace(/\/$/,'')}/${path}`} target="_blank" rel="noreferrer">{path}</a>)}</div>}
    <p role="status">{message}</p>
  </section>;
}
