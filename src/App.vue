<script setup>
import { ref,reactive,computed,watch,watchEffect,onMounted,nextTick} from "vue";
import Menu from "./components/menu/menu.vue"
const item=ref("")
function showMenu(i){
	if(i){
		item.value=i
	}else{
		item.value=""
	}
}
const data=[
	{
		title:"查看",
	},
	{
		title:"排序",
	},
	{
		title:"刷新",
	}
]
</script>

<template>
	<Menu :data="data"></Menu>
	<div class="desktop" @contextmenu.prevent="showMenu(null)">
		<div class="app" v-for="i in 50" tabindex="1"  @contextmenu.prevent.stop="showMenu(i)">
			<div class="box">
				<div class="icon">
					<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 4H30L40 14V42C40 43.1046 39.1046 44 38 44H10C8.89543 44 8 43.1046 8 42V6C8 4.89543 8.89543 4 10 4Z" fill="none" stroke="#333" stroke-width="4" stroke-linejoin="round"/><path d="M18 18.0083H30" stroke="#333" stroke-width="4" stroke-linecap="round"/><path d="M24.0083 18.0083V34" stroke="#333" stroke-width="4" stroke-linecap="round"/></svg>
				</div>
				<div class="name">
					桌面文件桌面文件桌面文件桌面文件桌面文件桌面文件桌面文件桌面文件
				</div>
			</div>
		</div>
	</div>
</template>
<style>
body{
	background-image: url(/bg.png);
	background-repeat: no-repeat;
}
</style>
<style scoped>
.desktop{
	display: flex;
	flex-direction: column;
	flex-wrap: wrap;
    align-content: flex-start;
	width: 100vw;
	height: 100vh;
	overflow: hidden;
	--size:12px;
	--line-height:14px;
}
.app{
	width: 80px;
	height: calc( 60px + var(--line-height) *2 + 8px);
	margin: 10px;
	box-sizing: border-box;

}
.box{
	width: 80px;
	height: 100%;
	padding: 4px 0;
	box-sizing: border-box;

}
.icon{
	width: 60px;
	height: 60px;
	margin: 0 auto;
	background-color: red;
}
.name{
	width: 100%;
	height: calc(var(--line-height) * 2);
	line-height: var(--line-height);
	
	text-align: center;
	font-size: var(--size);
	overflow: hidden;
	text-overflow: ellipsis;
	-webkit-line-clamp: 2; 
	display: -webkit-box; 
	-webkit-box-orient: vertical; 
	text-shadow: 1px 1px 1px black;
    color: #fff;
	cursor: default;

}
.app:focus .box{
	height: auto;
	outline: dotted 2px #ffbb29;
	background-color: rgba(255, 255, 255, 0.205);
	position: relative;
	z-index: 1;
}
.app:focus .name{
	height: auto;
	display:block; 
}
</style>
