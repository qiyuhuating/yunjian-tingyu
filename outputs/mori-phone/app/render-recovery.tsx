import {Component,type ReactNode} from 'react';
export default class RenderRecovery extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<main className="opening" role="alert"><h1>这一页暂时没能打开</h1><p>设备中的记录仍在。请先备份，再重新打开。</p><button className="primary" onClick={()=>void window.NativeRecoveryBackup?.()}>备份本页记录</button><button className="soft-button" onClick={()=>{if(confirm('重新打开会丢弃尚未保存的内容，确定已备份了吗？'))location.reload();}}>重新打开</button></main>:this.props.children;}
}
