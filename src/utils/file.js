import { reactive } from "vue";

const config=(await (await fetch("/config/index.json")).json())

export class path {
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
export const fileUidList=reactive({})
export const filePathList=reactive({})
export function findFile(param_path){
	return Object.values(fileUidList).find(i=>i.path===param_path)
}
// const obj={}
// function uidToPath(){
// 	for (const file of fileUidList) {
// 		obj[file.path] = file
// 	}
// 	return obj
// }
export function findPath(param_path){
	const path_key=param_path.split("/")
	const name=path_key[path_key.length-1]
	const isfile=isFile(name);
	let file=filePathList[param_path];
	if(!file){
		//文件不存在去浏览器查查
		const fileContent=localStorage.getItem(param_path)//内容
		if(fileContent===null) return 
		file=createFile(path_key.slice(0,path_key.length-1).join("/"),name,name,!isfile,fileContent)
	}
	return file
}

const isFileREX=new RegExp("\\.")
function isFile(str){
	return isFileREX.test(str)
}
export function loadFindPathSync(param_path){
	if(param_path){
		const keyList=param_path.split(/[:|/]/).filter(Boolean)
		let temp_path=`${keyList[0]}:`
		let loadFile=findFile(temp_path)
		let i=1
		function load(){
			if(loadFile&&keyList[i]){
				return 
			}
			loadFile.loadSync()
			temp_path=path.join(temp_path,keyList[i++])
			loadFile=findFile(temp_path)
			load()
		}
		load()
	}
}
export function loadFindPath(param_path){
	return new Promise(r=>{
		if(param_path){
			const keyList=param_path.split(/[:|/]/).filter(Boolean)
			let temp_path=`${keyList[0]}:`
			let loadFile=findFile(temp_path)
			let i=1
			function load(){
				if(!keyList[i]){
					r()
					return 
				}
				loadFile.load().then(()=>{
					temp_path=path.join(temp_path,keyList[i++])
					loadFile=findFile(temp_path)
					load()
				})
			}
			load()
		}
	})
}
export function uid(separator="-"){
	if(!crypto&&crypto.randomUUID){
		return crypto.randomUUID();
	}else{
		const str="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
		const arr=[]
		for (let index = 0; index < 3; index++) {
			const a=[]
			for (let i = 0; i < 4; i++) {
				a.push(str[Math.floor(Math.random()*52)])
			}
			arr.push(a.join(""))
		}
		const t=(Date.now()+"").slice(-5)+separator+(Math.random()+"").slice(-5)
		return arr.join(separator)+separator+t
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
		this.uid=uid()
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
			setTimeout(() => {
				this.isLoad=true
				if(this.isFolder){
					let pwd=this.path
					let keys=JSON.parse(localStorage.getItem(`[${pwd}]`))||[]
					this.content=keys.map(key=>{
						const temp_path=pwd
						return createFile(temp_path,key,key,!isFile(key),localStorage.getItem(path.join(temp_path,key)))
					})
				}else{
					this.content=localStorage.getItem(this.path)
				}
				r(this.content)
			}, 0);
		})
	}
	open() {
		return this.load()
	}
	
	loadSync(){
		this.isLoad=true
		if(this.isFolder){
			let pwd=this.path
			let keys=JSON.parse(localStorage.getItem(`[${pwd}]`))||[]
			this.content=keys.map(key=>{
				const temp_path=pwd
				return createFile(temp_path,key,key,!isFile(key),localStorage.getItem(path.join(temp_path,key)))
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
export function loadSystemFile(){
	const fileConfig=config.file
	return reactive(fileConfig.map(i=>{
		return createFile(i.pwd,i.title,"",true,[],{isRoot:true},false)
	}))
}

function createFile(pwd,title, name, isFolder = false, content = null,  attr = {},isLoad=false){
	const file=reactive(new File(pwd,title,name,isFolder,content,attr,isLoad))
	filePathList[file.path]=fileUidList[file.uid]=file
	return file
}
function init(){
	localStorage.setItem("[C:]",'["A","1.txt","B"]')
	localStorage.setItem("[C:A]",'["1.txt","B","C"]')
	localStorage.setItem("[C:B]",'["F"]')
	localStorage.setItem("[D:]",'["B"]')
	localStorage.setItem("[D:B]",'["F","ARR","ARR.txt"]')
	localStorage.setItem("[D:B/ARR]",'["A.1","A"]')
	localStorage.setItem("C:A","")
	localStorage.setItem("C:A/1.txt","文字")
	localStorage.setItem("C:1.txt","文字")
	localStorage.setItem("C:A/B","B")
	localStorage.setItem("C:A/C","C")
	localStorage.setItem("C:B","B")
	localStorage.setItem("C:B/F","F")
	localStorage.setItem("D:B","B")
	localStorage.setItem("D:B/F","")
	localStorage.setItem("D:B/ARR","")
	localStorage.setItem("D:B/ARR/A.1","1")
	localStorage.setItem("D:B/ARR/A","")
	localStorage.setItem("D:B/ARR.txt","2222")
	console.table(localStorage)
}
init()