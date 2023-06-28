<script setup>
import { ref,reactive,computed,watch,watchEffect,onMounted,nextTick} from "vue";
import menuItem from "./menuItem.vue";

const props=defineProps({
	data:{
		default:[],
		type:Array
	}
})
const emits=defineEmits([])
</script>

<template>

<div class="menu">
	<menuItem v-for="item in data" :key="item.title" :title="item.title"></menuItem>
</div>
</template>

<style scoped>
.menu{
	position: absolute;
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