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

<style scoped src="./App.css"></style>