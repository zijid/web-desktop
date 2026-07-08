<script setup>
import { ref,reactive,computed,watch,watchEffect,onMounted,onUnmounted,nextTick} from "vue";
import menuItem from "./menuItem.vue";
import {bus} from "@/App"
const props=defineProps({
	position:{
		default:()=>({x:0,y:0})
	}
})
const data=ref([])
const position=reactive({
	x:0,y:0
})
const show=ref(false)
window.show=show
bus.on("menu-show",({x,y,data:d})=>{
	show.value=true
	position.x=x
	position.y=y
	data.value=d
})
bus.on("menu-close",()=>{
	show.value=false
})

function onDocumentClick(e) {
  if (show.value && el.value && !el.value.contains(e.target)) {
    show.value = false
  }
}
function onDocumentKeydown(e) {
  if (e.key === "Escape" && show.value) {
    show.value = false
  }
}

onMounted(() => {
  document.addEventListener("click", onDocumentClick, true)
  document.addEventListener("keydown", onDocumentKeydown)
})

onUnmounted(() => {
  document.removeEventListener("click", onDocumentClick, true)
  document.removeEventListener("keydown", onDocumentKeydown)
})
const emits=defineEmits([])
const elInfo=reactive({
	width:0,height:0,
	x:position.x,
	y:position.y
})
const el=ref(null)
watch(()=>position,(e)=>{
	setPos()
},{deep:true,immediate:true})
async function setPos(){
	await nextTick()
	if(!el.value){
		await nextTick()
		if(!el.value)return
	}
	
	elInfo.width=el.value.offsetWidth;
	elInfo.height=el.value.offsetHeight;
	const p_x=position.x;
	const p_y=position.y;
	const elRightPos=p_x+elInfo.width;
	const elBottomPos=p_y+elInfo.height;
	const x_max=window.innerWidth
	const y_max=window.innerHeight
	let x,y
	if(p_x<0){
		x=0
	}else{
		if(x_max>=elRightPos){
			x=p_x
		}else{
			x=x_max-elInfo.width
		}
	}
	if(p_y<0){
		y=0
	}else{
		if(y_max>=elBottomPos){
			y=p_y
		}else{
			y=y_max-elInfo.height
		}
	}
	elInfo.x=x
	elInfo.y=y
}
</script>

<template>
<ul @contextmenu.stop.prevent v-if="show" ref="el" class="menu" :style="{top:`${elInfo.y}px`,left:`${elInfo.x}px`}">
	<menuItem :position="{x:elInfo.x+elInfo.width,y:elInfo.y}" v-for="item,index in data" :data="item" :key="index"></menuItem>
</ul>
</template>

<style scoped>

.menu{
	cursor: default;
	position: fixed;
	border: 1px solid #a3a3a3;
    font-size: 12px;
    text-shadow: 0 0 1px #c7c7c7;
	z-index: 2147483647;
	white-space: nowrap;
	padding: 2px 0;
    margin: 0;
	background: #f0f0f0;
	min-width: 160px;
	box-shadow: 2px 2px 8px rgba(0,0,0,0.15);
}
</style>