import { lazy, Suspense } from 'react';
const App=lazy(()=>import('./BroadcastApp'));
const BpSimulator=lazy(()=>import('./simulator/BpSimulator').then(module=>({default:module.BpSimulator})));
const BpSimulatorControl=lazy(()=>import('./simulator/BpSimulatorControl').then(module=>({default:module.BpSimulatorControl})));
export default function BroadcastRoutes() {
  return <Suspense fallback={<p>正在加载 / Loading…</p>}>
    {location.pathname==='/tools/bp-simulator' ? <BpSimulator /> : location.pathname==='/tools/bp-simulator-control' ? <BpSimulatorControl /> : <App />}
  </Suspense>;
}
