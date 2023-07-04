<script setup>
import { ref,reactive,computed,watch,watchEffect,onMounted,nextTick} from "vue";
import { FUNCTION,DIR } from "../../type";
import Menu from "./menu.vue";
const props=defineProps({
	title:{
		type:String,
		default:""
	},
	type:{
		type:Number,
		default:0
	},
	children:{
		type:Array,
		default:[]
	},
	click:{
		type:Function,
		default:()=>{}
	},
	position:{
		type:Object,
		default:{
			x:0,y:0,
			w:0,h:0,vw:0,vh:0,parentX:0,parentY:0
		}
	},
	el:{
		type:Object,
		default:{}
	},
	index:{
		type:Number,
		default:0
	}
})
const emits=defineEmits([])
const menu=ref(null)
const style=computed(()=>{
	//获取到上级传来的信息
	const w=props.position.w
	const h=props.position.h
	const width=props.position.vw||0
	const height=props.position.vh||0
	const x=props.position.x
	const y=props.position.y
	let el={
		offsetWidth:0,offsetHeight:0
	}
	if(menu.value){
		el=menu.value.$el
	}
	let elWidth=el.offsetWidth
	let elHeight=el.offsetHeight

	const result={
		x:x,y:y
	}
	const viewInElWidth=width-elWidth
	const viewInElHeight=height-elHeight
	if(width>elWidth){
		console.log("viewInElWidth:",viewInElWidth);
		console.log("x:",x);
		if(x<viewInElWidth){//位置小于屏幕宽度-元素宽度
			result.x=x
		}else{
			result.x=viewInElWidth-w
			console.log("viewInElWidth-w:",viewInElWidth-w);
			console.log("w:",w);
		}
		if(y<viewInElHeight){//位置小于屏幕宽度-元素宽度
			result.y=y
		}else{
			result.y=height-elHeight
		}
	}else{
		return {left:0+'px',top:0+'px',x:0,y:0}
	}
	return {
		left:result.x+"px",
		top:`calc( ${props.index}*1em + ${result.y}px) - 1em`,
		x:result.x,
		y:result.y,
		w:width-result.x,
		h:height-result.y,
		vw:width,
		vh:height
	}
	//calc(2*1.4em + 310px + 1em)
})
</script>

<template>
<div class="menuItem" @click="click">
	{{title}}
	<div class="icon" v-if="type===DIR" >
		<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 12L31 24L19 36" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>
	</div>
</div>
<Menu :index="index" ref="menu" v-if="type===DIR" :data="children" :position="style"></Menu>
</template>

<style scoped>
.menuItem{
	padding: 0 2em;
	display: flex;
    align-items: center;
    flex-direction: row;
    line-height: 1.4;
	word-wrap: normal;
	flex-wrap: nowrap;
	white-space: nowrap;
}
.menuItem:hover{
	background-color: #fff;
	cursor: pointer;
}
.icon{
	width: 1em;
	height: 1em;
	line-height: 1em;
}
</style>