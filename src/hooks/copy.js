import {ref,reactive,markRaw} from "vue"
import {createProgress} from "@/system/progress"

import {showWindow,showDesktop} from "@/system/window";
import {exec,bus,initApp,selectAppList} from "@/App"
import {addApp,openAppList,data,windowList,progressList,activeAppPid,fileList} from "@/hooks";
import {init,getConfig} from "@/system"
import {dir_str,readFileAll,readFile,WebDir} from "@/utils/file"

let editFileName=""
function initAppList(){
	appList.value=[...systemAppList,...fileList[config.desktop.path]]
	appList.value.sort(({createTime:a},{createTime:b})=>a-b)
}
function initList(path){
	readFileAll(path).then(res=>{
		fileList[path]=res
		initAppList()
		// openApp(systemAppList[0])
	})
}
const selectPath=ref(null)
const selectList=ref([])//复制剪切粘贴删除时候使用值当前在selectAppList获取 相对于剪切板
const isShear=ref(false)
function selectAppListEmpty(){
	selectAppList.value.splice(0,selectAppList.value.length)
}
async function selectApp(e,file){
	if(!await editNameBlue())return 
	if(e.ctrlKey){
		const index=selectAppList.value.findIndex(i=>i.uid===file.uid)
		if(index>-1){
			selectAppList.value.splice(index,1)
		}else{
			selectAppList.value.push(file)
		}
	}else{
		selectAppListEmpty()
		selectAppList.value.push(file)
	}
	if(selectAppList.value[0]){
		focusFile.value=selectAppList.value[0]
	}
}
bus.on("copy",()=>{
	isShear.value=false
	selectList.value.splice(0,selectList.value.length)
	selectList.value.push(...selectAppList.value)
})
bus.on("shear",()=>{
	isShear.value=true
	selectList.value.splice(0,selectList.value.length)
	selectList.value.push(...selectAppList.value)
})
bus.on("paste",()=>{
	const path=selectPath.value
	if(!path)return
	if(selectList.value){
		const arr=[]
		let fun
		if(isShear.value===false){
			fun=file=>{
				arr.push(file.copy(path))
			}
		}else{
			fun=file=>{
				arr.push(file.shear(path))
			}
		}
		const pwds=new Set(selectList.value.filter(i=>i.pwd!="/system-app").map(i=>i.pwd))
		selectList.value.filter(i=>i.pwd!="/system-app").forEach(fun)
		Promise.all(arr).then((e)=>{
			
			initList(path)
			pwds.forEach(initList)//更新全部复制的内容

			
			selectList.value.splice(0,selectList.value.length)
			if(desktop.value)
				desktop.value.focus()
		})
	}
})
bus.on("show-menu",async ({e,i})=>{
	console.log(`e,i:`,e,i);
	const isName=await editNameBlue()
	if(!isName) return
	bus.emit("menu-show",{
		type:"menu",
		x:e.clientX,
		y:e.clientY
	})
	
	const index=selectAppList.value.findIndex(item=>item.uid===i.uid)
	if(index==-1){
		selectAppListEmpty()
		selectAppList.value.push(i)
	}
	menuDatas.value.splice(0,menuDatas.value.length)
	if(item.value.edit){
		item.value.edit=false
	}
	if(title.value&&item.value.title){
		item.value.title=title.value
	}
	if(i.type==="WebDir"||i.type==="WebFile"){
		menuDatas.value.push({
			title:"打开",
			hander:()=>{
				openApp(i)
			}
		})
		menuDatas.value.push({
			title:"重命名",
			hander:()=>{
				console.log(`i:`,i);
				let dir=i
				editFile.value=dir
				editFileName=dir.name
			}
		})
		if(i.pwd!=="/system-app"){
			menuDatas.value.push({
				title:"复制",
				hander:()=>{
					copy()
				}
			},
			{
				title:"剪切",
				hander:()=>{
					shear()
				}
			},
			// {
				// title:"粘贴",
				// hander:()=>{
				// 	createProgress(i.title,i.exec,"C:/用户/桌面","","a b ccc")
			// },
			{
				title:"删除",
				hander:()=>{
					deleteFile()
				}
			})
		}
		item.value=i
	}else{
		menuDatas.value.push(...menuData)
		if(selectList.value.length){
			menuDatas.value.push({
				title:"粘贴",
				hander:()=>{
					paste("/C/Desktop/文件夹"||i.path)
				}
			})
		}
		item.value=""
	}
})
setInterval(() => {
	console.log(`selectAppList.value:`,selectAppList.value);
}, 1000);
bus.on("delete",()=>{
	selectList.value.splice(0,selectList.value.length)
	selectList.value.push(...selectAppList.value)
	const pwds=new Set(selectList.value.filter(i=>i.pwd!="/system-app").map(i=>i.pwd))
	console.log(`selectList.value:`,selectList.value);
	Promise.all(selectList.value.filter(i=>i.pwd!="/system-app").map(i=>i.delete())).then(res=>{
		pwds.forEach(initList)
	})
})
const opacity=ref(0)
onMounted(()=>{
	bg.value=config.desktop.bg.base64||config.desktop.bg.url
	initList(config.desktop.path)
	// bus.on("update:app",(apps)=>{
	// 	appList.value=[...apps]
	// })
	let t=0
	bus.on("select-path",(path)=>{
		console.log(`select-path:path:`,path);
		selectPath.value=path
		opacity.value=1
		clearTimeout(t)
		t=setTimeout(()=>{
			opacity.value=0
		},2000)
	})
})
function select(el){
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
const vSelect = {
	mounted: select
}
const item=ref({})
const editFile=ref(null)

let title=ref("")
const copyFile=ref(null)
const selectFile=ref(null)
function copy(){
	bus.emit("copy")
	// copyFile.value=file
}
function shear(){
	bus.emit("shear")
}
function paste(path){
	selectAppListEmpty()
	bus.emit("paste",path)
}
function deleteFile(){
	bus.emit("delete")
}
async function showMenu(e,i){
	bus.emit("show-menu",{e,i})
}
const menuData=[
	{
		title:"新建文本",
		icon:`<?xml version="1.0" encoding="UTF-8"?><svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M40 23V14L31 4H10C8.89543 4 8 4.89543 8 6V42C8 43.1046 8.89543 44 10 44H22" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M33 29V43" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 36H33H40" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 4V14H40" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
		hander:()=>{
			createProgress(exec["notepad"].title,exec["notepad"].app,"C:/用户/桌面","")
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
			// const app=addApp("explorer","文件管理器","","","")
			/**
			 创建文件夹
			 需要
			 当前位置
			 文件夹名称
			 */
			const pwd="/C/Desktop"
			const name="新建文件夹"
			let dir=new WebDir(pwd,name)
			dir.setIcon(dir_str)
			fileList[config.desktop.path].push(dir)
			editFile.value=dir
			editFileName=dir.name
			initAppList()
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
	editFileName=e.target.textContent;
}
const editNameRef=ref(null)
async function editNameBlue(){
	bus.emit("menu-close")
	// bus.emit("select-path",config.desktop.path)
	if(editFile.value===null)return true
	let isFileExist=await readFile("/C/Desktop/"+editFileName)
	if(isFileExist&&editFile.value.uid===isFileExist.uid){
		isFileExist=undefined
	}
	if(isFileExist||!editFileName){
		alert("文件名无效或文件已存在")
		const el=editNameRef.value[0]
		if(el){
			nextTick(()=>{
				el.focus()
				select(el)
			})
		}
		return false
	}
	// editFile.value.rename(editFileName)
	readFile(editFile.value.path).then(res=>{
		console.log(`res:`,res);
		console.log(`editFile.value:`,editFile.value);
		if(res&&res.uid===editFile.value.uid){
			editFile.value.rename(editFileName)
		}else{
			editFile.value.name=editFileName
			editFile.value.save()
		}
		initList(editFile.value.pwd)
		editFile.value=null
		// fileList[config.desktop.path].sort(({createTime:a},{createTime:b})=>a-b)
		editFileName=""
	})
	
	return true
}
function openApp(item){
	let app
	if(item.type==="WebDir"){
		app="Explorer"
	}else{
		app="Notepad"
	}
	createProgress(item.name,app,item.pwd,item.path)
	selectAppListEmpty()
}
const focusFile=ref(null)
async function focusApp(item){
	let isName=await editNameBlue()
	// if(focusFile.value){
	// 	isName=await editNameBlue()
	// }
	if(!isName) return
	focusFile.value=item
}
document.addEventListener("keydown",async (e)=>{
	if(e.code==="F2"){
		e.preventDefault()
		if(editFile.value)return 
		const isName=await editNameBlue()
		if(!isName) return
		if(focusFile.value){
			editFile.value=focusFile.value
			editFileName=editFile.value.name
		}
	}else if(e.code==="Tab"){
		const isName=await editNameBlue()
		if(!isName) return
		editFile.value=null
	}else if(e.code==="Enter"&&!e.shiftKey){
		e.preventDefault()
		const isName=await editNameBlue()
		if(!isName) return
	}else if(e.code==="KeyC"&&e.ctrlKey){
		copy()
	}else if(e.code==="KeyX"&&e.ctrlKey){
		shear()
	}else if(e.code==="KeyV"&&e.ctrlKey){
		if(selectList.value.length){
			paste("/C/Desktop/文件夹"||i.path)
		}
	}else if(e.code==="Delete"){
		deleteFile()
	}
})