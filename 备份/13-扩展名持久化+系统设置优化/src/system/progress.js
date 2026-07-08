import { ref,reactive,computed,watch,watchEffect,onMounted,nextTick,markRaw} from "vue";
import {progressList} from "@/hooks"
let pid=0
export function createProgress(title,exec,pwd,path){
	progressList.push({
		title,
		exec,
		pid: ++pid,
		pwd,
		path,
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
