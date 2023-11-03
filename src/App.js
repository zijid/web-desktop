import { Bus} from "@/utils";
import Explorer from "./components/explorer/explorer.vue";
import Notepad from "./components/notepad/notepad.vue";
import { getConfig } from "@/system";
import { loadSystemFile } from "@/utils/file";
import { addApp} from "@/hooks";
export const bus=new Bus()
export let systemDirectory
export function initApp(){
	loadSystemFile(getConfig()).then(res=>{
		systemDirectory=res
	})
}
export default {
	install:function(app){
		app.component("Explorer",Explorer)
		app.component("Notepad",Notepad)
	}
}
export const exec={
	explorer:{
		app:"Explorer",
		title:"文件管理器",
		pwd:"",
		targetPath:"",
		args:"",
		icon:`<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 8C5 6.89543 5.89543 6 7 6H19L24 12H41C42.1046 12 43 12.8954 43 14V40C43 41.1046 42.1046 42 41 42H7C5.89543 42 5 41.1046 5 40V8Z" fill="none" stroke="#333" stroke-width="4" stroke-linejoin="round"/><path d="M43 22H5" stroke="#333" stroke-width="4" stroke-linejoin="round"/><path d="M5 16V28" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M43 16V28" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`
	},
	// title,exec,pwd,targetPath,args
	notepad:{
		app:"Notepad",
		title:"记事本",
		pwd:"",
		targetPath:"E:/文件夹1/文本文件3.txt",
		args:"",
		icon:`<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 8H11C10.4477 8 10 8.44772 10 9V43C10 43.5523 10.4477 44 11 44H39C39.5523 44 40 43.5523 40 43V9C40 8.44772 39.5523 8 39 8H32" stroke="#333" stroke-width="4"/><path d="M18 13V8H21.9505C21.9778 8 22 7.97784 22 7.9505V6C22 4.34315 23.3431 3 25 3C26.6569 3 28 4.34315 28 6V7.9505C28 7.97784 28.0222 8 28.0495 8H32V13C32 13.5523 31.5523 14 31 14H19C18.4477 14 18 13.5523 18 13Z" fill="none" stroke="#333" stroke-width="4"/></svg>`
	},
}