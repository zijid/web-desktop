<script setup>
import { ref,reactive,computed,watch,watchEffect,onMounted,nextTick,defineAsyncComponent} from "vue";
import Menu from "../menu/menu.vue";
import { addApp,data ,openAppList} from "@/hooks";
import {createProgress,progressList,showWindow,activeAppPid,windowList,showDesktop,showCount} from "@/hooks/system"
import { FUNCTION,DIR } from "@/components/menu/type";
import { exec } from "@/App"

const vSelect = {
  mounted: (el) => {
        if (document.body.createTextRange) {
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
const position=reactive({
	x:-1000,y:-1000
})
let title=ref("")
function showMenu(e,i){
	position.x=e.clientX
	position.y=e.clientY
	show.value=true
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
			type:FUNCTION,
			hander:()=>{
				createProgress(i.title,i.exec,"C:/用户/桌面","","a b ccc")
				show.value=false
			}
		})
		menuDatas.value.push({
			title:"重命名",
			type:FUNCTION,
			hander:()=>{
				item.value.edit=true
				title.value=item.value.title
				show.value=false
			}
		})
	}else{
		item.value=""
	}
	menuDatas.value.push(...menuData)
	console.log("menuDatas.value:",menuDatas.value);
}
const show=ref(true)
setTimeout(() => {
	show.value=true
}, 1000);
const menuData=[
	{
		title:"新建文本",
		type:FUNCTION,
		hander:()=>{
			createProgress(exec["notepad"].title,exec["notepad"].app,"C:/用户/桌面","","a b ccc")
			show.value=false
		}
	},
	{
		title:"新建文件夹",
		type:FUNCTION,
		hander:()=>{
			const app=addApp("explorer","文件管理器","","","")
			item.value=app
			app.edit=true
			title.value=app.title
			show.value=false
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
	show.value=false;
	if(item.value.title &&title.value){
		item.value.title = title.value
		item.value.edit=false
		item.value={}
	}
}
</script>

<template>
	<div class="desktop" @click="editNameBlue" @contextmenu.prevent="showMenu($event,null)" >
		<Menu :data="menuDatas" :position="position" :show="show"></Menu>
		<div class="app" v-for="(item,index) in data" :key="item.title" tabindex="1" @contextmenu.prevent.stop="showMenu($event,item)">
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