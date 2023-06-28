<script setup>
import { ref,reactive,computed,watch,watchEffect,onMounted,nextTick} from "vue";


const props=defineProps({
	title:{
		type:String,
		default:""
	}
})
const emits=defineEmits([])

</script>

<template>

<div class="menuItem">
	{{title}}
	<i>
		<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 12L31 24L19 36" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>
	</i>
</div>
</template>

<style scoped>
.menuItem{
	padding: 0 2em;
	display: flex;
    align-items: center;
    flex-direction: row;
    line-height: 1;
}
.menuItem:hover{
	background-color: #fff;
	cursor: pointer;
}
</style>