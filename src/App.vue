<script setup>
import { ref,reactive,computed,watch,watchEffect,onMounted,nextTick,defineAsyncComponent} from "vue";
import systemDesktop from "@/components/system/desktop.vue";
const desktopStart=ref(false)
setTimeout(()=>{
	
	desktopStart.value=true
},100)
</script>

<template>
	<Suspense>
		<system-desktop></system-desktop>
		<!-- 在 #fallback 插槽中显示 “正在加载中” -->
		<template #fallback>
			<div v-cloak class="d pageLoading">
				加载中
			</div>
		</template>
	</Suspense>
</template>

<style scoped src="./App.css"></style>