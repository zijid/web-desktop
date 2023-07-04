<script setup>
import { ref,reactive,computed,watch,watchEffect,onMounted,nextTick} from "vue";
import { FUNCTION } from "../../type";
import menuItem from "./menuItem.vue";

const props=defineProps({
	data:{
		type:Array,
		default:[]
	},
	position:{
		type:Object,
		default:{
			x:0,y:0,
			w:0,h:0
		}
	},
	index:{
		type:Number,
		default:0
	}
})
const emits=defineEmits([])
function handerFun(type,fun){
	return function(){
		if(type===FUNCTION){
			fun()
		}
	}
}
const menu=ref(null)
const style=computed(()=>{
	const width=window.innerWidth
	const height=window.innerHeight
	let elWidth=100
	let elHeight=100
	if(menu.value){
		elWidth=menu.value.offsetWidth
		elHeight=menu.value.offsetHeight
	}
	const x=props.position.x||0
	const y=props.position.y||0
	let w=props.position.w||0
	let h=props.position.h||0
	const result={
		x:x,y:y
	}
	console.log("{x,y}:",{x,y});
	const viewInElWidth=width-elWidth
	const viewInElHeight=height-elHeight
	if(width>elWidth){//
		if(x<viewInElWidth){//位置小于屏幕宽度-元素宽度
			result.x=x
		}else{
			result.x=viewInElWidth+w
		}
		if(y<viewInElHeight){//位置小于屏幕宽度-元素宽度
			result.y=y
		}else{
			result.y=viewInElHeight
		}
	}else{
		// return {left:0+'px',top:0+'px',x:0,y:0}
	}
	return {
		left:result.x+'px',
	// top:result.y+'px',
	top:`calc( ${props.index}*1em + ${result.y-elHeight}px + 1em )`,
	x:result.x+elWidth,y:result.y,w:width-result.x,h:height-result.y,parentX:0,parentY:0,vw:width,vh:height}
	//宽度 x,y 
})
</script>

<template>

<div class="menu" :style="{left:style.left,top:style.top}" ref="menu">
	<menuItem :index="index" :position="style" v-for="(item,index) in data" :key="item.title" :title="item.title" :type="item.type" :children="item.children" :click="handerFun(item.type,item.hander)"></menuItem>
</div>
</template>

<style scoped>
.menu{
	position: fixed;
	border: 1px solid #a3a3a3;
	top: 0;
	left: 0;
	padding: 0.5em 0;
    font-size: 14px;
    color: #000;
    background-color: rgb(239 239 239);
    text-shadow: 0 0 1px #c7c7c7;
	z-index: 2;
}

</style>