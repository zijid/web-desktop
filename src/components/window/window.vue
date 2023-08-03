<script setup>
import { ref,reactive,computed,watch,watchEffect,onMounted,nextTick,provide,inject,onUnmounted} from "vue";
import {getApp} from "../../utils/index"
import { showWindow,closeWindow,createWindow,hideWindow} from "../../hooks/system";
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
// const position=reactive({
// 	x:0,
// 	y:0
// })
// const myWindow=reactive({
// 	w:50,
// 	h:50
// })
const windowState=reactive({
	isMax:false,
	x:0,
	y:0,
	w:50,
	h:60
})
const winInfo=createWindow(props.pid)
onMounted(()=>{
	const winEl=win.value
	if(winEl){
		const w=window.innerWidth
		const h=window.innerHeight
		windowState.x=w/2-winEl.offsetWidth/2+winInfo.z*50
		windowState.y=window.innerHeight/2-winEl.offsetHeight/2+winInfo.z*50
		if(windowState.x>w/2-100){
			windowState.x=0
		}
		if(windowState.y>h/2-100){
			windowState.y=0
		}
		
	}
})
function activeApp(){
	showWindow(winInfo.pid,"window")
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
function max(){
	if(windowState.isMax===true){
		windowState.isMax=false
	}else{
		windowState.isMax=true
	}
	// myWindow.w=100
	// myWindow.h=100
}
function close(pid){

}
function move(event){
	// console.log('自定义事件已触发:', event.detail.message);
	if(windowState.isMax===true){
		// windowState.isMax=false
	}
}

document.addEventListener('move', move);
onUnmounted(()=>{
	document.removeEventListener('move', move);
})
</script>

<template>
	<div :tabindex="winInfo.pid" class="win" ref="win" v-show="winInfo.z>-1" :class="{max:windowState.isMax}" :style="{left:windowState.x+'px',top:windowState.y+'px',zIndex:winInfo.z,width:windowState.w+'%',height:`calc( ${windowState.h}% - var(--tab-height) )`}" @mousedown="activeApp">
		<div class="header" ref="winMove" v-move="windowState" @move="move">
			<div style="pointer-events: none;">
				<slot name="title"></slot>
			</div>
			<div class="handle">
				<div class="min" @focus.stop @mousedown.stop @click.stop="hideWindow(winInfo.pid)">━</div>
				<div class="max" @click.stop="max(winInfo.pid)">
					<svg width="12" height="12" xmlns="http://www.w3.org/2000/svg" data-v-c30228d9="" v-if="windowState.isMax===true">
						<g data-v-c30228d9="">
							<title data-v-c30228d9="">缩小</title>
							<rect stroke-width="1" id="svg_4" height="6" width="10" y="3" x="2" stroke="#000" fill="transparent" data-v-c30228d9=""></rect>
							<rect stroke-width="1" id="svg_3" height="6" width="10" y="6" x="0" stroke="#000" data-v-c30228d9="" fill="#fff"></rect>
						</g>
					</svg>
					<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" v-if="windowState.isMax===false">
						<g>
							<title>放大</title>
							<rect stroke="#000" stroke-width="2" id="svg_4" height="12" width="12" y="0" x="0" fill="#fff"/>
						</g>
					</svg>
				</div>
				<div class="close" @mousedown.stop @click.stop="closeWindow(winInfo.pid)">✖</div>
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
	box-shadow: 1px 1px 6px 0px #0a0a0a57;
	font-size: 12px;
	display: flex;
	flex-direction: column;
	user-select: none;
}
.max{
	transition: all 0.3s ease;
	top: 0 !important;
	left: 0 !important;
	width: 100% !important;
	height: calc( 100% - var(--tab-height)) !important;
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
	width: 6em;
}
.handle>div{
	width: 2em;
	height: 2em;
	line-height: 2em;
	flex: 1;
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