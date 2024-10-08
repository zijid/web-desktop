//窗口控制
import { ref,reactive,computed,watch,watchEffect,onMounted,nextTick,markRaw} from "vue";
import {windowList,progressList,activeAppPid} from "@/hooks"
import {findProgress} from "@/system/progress"

let showDesktopState=false
export function createWindow(pid){//名字，pid，运行程序
	const progress=findProgress(pid)
	console.log(`progress:`,progress);
	activeAppPid.value=pid
	const win=reactive({
		title:progress?.title,
		pid:pid,
		args:progress?.args,
		exec:progress?.exec,
		z:windowList.length+1
	})
	windowList.push(win)
	return win
}
export function closeWindow(pid){//名字，pid，运行程序
	let index=progressList.findIndex(i=>i.pid===pid)
	if(!isNaN(index)&&index>-1){
		progressList.splice(index,1)
	}
	index=windowList.findIndex(i=>i.pid===pid)
	if(!isNaN(index)&&index>-1){
		windowList.splice(index,1)
	}
	sortList()
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
function top(thisWin){
	const pid=thisWin.pid
	const thisWinIndex=windowList.findIndex(i=>i.pid===pid)
	if(thisWinIndex>-1){
		const topLocation=windowList.length
		thisWin.z=topLocation+1
		sortList()
	}
}
function hide(thisWin){
	thisWin.z=-1
	sortList()
}
export function showCount(){
	return windowList.reduce((count,i)=>{
		return count+(i.z>0?1:0)
	},0)
}
export function showWindow(pid,type){
	const thisWin=windowList.find(i=>i.pid===pid)
	if(thisWin){
		if(type==="window"){//点击后直接置顶 一般只会在窗口上点击时触发
			top(thisWin)
		}else if(type==="tab"){//点击底部，需要判断当前层级，是否隐藏
			showDesktopState=false
			let topLocation=windowList.length
			if(thisWin.z===topLocation){//当前是最上层的
				hide(thisWin)
			}else if(thisWin.z<0){//隐藏的
				top(thisWin)
			}else{//其他基于最上层和隐藏之间的
				top(thisWin)
			}
		}
		actionUpdate()
	}else{
		throw Error("窗口不存在！")
	}
}
function sortListFun(){
	windowList.sort((a, b) => Math.abs(a.z) - Math.abs(b.z));
	windowList.forEach((i,index)=>{
		if(i.z<0){
			i.z=-1*(index+1)
		}else{
			i.z=index+1
		}
	})
}
function sortList(){
	nextTick(()=>requestAnimationFrame(sortListFun))
}
export function hideWindow(pid){
	const thisWin=windowList.find(i=>i.pid===pid)
	if(thisWin){
		hide(thisWin)
		actionUpdate()
	}
}

export function showDesktop(){
	if(windowList.every(i=>i.z<0)||showDesktopState===true){//显示
		showDesktopState=false
		windowList.forEach(i=>{
			i.z=Math.abs(i.z)
		})
		actionUpdate()
	}else{
		showDesktopState=true
		windowList.forEach(i=>{
			i.z=-Math.abs(i.z)
		})
		activeAppPid.value=null
	}
}