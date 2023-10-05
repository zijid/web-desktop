<script setup>
import { ref,reactive,computed,watch,watchEffect,onMounted,nextTick,defineAsyncComponent} from "vue";
import systemDesktop from "@/components/system/desktop.vue";
import "./App.js"//初始化一些东西
const desktopStart=ref(false)
setTimeout(()=>{
	desktopStart.value=true
},1000)
</script>

<template>
	<system-desktop  v-if="desktopStart" ></system-desktop>
	<div v-cloak class="d">
		加载中
	</div>
</template>

<style scoped src="./App.css"></style>