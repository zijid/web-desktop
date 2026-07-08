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
		<!-- 鍦?#fallback 鎻掓Ы涓樉绀?鈥滄鍦ㄥ姞杞戒腑鈥?-->
		<template #fallback>
			<div v-cloak class="d pageLoading">
				鍔犺浇涓?
			</div>
		</template>
	</Suspense>
</template>

<style scoped src="./App.css"></style>
