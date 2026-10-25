import Workspace from '../workspace-v2';
import {notFound} from 'next/navigation';
export default async function Page({params}:{params:Promise<{screen:string}>}){const {screen}=await params;if(!['atlas','corpus','surface','scan','smt','tape','formula','log','settings','portfolio'].includes(screen))notFound();return <Workspace initialScreen={screen}/>}
