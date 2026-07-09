import{_ as rt,x as ut,o as u,c as vt,q as G,s as m,e,d as p,t as $,f as M,h as D,i,y as E,v as h,z as Z,A as pt,r as q,F as J,B as ct,C as j,W as mt,k as o,D as O,G as L,H as R,I as U,J as K,K as ht,L as ft,M as bt}from"./index-f760bb7a.js";const wt={class:"creator"},kt={class:"top-bar"},gt={class:"tabs"},xt=["disabled"],yt={class:"tab-content form-tab"},Ct={class:"form-grid"},$t={class:"field"},_t={class:"field"},Vt={class:"field"},Mt={class:"radio-group"},Ht={class:"field"},At={class:"icon-row"},St={class:"field-row"},Tt={class:"field"},Lt={class:"field"},Ut={class:"field"},Bt={class:"field"},Wt={class:"field"},It={class:"tab-content editor-tab"},zt={class:"editor-toolbar"},Dt={class:"file-label"},Et={class:"editor-actions"},jt={class:"editor-wrap"},Ot={class:"line-numbers"},Rt={class:"tab-content saved-tab"},Pt={key:0,class:"empty-state"},Nt={key:1,class:"app-list"},Ft={class:"card-icon"},Yt={class:"card-body"},Gt={class:"card-name"},Zt={class:"card-id"},qt={class:"card-actions"},Jt=["onClick"],Kt=["onClick"],Qt=["onClick"],Xt={__name:"index",props:{title:{type:String,default:"新软件制作工具"},pid:{type:Number,default:0},path:{type:String,default:""}},setup(P){const f=o("myapp"),_=o("我的应用"),s=o("html"),H=o("📦"),A=o("emoji"),B=o(""),k=o(55),g=o(65),x=o(300),y=o(200),V=o(""),v=o("form"),a=o(""),N=o(""),W=o([]);function S(){W.value=Object.values(O())}S();const I=ut(()=>A.value==="svg"?B.value:H.value);function Q(){const l=f.value.trim(),t=_.value.trim();if(!l||!t){alert("请填写应用ID和名称");return}const n=V.value.split(/[,，]/).map(d=>d.trim()).filter(Boolean);n.length&&n.map(d=>`'${d}'`).join(", "),s.value==="html"?X(l,t):tt(l,t),v.value="editor"}function X(l,t,n,d){const w=I.value,c=`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
      padding: 24px;
      color: #333;
      background: #f9f9f9;
    }
    h1 { color: #0078d4; }
  </style>
</head>
<body>
  <h1>${t}</h1>
  <p>请编辑此 HTML 来构建你的应用。</p>
  <div id="app"></div>
</body>
</html>`;a.value=c,N.value=`  if (!getApp('${l}')) {
    registerApp('${l}', {
      name: '${t}',
      icon: '${w}',
      url: '/apps/${l}/index.html',
      windowWidth: ${k.value},
      windowHeight: ${g.value},
      minWidth: ${x.value},
      minHeight: ${y.value}
    })
  }`}function tt(l,t,n,d){const w=I.value,c=`<!-- ${l}/index.vue -->
<script setup>
/**
 * ${t}
 */
import { ref, inject } from 'vue'

const appContext = inject('appContext', {})
console.log('${t} 已启动', appContext)

const count = ref(0)
<\/script>

<template>
  <Win :pid="pid" :path="path">
    <template #title>新软件制作工具</template>
  <div class="${l}-app">
    <h2>${t}</h2>
    <p>应用 ID: ${l}</p>
    <button class="btn" @click="count++">
      点击了 {{ count }} 次
    </button>
  </div>
</template>

<style scoped>
.${l}-app {
  padding: 24px;
  font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
}
h2 { color: #0078d4; }
.btn {
  background: #0078d4; color: #fff; border: none;
  padding: 8px 20px; border-radius: 4px; cursor: pointer;
  margin-top: 12px;
}
.btn:hover { background: #106ebe; }
</style>`;a.value=c;const C="";N.value=`  if (!getApp('${l}')) {
    const comp = (await import('@/apps/${l}/index.vue')).default
    registerApp('${l}', {
      name: '${t}',
      icon: '${w}',
      component: comp,${C}
      windowWidth: ${k.value},
      windowHeight: ${g.value},
      minWidth: ${x.value},
      minHeight: ${y.value}
    })
  }`}async function F(){const l=f.value.trim(),t=_.value.trim(),n=I.value,d=new Blob([a.value],{type:"text/html"}),w=URL.createObjectURL(d);if(L(l)){try{const r=L(l);r.url&&r.url.startsWith("blob:")&&URL.revokeObjectURL(r.url)}catch{}R(l)}ht(l,{name:t,icon:n,url:w,windowWidth:k.value,windowHeight:g.value,minWidth:x.value,minHeight:y.value,extensions:V.value.split(/[,，]/).map(r=>r.trim()).filter(Boolean),_customHtml:a.value});const c=K().desktop.path,C=new ft(c,l);C.uid=l,C.nickname=t,C.icon=n,C._appId=l,await C.save();const{initList:at}=await U(()=>import("./index-f760bb7a.js").then(r=>r.Z),["./index-f760bb7a.js","./index-aeaff3d1.css"],import.meta.url);await at(c),bt(l,{name:t,icon:n,html:a.value,windowWidth:k.value,windowHeight:g.value,minWidth:x.value,minHeight:y.value,extensions:V.value.split(/[,，]/).map(r=>r.trim()).filter(Boolean),menu:[{title:"打开",hander:()=>j(l,{title:t})}]});const{rebuildAssociations:dt}=await U(()=>import("./index-f760bb7a.js").then(r=>r.$),["./index-f760bb7a.js","./index-aeaff3d1.css"],import.meta.url);dt(),S()}async function et(){if(s.value!=="html"){alert("目前仅支持 HTML 类型应用的即时保存。");return}if(!a.value.trim()){alert("请先生成代码");return}(L(f.value.trim())||Y(f.value.trim()))&&!confirm("应用 "+f.value.trim()+" 已存在，确定覆盖吗？")||(await F(),b.value="✅ 已保存",T.value="success",setTimeout(()=>b.value="",2e3))}async function nt(){if(s.value!=="html"){alert("目前仅支持 HTML 类型应用的即时保存和启动。");return}if(!a.value.trim()){alert("请先生成代码");return}const l=f.value.trim(),t=_.value.trim();(L(l)||Y(l))&&!confirm("应用 "+l+" 已存在，确定覆盖吗？")||(await F(),b.value="✅ 已保存！正在启动...",T.value="success",setTimeout(()=>{j(l,{title:t}),b.value=""},500))}async function lt(l){if(confirm(`确定删除应用 "${l}" 吗？`)){R(l);try{const{initList:t}=await U(()=>import("./index-f760bb7a.js").then(c=>c.Z),["./index-f760bb7a.js","./index-aeaff3d1.css"],import.meta.url),n=K().desktop.path,{readFile:d}=await U(()=>import("./index-f760bb7a.js").then(c=>c.Y),["./index-f760bb7a.js","./index-aeaff3d1.css"],import.meta.url),w=await d(n+"/"+l);w&&(await w.delete(),await t(n))}catch(t){console.warn("清除桌面快捷方式失败",t)}S(),b.value=`已删除 "${l}"`,T.value="info",setTimeout(()=>b.value="",2e3)}}function Y(l){return O()[l]||null}function ot(l){const n=O()[l];n&&(f.value=n.id,_.value=n.name,H.value=n.icon,k.value=n.windowWidth,g.value=n.windowHeight,x.value=n.minWidth,y.value=n.minHeight,V.value=(n.extensions||[]).join(", "),s.value="html",R(l),a.value=n.html,v.value="editor")}const b=o(""),T=o("");function it(l){navigator.clipboard.writeText(l).catch(()=>{const t=document.createElement("textarea");t.value=l,document.body.appendChild(t),t.select(),document.execCommand("copy"),document.body.removeChild(t)})}const z=o("");function st(l,t){it(l),z.value=t,setTimeout(()=>z.value="",1500)}return(l,t)=>(u(),vt(mt,{pid:P.pid,path:P.path},{title:G(()=>[...t[17]||(t[17]=[m("新软件制作工具",-1)])]),default:G(()=>[e("div",wt,[b.value?(u(),p("div",{key:0,class:M(["status-bar",T.value])},$(b.value),3)):D("",!0),e("div",kt,[e("div",gt,[e("button",{class:M({active:v.value==="form"}),onClick:t[0]||(t[0]=n=>v.value="form")},[...t[18]||(t[18]=[e("svg",{width:"16",height:"16",viewBox:"0 0 48 48",fill:"none"},[e("path",{d:"M38 4H10C7 4 6 5 6 8v6h36V8c0-3-1-4-4-4z",fill:"none",stroke:"currentColor","stroke-width":"4"}),e("path",{d:"M6 14v26c0 3 1 4 4 4h28c3 0 4-1 4-4V14H6z",fill:"none",stroke:"currentColor","stroke-width":"4"})],-1),m(" 应用定义 ",-1)])],2),e("button",{class:M({active:v.value==="editor"}),onClick:t[1]||(t[1]=n=>v.value="editor"),disabled:!a.value},[...t[19]||(t[19]=[e("svg",{width:"16",height:"16",viewBox:"0 0 48 48",fill:"none"},[e("path",{d:"M34 6H14C9 6 6 9 6 14V34C6 39 9 42 14 42H34C39 42 42 39 42 34V14C42 9 39 6 34 6Z",fill:"none",stroke:"currentColor","stroke-width":"4"}),e("path",{d:"M27 16L33 24L27 32",stroke:"currentColor","stroke-width":"4","stroke-linecap":"round"}),e("path",{d:"M21 16L15 24L21 32",stroke:"currentColor","stroke-width":"4","stroke-linecap":"round"})],-1),m(" 代码编辑器 ",-1)])],10,xt),e("button",{class:M({active:v.value==="saved"}),onClick:t[2]||(t[2]=n=>{v.value="saved",S()})},[...t[20]||(t[20]=[e("svg",{width:"16",height:"16",viewBox:"0 0 48 48",fill:"none"},[e("path",{d:"M24 44C35 44 44 35 44 24S35 4 24 4 4 13 4 24s9 20 20 20z",fill:"none",stroke:"currentColor","stroke-width":"4"}),e("path",{d:"M24 16v12",stroke:"currentColor","stroke-width":"4","stroke-linecap":"round"}),e("circle",{cx:"24",cy:"32",r:"2",fill:"currentColor"})],-1),m(" 已保存的应用 ",-1)])],2)])]),i(e("div",yt,[e("div",Ct,[e("div",$t,[t[21]||(t[21]=e("label",null,[m("应用 ID "),e("span",{class:"hint"},"（唯一标识，如 mytool）")],-1)),i(e("input",{"onUpdate:modelValue":t[3]||(t[3]=n=>f.value=n),placeholder:"myapp"},null,512),[[h,f.value]])]),e("div",_t,[t[22]||(t[22]=e("label",null,[m("应用名称 "),e("span",{class:"hint"},"（显示在桌面和菜单）")],-1)),i(e("input",{"onUpdate:modelValue":t[4]||(t[4]=n=>_.value=n),placeholder:"我的应用"},null,512),[[h,_.value]])]),e("div",Vt,[t[25]||(t[25]=e("label",null,"应用类型",-1)),e("div",Mt,[e("label",{class:M(["radio-label",{active:s.value==="html"}])},[i(e("input",{type:"radio","onUpdate:modelValue":t[5]||(t[5]=n=>s.value=n),value:"html"},null,512),[[Z,s.value]]),t[23]||(t[23]=m(" HTML（可即时预览） ",-1))],2),e("label",{class:M(["radio-label",{active:s.value==="vue"}])},[i(e("input",{type:"radio","onUpdate:modelValue":t[6]||(t[6]=n=>s.value=n),value:"vue"},null,512),[[Z,s.value]]),t[24]||(t[24]=m(" Vue 组件 ",-1))],2)])]),e("div",Ht,[t[27]||(t[27]=e("label",null,"图标",-1)),e("div",At,[i(e("select",{"onUpdate:modelValue":t[7]||(t[7]=n=>A.value=n),class:"icon-select"},[...t[26]||(t[26]=[e("option",{value:"emoji"},"Emoji",-1),e("option",{value:"svg"},"SVG",-1)])],512),[[pt,A.value]]),A.value==="emoji"?i((u(),p("input",{key:0,"onUpdate:modelValue":t[8]||(t[8]=n=>H.value=n),placeholder:"📦",class:"icon-input"},null,512)),[[h,H.value]]):i((u(),p("textarea",{key:1,"onUpdate:modelValue":t[9]||(t[9]=n=>B.value=n),placeholder:"粘贴 SVG 代码...",rows:"2",class:"icon-svg"},null,512)),[[h,B.value]])])]),e("div",St,[e("div",Tt,[t[28]||(t[28]=e("label",null,"宽 (%)",-1)),i(e("input",{"onUpdate:modelValue":t[10]||(t[10]=n=>k.value=n),type:"number",min:"20",max:"100"},null,512),[[h,k.value,void 0,{number:!0}]])]),e("div",Lt,[t[29]||(t[29]=e("label",null,"高 (%)",-1)),i(e("input",{"onUpdate:modelValue":t[11]||(t[11]=n=>g.value=n),type:"number",min:"20",max:"100"},null,512),[[h,g.value,void 0,{number:!0}]])]),e("div",Ut,[t[30]||(t[30]=e("label",null,"最小宽(px)",-1)),i(e("input",{"onUpdate:modelValue":t[12]||(t[12]=n=>x.value=n),type:"number",min:"200"},null,512),[[h,x.value,void 0,{number:!0}]])]),e("div",Bt,[t[31]||(t[31]=e("label",null,"最小高(px)",-1)),i(e("input",{"onUpdate:modelValue":t[13]||(t[13]=n=>y.value=n),type:"number",min:"150"},null,512),[[h,y.value,void 0,{number:!0}]])])]),e("div",Wt,[t[32]||(t[32]=e("label",null,[m("扩展名关联 "),e("span",{class:"hint"},"逗号分隔，如 txt,md")],-1)),i(e("input",{"onUpdate:modelValue":t[14]||(t[14]=n=>V.value=n),placeholder:"txt, md"},null,512),[[h,V.value]])])]),e("div",{class:"actions"},[e("button",{class:"btn-primary",onClick:Q},"生成代码 → 进入编辑器")])],512),[[E,v.value==="form"]]),i(e("div",It,[e("div",zt,[e("span",Dt,$(s.value==="html"?"index.html":"index.vue"),1),e("div",Et,[e("button",{class:"btn-sm",onClick:t[15]||(t[15]=n=>st(a.value,"code"))},$(z.value==="code"?"已复制 ✓":"复制代码"),1),s.value==="html"?(u(),p("button",{key:0,class:"btn-sm",onClick:et},"保存")):D("",!0),s.value==="html"?(u(),p("button",{key:1,class:"btn-sm btn-preview",onClick:nt},[...t[33]||(t[33]=[e("svg",{width:"14",height:"14",viewBox:"0 0 48 48",fill:"none"},[e("path",{d:"M24 44c11 0 20-9 20-20S35 4 24 4 4 13 4 24s9 20 20 20z",fill:"none",stroke:"currentColor","stroke-width":"4"}),e("path",{d:"M20 16l12 8-12 8V16z",fill:"currentColor"})],-1),m(" 保存并启动 ",-1)])])):D("",!0)])]),e("div",jt,[e("div",Ot,[(u(!0),p(J,null,q(a.value.split(`
`).length,n=>(u(),p("div",{key:n,class:"ln"},$(n),1))),128))]),i(e("textarea",{"onUpdate:modelValue":t[16]||(t[16]=n=>a.value=n),class:"code-input",spellcheck:"false",wrap:"off"},null,512),[[h,a.value]])])],512),[[E,v.value==="editor"]]),i(e("div",Rt,[W.value.length===0?(u(),p("div",Pt,[...t[34]||(t[34]=[e("svg",{width:"48",height:"48",viewBox:"0 0 48 48",fill:"none"},[e("path",{d:"M24 44c11 0 20-9 20-20S35 4 24 4 4 13 4 24s9 20 20 20z",fill:"none",stroke:"#ccc","stroke-width":"4"}),e("path",{d:"M24 16v12",stroke:"#ccc","stroke-width":"4","stroke-linecap":"round"}),e("circle",{cx:"24",cy:"32",r:"2",fill:"#ccc"})],-1),e("p",null,"还没有已保存的应用",-1),e("p",{class:"hint"},'先在"应用定义"中填写信息，生成代码后保存即可',-1)])])):(u(),p("div",Nt,[(u(!0),p(J,null,q(W.value,n=>(u(),p("div",{key:n.id,class:"app-card"},[e("div",Ft,$(n.icon),1),e("div",Yt,[e("div",Gt,$(n.name),1),e("div",Zt,$(n.id),1)]),e("div",qt,[e("button",{class:"btn-icon",title:"启动",onClick:d=>ct(j)(n.id,{title:n.name})},[...t[35]||(t[35]=[e("svg",{width:"16",height:"16",viewBox:"0 0 48 48",fill:"none"},[e("path",{d:"M20 16l12 8-12 8V16z",fill:"#0078d4"})],-1)])],8,Jt),e("button",{class:"btn-icon",title:"编辑",onClick:d=>ot(n.id)},[...t[36]||(t[36]=[e("svg",{width:"16",height:"16",viewBox:"0 0 48 48",fill:"none"},[e("path",{d:"M40 33l2 2-5 5-2-2",fill:"none",stroke:"#666","stroke-width":"4","stroke-linecap":"round"}),e("path",{d:"M30 6H10C8 6 6 8 6 10v28c0 2 2 4 4 4h12",fill:"none",stroke:"#666","stroke-width":"4"}),e("path",{d:"M22 26l12-12 4 4-12 12-4-4z",fill:"none",stroke:"#666","stroke-width":"4"})],-1)])],8,Kt),e("button",{class:"btn-icon",title:"删除",onClick:d=>lt(n.id)},[...t[37]||(t[37]=[e("svg",{width:"16",height:"16",viewBox:"0 0 48 48",fill:"none"},[e("path",{d:"M12 38l-2-26h28l-2 26H12z",fill:"none",stroke:"#e00","stroke-width":"4"}),e("path",{d:"M20 30V18",stroke:"#e00","stroke-width":"4","stroke-linecap":"round"}),e("path",{d:"M28 30V18",stroke:"#e00","stroke-width":"4","stroke-linecap":"round"}),e("path",{d:"M8 12h32",stroke:"#e00","stroke-width":"4","stroke-linecap":"round"})],-1)])],8,Qt)])]))),128))]))],512),[[E,v.value==="saved"]])])]),_:1},8,["pid","path"]))}},ee=rt(Xt,[["__scopeId","data-v-2ddec01d"]]);export{ee as default};
