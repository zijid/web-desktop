<script setup>
import { ref,reactive,computed,watch,watchEffect,onMounted,nextTick} from "vue";
import {systemDirectory} from "../../App"
import {readFileAll,readFile} from "@/utils/file"
import Win from "../window/window.vue";
import {fileList} from "@/hooks"
import {Message} from "zijid-ui"
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
</script>

<template>
<Win :path="path">
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
		<div class="body">

			<div class="loading d" v-if="isLoad===true">加载中</div>
			<template v-else>
				<!-- <zi-dir style="width: 140px;" @open="openDir" :data="dirData1"></zi-dir> -->
				<template class="dir_box" v-for="file in fileList[tempPath]" :key="file.uid+file.name">
					<div :class="[file.system?'root_dir':'dir_file']" v-if="file.type==='WebDir'" @dblclick="open(file)" >
						<div style="font-size: 24px;">
							<zi-icon name="user" v-if="file.system"></zi-icon>
							<zi-icon name="folder-close" v-else></zi-icon>
						</div>
						<div class="root_dir_name">
							{{file.nickname||file.name}}
							<template v-if="file.system&&file.nickname">({{file.name}})</template>
						</div>
					</div>
					<div class="dir_file" v-else @dblclick="open(file)">
						<div style="font-size: 24px;">
							<zi-icon name="file"></zi-icon>
						</div>
						<div class="name">
							{{file.nickname||file.name}}
						</div>
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
	background-color: rgb(174 228 253);
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