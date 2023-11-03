<script setup>
import { ref,reactive,computed,watch,watchEffect,onMounted,nextTick,defineAsyncComponent} from "vue";
import Menu from "@/components/system/menu/menu.vue";
import {createProgress} from "@/system/progress"

import {showWindow,showDesktop} from "@/system/window";
import {exec,bus,initApp} from "@/App"
import {addApp,openAppList,data,windowList,progressList,activeAppPid,fileList} from "@/hooks";
import {init,getConfig} from "@/system"
import {dir_str,readFileAll,readFile,WebDir} from "@/utils/file"
await init()
initApp()
const config=getConfig()
console.log(`配置config:`,config);
const appList=ref([...data])
const bg=ref("")
const systemAppList=[]
try {
	readFileAll("/system-app").then(res=>{
		if(res.length===0){
			config['desktop']['system-app'].forEach(i=>{
				const systemDir=new WebDir(i.pwd,i.name)
				systemDir.init(i)
				systemAppList.push(systemDir)
				systemDir.save()
			})
		}else{
			systemAppList.push(...res)
		}
	})
} catch (error) {
	console.error("加载默认桌面app失败："+error)
}
let editFileName=""
function initList(){
	readFileAll(config.desktop.path).then(res=>{
		fileList[config.desktop.path]=res
		appList.value=[...systemAppList,...fileList[config.desktop.path]]
		appList.value.sort(({createTime:a},{createTime:b})=>a-b)
		// openApp(systemAppList[0])
	})
}
onMounted(()=>{
	bg.value=config.desktop.bg.base64||config.desktop.bg.url
	initList()
	// bus.on("update:app",(apps)=>{
	// 	appList.value=[...apps]
	// })
})
function select(el){
	if(document.body.createTextRange) {
		var range = document.body.createTextRange();
		range.moveToElementText(text);
		range.select();
	} else if (window.getSelection) {
		var selection = window.getSelection();
		var range = document.createRange();
		range.selectNodeContents(el);
		selection.removeAllRanges();
		selection.addRange(range);
	} else {
		alert("none");
	}
}
const vSelect = {
	mounted: select
}
const item=ref({})
const editFile=ref(null)

let title=ref("")
async function showMenu(e,i){
	const isName=await editNameBlue()
	if(!isName) return
	bus.emit("menu-show",{
		type:"menu",
		x:e.clientX,
		y:e.clientY
	})
	menuDatas.value.splice(0,menuDatas.value.length)
	if(item.value.edit){
		item.value.edit=false
	}
	if(title.value&&item.value.title){
		item.value.title=title.value
	}
	if(i){
		item.value=i
		// menuDatas.value.push(...i.menu(show))
		menuDatas.value.push({
			title:"打开",
			hander:()=>{
				createProgress(i.title,i.exec,"C:/用户/桌面","","a b ccc")
			}
		})
		menuDatas.value.push({
			title:"重命名",
			hander:()=>{
				let dir=i
				editFile.value=dir
				editFileName=dir.naem
			}
		})
	}else{
		item.value=""
	}
	menuDatas.value.push(...menuData)
}
const menuData=[
	{
		title:"新建文本",
		icon:`<?xml version="1.0" encoding="UTF-8"?><svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M40 23V14L31 4H10C8.89543 4 8 4.89543 8 6V42C8 43.1046 8.89543 44 10 44H22" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M33 29V43" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 36H33H40" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 4V14H40" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
		hander:()=>{
			createProgress(exec["notepad"].title,exec["notepad"].app,"C:/用户/桌面","")
		}
	},
	{
		title:"TEST文件夹",
		children:[
			{
				title:"文件夹111",
				children:[
					{
						title:"打开",
						hander:()=>{
							alert("打开")
						}
					}
				]
			}
		]
	},
	{
		title:"新建文件夹",
		icon:`<?xml version="1.0" encoding="UTF-8"?><svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 8C5 6.89543 5.89543 6 7 6H19L24 12H41C42.1046 12 43 12.8954 43 14V40C43 41.1046 42.1046 42 41 42H7C5.89543 42 5 41.1046 5 40V8Z" fill="none" stroke="#333" stroke-width="4" stroke-linejoin="round"/><path d="M43 22H5" stroke="#333" stroke-width="4" stroke-linejoin="round"/><path d="M5 16V28" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M43 16V28" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
		hander:()=>{
			// const app=addApp("explorer","文件管理器","","","")
			/**
			 创建文件夹
			 需要
			 当前位置
			 文件夹名称
			 */
			const pwd="/C/Desktop"
			const name="新建文件夹"
			let dir=new WebDir(pwd,name)
			dir.setIcon(dir_str)
			fileList[config.desktop.path].push(dir)
			editFile.value=dir
			editFileName=dir.naem
		}
	}
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
function editNameInput(e){
	editFileName=e.target.textContent;
}
const editNameRef=ref(null)
async function editNameBlue(){
	bus.emit("menu-close")
	if(editFile.value===null)return true
	let isFileExist=await readFile("/C/Desktop/"+editFileName)
	if(isFileExist&&editFile.value.uid===isFileExist.uid){

	}else if(isFileExist||!editFileName){

		alert("文件名无效或文件已存在")
		const el=editNameRef.value[0]
		if(el){
			nextTick(()=>{
				el.focus()
				select(el)
			})
		}
		return false
	}
	editFile.value.rename(editFileName)
	editFile.value=null
	initList()
	// fileList[config.desktop.path].sort(({createTime:a},{createTime:b})=>a-b)
	editFileName=""
	return true
}
function openApp(item){
	let app
	if(item.type==="WebDir"){
		app="Explorer"
	}else{
		app="Notepad"
	}
	createProgress(item.name,app,item.pwd,item.path)
}
const focusFile=ref(null)
async function focusApp(item){
	const isName=await editNameBlue()
	if(!isName) return
	focusFile.value=item
}
document.addEventListener("keydown",async (e)=>{
	if(e.code==="F2"){
		e.preventDefault()
		if(editFile.value)return 
		const isName=await editNameBlue()
		if(!isName) return
		if(focusFile.value){
			editFile.value=focusFile.value
			editFileName=editFile.value.name
		}
	}else if(e.code==="Tab"){
		const isName=await editNameBlue()
		if(!isName) return
		editFile.value=null
	}else if(e.code==="Enter"&&!e.shiftKey){
		e.preventDefault()
		const isName=await editNameBlue()
		if(!isName) return
		editFile.value=null
	}
})
</script>

<template>
	<div class="desktop" :style="{backgroundImage:`url(${bg})`}" @click="editNameBlue" @contextmenu.prevent="showMenu($event,{alias:'desktop'})" >
		<Menu :data="menuDatas"></Menu>
		<div class="app" @focus="focusApp(item)" v-for="(item,index) in appList" :key="item.path" :tabindex="index+1" @contextmenu.prevent.stop="showMenu($event,item)">
			<!-- <div class="box" @dblclick="createProgress(item.title,item.exec,item.pwd,item.targetPath,item.args)">
				<div class="icon" v-html="item.icon"></div>
				<div class="name" v-if="!item.edit">
					{{item.title}}
				</div>
				<div class="name editName" v-else v-focus v-text="data[index].title"
				 @input="editNameInput"
				 @click.stop
				 @dblclick.stop
				 contenteditable=""
				 v-select
				 ></div>
			</div> -->
			<div class="box" @dblclick="openApp(item)">
				<div class="icon">
					<div class="svg" v-html="item.icon"></div>
				</div>
				<!-- 可以优化为url这样多个svg就只有一个请求了 ，不过影响也不大吧-->
					<!-- <img width="24" height="24" src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNSA4QzUgNi44OTU0MyA1Ljg5NTQzIDYgNyA2SDE5TDI0IDEySDQxQzQyLjEwNDYgMTIgNDMgMTIuODk1NCA0MyAxNFY0MEM0MyA0MS4xMDQ2IDQyLjEwNDYgNDIgNDEgNDJIN0M1Ljg5NTQzIDQyIDUgNDEuMTA0NiA1IDQwVjhaIiBmaWxsPSJub25lIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik00MyAyMkg1IiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik01IDE2VjI4IiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0iTTQzIDE2VjI4IiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+" alt=""> -->
				<div ref="editNameRef" v-if="editFile&&editFile.uid===item.uid" class="name editName" v-focus v-text="item.name"
					@input="editNameInput"
					@click.stop
					@dblclick.stop
					contenteditable=""
					v-select
				 ></div>
				<div class="name" v-else>
					{{item.name}}
				</div>
			</div>
		</div>
		<div id="windows">
			<!-- <Notepad></Notepad>
			<Explorer></Explorer> -->
			<template v-for="(progress,index) in progressList" :key="progress.pid">
				<component :is="progress.exec" v-bind="progress" ref="app"></component>
			</template>
		</div>
		<div class="tab"><!-- v-show="progressList.length"-->
			<template v-for="(progress,index) in progressList" :key="progress.pid">
				<div v-if="windowList.find(i=>i.pid===progress.pid)" class="app_item" :class="{active_app:activeAppPid===progress.pid}" @click="showApp(progress.pid,index)">
					{{ progress.title }}
				</div>
			</template>
			<div class="showDesktop" @click="showDesktop"></div>
		</div>
	</div>
</template>

<style scoped src="./desktop.css"></style>