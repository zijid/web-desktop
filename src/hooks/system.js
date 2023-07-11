//进程管理
import { ref,reactive,computed,watch,watchEffect,onMounted,nextTick} from "vue";
import { markRaw } from 'vue';
export const progressList=reactive([])
export const activeAppPid=ref(null)

export function createProgress(title,exec,args){
	progressList.push({
		title,
		exec:markRaw(exec),
		// pwd,
		pid:progressList.length+1,
		args
	})
	console.log("progressList.length:",progressList.length);
}
export function refreshProgressAll(){
	
}
export function activateProgress(pid){
	
}
export function findProgress(pid){
	return progressList.find(i=>i.pid===pid)
}
//窗口管理
export const windowList=reactive([])
let pid=0
export function getPid() {
	return pid++
}
export function createWindow(pid){//名字，pid，运行程序
	const progress=findProgress(pid)
	activeAppPid.value=pid
	return windowList[windowList.push({
		title:progress.title,
		pid:pid,
		args:progress.args,
		exec:progress.exec,
		z:windowList.length
	})-1]
}
export function closeWindow(pid){//名字，pid，运行程序
	const index=windowList.findIndex(i=>i.pid===pid)
	if(!isNaN(index)){
		windowList.splice(index,1)
	}
}
export function getWindow(pid){//名字，pid，运行程序
	return windowList.find(i=>i.pid===pid)
}
setInterval(() => {
	console.log("windowList:",windowList);
}, 1000);
let hideCount=0
export function showWindow(pid){
	const len=windowList.length-1-hideCount
	const thisWin=getWindow(pid)
	// if(thisWin.z<0){
	// 	thisWin.z=len+1
	// 	hideCount++
	// 	// if(windowList.some(i=>i.z===thisWin.z&&i.pid!==thisWin.pid)){

	// 	// }
	// 	return 
	// }
	// console.log("thisWin.z,len:",thisWin.z,len);
	console.log("hideCount:",hideCount);
	console.log("len:",len);
	console.log("thisWin.z:",thisWin.z);
	// if(thisWin.z===len){
	// 	thisWin.z=-thisWin.z
	// 	hideCount++
	// 	return
	// }
	windowList.sort((a, b) => a.z - b.z);
	for(let i=thisWin.z;i<=len;i++){
		windowList[i].z--
	}
	thisWin.z=len
	activeAppPid.value=thisWin.pid
}

export function hideWindow(pid){
	const len=windowList.length-1-hideCount
	const thisWin=getWindow(pid)
	// hideCount=windowList.reduce((prev, current) => {
	// 	return current.z <0 ? prev+1 : 0;
	// },0);
	hideCount++
	for(let i=thisWin.z;i<len;i++){
		windowList[i].z--
	}
	thisWin.z=-thisWin.z
	const max = windowList.reduce((prev, current) => {
		return current.z > prev.z ? current : prev;
	});
	activeAppPid.value=max.pid
}
export function hideToShowWindow(pid){
	const thisWin=getWindow(pid)
	hideCount=windowList.reduce((prev, current) => {
		return current.z <0 ? prev+1 : 0;
	},0);
	let len=windowList.length-1-hideCount
	console.log("len:",len);
	if(len<0){
		len=0
	}
	thisWin.z=len
	activeAppPid.value=pid
}