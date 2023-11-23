<script setup>
import { ref,reactive,computed,watch,watchEffect,onMounted,nextTick} from "vue";

import {bus,systemDirectory} from "@/App"
import {readFileAll,readFile} from "@/utils/file"
import Win from "../window/window.vue";
import {fileList,selectList} from "@/hooks"
import {Message} from "zijid-ui"
import {initList} from "@/system"
import * as system from "@/system"
const props=defineProps({
	path:{
		type:String,
		default:""
	},
	// pid:{
	// 	type:Number,
	// 	default:0
	// }
})
const emits=defineEmits([])
const search=ref("")
const searchKeyword=ref("")

const tempPath=ref("")
const history=[]
const isLoad=ref(false)
const index=ref(0)
// const selectList=ref([])
const focusFile=ref(null)
const dir=computed(()=>{
	return fileList[tempPath.value]
})

fileList[tempPath.value]=systemDirectory
if(!systemDirectory){
	isLoad.value=true
	const t=setInterval(()=>{
		if(systemDirectory){
			if(tempPath.value==="/"||tempPath.value==="")isLoad.value=false
			clearInterval(t)
			fileList["/"]=systemDirectory
			fileList[""]=systemDirectory
		}
	},100)
}
watch(()=>tempPath.value,()=>{
	search.value=tempPath.value
	bus.emit("select-path",tempPath.value)
	isLoad.value=true
	const str=search.value||'/'
	if(str==='/'){
		isLoad.value=false
		fileList[tempPath.value]=systemDirectory
	}else{
		readFileAll(str).then(res=>{
			if(res.length===0){
				readFile(str).then(s=>{
					isLoad.value=false
					if(s){
						fileList[tempPath.value]=res
					}else{
						fileList[tempPath.value]=null
					}
				})
			}else if(res[0]){
				isLoad.value=false
				fileList[tempPath.value]=res
			}
		})
	}
})
onMounted(()=>{
	if(props.path.startsWith("/system-app")){
		tempPath.value=""
	}else{
		tempPath.value=props.path
	}
	history.push(tempPath.value)
})
function open(file){
	if(file.type==="WebDir"){
		history.splice(index.value+1,history.length)
		history.push(file.path)
		tempPath.value=file.path
		index.value=history.length-1
	}else{
		file.read().then(r=>{
			Message('文件内容:'+r)
		})
	}
}
function move(i){
	index.value+=i
	tempPath.value=history[index.value]
	// explorer.value.focus()
}

function skip(){
	let search_str=search.value
	
	if(tempPath.value===search_str){
		return
	}
	history.splice(index.value+1,history.length)
	history.push(search_str)
	tempPath.value=search_str
	index.value=history.length-1
}
function find(){
	alert("搜索未制作")
}
function f(){
	console.log(`1:`,1);
	bus.emit("select-path",tempPath.value)
}

const selectAppList=ref([])//选中的应用
function selectAppListEmpty(){
	selectAppList.value.splice(0,selectAppList.value.length)
}
async function selectApp(e,file){
	bus.emit("menu-close")
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
function noSelect(){
	selectAppListEmpty()
	editNameBlue()
	bus.emit("menu-close")
}

let editFileName=""
const menuDatas=ref([])
const editFile=ref(null)
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
			editFileName=dir.name
			initAppList()
		}
	}
]
async function showMenu(e,i){
	const isName=await editNameBlue()
	if(!isName) return
	const index=selectAppList.value.findIndex(item=>item.uid===i.uid)
	if(index==-1){
		selectAppListEmpty()
		selectAppList.value.push(i)
	}
	menuDatas.value.splice(0,menuDatas.value.length)
	
	// if(i.type==="WebDir"||i.type==="WebFile"){
		console.log(`i:`,i);
		if(i.pwd&&i.pwd!=="/system-app"&&i.pwd!=="/"){
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
	// }else{
		menuDatas.value.push(...menuData)
		console.log(`selectList.value:`,selectList.value);
		if(selectList.value.length){
			menuDatas.value.push({
				title:"粘贴1",
				hander:()=>{
					paste()
				}
			})
		}
	// }
	
	bus.emit("menu-show",{
		x:e.clientX,
		y:e.clientY,
		data:menuDatas.value
	})
}
function editNameInput(e){
	editFileName=e.target.textContent;
}
const vSelect = {
	mounted: select
}
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

const editNameRef=ref(null)
async function editNameBlue(){
	bus.emit("menu-close")
	// bus.emit("select-path",config.desktop.path)
	if(editFile.value===null)return true
	let isFileExist=await readFile(editFile.value.pwd+editFileName)
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
		if(res&&res.uid===editFile.value.uid){
			const pwd=editFile.value.pwd
			editFile.value.rename(editFileName).then(res=>{
				initList(pwd)
			})
		}else{
			editFile.value.name=editFileName
			editFile.value.save()
		}
		initList(editFile.value.pwd)
		editFile.value=null
		// fileList[config.desktop.path].sort(({createTime:a},{createTime:b})=>a-b)
		editFileName=""
	})
	
	return true
}
// function initList(path){
// 	readFileAll(path).then(res=>{
// 		fileList[path]=res
// 		// initAppList()
// 		// openApp(systemAppList[0])
// 	})
// }

async function keydown(e){
	if(e.code==="F2"){
		e.preventDefault()
		if(editFile.value)return 
		const isName=await editNameBlue()
		if(!isName) return
		if(focusFile.value){
			editFile.value=focusFile.value
			editFileName=editFile.value.nickname||editFile.value.name
		}
	}else if(e.code==="Tab"){
		const isName=await editNameBlue()
		if(!isName) return
		editFile.value=null
	}else if(e.code==="Enter"&&!e.shiftKey){
		e.preventDefault()
		const isName=await editNameBlue()
		if(!isName) return
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
}

function copy(){
	system.copy([...selectAppList.value])
}
function shear(){
	system.shear([...selectAppList.value])
}
function paste(){
	selectAppListEmpty()
	system.paste(tempPath.value)
	// if(desktop.value)
	// 	desktop.value.focus()
}
function deleteFile(){
	system.deleteFile([...selectAppList.value])
}
</script>

<template>
<Win :path="path" @focus.stop="f" v-focus @click="editNameBlue" @keydown.stop="keydown">
	<template v-slot:title>
		文件管理器<span class="path" v-text="tempPath"></span>
	</template>
	<div class="explorer">
		<div class="function">
			<div class="history">
				<button class="after"
				@click="move(-1)"
				:disabled="history.length===0||index==0" title="后退">
					←
				</button>
				<button class="before"
				@click="move(1)"
				:disabled="history.length===0||index===history.length-1"
				title="前进">
					→
				</button>
			</div>
			<input type="text" class="search"
			v-model="search"
			title="搜索"
			@keydown.enter="skip">
			<div class="skip" @click="skip"
			title="搜索">
				→
			</div>
			<input type="text" class="searchKeyword" v-model="searchKeyword"
			placeholder="搜索"
			title="搜索"
			@keydown.enter="find">
		</div>
		<div class="body" @click.stop="noSelect"  @contextmenu.prevent.stop="showMenu($event,{alias:'desktop',path:tempPath})">

			<div class="loading d" v-if="isLoad===true">加载中</div>
			<template v-else>
				<!-- <zi-dir style="width: 140px;" @open="openDir" :data="dirData1"></zi-dir> -->
				<template v-for="file in fileList[tempPath]" :key="file.uid+file.name">
					<div
						@contextmenu.prevent.stop="showMenu($event,file)"
						@click.stop="selectApp($event,file)"
						:class="[file.system?'root_dir':'dir_file',selectAppList.findIndex(i=>i.uid===file.uid)!==-1?'dir_file-hover':'']" v-if="file.type==='WebDir'" @dblclick="open(file)" >
						<div style="font-size: 24px;">
							<zi-icon name="user" v-if="file.system"></zi-icon>
							<zi-icon name="folder-close" v-else></zi-icon>
						</div>
						<div class="root_dir_name">
							
							<template v-if="file.system&&file.nickname">
								{{file.nickname||file.name}}
								<div ref="editNameRef"
								v-if="editFile&&editFile.uid===file.uid"
								class="name editName"
								v-focus v-text="file.nickname||file.name"
									@input="editNameInput"
									@click.stop
									@dblclick.stop
									contenteditable=""
									v-select
								></div>
								<div class="name" v-else>
									({{file.name}})
								</div>
							</template>
							<template v-else>
								<div ref="editNameRef"
								v-if="editFile&&editFile.uid===file.uid"
								class="name editName"
								v-focus v-text="file.nickname||file.name"
									@input="editNameInput"
									@click.stop
									@dblclick.stop
									contenteditable=""
									v-select
								></div>
								<div class="name" v-else>
									{{file.nickname||file.name}}
								</div>
							</template>
						</div>
					</div>
					<div
					@contextmenu.prevent.stop="showMenu($event,file)"
					@click.stop="selectApp($event,file)"
					:class="[selectAppList.findIndex(i=>i.uid===file.uid)!==-1?'dir_file-hover':'']" 
					class="dir_file" v-else @dblclick="open(file)">
						<div style="font-size: 24px;">
							<zi-icon name="file"></zi-icon>
						</div>
						<div ref="editNameRef"
							v-if="editFile&&editFile.uid===file.uid"
							class="name editName"
							v-focus v-text="file.name"
							@input="editNameInput"
							@click.stop
							@dblclick.stop
							contenteditable=""
							v-select
						></div>
						<div class="name" v-else>
							({{file.name}})
						</div>
						<!-- <div class="name">
							{{file.nickname||file.name}}
						</div> -->
					</div>
				</template>
			</template>
			<div v-show="isLoad===false&&dir&&dir.length===0" class="no_dir_content">空文件夹</div>
			<div v-show="isLoad===false&&dir===null" class="no_dir_content">不存在这个文件或文件夹</div>
		</div>
	</div>
</Win>
<!-- <div :tabindex="pid" class="explorer" ref="explorer" :style="{left:position.x+'px',top:position.y+'px'}">
	<div class="header" ref="explorerMove">文件管理器<span class="path" v-text="tempPath"></span>
		<div class="handle">
			<div class="min">━</div>
			<div class="max">⬜</div>
			<div class="close">✖</div>
		</div>
	</div>
	<div class="function">
		<div class="history">
			<button class="after" @click="move(-1)" :disabled="index==0">
				←
			</button>
			<button class="before" @click="move(1)" :disabled="index===history.length-1">
				→
			</button>
		</div>
		<input type="text" class="search" v-model="search" @keydown.enter="skip">
		<div class="skip" @click="skip">
			→
		</div>
		<input type="text" class="searchKeyword" v-model="searchKeyword" placeholder="搜索">
	</div>
	<div class="body">
		<div v-for="file in dir" @click="open(file)" :key="file.name">
			<template v-if="file.isRoot">
				<div class="root_dir" v-if="file.isFolder">
					<div class="root_dir_name">{{file.name}}{{ file.pwd }}
					</div>
				</div>
			</template>
			<div class="dir_file" v-else-if="file.isFolder">
				<div class="name">{{file.name}}
				</div>
			</div>
			<div class="dir_file" v-else>
				<div class="name">{{file.name}}
				</div>
			</div>
		</div>
	</div>
</div> -->
</template>

<style scoped>
.explorer:focus-within{
	z-index: 8;
}
.explorer{
	background-color: rgb(255, 255, 255);
	z-index: 2;
	font-size: 12px;
	display: flex;
	flex-direction: column;
	user-select: none;
	height: 100%;
}
.header{
	cursor: move;
	padding:0.5em 1em;
	user-select: none;
	border: 1px solid #dbdbdb;
	position: relative;
}
.path{
	cursor: auto;
}
.handle{
	position: absolute;
    top: 0;
	right: 0;
	display: flex;
	flex-direction: row;
	text-align: center;
	cursor: auto;
}
.handle>div{
	width: 2em;
	height: 2em;
	line-height: 2em;
}
.min{
	--hover-bg-color:#e4e4e4;
	--active-bg-color:#d4d4d4;
	--hover-color:#000000;
}
.max{
	
	--hover-bg-color:#e4e4e4;
	--active-bg-color:#d4d4d4;
	--hover-color:#000000;
}
.close{
	--hover-bg-color:#fd0000;
	--active-bg-color:#ff4a4a;
	--hover-color:#ffffff;
}
.handle>div:hover{
	background-color: var(--hover-bg-color);
	color: var(--hover-color);
}
.handle>div:active{
	background-color: var(--active-bg-color);
}
.path{
	color: #ababab;
	margin-left: 1em;
}
.body{
	flex-grow: 1;
	background-color: rgb(255, 255, 255);
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	align-content: flex-start;
	overflow: auto;
	height: calc( 100% - 2.8em);
}
.body .dir_box{
}
.no_dir_content{
	padding: 1em 0 0 1em;
}
.root_dir{
	width: 10em;
	height: 2em;
	margin-left:1em;
	padding: 0.5em;
	border:1px solid #000;
	display: flex;
	flex-direction: row;
    align-items: center;
}
.root_dir_name{
	width: 100%;
	text-overflow: ellipsis;
	overflow: hidden;
	white-space: nowrap;
}
.dir_file{
    width: 100%;
    padding: 0.5em;
	display: flex;
	flex-direction: row;
    align-items: center;
}
.dir_file:hover{
	background-color: rgb(214, 214, 214)
}
.body .dir_file-hover{
	background-color: #3f51b5;
	color: #fff;
}
.name{
	width: 100%;
	text-overflow: ellipsis;
	overflow: hidden;
	white-space: nowrap;
}
.function{
	display: flex;
	flex-direction: row;
	padding: 0.4em 1em 0.4em 0.4em;
}
.history{
	display: flex;
	flex-direction: row;
	cursor: default;
	user-select: none;
}
.history>*{
	width: 2em;
	height: 2em;
	text-align: center;
	line-height: 2em;
	background-color: #fff;
	padding: 0;
	border:none;
}
.history>*:disabled{
	background-color: transparent !important;
}

.history>*:hover{
	background-color: #e4e4e4;
}
.history>*:active{
	background-color: #d4d4d4;
}
.search{
	width: 20em;
	flex-grow: 1;
}
.skip{
	width: 2em;
	height: 2em;
	line-height: 2em;
	text-align: center;
	border:1px solid #d4d4d4;
	border-left-width: 0;
	margin-right: 1em;
	cursor: default;
}
.skip:hover{
	background-color: rgb(192, 98, 255);
	color: #fff;
}
.skip:active{
	background-color: rgb(113, 0, 158);
}
.searchKeyword{
	width: 5em;
}
.search,.searchKeyword{
	border:1px solid #d4d4d4;
	outline: none;
	font-size: 12px;
	padding: 0 0.5em;
}
.search:focus,.searchKeyword:focus{
	border-color: rgb(0, 68, 255);
}
.loading{
	width: 100%;
    padding-top: 20%;
	text-align: center;
}
</style>