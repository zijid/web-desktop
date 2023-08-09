<script setup>
import { ref,reactive,computed,watch,watchEffect,onMounted,nextTick,defineAsyncComponent} from "vue";
import Menu from "./components/menu/menu.vue"
import { addApp,data ,openAppList} from "./hooks";
import {createProgress,progressList,showWindow,activeAppPid,windowList,showDesktop,showCount} from "./hooks/system"
import { FUNCTION,DIR } from "./components/menu/type";
import { exec } from "./App"
import "./App.js"//初始化一些东西
// let nameName=defineAsyncComponent(()=>import("http://localhost/1.js"))
// console.log("nameName:",nameName);
const item=ref({})
const position=reactive({
	x:-1000,y:-1000
})
let title=ref("")

function showMenu(e,i){
	position.x=e.clientX
	position.y=e.clientY
	show.value=true
	menuDatas.value.splice(0,menuDatas.value.length)
	if(item.value.edit){
		item.value.edit=false
	}
	if(title.value&&item.value.title){
		item.value.title=title.value
	}
	if(i){
		item.value=i
		menuDatas.value.push(...i.menu(show))
		menuDatas.value.push({
			title:"重命名",
			type:FUNCTION,
			hander:()=>{
				item.value.edit=true
				title.value=item.value.title
				show.value=false
			}
		})
	}else{
		item.value=""
	}
	menuDatas.value.push(...menuData)
	console.log("menuDatas.value:",menuDatas.value);
}
const show=ref(true)
setTimeout(() => {
	show.value=true
}, 1000);
const menuData=[
	{
		title:"新建文本",
		type:FUNCTION,
		hander:()=>{
			createProgress(exec["notepad"].title,exec["notepad"].app,"C:/用户/桌面","","a b ccc")
			show.value=false
		}
	},
	{
		title:"新建文件夹",
		type:FUNCTION,
		hander:()=>{
			// createProgress(exec["explorer"].title,exec["explorer"].app,"C:/用户/桌面/新文件夹","","a b ccc")
			const app=addApp("explorer","文件管理器","","","")
			item.value=app
			app.edit=true
			title.value=app.title
			show.value=false
		}
	},
	// {
	// 	title:"新建",
	// 	type:DIR,
	// 	children:[
	// 		{
	// 			title:"文本",
	// 			type:FUNCTION,
	// 			hander:()=>{
	// 				addApp(FUNCTION,"文本")
	// 			}
	// 		},
	// 		{
	// 			title:"目录",
	// 			type:FUNCTION,
	// 			hander:()=>{
	// 				addApp(DIR,"文本")
	// 			}
	// 		},
	// 		{
	// 			title:"更多",
	// 			type:DIR,
	// 			children:[
	// 				{
	// 					title:"文本2",
	// 					type:DIR,
	// 					children:[
	// 						{
	// 							title:"文本3",
	// 							type:FUNCTION,
	// 							hander:()=>{
	// 								addApp("文本")
	// 							}
	// 						},
	// 						{
	// 							title:"目录3",
	// 							type:FUNCTION,
	// 							hander:()=>{
	// 								addApp("文本")
	// 							}
	// 						}
	// 					],
	// 				},
	// 				{
	// 					title:"目录2",
	// 					type:FUNCTION,
	// 					hander:()=>{
	// 						addApp("文本")
	// 					}
	// 				}
	// 			],
	// 		}
	// 	],
	// }
]
const menuDatas=ref([])
const app=ref([])
const activeAppIndex=ref(0)
nextTick(()=>{
	activeAppIndex.value=openAppList.length-1
})

function showApp(pid,index){
	showWindow(pid,"tab")
}
function rFun(fun){
	let st=false
	return ()=>{
		if(st){
			return
		}
		st=true
		return fun().then(r=>{
			st=false
		})
	}
}
function editNameInput(e){
	title.value=e.target.textContent;
}

function editNameBlue(){
	show.value=false;
	if(item.value.title &&title.value){
		item.value.title = title.value
		item.value.edit=false
		item.value={}
	}
}
</script>

<template>
	<div class="desktop" @click="editNameBlue" @contextmenu.prevent="showMenu($event,null)" >
		<Menu :data="menuDatas" :position="position" :show="show"></Menu>
		<!-- <div v-for="app in openAppList" :key="app.path">
			<Explorer v-if="app.exec===0" :path="app.path"></Explorer>
			<Notepad v-else :path="app.path"></Notepad>
		</div> -->
		<div class="app" v-for="(item,index) in data" :key="item.title" tabindex="1" @contextmenu.prevent.stop="showMenu($event,item)">
			<div class="box" @dblclick="createProgress(item.title,item.exec,item.pwd,item.targetPath,item.args)">
				<div class="icon" v-html="item.icon"></div>
				<div class="name" v-if="!item.edit">
					{{item.title}}
				</div>
				<div class="name" v-else v-focus v-text="data[index].title"
				 @input="editNameInput"
				 @click.stop
				 contenteditable=""
				 ></div>
				<!-- <textarea class="name" v-else v-focus v-model="data[index].title"
				 @click.stop="editNameInput"
				 @compositionstart="compositionstart"
				 @compositionend="compositionend"
				 contenteditable=""
				 rows="1"
				 ></textarea> -->
				 
			</div>
		</div>
		<!-- <div class="app" tabindex="1">
			<div class="box">
				<div class="icon">
					<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 8C5 6.89543 5.89543 6 7 6H19L24 12H41C42.1046 12 43 12.8954 43 14V40C43 41.1046 42.1046 42 41 42H7C5.89543 42 5 41.1046 5 40V8Z" fill="none" stroke="#333" stroke-width="4" stroke-linejoin="round"/><path d="M43 22H5" stroke="#333" stroke-width="4" stroke-linejoin="round"/><path d="M5 16V28" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M43 16V28" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>
				</div>
				<div class="name" contenteditable="" v-focus style="">
					11111111111111111111111111111111111111111
				</div>
			</div>
		</div> -->
		<div id="windows">
			<template v-for="(progress,index) in progressList" :key="progress.pid">
				<component :is="progress.exec" v-bind="progress" ref="app"></component>
			</template>
		</div>
		<div class="tab" v-show="progressList.length">
			<!-- <template v-for="(app,index) in openAppList" :key="app.path">
					<Explorer v-if="app.exec===0" :path="app.path" :pid="app.pid" ref="app"></Explorer>
					<Notepad v-else :path="app.path" :pid="app.pid" ref="app"></Notepad>
					<div class="app_item" :class="{active_app:activeAppIndex===index}" @click="showApp(index)">
					{{ app.exec }}
				</div>
			</template> -->
			<template v-for="(progress,index) in progressList" :key="progress.pid">
				<div v-if="windowList.find(i=>i.pid===progress.pid)" class="app_item" :class="{active_app:activeAppPid===progress.pid}" @click="showApp(progress.pid,index)">
					{{ progress.title }}
				</div>
			</template>
			<div class="showDesktop" @click="showDesktop"></div>
		</div>
	</div>
	<!-- <div v-cloak>
		加载中...
	</div> -->
</template>
<style>
body{
	background-image: url(/bg.png);
	background-repeat: no-repeat;
	overflow: hidden;
	margin: 0;
	height: 100vh;
	position: fixed;
}
</style>
<style scoped>
/* [v-cloak] {
	position: fixed;
	z-index: 999;
	inset: 0;
	background-color: red;
} */
.desktop{
	--size:12px;
	--line-height:14px;
	--tab-height:40px;
	display: flex;
	flex-direction: column;
	flex-wrap: wrap;
    align-content: flex-start;
	width: 100vw;
	height: 100vh;
	overflow: hidden;
	padding-bottom: var(--tab-height);
}

.showDesktop{
    position: fixed;
	bottom: 0;
    right: 0;
    width: 10px;
	height:var(--tab-height);
	background: #3a3a3a;
    box-shadow: -1px 0px 1px #ffffff57;
}
.showDesktop:hover{
	background-color: #ffffff3a;
}
.tab{
	width: 100%;
	height:var(--tab-height);
	background-color: #0000007a;
	position: fixed;
	bottom: 0;
	display: flex;
	flex-direction: row;
	z-index: 9;
	overflow-x: auto;
	overflow-y: hidden;
	padding-right: 10px;
}
.tab::-webkit-scrollbar{/*整个滚动条  https://m.php.cn/article/480425.html*/
    width: 0px;
	height: 0px;
    background-color: rgb(199, 199, 199);
}
.app_box{
	position: fixed;
}
.app_item{
	padding:0 1em;
	line-height:var(--tab-height);
	box-sizing: border-box;
	color: #fff;
	border-bottom: 2px inset #ffbb29;
	cursor: default;
	user-select: none;
	margin:0 10px;
	transition: padding 0.1s, margin 0.1s;
}
.app_item:hover{
	background-color: rgba(240, 240, 240, 0.2);
	margin:0;
	padding:0 calc( 1em + 10px );
}
.app_item:active{
	background-color: rgba(240, 240, 240, 0.4);
}
.active_app{
	background-color: rgba(240, 240, 240, 0.5);
	margin:0;
	padding:0 calc( 1em + 10px );
}
.app{
	width: 80px;
	height: calc( 60px + var(--line-height) *2 + 8px);
	margin: 10px;
	box-sizing: border-box;
	position: relative;

}
.box{
	width: 80px;
	height: 100%;
	padding: 4px 0;
	box-sizing: border-box;

}
.icon{
	width: 60px;
	height: 60px;
	margin: 0 auto;
	display: flex;
    align-items: center;
    justify-content: center;
	filter: drop-shadow(1px 1px 1px #fff);
}
.name{
	width: 100%;
	height: calc(var(--line-height) * 2);
	line-height: var(--line-height);
	text-align: center;
	font-size: var(--size);
	overflow: hidden;
	text-overflow: ellipsis;
	-webkit-line-clamp: 2; 
	display: -webkit-box; 
	-webkit-box-orient: vertical; 
    color: #fff;
	cursor: default;
	text-shadow: 1px 1px #000;
	user-select: none;
	resize: none;
	word-break: break-word;
}
.name:focus{
	min-width: 2em;
	margin:  0 auto;
	outline: dotted 1px #000000;
	background-color: #fff;
	color: #000;
	width: fit-content;
	height: auto !important;
	text-shadow: none;
	max-width: 100%;
	-webkit-line-clamp: unset; 
	overflow:unset;
	position: relative;
	z-index: 20;
}
.app:focus .box{
	height: auto;
	outline: dotted 2px #ffbb29;
	background-color: rgba(255, 255, 255, 0.205);
	position: relative;
	z-index: 1;
}
.app:focus .name{
	height: auto;
	display:block; 
}
</style>
