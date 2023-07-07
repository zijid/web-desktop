import { openAppList } from "../hooks";
class path {
	static join(...paths){
		let fullPath = paths.join('/');

		// 处理 ../ 路径段
		const pathSegments = fullPath.split('/');
		const normalizedSegments = [];

		for (let segment of pathSegments) {
			if (segment === '..') {
				normalizedSegments.pop();
			} else {
				normalizedSegments.push(segment);
			}
		}
		fullPath = normalizedSegments.filter(i=>i).join('/');

		// 处理 ./ 路径段
		fullPath = fullPath.replace(/\/\.\//g, '/');

		// 处理 / 路径段
		fullPath = fullPath.replace(/\/+/g, '/');

		return fullPath;
	}
}

class File {
	/**
	 * 
	 * @param {*} p 
	 * @param {*} name 
	 * @param {*} isFolder 
	 * @param {*} content 
	 * @param {*} attr {extension,isRoot,name,isFolder,content,pwd}
	 */
	constructor(p, name, isFolder = false, content = null,  attr = {}) {
		this.name = name; // 文件或文件夹的名称
		this.isFolder = isFolder; // 是否是文件夹
		this.content = content; // 文件的内容（仅适用于文件），文件夹显示数组
		this.extension = ""; // 文件的后缀（仅适用于文件）
		this.state = 0//0正常文件，1隐藏，2删除（删除只是看不就其实还是存在可以恢复）
		this.isRoot=false//是否是根目录
		this.pwd=p
		Object.assign(this,attr)
		this.path=path.join(p,name+this.extension)
		if(!this.content){
			if(this.isFolder){
				this.content=[]
			}else{
				this.content=""
			}
		}
		// this.attribute = Object.assign({ name, path: path.join(p,name+extension) }, attr)//文件或文件夹属性
		/*
		 文件名
		 位置
		 大小
		 包含文件和文件夹数量
		 创建时间
		 属性//待定吧
		 图标
		 */
	}
	open() {
		if (this.isFolder) {//使用文件夹管理器打开
			console.log(`打开文件夹: ${this.name}`);
		} else {//如果是文件先判断后缀对应的打开应用是否存在，存在就打开，不存在就使用弹窗程序提示

		}
	}
}

export {
	path,File
}
let pid=0
export function openApp(exec,path){
	openAppList.push({exec,path,pid:++pid})
	console.log("pid:",openAppList);
}
const tempCache={}
export function findFile(systemDirectory,path){
	let result
	const cacheValue=tempCache[path]
	if(cacheValue){
		console.log("缓存取");
		return cacheValue
	}
	function findArr(arr){
		return arr.some(file=>{
			if(file.path===path){
				tempCache[path]=result=file
				return true
			}else{
				if(file.isFolder){
					return findArr(file.content)
				}else{
					return false
				}
			}
		})

	}
	findArr(systemDirectory)
	console.log("tempCache:",tempCache);
	return result
}