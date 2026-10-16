(function(command) {
  try {
    const visible = el => {const rect=el.getBoundingClientRect();return el.isConnected && rect.width>0 && rect.height>0 && rect.bottom>0 && rect.right>0 && rect.top<innerHeight && rect.left<innerWidth && getComputedStyle(el).visibility !== 'hidden';};
    const controls = () => Array.from(document.querySelectorAll('a[href],button,input,textarea,select,[role="button"],[contenteditable="true"]')).filter(visible).slice(0,150);
    const snapshot = () => ({url:location.href,title:document.title.slice(0,300),text:(document.body?.innerText || '').slice(0,24000),
      elements:controls().map((el,index) => ({id:index,tag:el.tagName.toLowerCase(),type:el.getAttribute('type') || '',
        label:(el.getAttribute('aria-label') || el.labels?.[0]?.innerText || el.innerText || el.getAttribute('placeholder') || el.getAttribute('name') || '').slice(0,180),
        href:el.tagName === 'A' ? el.href.slice(0,2000) : undefined,disabled:!!el.disabled,
        options:el.tagName === 'SELECT' ? Array.from(el.options).slice(0,50).map(o=>({value:o.value.slice(0,200),text:o.text.slice(0,100)})) : undefined}))});
    if(command.action === 'read') return JSON.stringify({ok:true,page:snapshot()});
    if(location.href !== command.url) throw Error('页面地址已改变，请重新读取');
    if(command.action === 'scroll') { window.scrollBy(0,Math.max(-1500,Math.min(1500,command.amount || 600))); return JSON.stringify({ok:true}); }
    const el=controls()[command.target];
    if(!el || el.disabled) throw Error('控件不存在或已停用，请重新读取');
    // The read-time fingerprint prevents acting on a different control after a DOM update.
    const fingerprint=snapshot().elements[command.target];
    if(JSON.stringify(fingerprint) !== JSON.stringify(command.element)) throw Error('页面控件已改变，请重新读取');
    el.scrollIntoView({block:'center'});
    if(command.action === 'click') {
      if(el.tagName === 'INPUT' && ['file','password'].includes(el.type)) throw Error('文件选择和密码输入请由用户完成');
      el.click();
    } else if(command.action === 'fill') {
      if(el.isContentEditable){el.textContent=command.value;el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:command.value}));el.dispatchEvent(new Event('change',{bubbles:true}));return JSON.stringify({ok:true});}
      if(!['INPUT','TEXTAREA'].includes(el.tagName) || ['file','password','hidden','submit','button','checkbox','radio'].includes(el.type) || el.readOnly) throw Error('此控件不能自动填写');
      const descriptor=Object.getOwnPropertyDescriptor(el.tagName === 'INPUT' ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype,'value');
      descriptor.set.call(el,command.value);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));
    } else if(command.action === 'select') {
      if(el.tagName !== 'SELECT' || !Array.from(el.options).some(o => o.value === command.value)) throw Error('选项不存在');
      el.value=command.value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));
    } else if(command.action === 'download') {
      if(el.tagName !== 'A' || !/^https?:$/.test(new URL(el.href).protocol)) throw Error('只能下载页面中明确的 HTTP/HTTPS 链接');
      return JSON.stringify({ok:true,downloadUrl:el.href});
    } else throw Error('不支持的网页操作');
    return JSON.stringify({ok:true});
  } catch(error) { return JSON.stringify({ok:false,error:String(error.message || error)}); }
})
