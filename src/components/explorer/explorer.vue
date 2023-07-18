<script setup>
import { ref,reactive,computed,watch,watchEffect,onMounted,nextTick} from "vue";
import {systemDirectory} from "../../App"
import { findFile } from "../../utils";
import Win from "../window/window.vue";

const props=defineProps({
	path:{
		type:String,
		default:""
	},
	// pid:{
	// 	type:Number,
	// 	default:0
	// }
	args:{
		type:String,
		default:""
	},
})
const args=computed(()=>{
	return props.args.split(" ")
})//path （开始路径） 
const emits=defineEmits([])

const search=ref("")

const searchKeyword=ref("")

const tempPath=ref("")
const history=[]
const explorer=ref(null)
const dir=computed(()=>{
	if(!tempPath.value){
		return systemDirectory
	}else{
		const file=findFile(systemDirectory,tempPath.value)
		if(file){
			return file.content
		}else{
			return []
		}
		 
	}
})
const index=ref(0)
watch(()=>tempPath.value,()=>{
	search.value=tempPath.value
})
watchEffect(()=>{
	history.push(tempPath.value=props.path)
})
function open(file){
	if(file.isFolder){
		history.splice(index.value+1,history.length)
		history.push(file.path)
		tempPath.value=file.path
		index.value=history.length-1
	}else{
		alert("打开"+file.name)
	}
}
function move(i){
	index.value+=i
	tempPath.value=history[index.value]
	// explorer.value.focus()
}
function skip(){
	const file=findFile(systemDirectory,search.value)
	if(tempPath.value===search.value){
		return
	}
	if(file){
		if(file.isFolder){
			history.splice(index.value+1,history.length)
			history.push(file.path)
			index.value=history.length-1
			tempPath.value=search.value
		}else{
			alert("打开"+file.name)
		}
	}else{
		if(search.value){
			alert("没有找到文件或文件夹")
		}else{
			history.splice(index.value+1,history.length)
			history.push("")
			index.value=history.length-1
			tempPath.value=""
		}
	}
}
function find(){
	console.log("searchKeyword.value:",searchKeyword.value);
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
			<input type="text" class="searchKeyword" v-model="searchKeyword" placeholder="搜索" @keydown.enter="find">
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
}
.body>*{
	border: 1px solid #000;
    padding: 1em;
}
.root_dir{
	width: 10em;
	height: 2em;
	border:1px solid #000;
	margin-right:1em;
	padding: 0.5em;
}
.root_dir_name{
	width: 100%;
	text-overflow: ellipsis;
	overflow: hidden;
	white-space: nowrap;
}
.dir_file{
	width: 10em;

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
</style>