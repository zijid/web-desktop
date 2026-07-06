<script setup>
import { ref,reactive,computed,watch,watchEffect,onMounted,nextTick} from "vue";
import {systemDirectory} from "../../App"
import Win from "../window/window.vue";
import { findFile, getApp } from "../../utils";
// const props=defineProps({
// 	path:{
// 		type:String,
// 		default:""
// 	},
// 	pid:{
// 		type:Number,
// 		default:0
// 	}
// })
const props=defineProps({
	path:{
		type:String,
		default:""
	},
	pwd:{
		type:String,
		default:""
	},
	targetPath:{
		type:String,
		default:""
	},
	title:{
		type:String,
		default:""
	},
	pid:{
		type:Number,
		default:0
	},
	args:{
		type:String,
		default:""
	},
})
const args=computed(()=>{
	return props.args.split(" ")
})//path （开始路径） 
const file=ref({})
const emits=defineEmits([])

watchEffect(()=>{
	file.value=findFile(systemDirectory,props.targetPath)
})
</script>

<template>
<Win :path="path" :pid="pid">
	<template v-slot:title>
		{{title}}
	</template>
	<div class="content">
		<div class="function">
			功能区 未制作
		</div>
		<div class="body" v-text="file?.content"></div>
	</div>
</Win>
<!-- <div :tabindex="pid"  class="notepad" ref="notepad" :style="{left:position.x+'px',top:position.y+'px'}">
	<div class="header" ref="notepadMove">
		<div class="handle">
			<div class="min">━</div>
			<div class="max">⬜</div>
			<div class="close">✖</div>
		</div>
	</div>
	<div class="function">
	</div>
	<div class="body" v-text="file.content"></div>
</div> -->
</template>

<style scoped>
.notepad{
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
/* .content{
	display: flex;
} */
.function{
	display: flex;
	flex-direction: row;
	padding: 0.4em 1em 0.4em 0.4em;
	border-bottom: 1px solid #dbdbdb;
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