<script setup>


import { ref,reactive,computed,watch,watchEffect,onMounted,onUnmounted,nextTick,defineAsyncComponent} from "vue";


import Menu from "@/components/system/menu/menu.vue";


import {createProgress} from "@/system/progress"


import AppFrame from "@/system/apps/AppFrame.vue"


import Window from "@/components/window/window.vue"


import SystemInfo from "@/components/system/SystemInfo.vue"





import {showWindow,showDesktop} from "@/system/window";


import {closeWindow as sysCloseWindow} from "@/system/window";


import {exec,bus,systemDirectory,initApp,initAppSystem} from "@/App"


import {addApp,openAppList,data,windowList,progressList,activeAppPid,fileList,selectList} from "@/hooks";


import {init,getConfig} from "@/system"


import * as system from "@/system"


import {dir_str,my_computer,readFileAll,readFile,WebDir,WebFile} from "@/utils/file"


import { getAllApps, getApp, launchApp, loadCustomApps } from "@/system/apps"


import { openFile, getOpenWithApps, getAppForExtension, rebuildAssociations } from "@/system/filetypes"





// 自定义指令：自动聚焦 contenteditable 并将光标移到末尾


const vFocus = {


  mounted(el) {


    el.focus()


    const range = document.createRange()


    const sel = window.getSelection()


    range.selectNodeContents(el)


    range.collapse(false)


    sel.removeAllRanges()


    sel.addRange(range)


  }


}


await init()


await initApp()


const config=getConfig()


console.log(`配置config:`,config);


const desktop=ref(null)


const appList=ref([...data])


// const appList=computed(()=>{


// 	return fileList[config.desktop.path]


// })


const bg=ref("")
const bgMode=ref(localStorage.getItem('web-desktop-bg-mode') || 'cover')

const bgStyle=computed(()=>{
  const mode = bgMode.value
  if (!bg.value) return {}
  const isGradient = bg.value.startsWith('gradient:')
  const styles = isGradient
    ? { background: bg.value.substring(9) }
    : { backgroundImage: `url(${bg.value})` }
  switch (mode) {
    case 'cover':
      styles.backgroundSize = 'cover'
      styles.backgroundRepeat = 'no-repeat'
      styles.backgroundPosition = 'center center'
      break
    case 'contain':
      styles.backgroundSize = 'contain'
      styles.backgroundRepeat = 'no-repeat'
      styles.backgroundPosition = 'center center'
      break
    case 'fill':
      styles.backgroundSize = '100% 100%'
      styles.backgroundRepeat = 'no-repeat'
      styles.backgroundPosition = 'center center'
      break
    case 'center':
      styles.backgroundSize = 'auto'
      styles.backgroundRepeat = 'no-repeat'
      styles.backgroundPosition = 'center center'
      break
    case 'tile':
      styles.backgroundSize = 'auto'
      styles.backgroundRepeat = 'repeat'
      styles.backgroundPosition = '0 0'
      break
    default:
      styles.backgroundSize = 'cover'
      styles.backgroundRepeat = 'no-repeat'
      styles.backgroundPosition = 'center center'
  }
  return styles
})


const systemAppList=[]


const selectAppList=ref([])//选中的应用


const showStartMenu=ref(false)


const systemApps=ref([])





try {


	readFileAll("/system-app").then(res=>{


		if(res.length===0){


			config['desktop']['system-app'].forEach(i=>{


				const systemDir=new WebDir(i.pwd,i.name)


				systemDir.init(i)


				systemAppList.push(systemDir)


				console.log(`systemDir:`,systemDir);


				systemDir.save()


			})


		}else{


			systemAppList.push(...res)


			systemApps.value=[...systemAppList]


		}


	})


	// 等待应用扫描注册完成


	await initAppSystem()


	// 加载用户自定义应用


	loadCustomApps(); rebuildAssociations()


	// 将已注册的应用也显示到桌面


	const desktopApps = getAllApps().filter(a => !a.hidden)


	for (const app of desktopApps) {


		if (!systemAppList.find(i => i.uid === app.id)) {


			const appIcon = new WebDir("/system-app", app.name)


			appIcon.uid = app.id


			appIcon.icon = app.icon


			appIcon._appId = app.id


			systemAppList.push(appIcon)


		}


	}


	systemApps.value=[...systemAppList]


} catch (error) {


	console.error("加载默认桌面app失败："+error)


}


systemApps.value = [...systemAppList]


let editFileName=""


function toggleStartMenu(){


  showStartMenu.value=!showStartMenu.value


}


function closeStartMenu(e){


  if(!showStartMenu.value)return


  if(!e.target.closest(".startMenu")&&!e.target.closest(".startBtn")){


    showStartMenu.value=false


  }


}


function initAppList(){

	appList.value=[...(fileList[config.desktop.path]||[])]

	// 根据扩展名关联更新文件图标

	for (const f of appList.value) {
		if (f.type === 'WebFile' && f.extension) {
			const ext = f.extension.replace(/^\./, '').toLowerCase()
			const appId = getAppForExtension(ext)
			if (appId) {
				const app = getApp(appId)
				if (app && app.icon) {
					if (!f._origIcon) f._origIcon = f.icon
					f.icon = app.icon
				}
			} else if (f._origIcon) {
				f.icon = f._origIcon
				delete f._origIcon
			}
		}
	}

	const thisPcIdx = appList.value.findIndex(i => i.uid === "this-pc")


	if (thisPcIdx === -1) {


		appList.value.unshift({


			uid: "this-pc",


			name: "此电脑",


			icon: my_computer,


			type: "WebDir",


			path: "/",


			pwd: "/"


		})


	}


	appList.value.sort((a, b) => {
		// 此电脑始终在第一位
		if (a.uid === 'this-pc') return -1
		if (b.uid === 'this-pc') return 1
		// 文件夹排在文件前面
		if (a.type === 'WebDir' && b.type !== 'WebDir') return -1
		if (a.type !== 'WebDir' && b.type === 'WebDir') return 1
		// 按名称排序
		return (a.name || '').localeCompare(b.name || '', 'zh-CN')
	})


}


watch(()=>fileList,()=>{


	console.log(`111:`,fileList);


	initAppList()


},{deep:true})


const selectPath=ref(null)


const desktopDragOver=ref(false)


const showSystemInfo=ref(false)


// const selectList=ref([])//复制剪切粘贴删除时候使用值当前在selectAppList获取


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





const opacity=ref(0)


onMounted(()=>{


  window.addEventListener('app-registered', refreshAppList)


  document.addEventListener("click",closeStartMenu,true)
  document.addEventListener("click",closeTaskbarPopup,true)
  document.addEventListener("click",closeTaskbarPopup,true)


	bg.value=config.desktop.bg.base64||config.desktop.bg.url

	// 从 localStorage 读取用户设置覆盖
	const savedBg = localStorage.getItem('web-desktop-bg')
	const savedPath = localStorage.getItem('web-desktop-desktop-path')
	if (savedBg) bg.value = savedBg
const savedMode = localStorage.getItem('web-desktop-bg-mode')
if (savedMode) bgMode.value = savedMode
	if (savedPath) config.desktop.path = savedPath

	bus.on('wallpaper-change', (url) => { bg.value = url })
bus.on('wallpaper-mode-change', (mode) => { bgMode.value = mode })
  
  bus.on('file-list-changed', (path) => { system.initList(path).then(() => { initAppList() }) })


	system.initList(config.desktop.path).then(()=>{


		initAppList()


	})


	// bus.on("update:app",(apps)=>{


	// 	appList.value=[...apps]


	// })


	let t=0


	selectPath.value=config.desktop.path


	bus.on("select-path",(path)=>{


		selectPath.value=path


		opacity.value=1


		clearTimeout(t)


		t=setTimeout(()=>{


			opacity.value=0


		},2000)


	})


})


onUnmounted(()=>{


  document.removeEventListener("click",closeStartMenu,true)
  document.removeEventListener("click",closeTaskbarPopup,true)
  document.removeEventListener("click",closeTaskbarPopup,true)


  window.removeEventListener('app-registered', refreshAppList)


})





// 应用注册后刷新开始菜单


function refreshAppList() {


  const apps = getAllApps().filter(a => !a.hidden)


  for (const app of apps) {


    if (!systemAppList.find(i => i.uid === app.id)) {


            const appIcon = new WebDir('/system-app', app.name)


      appIcon.uid = app.id


      appIcon.icon = app.icon


      appIcon._appId = app.id


      systemAppList.push(appIcon)


    }


  }


  systemApps.value = [...systemAppList]


  // 同时刷新桌面文件图标（扩展名关联更新后重新匹配图标）; rebuildAssociations()


  initAppList()


}


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


const editFile=ref(null)


function copy(){


	system.copy([...selectAppList.value])


}


function shear(){


	system.shear([...selectAppList.value])


}


function paste(){


	selectAppListEmpty()


	system.paste(selectPath.value)


	if(desktop.value)


		desktop.value.focus()


}


function deleteFile(){


	system.deleteFile([...selectAppList.value])


}


async function showMenu(e,i){


	const isName=await editNameBlue()


	if(!isName) return


	const index=selectAppList.value.findIndex(item=>item.uid===i.uid)


	if(index==-1){


		selectAppListEmpty()


		selectAppList.value.push(i)


	}


	menuDatas.value.splice(0,menuDatas.value.length)


	if(i.type==="WebDir"||i.type==="WebFile"){


		const _menuClickPos = { x: e.clientX, y: e.clientY }


		menuDatas.value.push({


			title:"打开",


			hander:()=>{


				openApp(i, _menuClickPos)


			}


		})


		// "打开方式"子菜单：列出全部应用


		const ext = i.extension ? i.extension.replace(/^\./, "").toLowerCase() : ""


		const matchApps = ext ? getOpenWithApps(ext) : []


		const allApps = getAllApps().filter(a => !a.hidden && a.id !== 'explorer')


		const openWithChildren = []


		// 先加匹配的应用


		for (const ma of matchApps) {


			openWithChildren.push({


				title: '✓ ' + ma.name,


				hander: () => { launchApp(ma.id, { title: i.name, filePath: i.path, pwd: i.pwd }) }


			})


		}


		// 匹配的和不匹配之间加分隔线


		if (matchApps.length > 0 && matchApps.length < allApps.length) {


			openWithChildren.push({ type: 'separator' })


		}


		// 再加其他应用


		for (const app of allApps) {


			if (matchApps.find(a => a.id === app.id)) continue


			openWithChildren.push({


				title: app.name,


				hander: () => { launchApp(app.id, { title: i.name, filePath: i.path, pwd: i.pwd }) }


			})


		}


		menuDatas.value.push({


			title: '打开方式',


			children: openWithChildren


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


		if(i.pwd!=="/system-app" && i.uid!=="this-pc"){


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




	}else{


		menuDatas.value.push(...menuData)

		const shortcutIdx = menuDatas.value.findIndex(i => i.title === "系统设置")
		if (shortcutIdx > -1) {
			const allApps = getAllApps().filter(a => !a.hidden)
			if (allApps.length > 0) {
				const shortcutChildren = allApps.map(app => ({
					title: app.name,
					icon: app.icon,
					hander: () => {
						const shortcut = new WebDir(config.desktop.path, app.name)
						shortcut.uid = app.id + '-shortcut'
						shortcut.icon = app.icon
						shortcut._appId = app.id
						shortcut.nickname = app.name
						shortcut.save().then(() => {
							system.initList(config.desktop.path).then(() => initAppList())
						})
						bus.emit('menu-close')
					}
				}))
				menuDatas.value.splice(shortcutIdx, 0, {
					title: '新建快捷方式',
					icon: '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 4L6 14V34L24 44L42 34V14L24 4Z" fill="none" stroke="#333" stroke-width="4" stroke-linejoin="round"/><path d="M24 44V24" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 14L24 24L42 14" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
					children: shortcutChildren
				})
			}
		}


		console.log(`selectList.value:`,selectList.value);


		if(selectList.value.length){


			menuDatas.value.push({


				title:"粘贴",


				hander:()=>{


					paste()


				}


			})


		}


	}


	


		menuDatas.value.push({


				title:"属性",


				hander:()=>{


					alert('文件属性\\n名称: ' + i.name + '\\n路径: ' + i.path + '\\n类型: ' + (i.type||'应用') + '\\n大小: ' + (i.size||'--') + '\\n创建时间: ' + (i.createTime ? new Date(i.createTime).toLocaleString() : '--') )


				}


			})
	bus.emit("menu-show",{


		x:e.clientX,


		y:e.clientY,


		data:menuDatas.value


	})


}


const menuData=[




	{


		title:"新建文本",


		icon:`<?xml version="1.0" encoding="UTF-8"?><svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M40 23V14L31 4H10C8.89543 4 8 4.89543 8 6V42C8 43.1046 8.89543 44 10 44H22" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M33 29V43" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 36H33H40" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 4V14H40" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,


		hander:async ()=>{ editFile.value = null; editFileName = "";


			const pwd = "/C/Desktop"


			let name = "新建文本文档.txt"


			let counter = 2


			while ((fileList[config.desktop.path]||[]).some(f => f.name === name)) { name = "新建文本文档 (" + counter + ").txt"; counter++ }


			const file = new WebFile(pwd, name);


			file.write("");


			await file.save();


			fileList[config.desktop.path].push(file);


			editFile.value = file;


			editFileName = file.name;


			initAppList()


		}


	},


	{


		title:"新建文件夹",


		icon:`<?xml version="1.0" encoding="UTF-8"?><svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 8C5 6.89543 5.89543 6 7 6H19L24 12H41C42.1046 12 43 12.8954 43 14V40C43 41.1046 42.1046 42 41 42H7C5.89543 42 5 41.1046 5 40V8Z" fill="none" stroke="#333" stroke-width="4" stroke-linejoin="round"/><path d="M43 22H5" stroke="#333" stroke-width="4" stroke-linejoin="round"/><path d="M5 16V28" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M43 16V28" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,


		hander:async ()=>{ editFile.value = null; editFileName = "";


			const pwd="/C/Desktop"


			let name="新建文件夹"


			let counter = 2


			while ((fileList[config.desktop.path]||[]).some(f => f.name === name)) { name = "新建文件夹 (" + counter + ")"; counter++ }


			let dir=new WebDir(pwd,name)


			dir.setIcon(dir_str)


			await dir.save()


			fileList[config.desktop.path].push(dir)


			editFile.value=dir


			editFileName=dir.name


			initAppList()


		}


	},




	{


		title:"系统设置",


		icon:`<?xml version="1.0" encoding="UTF-8"?><svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z" fill="none" stroke="#333" stroke-width="4"/><path d="M24 16V24" stroke="#333" stroke-width="4" stroke-linecap="round"/><circle cx="24" cy="32" r="2" fill="#333"/></svg>`,


		hander: () => { launchApp('system-settings', { title: '系统设置' }) }


	},


	{


		title:"属性",


		icon:`<?xml version="1.0" encoding="UTF-8"?><svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z" fill="none" stroke="#333" stroke-width="4"/><path d="M24 16V24" stroke="#333" stroke-width="4" stroke-linecap="round"/><circle cx="24" cy="32" r="2" fill="#333"/></svg>`,


		hander:()=>{


      showSystemInfo.value=true


		}
	}

]


const menuDatas=ref([])


const app=ref([])


const activeAppIndex=ref(0)


nextTick(()=>{


	activeAppIndex.value=openAppList.length-1


})





const taskbarPopupPid = ref(null)
const taskbarPopupVisible = ref(false)
const taskbarPopupX = ref(0)
const taskbarPopupY = ref(0)
function showTaskbarPopup(e, progress) {
  const rect = e.currentTarget.getBoundingClientRect()
  taskbarPopupPid.value = progress.pid
  taskbarPopupX.value = rect.left + rect.width / 2
  taskbarPopupY.value = rect.top
  taskbarPopupVisible.value = true
}
function closeTaskbarPopup() {
  taskbarPopupVisible.value = false
}

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


	const file = editFile.value; const name = editFileName;


	try {


		const res = await readFile(file.path)


		if(res&&res.uid===file.uid){


			await file.rename(name)


		}else{


			file.name = name


			await file.save()


		}


		await system.initList(file.pwd)


		initAppList()


		appList.value = [...appList.value]


	} catch(e) { console.error("editNameBlue error", e) }


	editFile.value=null


	editFileName=""


	return true


}

// 桌面快捷方式
async function createDesktopShortcut(app) {
  const shortcut = new WebDir(config.desktop.path, app.nickname || app.name)
  shortcut.uid = app.uid + '-shortcut'
  shortcut.icon = app.icon
  shortcut._appId = app._appId || app.uid
  shortcut.nickname = (app.nickname || app.name)
  await shortcut.save()
  await system.initList(config.desktop.path)
  initAppList()
}

function showStartAppMenu(e, app) {
  bus.emit('menu-close')
  const items = [
    { title: '打开', hander: () => openApp(app) },
    { type: 'separator' },
    { title: '发送到桌面快捷方式', hander: () => createDesktopShortcut(app) }
  ]
  bus.emit('menu-show', { x: e.clientX, y: e.clientY, data: items })
}



function openApp(item, eventOrPos){


	if (item._appId) {


		const def = getApp(item._appId)


		if (def) {


			launchApp(item._appId, { title: item.name })


			selectAppListEmpty()


			return


		}


	}


	// 先尝试用文件类型关联打开


	if (item.type === "WebFile") {


		// 从文件名实时提取扩展名，避免重命名后 extension 属性未刷新的问题


		const nameParts = (item.name || '').split('.')


		const ext = nameParts.length > 1 ? nameParts.pop().toLowerCase() : ''


		const itemWithExt = Object.assign({}, item, { extension: ext ? '.' + ext : '' })


		const opened = openFile(itemWithExt)


		if (opened) {


			selectAppListEmpty()


			return


		}


		// 无关联时弹出选择应用


		let px = 0, py = 0


		if (eventOrPos && eventOrPos.clientX !== undefined) {


			px = eventOrPos.clientX; py = eventOrPos.clientY


		} else if (eventOrPos && eventOrPos.x !== undefined) {


			px = eventOrPos.x; py = eventOrPos.y


		} else {


			px = window.innerWidth / 2; py = window.innerHeight / 2


		}


		const pickerApps = getAllApps().filter(a => !a.hidden && a.id !== 'explorer')


		const pickerItems = []


		for (const app of pickerApps) {


			pickerItems.push({


				title: app.name,


				hander: () => { launchApp(app.id, { title: item.name, filePath: item.path, pwd: item.pwd }) }


			})


		}


		bus.emit("menu-show", { x: px, y: py, data: pickerItems })


		selectAppListEmpty()


		return


	}


	let app


	if(item.type==="WebDir"){


		app="Explorer"


	}else{


		app="Notepad"


	}


	createProgress(item.name,app,item.pwd,item.path)


	selectAppListEmpty()


}


function openThisPC(){


	showStartMenu.value = false


	launchApp('explorer', { title: '此电脑', pwd: '/', filePath: '/' })


}


function openDrive(drivePath, driveName){


	showStartMenu.value = false


	launchApp('explorer', { title: driveName, pwd: drivePath, filePath: drivePath })


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


async function inputKeyDown(e){


	if(e.code==="Enter"&&!e.shiftKey){


		e.preventDefault()


		const isName=await editNameBlue()


		if(!isName) return


	}


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


	}else if(e.code==="KeyC"&&e.ctrlKey){


		copy()


	}else if(e.code==="KeyX"&&e.ctrlKey){


		shear()


	}else if(e.code==="KeyV"&&e.ctrlKey){


		if(selectList.value.length){


			paste()


		}


	}else if(e.code==="Delete"){


		deleteFile()


	}


})




// ...
let _desktopDragCount = 0

function onDesktopDragOver(e) {
  _desktopDragCount++
  desktopDragOver.value = true
}

function onDesktopDragLeave(e) {
  _desktopDragCount--
  if (_desktopDragCount <= 0) {
    _desktopDragCount = 0
    desktopDragOver.value = false
  }
}

async function onDesktopDrop(e) {
  _desktopDragCount = 0
  desktopDragOver.value = false
  
  const files = e.dataTransfer.files
  if (!files || files.length === 0) return
  
  const targetPath = config.desktop.path || '/C/Desktop'
  
  let saved = 0
  let errors = 0
  const total = files.length
  
  for (let i = 0; i < total; i++) {
    const file = files[i]
    if (!file) { errors++; continue }
    try {
      await handleDesktopFileDrop(file, targetPath)
      saved++
    } catch (err) {
      console.error('[Desktop] Drop file failed:', file.name, err)
      errors++
    }
  }
  
  // Refresh
  await system.initList(config.desktop.path)
  initAppList()
  
  if (saved > 0) {
    const msg = 'Imported ' + saved + ' file(s)' + (errors > 0 ? ', ' + errors + ' failed' : '')
    try { const { useToast } = await import('zijid-ui'); const t = useToast(); t.show({ title: 'Import complete', message: msg, type: 'success', duration: 3000 }) } catch(e) {}
  }
}

async function handleDesktopFileDrop(file, targetPath) {
  const name = file.name
  if (!name) throw new Error('Invalid file name')
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async function(e) {
      try {
        const dataUrl = e.target.result
        const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : ''
        
        // Check same-name file
        const { readFile, WebFile } = await import('@/utils/file')
        const destPath = targetPath + '/' + name
        const exists = await readFile(destPath)
        let finalName = name
        if (exists) {
          const nameParts = name.split('.')
          const baseName = nameParts.length > 1 ? nameParts.slice(0, -1).join('.') : name
          const suffix = nameParts.length > 1 ? '.' + nameParts.pop() : ''
          let counter = 2
          while (await readFile(targetPath + '/' + baseName + '(' + counter + ')' + suffix)) {
            counter++
          }
          finalName = baseName + '(' + counter + ')' + suffix
        }
        
        const wf = new WebFile(targetPath, finalName)
        wf.write(dataUrl)
        await wf.save()
        resolve()
      } catch (err) { reject(err) }
    }
    reader.onerror = () => reject(new Error('Read file failed'))
    reader.readAsDataURL(file)
  })
}

function f(){


	console.log(`111:`,111);


	bus.emit("select-path",config.desktop.path)


}





</script>


<template>


	<div :style="{opacity:opacity}" style="transition: opacity 0.3s;position: fixed;right: 1em;text-shadow: 1px 1px 1px #fff;color: #000;font-size: 12px;">当前焦点目录:{{ selectPath }}</div>


	<div @focus="f" ref="desktop" tabindex="1" class="desktop" :class="{ 'drag-over': desktopDragOver }" :style="bgStyle" @click.stop="selectAppListEmpty" @click="editNameBlue" @contextmenu.prevent="showMenu($event,{alias:'desktop',path:config.desktop.path})" @dragover.prevent="onDesktopDragOver" @dragleave.prevent="onDesktopDragLeave" @drop.prevent="onDesktopDrop">


		<Menu></Menu>


		<!-- @focus="focusApp(item)" -->


		<div @focus="f" :tabindex="index+10" class="app" :class="{appFocus:selectAppList.findIndex(i=>i.uid===item.uid)!==-1||(editFile&&editFile.uid===item.uid)}" v-for="(item,index) in appList" :key="item.uid" @contextmenu.prevent.stop="showMenu($event,item)">


			<!-- <div class="box" @dblclick="createProgress(item.title,item.exec,item.pwd,item.targetPath,item.args)">


				<div class="icon" v-html="item.icon"></div>


				<div class="name" v-if="!item.edit">


					{{item.title}}


				</div>


				<div class="name editName" v-else v-focus v-text="data[index].title"


				 @input="editNameInput"


				 @click.stop


				 @dblclick.stop


				 contenteditable=""


				 ></div>


			</div> -->


			<div class="box" @dblclick="openApp(item, $event)" @click.stop="selectApp($event,item)">


				<div class="icon">


					<div class="svg" v-html="item.icon"></div>


				</div>


				<!-- 可以优化为url这样多个svg就只有一个请求了 ，不过影响也不大吧-->


					<!-- <img width="24" height="24" src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNSA4QzUgNi44OTU0MyA1Ljg5NTQzIDYgNyA2SDE5TDI0IDEySDQxQzQyLjEwNDYgMTIgNDMgMTIuODk1NCA0MyAxNFY0MEM0MyA0MS4xMDQ2IDQyLjEwNDYgNDIgNDEgNDJIN0M1Ljg5NTQzIDQyIDUgNDEuMTA0NiA1IDQwVjhaIiBmaWxsPSJub25lIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik00MyAyMkg1IiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik01IDE2VjI4IiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0iTTQzIDE2VjI4IiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+" alt=""> -->


				<div ref="editNameRef" v-if="editFile&&editFile.uid===item.uid" class="name editName" v-focus


					@input="editNameInput"


					@keydown.stop="inputKeyDown"


					@click.stop


					@dblclick.stop


					contenteditable=""


				>{{ editFileName }}</div>


				<div class="name" v-else>


					{{item.name}}


				</div>


			</div>


		</div>


		<div id="windows">


			<!-- <Notepad></Notepad>


			<Explorer></Explorer> -->


			<template v-for="(progress,index) in progressList" :key="progress.pid">


			<component v-if="progress.exec" :is="progress.exec" :path="progress.path || '/'" :pid="progress.pid" ref="app" />


			<Window v-else :pid="progress.pid" :title="progress.title" :path="progress.path" :initW="progress.windowWidth ?? 50" :initH="progress.windowHeight ?? 60">


				<template #title>{{ progress.title }}</template>


				<AppFrame :app-id="progress.appId" :title="progress.title" :pid="progress.pid" :pwd="progress.pwd" :path="progress.path" :args="progress.args" :url="progress.url" ref="app" @close="sysCloseWindow" @focus="(pid) => showWindow(pid, 'window')" />


			</Window>


			</template>


		</div>


		<div class="tab"><!-- v-show="progressList.length"-->


			<div class="startBtn" @click.stop="toggleStartMenu">


				<svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 4L6 14V34L24 44L42 34V14L24 4Z" fill="none" stroke="#fff" stroke-width="4" stroke-linejoin="round"/><path d="M24 44V24" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 14L24 24L42 14" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>


				<span>开始</span>


			</div>


			<template v-for="(progress,index) in progressList" :key="progress.pid">


				<div v-if="windowList.find(i=>i.pid===progress.pid)" class="app_item" :class="{active_app:activeAppPid===progress.pid}" @click="showApp(progress.pid,index)" @contextmenu.prevent.stop="showTaskbarPopup($event, progress)">


					{{ progress.title }}


				</div>


			</template>


			<div class="showDesktop" @click="showDesktop"></div>


		</div>

		<div v-if="taskbarPopupVisible" class="taskbar-popup"
			:style="{
				left: taskbarPopupX + 'px',
				bottom: 'calc(var(--tab-height) + 8px)'
			}"
			@click.stop="closeTaskbarPopup()">
			<div class="taskbar-popup-item" @click.stop="sysCloseWindow(taskbarPopupPid); closeTaskbarPopup()">关闭窗口</div>
		</div>

		<SystemInfo :visible='showSystemInfo' :appCount='getAllApps().filter(a=>!a.hidden).length' :fileCount='(fileList[config.desktop.path]||[]).length' @close='showSystemInfo=false' />


		<Teleport to="body">


			<div v-if="showStartMenu" class="startMenu" @click.stop>


					<div class="startHeader">


						<span>应用程序</span>


					</div>


					<div class="startBody">


						<!-- 驱动器快速访问 -->


						<template v-for="drive in systemDirectory" :key="drive.path">


							<div class="startAppItem drive-item" @click="openDrive(drive.path, drive.nickname || drive.name)">


								<div class="startAppIcon" v-html="drive.icon"></div>


								<span class="startAppName">{{ drive.nickname || drive.name }}</span>


							</div>


						</template>


						<div v-for="app in systemApps" :key="app.uid" class="startAppItem" @click="openApp(app)" @contextmenu.prevent.stop="showStartAppMenu($event, app)">


							<div class="startAppIcon" v-html="app.icon"></div>


							<span class="startAppName">{{ app.nickname || app.name }}</span>


						</div>


					</div>


				</div>


		</Teleport>


	</div>


</template>





<style scoped src="./desktop.css"></style>










































