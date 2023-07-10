<script setup>
import { ref,reactive,computed,watch,watchEffect,onMounted,nextTick,provide,inject} from "vue";
import {getApp} from "../../utils/index"
import { showWindow,windowList,createWindow} from "../../hooks/system";
const props=defineProps({
	path:{
		type:String,
		default:""
	},
	pid:{
		type:Number,
		default:0
	}
})
const emits=defineEmits([])
// let isDown=false
const win=ref(null)
const winMove=ref(null)
// let offset = { x: 0, y: 0 };
const position=reactive({
	x:0,
	y:0
})
const winInfo=createWindow(props.pid)
onMounted(()=>{
	const winEl=win.value
	if(winEl){
		position.x=window.innerWidth/2-winEl.offsetWidth/2+winInfo.z*50
		position.y=window.innerHeight/2-winEl.offsetHeight/2+winInfo.z*50
	}
})
function activeApp(){
	showWindow(winInfo.pid)
}
// document.addEventListener('mousedown', handleMouseDown);
// document.addEventListener('mousemove', handleMouseMove);
// document.addEventListener('mouseup', handleMouseUp);

// function handleMouseDown(e) {
// 	if (e.target === winMove.value) {
// 		isDown=true
// 		const rect = winMove.value.getBoundingClientRect();
// 		offset.x = e.clientX - rect.left;
// 		offset.y = e.clientY - rect.top;
// 	}
// }

// function handleMouseMove(e) {

//     if(isDown){
// 		const x = e.clientX - offset.x;
// 		const y = e.clientY - offset.y;
// 		position.x = x
// 		position.y = y
// 	}
// }
// function handleMouseUp() {
// 	isDown=false
// }
</script>

<template>
<div :tabindex="winInfo.pid" class="win" ref="win" :style="{left:position.x+'px',top:position.y+'px',zIndex:winInfo.z}" @focus="activeApp">
	<div class="header" ref="winMove" v-move="position">
		<div style="pointer-events: none;">
			<slot name="title"></slot>
		</div>
		<div class="handle">
			<div class="min">━</div>
			<div class="max">⬜</div>
			<div class="close">✖</div>
		</div>
	</div>
	<div class="content">
		<slot :win="{path}"></slot>
	</div>
</div>
</template>

<style scoped>
.win:focus-within{
	z-index: 8;
}
.win{
	position: fixed;
	background-color: rgb(255, 255, 255);
	z-index: 2;
	outline: 1px solid #949494;
    box-shadow: 1px 1px 20px 0px #0a0a0a;
	top: 50%;
	left: 50%;
	width: 50%;
	height: 50%;
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
.content{
	flex-grow: 1;
	background-color: rgb(255, 255, 255);
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	align-content: flex-start;
	overflow: auto;
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