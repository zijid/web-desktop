<script setup>
import { ref,reactive,computed,watch,watchEffect,onMounted,nextTick} from "vue";
import Menu from "./components/menu/menu.vue"
import { addApp,data ,openAppList} from "./hooks";
import {createProgress,progressList,showWindow,activeAppPid,hideToShowWindow,windowList,showDesktop} from "./hooks/system"
import { FUNCTION,DIR } from "./components/menu/type";
import "./App.js"//初始化一些东西
// import Explorer from "./components/explorer/explorer.vue";
// import Notepad from "./components/notepad/notepad.vue";
// import Win from "./components/window/window.vue";

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
		title:"文本",
		type:FUNCTION,
		hander:()=>{
			addApp(FUNCTION,"文本")
			show.value=false
		}
	},
	{
		title:"文件夹",
		type:FUNCTION,
		hander:()=>{
			addApp(DIR,"文件夹")
			show.value=false
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
const app=ref([])
const activeAppIndex=ref(0)

nextTick(()=>{
	activeAppIndex.value=openAppList.length-1
})

function showApp(pid,index){
	// console.log("app.value[index].$el:",app.value[index].$el);
	// app.value[index].$el.focus()
	console.log("pid:",pid);
	if(windowList.find(i=>i.pid===pid).z>-1){
		showWindow(pid,"tab")
	}else{
		hideToShowWindow(pid)
	}
}
</script>

<template>
	<div class="desktop" @click="show=false" @contextmenu.prevent="showMenu($event,null)">
		<Menu :data="menuData" :position="position" :show="show"></Menu>
		<!-- <div v-for="app in openAppList" :key="app.path">
			<Explorer v-if="app.exec===0" :path="app.path"></Explorer>
			<Notepad v-else :path="app.path"></Notepad>
		</div> -->
		<div class="app" v-for="item in data" :key="item.title" tabindex="1"  @contextmenu.prevent.stop="showMenu($event,i)">
			<div class="box" @dblclick="createProgress(item.title,item.exec,item.pwd,item.targetPath,item.args)">
				<div class="icon" v-html="item.icon"></div>
				<div class="name">
					{{item.title}}
				</div>
			</div>
		</div>
		<div class="tab">
			<!-- <template v-for="(app,index) in openAppList" :key="app.path">
					<Explorer v-if="app.exec===0" :path="app.path" :pid="app.pid" ref="app"></Explorer>
					<Notepad v-else :path="app.path" :pid="app.pid" ref="app"></Notepad>
					<div class="app_item" :class="{active_app:activeAppIndex===index}" @click="showApp(index)">
					{{ app.exec }}
				</div>
			</template> -->
			<template v-for="(progress,index) in progressList" :key="progress.pid">
				{{ progress }}
				<component :is="progress.exec" v-bind="progress" ref="app"></component>
				<div class="app_item" :class="{active_app:activeAppPid===progress.pid}" @click="showApp(progress.pid,index)">
					{{ progress.title }}
				</div>
			</template>
			<div class="showDesktop" @click="showDesktop"></div>
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
	--tab-height:40px;
	padding-bottom: var(--tab-height);
}

.showDesktop{
    position: absolute;
    right: 0;
    width: 10px;
    height: 100%;
    background: #00000033;
    box-shadow: -1px 0px 1px #ffffff57;
}
.showDesktop:hover{
	background-color: #ffffff3a;
}
.tab{
	width: 100%;
	height:var(--tab-height);
	background-color: #0000007a;
	position: fixed;
	bottom: 0;
	display: flex;
	flex-direction: row;
	z-index: 9;
}
.app_box{
	position: fixed;
}
.app_item{
	padding:0 1em;
	line-height:var(--tab-height);
	box-sizing: border-box;
	color: #fff;
	border-bottom: 2px inset #ffbb29;
	cursor: default;
	user-select: none;
	margin:0 10px;
	transition: padding 0.1s, margin 0.1s;
}
.app_item:hover{
	background-color: rgba(240, 240, 240, 0.2);
	margin:0;
	padding:0 calc( 1em + 10px );
}
.app_item:active{
	background-color: rgba(240, 240, 240, 0.4);
}
.active_app{
	background-color: rgba(240, 240, 240, 0.5);
	margin:0;
	padding:0 calc( 1em + 10px );
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
	display: flex;
    align-items: center;
    justify-content: center;
	filter: drop-shadow(1px 1px 1px #fff);
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
    color: #fff;
	cursor: default;
	text-shadow: 1px 1px #000;
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
