<script setup>
import { ref,reactive,computed,watch,watchEffect,onMounted,nextTick,defineAsyncComponent} from "vue";
import systemDesktop from "@/components/system/desktop.vue";
const desktopStart=ref(false)
setTimeout(()=>{
	desktopStart.value=true
},100)
</script>

<template>
	<system-desktop v-if="desktopStart" ></system-desktop>
	<div v-cloak class="d pageLoading">
		加载中
	</div>
</template>

<style scoped src="./App.css"></style>