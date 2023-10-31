import { ref,reactive,computed,watch,watchEffect,onMounted,nextTick,markRaw} from "vue";
import {progressList} from "@/hooks"
let pid=0
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
export function getPid() {
	return pid++
}