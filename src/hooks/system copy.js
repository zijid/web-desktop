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
	let index=progressList.findIndex(i=>i.pid===pid)
	if(!isNaN(index)){
		progressList.splice(index,1)
	}
	console.log("windowList,pid:",windowList,pid);
	index=windowList.findIndex(i=>i.pid===pid)
	if(!isNaN(index)){
		console.log("index:",index);
		let obj=windowList[index]
		const len=windowList.length-1-hideCount
		windowList.sort((a, b) => a.z - b.z);
		for(let i=obj.z+1;i<=len;i++){
			windowList[i+hideCount].z--
		}
		windowList.splice(index,1)
	}
	actionUpdate()
}
function actionUpdate(){
	const max = windowList.reduce((prev, current) => {
		return current.z > prev.z ? current : prev;
	},{pid:null,z:-1});
	if(max&&max.z>-1){
		activeAppPid.value=max.pid
	}else{
		activeAppPid.value=null
	}
}
export function getWindow(pid){//名字，pid，运行程序
	return windowList.find(i=>i.pid===pid)
}
// setInterval(() => {
// 	console.log("windowList:",windowList);
// }, 1000);
let hideCount=0
export function showWindow(pid,type){
	const len=windowList.length-1-hideCount
	const thisWin=getWindow(pid)
	if(type==="tab"&&thisWin.z===windowList.length-1-hideCount){
		hideWindow(pid)
		return
	}
	// if(thisWin.z<0){
	// 	thisWin.z=len+1
	// 	hideCount++
	// 	// if(windowList.some(i=>i.z===thisWin.z&&i.pid!==thisWin.pid)){

	// 	// }
	// 	return 
	// }
	// console.log("thisWin.z,len:",thisWin.z,len);
	// if(thisWin.z===len){
	// 	thisWin.z=-thisWin.z
	// 	hideCount++
	// 	return
	// }
	windowList.sort((a, b) => a.z - b.z);
	for(let i=thisWin.z+1;i<=len;i++){
		windowList[i+hideCount].z--
	}
	thisWin.z=len
	activeAppPid.value=thisWin.pid
}

export function hideWindow(pid){
	console.log("隐藏");
	const thisWin=getWindow(pid)
	// hideCount=windowList.reduce((prev, current) => {
	// 	return current.z <0 ? prev+1 : 0;
	// },0);
	if(thisWin.z<0){
		return 
	}
	hideCount++
	const len=windowList.length-1-hideCount
	windowList.sort((a, b) => a.z - b.z);
	for(let i=thisWin.z;i<=len;i++){
		console.log("i:",i);
		windowList[i+hideCount].z--
	}
	thisWin.z=-thisWin.z
	if(!thisWin.z){
		thisWin.z=-1
	}
	actionUpdate()
}
export function hideToShowWindow(pid){
	const thisWin=getWindow(pid)
	// hideCount=windowList.reduce((prev, current) => {
	// 	return current.z <0 ? prev+1 : 0;
	// },0);
	hideCount--
	let len=windowList.length-1-hideCount
	if(len<0){
		len=0
	}
	thisWin.z=len
	activeAppPid.value=pid
}

const showDesktopState=ref(false)

export function showDesktop(){
	if(showDesktopState.value===true){
		showDesktopState.value=false
		const len=windowList.length
		windowList.forEach(i=>{
			console.log("i.z:",i.z);
			if(i.z===0){
				i.z=-len
			}else{
				i.z=-i.z
			}
		})
	}else{
		showDesktopState.value=false
		windowList.forEach(i=>{
			i.z=-i.z
		})
	}
}