import { useState } from 'react';
export function RecoveryPanel({token,zh}:{token:string;zh:boolean}){
  const [message,setMessage]=useState(''),[busy,setBusy]=useState(false);
  const api=(import.meta.env.VITE_API_URL||'').replace(/\/$/,'');
  async function run(kind:'status'|'backup'|'export'){
    setBusy(true);
    try{
      const response=await fetch(api+(kind==='export'?'/api/match-export':'/api/recovery'),{method:kind==='backup'?'POST':'GET',headers:{Authorization:`Bearer ${token}`}});
      const data=await response.json();if(!response.ok)throw new Error(data.error);
      if(kind==='export'){
        const url=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:'application/json'}));
        const link=document.createElement('a');link.href=url;link.download=`hok-match-${Date.now()}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
        setMessage(zh?'比赛已导出，含阵容、每局映射、历史与上传照片。':'Match exported with rosters, player mappings, history and uploaded portraits.');
      }else setMessage(kind==='backup'?(zh?'备份已保存。':'Backup saved.'):(data.error||`${zh?'备份数量':'Backups'}: ${data.backups.length} · ${data.lastBackup||'—'}`));
    }catch(error){setMessage(error instanceof Error?error.message:'Recovery failed');}finally{setBusy(false);}
  }
  return <details className="panel"><summary>{zh?'备份与恢复':'Backup and recovery'}</summary><div className="toolbar">
    <button disabled={busy} onClick={()=>void run('status')}>{zh?'备份状态':'Backup status'}</button>
    <button disabled={busy} onClick={()=>void run('backup')}>{zh?'立即备份':'Back up now'}</button>
    <button disabled={busy} onClick={()=>void run('export')}>{zh?'导出比赛':'Export match'}</button>
  </div><p role="status">{message}</p><p className="muted">{zh?'后端每分钟检查变更，保留最近 20 份备份。恢复/导入前停止后端，再运行 npm run recovery -- restore <备份文件> 或 import <比赛文件>。':'The backend checks for changes every minute and keeps 20 backups. Stop it before running npm run recovery -- restore <backup> or import <match>.'}</p></details>;
}
