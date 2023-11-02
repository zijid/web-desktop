import { ref,reactive,computed,watch,watchEffect,onMounted,nextTick,markRaw} from "vue";
import {progressList} from "@/hooks"
let pid=0
export function createProgress(title,exec,pwd,path){
	/*
	文件名字
	运行方式
	目标位置
	文件位置
	文件类型

	组件是直接注册还是全局

	全局吧 反正自己写 如果是html的也用一个组件引入
	 */
	progressList.push({
		title,//文件名
		exec,//文件类型
		pid:progressList.length+1,//pid
		pwd,//文件位置
		path,//目标位置
	})
}
export function refreshProgressAll(){
	
}
export function activateProgress(pid){
	
}
export function findProgress(pid){
	return progressList.find(i=>i.pid===pid)
}
export function getPid() {
	return pid++
}