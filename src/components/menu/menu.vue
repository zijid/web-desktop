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
			x:0,y:10
		}
	}
})
const emits=defineEmits([])
function handerFun(type,fun){
	if(type===FUNCTION){
		fun()
	}
}
console.log("props.position:",props.position.x);
const style={top:props.position.y+'px',left:props.position.x+'px'}
</script>

<template>

<div class="menu" :style="style">
	<menuItem v-for="item in data" :key="item.title" :title="item.title" :type="item.type" :children="item.children" @click="handerFun(item.type,item.hander)"></menuItem>
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
}

</style>