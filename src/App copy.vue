<script setup>
import { ref,reactive,computed,watch,watchEffect,onMounted,nextTick} from "vue";
import Menu from "./components/menu/menu.vue"
import { addApp,data } from "./hooks";
import { FUNCTION,DIR } from "./components/menu/type";
const item=ref("")
const position=reactive({
	x:-1000,y:-1000
})
function showMenu(e,i){
	position.x=e.clientX
	position.y=e.clientY
	show.value=true
	if(i){
		item.value=i
	}else{
		item.value=""
	}
}
const show=ref(true)
setTimeout(() => {
	
show.value=true
}, 1000);
const menuData=[
	{
		title:"文本a",
		type:FUNCTION,
		hander:()=>{
			addApp(FUNCTION,"文本")
			show.value=false
		}
	},
	{
		title:"文本b",
		type:FUNCTION,
		hander:()=>{
			addApp(DIR,"文件夹")
		}
	},
	{
		title:"新建",
		type:DIR,
		children:[
			{
				title:"文本",
				type:FUNCTION,
				hander:()=>{
					addApp(FUNCTION,"文本")
				}
			},
			{
				title:"目录",
				type:FUNCTION,
				hander:()=>{
					addApp(DIR,"文本")
				}
			},
			{
				title:"更多",
				type:DIR,
				children:[
					{
						title:"文本2",
						type:DIR,
						children:[
							{
								title:"文本3",
								type:FUNCTION,
								hander:()=>{
									addApp("文本")
								}
							},
							{
								title:"目录3",
								type:FUNCTION,
								hander:()=>{
									addApp("文本")
								}
							}
						],
					},
					{
						title:"目录2",
						type:FUNCTION,
						hander:()=>{
							addApp("文本")
						}
					}
				],
			}
		],
	}
]
</script>

<template>
	<div class="desktop" @click="show=false" @contextmenu.prevent="showMenu($event,null)">
		<Menu :data="menuData" :position="position" :show="show"></Menu>
		<div class="app" v-for="item in data" :key="item.title" tabindex="1"  @contextmenu.prevent.stop="showMenu($event,i)">
			<div class="box">
				<div class="icon" v-html="item.icon">
					
				</div>
				<div class="name">
					{{item.title}}
				</div>
			</div>
		</div>
	</div>
</template>
<style>
body{
	background-image: url(/bg.png);
	background-repeat: no-repeat;
	overflow: hidden;
	margin: 0;
	height: 100vh;
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
