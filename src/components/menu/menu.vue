<script setup>
import { ref,reactive,computed,watch,watchEffect,onMounted,nextTick} from "vue";
import { FUNCTION } from "./type";
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
	},
	show:{
		type:Boolean,
		default:true
	}
})

const emits=defineEmits(["focus"])
function handerFun(type,fun){
	return function(){
		if(type===FUNCTION){
			fun()
		}
	}
}
const menu=ref(null)
const elWidthValue=ref(100)
const elHeightValue=ref(100)

const style=computed(()=>{
	const width=props.position.vw||window.innerWidth
	const height=props.position.vh||window.innerHeight
	
	if(menu.value){
		elWidthValue.value=menu.value.offsetWidth
		elHeightValue.value=menu.value.offsetHeight
	}
	let elWidth=elWidthValue.value
	let elHeight=elHeightValue.value
	const x=props.position.x||0
	const y=props.position.y||0
	let w=props.position.w||0
	let h=props.position.h||0
	const result={
		x:x,y:y
	}
	const viewInElWidth=width-elWidth
	const viewInElHeight=height-elHeight
	let top=""
	if(width>elWidth){
		if(x<viewInElWidth){//位置小于屏幕宽度-元素宽度
			result.x=x
		}else{
			console.log("22:",22);
			result.x=viewInElWidth+w
		}
		if(y<viewInElHeight){//位置小于屏幕宽度-元素宽度
			result.y=y
			top=`calc( ${props.index} * 1.4em + ${result.y-20}px + 1em )`
		}else{
			result.y=viewInElHeight
			top=`${result.y-20}px`
		}
	}else{
		// return {left:0+'px',top:0+'px',x:0,y:0}
	}
	return {
		left:result.x-20+'px',
		top,
		x:result.x+elWidth,y:result.y+props.index*14*1.4,w:width-result.x,h:height-result.y,parentX:0,parentY:0,vw:width,vh:height
	}
})
// watch(()=>props.show,()=>{
// 	console.log("1:",1);
// })
</script>

<template>

<div class="menu" @contextmenu.stop.prevent :style="{left:style.left,top:style.top}" ref="menu" :class="{show:!show}">
	<menuItem :index="index" :position="style" v-for="(item,index) in data" :key="item.title" :title="item.title" :type="item.type" :children="item.children" :click="handerFun(item.type,item.hander)"></menuItem>
</div>
</template>

<style scoped>
.show{
	top:-500px !important;
	opacity: 0 !important;
	pointer-events: none !important;
}
.menu{
	transition: opacity 0.1s ease 0s;
	position: fixed;
	border: 1px solid #a3a3a3;
	top: 0;
	left: 0;
	padding: 0.5em 0;
    font-size: 14px;
    color: #000;
    background-color: rgb(239 239 239);
    text-shadow: 0 0 1px #c7c7c7;
	z-index: 10;
}
.menu:hover{
	/* display: block; */
	opacity: 1;
	pointer-events: all;
}
</style>