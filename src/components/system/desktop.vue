<script setup>
import { ref,reactive,computed,watch,watchEffect,onMounted,nextTick,defineAsyncComponent} from "vue";
import Menu from "@/components/system/menu/menu.vue";
import {createProgress,progressList,showWindow,activeAppPid,windowList,showDesktop} from "@/hooks/system"
import { exec,bus} from "@/App"
import { addApp,openAppList,data} from "@/hooks";
import {init,getConfig} from "@/system"
await init()
const config=getConfig()
console.log(`config:`,config);
const appList=ref([...data])
const bg=ref("")
onMounted(()=>{
	bg.value=config.bg.base64||config.bg.url
	bus.on("update:app",(apps)=>{
		appList.value=[...apps]
	})
})

const vSelect = {
	mounted: (el) => {
		if(document.body.createTextRange) {
			var range = document.body.createTextRange();
			range.moveToElementText(text);
			range.select();
		} else if (window.getSelection) {
			var selection = window.getSelection();
			var range = document.createRange();
			range.selectNodeContents(el);
			selection.removeAllRanges();
			selection.addRange(range);
		} else {
			alert("none");
		}
	}
}
const item=ref({})
let title=ref("")
function showMenu(e,i){
	bus.emit("menu-show",{
		type:"menu",
		x:e.clientX,
		y:e.clientY
	})
	menuDatas.value.splice(0,menuDatas.value.length)
	if(item.value.edit){
		item.value.edit=false
	}
	if(title.value&&item.value.title){
		item.value.title=title.value
	}
	if(i){
		item.value=i
		// menuDatas.value.push(...i.menu(show))
		menuDatas.value.push({
			title:"打开",
			hander:()=>{
				createProgress(i.title,i.exec,"C:/用户/桌面","","a b ccc")
			}
		})
		menuDatas.value.push({
			title:"重命名",
			hander:()=>{
				item.value.edit=true
				title.value=item.value.title
			}
		})
	}else{
		item.value=""
	}
	menuDatas.value.push(...menuData)
	console.log("menuDatas.value:",menuDatas.value);
}
const menuData=[
	{
		title:"新建文本",
		icon:`<?xml version="1.0" encoding="UTF-8"?><svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M40 23V14L31 4H10C8.89543 4 8 4.89543 8 6V42C8 43.1046 8.89543 44 10 44H22" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M33 29V43" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 36H33H40" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 4V14H40" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
		hander:()=>{
			console.log(`111:`,111);
			createProgress(exec["notepad"].title,exec["notepad"].app,"C:/用户/桌面","","a b ccc")
		}
	},
	{
		title:"TEST文件夹",
		children:[
			{
				title:"文件夹111",
				children:[
					{
						title:"打开",
						hander:()=>{
							alert("打开")
						}
					}
				]
			}
		]
	},
	{
		title:"新建文件夹",
		icon:`<?xml version="1.0" encoding="UTF-8"?><svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 8C5 6.89543 5.89543 6 7 6H19L24 12H41C42.1046 12 43 12.8954 43 14V40C43 41.1046 42.1046 42 41 42H7C5.89543 42 5 41.1046 5 40V8Z" fill="none" stroke="#333" stroke-width="4" stroke-linejoin="round"/><path d="M43 22H5" stroke="#333" stroke-width="4" stroke-linejoin="round"/><path d="M5 16V28" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M43 16V28" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
		hander:()=>{
			const app=addApp("explorer","文件管理器","","","")
			item.value=app
			app.edit=true
			title.value=app.title
		}
	}
]
const menuDatas=ref([])
const app=ref([])
const activeAppIndex=ref(0)
nextTick(()=>{
	activeAppIndex.value=openAppList.length-1
})

function showApp(pid,index){
	showWindow(pid,"tab")
}
function editNameInput(e){
	title.value=e.target.textContent;
}

function editNameBlue(){
	bus.emit("menu-close")
	if(item.value.title&&title.value){
		item.value.title = title.value
		item.value.edit=false
		item.value={}
	}
}
</script>

<template>
	<div class="desktop" :style="{backgroundImage:`url(${bg})`}" @click="editNameBlue" @contextmenu.prevent="showMenu($event,null)" >
		<Menu :data="menuDatas"></Menu>
		<div class="app" v-for="(item,index) in appList" :key="index" tabindex="1" @contextmenu.prevent.stop="showMenu($event,item)">
			<div class="box" @dblclick="createProgress(item.title,item.exec,item.pwd,item.targetPath,item.args)">
				<div class="icon" v-html="item.icon"></div>
				<div class="name" v-if="!item.edit">
					{{item.title}}
				</div>
				<div class="name editName" v-else v-focus v-text="data[index].title"
				 @input="editNameInput"
				 @click.stop
				 @dblclick.stop
				 contenteditable=""
				 v-select
				 ></div>
			</div>
		</div>
		<div id="windows">
			<template v-for="(progress,index) in progressList" :key="progress.pid">
				<component :is="progress.exec" v-bind="progress" ref="app"></component>
			</template>
		</div>
		<div class="tab" v-show="progressList.length">
			<template v-for="(progress,index) in progressList" :key="progress.pid">
				<div v-if="windowList.find(i=>i.pid===progress.pid)" class="app_item" :class="{active_app:activeAppPid===progress.pid}" @click="showApp(progress.pid,index)">
					{{ progress.title }}
				</div>
			</template>
			<div class="showDesktop" @click="showDesktop"></div>
		</div>
	</div>
</template>

<style scoped src="./desktop.css"></style>