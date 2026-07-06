import {ref,reactive,markRaw} from "vue"
import {createProgress} from "@/system/progress"
import {exec,bus}from "@/App.js"
export const progressList=reactive([])
export const windowList=reactive([])
export const activeAppPid=ref(null)

export const fileList=reactive({})
export const data=[]

export const selectList=ref([])
export const isShear=ref(false)
// try{
// 	bus.on("get:app",()=>{
// 		bus.emit("update:app",data)
// 	})
// }catch(err){
// 	console.log(`err:`,err);
// }
export function addApp(appName,titleTemp,path,targetPath,args){
	// let icon=`<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 9V41L9 21H39.5V15C39.5 13.8954 38.6046 13 37.5 13H24L19 7H6C4.89543 7 4 7.89543 4 9Z" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M40 41L44 21H8.8125L4 41H40Z" fill="none" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`
	// if(type===FUNCTION){
	// 	icon=`<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 4H30L40 14V42C40 43.1046 39.1046 44 38 44H10C8.89543 44 8 43.1046 8 42V6C8 4.89543 8.89543 4 10 4Z" fill="none" stroke="#333" stroke-width="4" stroke-linejoin="round"/><path d="M18 18.0083H30" stroke="#333" stroke-width="4" stroke-linecap="round"/><path d="M24.0083 18.0083V34" stroke="#333" stroke-width="4" stroke-linecap="round"/></svg>`
	// }
	if(!exec)return
	const appInfo=exec[appName]
	let title=titleTemp||appInfo.title
	data.push({
		title,
		icon:appInfo.icon,
		exec:markRaw(appInfo.app),
		path,
		targetPath,
		args,
		edit:false,
		menu:(show)=>[
			{
				title:"打开",
				hander:()=>{
					createProgress(title,appInfo.app,"C:/用户/桌面","")
					show.value=false
				}
			},
		]
	})
	bus.emit("update:app",data)
	return data[data.length-1]
}
// title,exec,pwd,targetPath,args
export const openAppList=reactive([])