
const config=(await (await fetch("/config/index.json")).json())
console.log(config);
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
		// 处理 :/ 路径段
		fullPath = fullPath.replace(/:\//g, ':');

		return fullPath;
	}
}

class File {
	/**
	 * 
	 * @param {*} pwd 
	 * @param {*} name 
	 * @param {*} isFolder 
	 * @param {*} content 
	 * @param {*} attr {extension,isRoot,name,isFolder,content,pwd}
	 * @param {*} isLoad
	 */
	constructor(pwd,title,name, isFolder = false, content = null,  attr = {},isLoad=false) {
		this.title = title; // 显示的名称
		this.name = name; // 文件或文件夹的名称
		this.isFolder = isFolder; // 是否是文件夹
		this.content = content; // 文件的内容（仅适用于文件），文件夹显示数组
		this.extension = ""; // 文件的后缀（仅适用于文件）
		this.state = 0//0正常文件，1隐藏，2删除（删除只是看不就其实还是存在可以恢复）
		this.isRoot=false//是否是根目录
		this.pwd=pwd
		this.isLoad=isLoad
		Object.assign(this,attr)
		this.path=path.join(pwd,name+this.extension)
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
	load(){
		return new Promise(r=>{
			if(this.isFolder){
				let pwd=this.path
				let keys=JSON.parse(localStorage.getItem(`[${pwd}]`))||[]
				this.content=keys.map(key=>{
					const temp_path=pwd
					return new File(temp_path,key,key,/\./.test(key)?false:true,localStorage.getItem(path.join(temp_path,key)))
				})
			}else{
				this.content=localStorage.getItem(this.path)
			}
			r(this.content)
		})
	}
	open() {
		return this.load()
	}
	
	loadSync(){
		if(this.isFolder){
			let pwd=this.path
			let keys=JSON.parse(localStorage.getItem(`[${pwd}]`))||[]
			this.content=keys.map(key=>{
				const temp_path=pwd
				return new File(temp_path,key,key,/\./.test(key)?false:true,localStorage.getItem(path.join(temp_path,key)))
			})
		}else{
			this.content=localStorage.getItem(this.path)
		}
		return this.content
	}
	openSync() {
		return this.loadSync()
	}
}
function loadFile(pwd,filter){
	if(filter==="*"){

	}
}
function loadSystemFile(){
	const fileConfig=config.file
	return fileConfig.map(i=>{
		return createFile(i.pwd,i.title,"",true,[],{isRoot:true},false)
	})
}

function createFile(pwd,title, name, isFolder = false, content = null,  attr = {},isLoad=false){
	const file=new File(pwd,title, name, isFolder, content,  attr,isLoad)
	
	return file
}
function init(){
	localStorage.setItem("[C:]",'["A","1.txt","B"]')
	localStorage.setItem("[C:A]",'["1.txt","B","C"]')
	localStorage.setItem("[C:B]",'["F"]')
	localStorage.setItem("[D:]",'["B"]')
	localStorage.setItem("[D:B]",'["F","ARR","ARR.txt"]')
	localStorage.setItem("C:A","A")
	localStorage.setItem("C:A/1.txt","文字")
	localStorage.setItem("C:1.txt","文字")
	localStorage.setItem("C:A/B","B")
	localStorage.setItem("C:A/C","C")
	localStorage.setItem("C:B","B")
	localStorage.setItem("C:B/F","F")
	localStorage.setItem("D:B","B")
	localStorage.setItem("D:B/F","")
	localStorage.setItem("D:B/ARR","")
	localStorage.setItem("D:B/ARR.txt","2222")
	console.table(localStorage)
}
init()

export {
	loadSystemFile
}