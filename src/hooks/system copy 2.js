//进程管理
import { ref,reactive,computed,watch,watchEffect,onMounted,nextTick,markRaw} from "vue";
export const progressList=reactive([])
export const activeAppPid=ref(null)

export function createProgress(title,exec,pwd,targetPath,args=""){
	/*
	文件名字
	运行方式
	目标位置
	文件位置
	文件类型
	 */
	progressList.push({
		title,//文件名
		exec:markRaw(exec),//文件类型
		pid:progressList.length+1,//pid
		pwd,//文件位置
		targetPath,//目标位置
		args//参数
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
		z:windowList.length+1
	})-1]
}
export function closeWindow(pid){//名字，pid，运行程序
	let index=progressList.findIndex(i=>i.pid===pid)
	if(!isNaN(index)&&index>-1){
		progressList.splice(index,1)
	}
	index=windowList.findIndex(i=>i.pid===pid)
	if(!isNaN(index)&&index>-1){
		let obj=windowList[index]
		const len=windowList.length-1-hideCount
		windowList.sort((a, b) => a.z - b.z);
		for(let i=obj.z;i<len;i++){
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
setInterval(() => {
	console.log("windowList:",windowList);
}, 1000);
let hideCount=0
export function showWindow(pid,type){
	const len=windowList.length
	const thisWin=getWindow(pid)
	if(type==="tab"&&thisWin.z===windowList.length){
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
	// windowList.sort((a, b) => a.z - b.z);
	// for(let i=thisWin.z+1;i<=len;i++){
	// 	windowList[i+hideCount].z--
	// }
	// if(thisWin.z>windowList.length+1){
	// 	thisWin.z=-thisWin.z
	// 	return 
	// }
	thisWin.z=99999999999999999
	sortList()
	// windowList.pop()
	windowList.forEach((i,index)=>{
		console.log("i.z:",i.z);
		if(i.z>0){
			i.z=index+1
		}else{
			i.z=-1*(index+1)
		}
	})
	thisWin.z=len
	// windowList.push(thisWin)
	activeAppPid.value=thisWin.pid

	console.log("showWindow:",thisWin.z);
}
function sortList(){
	windowList.sort((a, b) => Math.abs(a.z) - Math.abs(b.z));
	windowList.forEach((i,index)=>{
		if(i.z<0){
			i.z=index-1
		}else{
			i.z=index+1
		}
	})
}
export function hideWindow(pid){
	const thisWin=getWindow(pid)
	// hideCount=windowList.reduce((prev, current) => {
	// 	return current.z <0 ? prev+1 : 0;
	// },0);
	if(thisWin.z<0){
		return 
	}
	hideCount++
	const len=windowList.length-1-hideCount
	if(thisWin.z<len){
		windowList.sort((a, b) => a.z - b.z);
		for(let i=thisWin.z;i<=len;i++){
			windowList[i+hideCount].z--
		}
	}
	thisWin.z=-thisWin.z
	if(!thisWin.z){
		thisWin.z=-1
	}
	actionUpdate()
	console.log("hideWindow:",thisWin.z);
}
export function hideToShowWindow(pid){
	if(showDesktopState.value){
		showDesktopState.value=false
	}
	const thisWin=getWindow(pid)
	// hideCount=windowList.reduce((prev, current) => {
	// 	return current.z <0 ? prev+1 : 0;
	// },0);
	console.log("thisWin.z:",thisWin.z);
	hideCount--
	let len=windowList.length-1+hideCount
	if(len<0){

		return
	}
	
	
	// windowList.forEach((i,index)=>{
	// 	if(i.z>0){
	// 		i.z!=index+1-hideCount
	// 	}
	// })
	// thisWin.z=len+1
	
	thisWin.z=99999999999999999
	sortList()
	windowList.pop()
	console.log("hideCount:",hideCount);
	windowList.forEach((i,index)=>{
		console.log("i.z:",i.z);
		if(i.z>0){
			i.z=index+1
		}else{
			i.z=-1*(index+1)
		}
		console.log("i.z:",i.z);
	})
	windowList.push(thisWin)
	console.log("windowList:",windowList);
	console.log("thisWin:",thisWin);
	thisWin.z=len
	activeAppPid.value=pid
	console.log("hideToShowWindow:",thisWin.z);
}

const showDesktopState=ref(false)

export function showDesktop(){
	if(showDesktopState.value===true){//显示
		showDesktopState.value=false
		windowList.forEach(i=>{
			i.z=Math.abs(i.z)
		})
		actionUpdate()
	}else{
		showDesktopState.value=true
		windowList.forEach(i=>{
			i.z=-Math.abs(i.z)
		})
		activeAppPid.value=null
	}
}