<script setup>
import { ref,reactive,computed,watch,watchEffect,onMounted,nextTick,defineAsyncComponent} from "vue";
import Menu from "@/components/system/menu/menu.vue";
import {createProgress} from "@/system/progress"
import AppFrame from "@/system/apps/AppFrame.vue"
import Window from "@/components/window/window.vue"

import {showWindow,showDesktop} from "@/system/window";
import {closeWindow as sysCloseWindow} from "@/system/window";
import {exec,bus,initApp,initAppSystem} from "@/App"
import {addApp,openAppList,data,windowList,progressList,activeAppPid,fileList,selectList} from "@/hooks";
import {init,getConfig} from "@/system"
import * as system from "@/system"
import {dir_str,my_computer,readFileAll,readFile,WebDir,WebFile} from "@/utils/file"
import { getAllApps, getApp, launchApp } from "@/system/apps"

// 自定义指令：自动聚焦 contenteditable 并将光标移到末尾
const vFocus = {
  mounted(el) {
    el.focus()
    const range = document.createRange()
    const sel = window.getSelection()
    range.selectNodeContents(el)
    range.collapse(false)
    sel.removeAllRanges()
    sel.addRange(range)
  }
}
await init()
await initApp()
const config=getConfig()
console.log(`配置config:`,config);
const desktop=ref(null)
const appList=ref([...data])
// const appList=computed(()=>{
// 	return fileList[config.desktop.path]
// })
const bg=ref("")
const systemAppList=[]
const selectAppList=ref([])//选中的应用
const showStartMenu=ref(false)
const systemApps=ref([])

try {
	readFileAll("/system-app").then(res=>{
		if(res.length===0){
			config['desktop']['system-app'].forEach(i=>{
				const systemDir=new WebDir(i.pwd,i.name)
				systemDir.init(i)
				systemAppList.push(systemDir)
				console.log(`systemDir:`,systemDir);
				systemDir.save()
			})
		}else{
			systemAppList.push(...res)
			systemApps.value=[...systemAppList]
		}
	})
	// 等待应用扫描注册完成
	await initAppSystem()
	// 将已注册的应用也显示到桌面
	const desktopApps = getAllApps().filter(a => !a.hidden)
	for (const app of desktopApps) {
		if (!systemAppList.find(i => i.uid === app.id)) {
			const appIcon = new WebDir("/system-app", app.name)
			appIcon.uid = app.id
			appIcon.icon = app.icon
			appIcon._appId = app.id
			systemAppList.push(appIcon)
		}
	}
	systemApps.value=[...systemAppList]
} catch (error) {
	console.error("加载默认桌面app失败："+error)
}
systemApps.value = [...systemAppList]
let editFileName=""
function toggleStartMenu(){
  showStartMenu.value=!showStartMenu.value
}
function initAppList(){
	appList.value=[...(fileList[config.desktop.path]||[])]
	// 在桌面添加"此电脑"图标
	const thisPcIdx = appList.value.findIndex(i => i.uid === "this-pc")
	if (thisPcIdx === -1) {
		appList.value.unshift({
			uid: "this-pc",
			name: "此电脑",
			icon: my_computer,
			type: "WebDir",
			path: "/",
			pwd: "/"
		})
	}
	appList.value.sort(({createTime:a},{createTime:b})=>a-b)
}
watch(()=>fileList,()=>{
	console.log(`111:`,fileList);
	initAppList()
},{deep:true})
const selectPath=ref(null)
// const selectList=ref([])//复制剪切粘贴删除时候使用值当前在selectAppList获取
const isShear=ref(false)
function selectAppListEmpty(){
	selectAppList.value.splice(0,selectAppList.value.length)
}
async function selectApp(e,file){
	if(!await editNameBlue())return 
	if(e.ctrlKey){
		const index=selectAppList.value.findIndex(i=>i.uid===file.uid)
		if(index>-1){
			selectAppList.value.splice(index,1)
		}else{
			selectAppList.value.push(file)
		}
	}else{
		selectAppListEmpty()
		selectAppList.value.push(file)
	}
	if(selectAppList.value[0]){
		focusFile.value=selectAppList.value[0]
	}
}

const opacity=ref(0)
onMounted(()=>{
	bg.value=config.desktop.bg.base64||config.desktop.bg.url
	// initList(config.desktop.path)
	
	system.initList(config.desktop.path).then(()=>{
		initAppList()
	})
	// bus.on("update:app",(apps)=>{
	// 	appList.value=[...apps]
	// })
	let t=0
	selectPath.value=config.desktop.path
	bus.on("select-path",(path)=>{
		selectPath.value=path
		opacity.value=1
		clearTimeout(t)
		t=setTimeout(()=>{
			opacity.value=0
		},2000)
	})
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
const editFile=ref(null)
function copy(){
	system.copy([...selectAppList.value])
}
function shear(){
	system.shear([...selectAppList.value])
}
function paste(){
	selectAppListEmpty()
	system.paste(selectPath.value)
	if(desktop.value)
		desktop.value.focus()
}
function deleteFile(){
	system.deleteFile([...selectAppList.value])
}
async function showMenu(e,i){
	const isName=await editNameBlue()
	if(!isName) return
	const index=selectAppList.value.findIndex(item=>item.uid===i.uid)
	if(index==-1){
		selectAppListEmpty()
		selectAppList.value.push(i)
	}
	menuDatas.value.splice(0,menuDatas.value.length)
	if(i.type==="WebDir"||i.type==="WebFile"){
		menuDatas.value.push({
			title:"打开",
			hander:()=>{
				openApp(i)
			}
		})
		menuDatas.value.push({
			title:"重命名",
			hander:()=>{
				console.log(`i:`,i);
				let dir=i
				editFile.value=dir
				editFileName=dir.name
			}
		})
		if(i.pwd!=="/system-app"){
			menuDatas.value.push({
				title:"复制",
				hander:()=>{
					copy()
				}
			},
			{
				title:"剪切",
				hander:()=>{
					shear()
				}
			},
			// {
				// title:"粘贴",
				// hander:()=>{
				// 	createProgress(i.title,i.exec,"C:/用户/桌面","","a b ccc")
			// },
			{
				title:"删除",
				hander:()=>{
					deleteFile()
				}
			})
		}
			menuDatas.value.push({
				title:"属性",
				hander:()=>{
					alert('文件属性\\n名称: ' + i.name + '\\n路径: ' + i.path + '\\n类型: ' + (i.type||'应用') + '\\n大小: ' + (i.size||'--') + '\\n创建时间: ' + (i.createTime ? new Date(i.createTime).toLocaleString() : '--') )
				}
			})
	}else{
		menuDatas.value.push(...menuData)
		console.log(`selectList.value:`,selectList.value);
		if(selectList.value.length){
			menuDatas.value.push({
				title:"粘贴",
				hander:()=>{
					paste()
				}
			})
		}
	}
	
	bus.emit("menu-show",{
		x:e.clientX,
		y:e.clientY,
		data:menuDatas.value
	})
}
const menuData=[
	{
		title:"属性",
		icon:`<?xml version="1.0" encoding="UTF-8"?><svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z" fill="none" stroke="#333" stroke-width="4"/><path d="M24 16V24" stroke="#333" stroke-width="4" stroke-linecap="round"/><circle cx="24" cy="32" r="2" fill="#333"/></svg>`,
		hander:()=>{
			alert('系统信息\\n应用: Web Desktop\\n版本: 1.0\\n分辨率: ' + window.innerWidth + '\\u00D7' + window.innerHeight)
		}
	},
	{
		title:"新建文本",
		icon:`<?xml version="1.0" encoding="UTF-8"?><svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M40 23V14L31 4H10C8.89543 4 8 4.89543 8 6V42C8 43.1046 8.89543 44 10 44H22" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M33 29V43" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 36H33H40" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 4V14H40" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
		hander:async ()=>{ editFile.value = null; editFileName = "";
			const pwd = "/C/Desktop"
			let name = "新建文本文档.txt"
			let counter = 2
			while ((fileList[config.desktop.path]||[]).some(f => f.name === name)) { name = "新建文本文档 (" + counter + ").txt"; counter++ }
			const file = new WebFile(pwd, name);
			file.write("");
			await file.save();
			fileList[config.desktop.path].push(file);
			editFile.value = file;
			editFileName = file.name;
			initAppList()
		}
	},
	{
		title:"新建文件夹",
		icon:`<?xml version="1.0" encoding="UTF-8"?><svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 8C5 6.89543 5.89543 6 7 6H19L24 12H41C42.1046 12 43 12.8954 43 14V40C43 41.1046 42.1046 42 41 42H7C5.89543 42 5 41.1046 5 40V8Z" fill="none" stroke="#333" stroke-width="4" stroke-linejoin="round"/><path d="M43 22H5" stroke="#333" stroke-width="4" stroke-linejoin="round"/><path d="M5 16V28" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M43 16V28" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
		hander:async ()=>{ editFile.value = null; editFileName = "";
			const pwd="/C/Desktop"
			let name="新建文件夹"
			let counter = 2
			while ((fileList[config.desktop.path]||[]).some(f => f.name === name)) { name = "新建文件夹 (" + counter + ")"; counter++ }
			let dir=new WebDir(pwd,name)
			dir.setIcon(dir_str)
			await dir.save()
			fileList[config.desktop.path].push(dir)
			editFile.value=dir
			editFileName=dir.name
			initAppList()
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
	// bus.emit("select-path",config.desktop.path)
	if(editFile.value===null)return true
	let isFileExist=await readFile("/C/Desktop/"+editFileName)
	if(isFileExist&&editFile.value.uid===isFileExist.uid){
		isFileExist=undefined
	}
	if(isFileExist||!editFileName){
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
	// editFile.value.rename(editFileName)
	readFile(editFile.value.path).then(res=>{
		console.log(`res:`,res);
		console.log(`editFile.value:`,editFile.value);
		if(res&&res.uid===editFile.value.uid){
			editFile.value.rename(editFileName)
		}else{
			editFile.value.name=editFileName
			editFile.value.save()
		}
		system.initList(editFile.value.pwd).then(()=>{
			initAppList()
		})
		editFile.value=null
		// fileList[config.desktop.path].sort(({createTime:a},{createTime:b})=>a-b)
		editFileName=""
	})
	
	return true
}
function openApp(item){
	if (item._appId) {
		const def = getApp(item._appId)
		if (def) {
			launchApp(item._appId, { title: item.name })
			selectAppListEmpty()
			return
		}
	}
	let app
	if(item.type==="WebDir"){
		app="Explorer"
	}else{
		app="Notepad"
	}
	createProgress(item.name,app,item.pwd,item.path)
	selectAppListEmpty()
}
const focusFile=ref(null)
async function focusApp(item){
	let isName=await editNameBlue()
	// if(focusFile.value){
	// 	isName=await editNameBlue()
	// }
	if(!isName) return
	focusFile.value=item
}
async function inputKeyDown(e){
	if(e.code==="Enter"&&!e.shiftKey){
		e.preventDefault()
		const isName=await editNameBlue()
		if(!isName) return
	}
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
	}else if(e.code==="KeyC"&&e.ctrlKey){
		copy()
	}else if(e.code==="KeyX"&&e.ctrlKey){
		shear()
	}else if(e.code==="KeyV"&&e.ctrlKey){
		if(selectList.value.length){
			paste()
		}
	}else if(e.code==="Delete"){
		deleteFile()
	}
})
function f(){
	console.log(`111:`,111);
	bus.emit("select-path",config.desktop.path)
}

</script>
<template>
	<div :style="{opacity:opacity}" style="transition: opacity 0.3s;position: fixed;right: 1em;text-shadow: 1px 1px 1px #fff;color: #000;font-size: 12px;">当前焦点目录:{{ selectPath }}</div>
	<div @focus="f" ref="desktop" tabindex="1" class="desktop" :style="{backgroundImage:`url(${bg})`}" @click.stop="selectAppListEmpty" @click="editNameBlue" @contextmenu.prevent="showMenu($event,{alias:'desktop',path:config.desktop.path})">
		<Menu></Menu>
		<!-- @focus="focusApp(item)" -->
		<div @focus="f" :tabindex="index+10" class="app" :class="{appFocus:selectAppList.findIndex(i=>i.uid===item.uid)!==-1||(editFile&&editFile.uid===item.uid)}" v-for="(item,index) in appList" :key="item.uid" @contextmenu.prevent.stop="showMenu($event,item)">
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
			<div class="box" @dblclick="openApp(item)" @click.stop="selectApp($event,item)">
				<div class="icon">
					<div class="svg" v-html="item.icon"></div>
				</div>
				<!-- 可以优化为url这样多个svg就只有一个请求了 ，不过影响也不大吧-->
					<!-- <img width="24" height="24" src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNSA4QzUgNi44OTU0MyA1Ljg5NTQzIDYgNyA2SDE5TDI0IDEySDQxQzQyLjEwNDYgMTIgNDMgMTIuODk1NCA0MyAxNFY0MEM0MyA0MS4xMDQ2IDQyLjEwNDYgNDIgNDEgNDJIN0M1Ljg5NTQzIDQyIDUgNDEuMTA0NiA1IDQwVjhaIiBmaWxsPSJub25lIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik00MyAyMkg1IiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik01IDE2VjI4IiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0iTTQzIDE2VjI4IiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+" alt=""> -->
				<div ref="editNameRef" v-if="editFile&&editFile.uid===item.uid" class="name editName" v-focus
					@input="editNameInput"
					@keydown.stop="inputKeyDown"
					@click.stop
					@dblclick.stop
					contenteditable=""
					v-select
				>{{ editFileName }}</div>
				<div class="name" v-else>
					{{item.name}}
				</div>
			</div>
		</div>
		<div id="windows">
			<!-- <Notepad></Notepad>
			<Explorer></Explorer> -->
			<template v-for="(progress,index) in progressList" :key="progress.pid">
			<component v-if="progress.exec" :is="progress.exec" v-bind="progress" ref="app" />
			<Window v-else :pid="progress.pid" :title="progress.title" :path="progress.path" :initW="progress.windowWidth ?? 50" :initH="progress.windowHeight ?? 60">
				<template #title>{{ progress.title }}</template>
				<AppFrame v-bind="progress" ref="app" @close="sysCloseWindow" @focus="(pid) => showWindow(pid, 'window')" />
			</Window>
			</template>
		</div>
		<div class="tab"><!-- v-show="progressList.length"-->
			<div class="startBtn" @click.stop="toggleStartMenu">
				<svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 4L6 14V34L24 44L42 34V14L24 4Z" fill="none" stroke="#fff" stroke-width="4" stroke-linejoin="round"/><path d="M24 44V24" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 14L24 24L42 14" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>
				<span>开始</span>
			</div>
			<template v-for="(progress,index) in progressList" :key="progress.pid">
				<div v-if="windowList.find(i=>i.pid===progress.pid)" class="app_item" :class="{active_app:activeAppPid===progress.pid}" @click="showApp(progress.pid,index)">
					{{ progress.title }}
				</div>
			</template>
			<div class="showDesktop" @click="showDesktop"></div>
		</div>
		<Teleport to="body">
			<div v-if="showStartMenu" class="startMenuOverlay" @click="showStartMenu=false">
				<div class="startMenu" @click.stop>
					<div class="startHeader">
						<span>应用程序</span>
					</div>
					<div class="startBody">
						<div v-for="app in systemApps" :key="app.uid" class="startAppItem" @click="openApp(app)">
							<div class="startAppIcon" v-html="app.icon"></div>
							<span class="startAppName">{{ app.nickname || app.name }}</span>
						</div>
					</div>
				</div>
			</div>
		</Teleport>
	</div>
</template>

<style scoped src="./desktop.css"></style>









