//进程管理
import { ref,reactive,computed,watch,watchEffect,onMounted,nextTick} from "vue";
import { markRaw } from 'vue';
export const progressList=reactive([])

export function createProgress(exec,args){
	progressList.push({
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
	return windowList[windowList.push({
		pid:pid,
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
export function showWindow(pid){
	const len=windowList.length
	const thisWin=getWindow(pid)
	if(thisWin.z===len-1){
		return
	}
	windowList.sort((a, b) => a.z - b.z);

	for(let i=thisWin.z;i<len;i++){
		windowList[i].z--
	}
	thisWin.z=len-1
}