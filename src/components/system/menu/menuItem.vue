<script setup>
import { ref,reactive,computed,watch,watchEffect,onMounted,nextTick} from "vue";
import menuItem from "./menuItem.vue";
import {bus} from "@/App"
// import Menu from "./menu.vue";
const props=defineProps({
	data:{
		type:Object,
		default:()=>({})
	},
	position:{
		type:Object,
		default:()=>({x:0,y:0})
	}
})
const el=ref(null)
const show=ref(false)
const elInfo=reactive({
	width:0,height:0,
	x:props.position.x,
	y:props.position.y
})
const emits=defineEmits([])
const isRight=ref(true)
const vMenuItem={
	mounted(el){
		const parentInfo=el.parentNode.getBoundingClientRect()
		const elInfoTemp=el.getBoundingClientRect()
		const p_x=parentInfo.x;
		const p_y=parentInfo.y;
		const elRightPos=p_x+parentInfo.width+elInfoTemp.width;
		const elBottomPos=p_y+elInfoTemp.height;
		const x_max=window.innerWidth
		const y_max=window.innerHeight
		let x,y
		if(x_max>=elRightPos){
			x=p_x+parentInfo.width
		}else{
			x=p_x-elInfoTemp.width
		}
		if(y_max>=elBottomPos){
			y=p_y
		}else{
			console.log(`1111111:`,1111111);
			y=y_max-elInfoTemp.height
		}
		elInfo.x=x
		elInfo.y=y
	}
}
function mouseenter(){
	show.value=true
}
function mouseleave(){
	show.value=false
}
function hander(fun){
	if(!Array.isArray(props.data.children)||props.data.children.length<=0&&fun){
		bus.emit("menu-close")
		fun&&fun()
	}
}
</script>

<template>
<div class="system_menu_item"
@mouseenter.self="mouseenter"
@mouseleave.self="mouseleave"
>
	<div class="bg" @click.stop="hander(data.hander)">
		<div class="icon" v-html="data.icon"></div>
		<span>{{data.title}}</span>
		<div class="icon" v-if="data.children" >
			<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 12L31 24L19 36" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>
		</div>
	</div>
	<div class="group" v-if="show&&data.children&&data.children.length" :style="{top:`${elInfo.y}px`,left:`${elInfo.x}px`}" v-menu-item ref="el">
		<!-- <Menu :position="position" :data="data.children"></Menu> -->
		<menuItem v-for="item,index in data.children" :data="item" :key="index"></menuItem>
	</div>
</div>
</template>

<style scoped>
.group{
	/* opacity: 0; */
    position: fixed;
    top:0;
    left:0;
	border: 1px solid #a3a3a3;
    text-shadow: 0 0 1px #c7c7c7;
	z-index: 1;
	box-shadow: 2px 2px 2px 0px #bdbdbd;
}
.left{
	left: 0;
    transform: translateX(-100%) translateY(-50%);
}
.right{
	right: 0;
    transform: translateX(100%) translateY(-50%);
}
.bg{
	padding:0.1em  0.5em;
	display: flex;
    flex-direction: row;
    align-items: center;
}
.bg>span{
	margin-left: .5em;
}
.system_menu_item{
	position: relative;
    color: #000;
    background-color: rgb(226, 226, 226);
}
.system_menu_item:hover>.bg{
	background-color: #fff;
	color: #000;
}
.system_menu_item:hover>.group{
	opacity: 1;
}

.icon{
	width: 1em;
	height: 1em;
	line-height: 1em;
}
</style>