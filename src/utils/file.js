import {stringToBlobUrl} from "@/utils"
import {IndexedDB,utils} from "zijid-ui"
import {db} from "@/system"
const config=(await (await fetch("config/index.json")).json())
// const db = new IndexedDB("web-desktop")
const tableName="web-desktop-table"
if(!await db.isCreate(tableName)){
	await db.createTable(tableName,{keyPath:"path"},[
		{name:"pwd",key:"_pwd"},
		{name:"content",key:"content"},
		{name:"type",key:"type"},
	])
}
function createFileError(message) {
	const error = new Error(message);
	error.name = 'FileCreateError';
	return error;
}
async function _readFile(path){
	let file=await db.find(tableName,path)
	return file
}
async function _readAll(path){
	let dir=await db.findIndexAll(tableName,"pwd",path)
	return dir
}
async function _writeFile(path,content){
	return await db.add(tableName,JSON.parse(JSON.stringify(content)),path,true)
}
async function _removeFile(path){
	return await db.delete(tableName,path);
}
export function dbToFile(params,newFile=false){
	if(!params)return
	if(params.type==="WebFile"){
		const file=new WebFile(params._pwd,params._name)
		file.init(params)
		// file.uid=utils.uid()
		// file.createTime=Date.now()
		// file.setIcon(params.icon)
		file.write(params.content)
		return file
	}else{
		const dir=new WebDir(params._pwd,params._name,params.nickname,params.system)
		dir.init(params)
		// dir.uid=utils.uid()
		// dir.createTime=Date.now()
		// dir.setIcon(params.icon)
		return dir
	}
}
function nameRepetitive(file,index=0){
	return new Promise(r=>{
		readFile(file.path).then(res=>{
			if(!res){
				if(index){
					let name=file.name
					const names=name.split('-')
					if(names.length>1){
						names[names.length-1] = index
					}else{
						names.push(index)
					}
					file.name=names.join("-")
				}
				file.save()
				r()
			}else{
				if(++index){
					let name=file.name
					const names=name.split('-')
					if(names.length>1){
						names[names.length-1] = index
					}else{
						names.push(index)
					}
					file.name=names.join("-")
				}
				nameRepetitive(file,index).then(r)
			}
		})
	})
}
class FilesystemObject{
	uid=utils.uid()
	createTime=Date.now()
	icon=""
	// newFile(){
	// 	this.uid=utils.uid()
	// 	this.createTime=Date.now()
	// }
	init(obj){
		this.uid=obj.uid||this.uid
		this.createTime=obj.createTime||this.createTime
		this.icon=obj.icon||this.icon
	}
	setIcon(str){
		this.icon=str
	}
	async write(txt){
		return this.content=txt
	}
	async save(){
		if(!this.content===undefined){
			await this.read()
		}
		return await _writeFile(this.path,this)
	}
	async _read(){
		const file=await _readFile(this.path)
		return file
	}
	async _readDir(){
		const dir=await _readAll(this.path)
		return dir
	}
	copy(path){
		const newFile=dbToFile(this,true)
		newFile.pwd=path
		// newFile.newFile()
		newFile.uid=utils.uid()
		newFile.createTime=Date.now()
		if(this.type==="WebFile"){
			return nameRepetitive(newFile)
		}else{
			return readFileAll(this.path).then(res=>{
				const arr=[newFile.save()]
				arr.push(...res.map(file=>{
					return file.copy(newFile.path)
				}))
				return Promise.all(arr)
			})
		}
	}
	shear(path){
		// const newFile=dbToFile(this,true)
		// newFile.pwd=path
		// // newFile.newFile()
		// newFile.uid=utils.uid()
		// newFile.createTime=Date.now()
		// return nameRepetitive(newFile)
		if(this.type==='WebDir'&&path.startsWith(this.path)){
			/**
			 * 取消条件
			 * 粘贴位置是当前文件夹的子路径相等也一样
			 */
			return false
		}
		/**
		 * 怎么判断是否是子文件夹
		 * 粘贴的目录是/C/Desktop 当前文件夹的路径是/C/Desktop 这是同路径跳过
		 * 
		 * 粘贴的目录是/C/Desktop/1/2 当前被粘贴文件夹的路径是/C/Desktop/1 这是子路径
		 */
		const oldPath=this.path
		return this.move(path).then(()=>{
			if(this.type==='WebFile'){
				return this.save()
			}
			return readFileAll(oldPath).then(res=>{
				console.log(`res:`,res);
				console.log(`oldPath:`,oldPath);
				console.log(`this.path:`,this.path);
				const arr=[this.save()]
				arr.push(...res.map(file=>{
					return file.shear(this.path)
				}))
				return Promise.all(arr)
			})

			// return this.save().then(e=>{
			// 	console.log(`e:`,e);
			// 	return e
			// })
		})
	}
	move(toPwd){
		const p=_removeFile(this.path)
		this.pwd=toPwd
		return p
		// this.save()
	}
	rename(name){
		const path=this.path
		_removeFile(path)
		this.name=name
		if(this.type==="WebFile"){
			return _writeFile(this.path,this)
		}else{
			const arr=[_writeFile(this.path,this)]
			return readFileAll(path).then(res=>{
				arr.push(...res.map(file=>{
					return file.shear(this.path)
				}))
				return Promise.all(arr)
			})
		}
	}
	delete(){
		if(this.type==="WebFile"){
			return _removeFile(this.path)
		}else{
			const arr=[_removeFile(this.path)]
			return readFileAll(this.path).then(res=>{
				arr.push(...res.map(file=>{
					return file.delete()
				}))
				return Promise.all(arr)
			})
		}
	}
}
function pathJoin(...paths){
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
	fullPath = normalizedSegments.join('/');

	// 处理 ./ 路径段
	fullPath = fullPath.replace(/\/\.\//g, '/');

	// 处理 / 路径段
	fullPath = fullPath.replace(/\/+/g, '/');
	// 处理 :/ 路径段
	fullPath = fullPath.replace(/:\//g, ':');

	return fullPath;
}
class WebFile extends FilesystemObject{
	extension=""
	_name=""
	_pwd=""
	path=""
	nickname=""
	type="WebFile"
	constructor(pwd,name,nickname=""){
		if (!pwd || !name) {
			throw createFileError(`创建文件失败，无路径或文件名:pwd:${pwd} name:${name}`);
		}
		super()
		this.name=name
		this.pwd=pwd
		this.nickname=nickname
		this.content=undefined
	}

	
	init(obj){
		super.init(obj)
		this.extension=obj.extension||this.extension
		this.name=obj._name||obj.name||this.name
		this._pwd=obj._pwd||this._pwd
		this.nickname=obj.nickname||this.nickname
	}

	async read(){
		const file=await this._read()
		this.content=file.content
		return this.content
	}
	set pwd(value){
		this._pwd = value
		this.path=pathJoin(value,this.name)
	}
	set name(value){
		let names=value.split(".")
		let extension=""
		if(names.length>1){
			extension=names.slice(names.length-1)
			this.extension="."+extension
		}
		this._name=value
		this.path=pathJoin(this._pwd,value)
	}
	get pwd(){
		return this._pwd
	}
	get name(){
		return this._name
	}
}
class WebDir extends FilesystemObject{
	_name=""
	_pwd=""
	path=""
	nickname=""
	type="WebDir"
	system=false
	constructor(pwd,name,nickname,system=false){
		if (!pwd||!name){
			throw createFileError(`创建文件夹失败，无路径或文件夹名:pwd:${pwd} name:${name}`);
		}
		super()
		this.name=name//文件名加后缀
		this.pwd=pwd
		this.nickname=nickname
		this.content=null
		this.system=system
	}

	init(obj){
		super.init(obj)
		this.name=obj._name||obj.name||this.name
		this._pwd=obj._pwd||this._pwd
		this.nickname=obj.nickname||this.nickname
	}

	async read(){
		const dir=await this._readDir()
		this.content=dir.map(i=>{
			return dbToFile(i)
		})
		return this.content
	}
	set pwd(value){
		this._pwd = value
		this.path=pathJoin(value,this.name)
	}
	get pwd(){
		return this._pwd
	}
	set name(value){
		this._name=value
		this.path=pathJoin(this._pwd,value)
	}
	get name(){
		return this._name
	}
	delete(isDeep=true){
		super.delete()
		if(isDeep){
			_readAll(this.path).then(res=>{
				res.forEach(i=>{
					dbToFile(i).delete()
				})
			})
		}
		// this.
	}
}
export {
	WebFile,
	WebDir
}

export const dir_str = `<?xml version="1.0" encoding="UTF-8"?><svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 8C5 6.89543 5.89543 6 7 6H19L24 12H41C42.1046 12 43 12.8954 43 14V40C43 41.1046 42.1046 42 41 42H7C5.89543 42 5 41.1046 5 40V8Z" fill="#ffc25b" stroke="#9013fe" stroke-width="4" stroke-linejoin="round"/><path d="M43 22H5" stroke="#ffffff" stroke-width="4" stroke-linejoin="round"/><path d="M5 16V28" stroke="#9013fe" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M43 16V28" stroke="#9013fe" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
export const file_str =`<?xml version="1.0" encoding="UTF-8"?><svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M40 23V14L31 4H10C8.89543 4 8 4.89543 8 6V42C8 43.1046 8.89543 44 10 44H22" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M33 29V43" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 36H33H40" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 4V14H40" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`
export const txt_str =`<?xml version="1.0" encoding="UTF-8"?><svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 6C8 4.89543 8.89543 4 10 4H30L40 14V42C40 43.1046 39.1046 44 38 44H10C8.89543 44 8 43.1046 8 42V6Z" fill="#ffffff" stroke="#000000" stroke-width="4" stroke-linejoin="round"/><path d="M16 20H32" stroke="#707070" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 28H32" stroke="#707070" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`
export const no_str =`<?xml version="1.0" encoding="UTF-8"?><svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 44H38C39.1046 44 40 43.1046 40 42V14H30V4H10C8.89543 4 8 4.89543 8 6V42C8 43.1046 8.89543 44 10 44Z" fill="#ffffff" stroke="#000000" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 4L40 14" stroke="#000000" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 22L30 34" stroke="#707070" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 22L18 34" stroke="#707070" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`
async function testFile(){
	const initDir=[
		{
			pwd:"/C",
			name:"Users",
			nickname:"用户"
		},
		{
			pwd:"/C",
			name:"Desktop",
			nickname:"桌面"
		},
		{
			pwd:"/C/Desktop",
			name:"文件夹",
		},
		{
			pwd:"/C/Desktop",
			name:"文件夹2",
		},
		{
			pwd:"/C/Desktop/文件夹2",
			name:"文件夹2-1",
		},
		{
			pwd:"/C",
			name:"Document",
			nickname:"文档"
		},
		{
			pwd:"/C",
			name:"Temp",
			nickname:"临时文件"
		},
		{
			pwd:"/C",
			name:"System",
			nickname:"系统文件"
		},
		{
			pwd:"/C",
			name:"SystemSoftware",
			nickname:"系统软件"
		},
		{
			pwd:"/E",
			name:"文件夹1",
			nickname:""
		},
		{
			pwd:"/E",
			name:"文件夹2",
			nickname:""
		},
	]
	const initFile=[
		{
			pwd:"/E/文件夹1",
			name:"文本文件2",
			content:"/E/文件夹1/文本文件2"
		},
		{
			pwd:"/E/文件夹1",
			name:"文本文件3",
			content:"/E/文件夹1/文本文件3"
		},
		{
			pwd:"/E",
			name:"文本文件1",
			content:"/E/文本文件1"
		},
		{
			pwd:"/C/Desktop",
			name:"文本文件33",
		},
		{
			pwd:"/C/Desktop",
			name:"文本文件2",
		},
		{
			pwd:"/C/Desktop",
			name:"111.txt",
		},
		{
			pwd:"/C/Desktop/文件夹",
			name:"文件夹内容.txt",
		},
	]
	readFile("/C/Desktop/文件夹").then(res=>{
		if(!res){
			initDir.forEach(i=>{
				const pwd=i.pwd
				const name=i.name
				const nickname=i.nickname
				const system=i.system
				let dir=new WebDir(pwd,name,nickname,system)
				dir.setIcon(dir_str)
				dir.save()
			})
			
			initFile.forEach(i=>{
				const pwd=i.pwd
				const name=i.name
				let names=name.split(".")
				let extension=""
				if(names.length>1){
					extension=names.slice(names.length-1)[0]
				}
				const content=i.content
				let file=new WebFile(pwd,name)
				if(extension==="txt"){
					file.setIcon(txt_str)
				}else{
					file.setIcon(no_str)
				}
				file.write(content)
				file.save()
			})
		}
	})
}

// console.log(`stringToBlobUrl(str,'image/svg+xml'):`,stringToBlobUrl(str,'image/svg+xml'));
testFile()
console.log('%c默认重新创建桌面文件和文件夹，在@/utils/file.js文件内testFile方法', 'color: red; font-weight: bold; background-color: yellow;');

export function loadSystemFile(config){
	let fileConfig=config.file
	return new Promise(r=>{
		readFileAll("/").then(res=>{
			if(res.length===0){
				fileConfig=[]
				fileConfig=config.file.map(i=>{
					const systemDir=new WebDir(i.pwd,i.name,i.title,true)
					// systemDir.init(i)
					systemDir.save()
					return systemDir
				})
				r(fileConfig)
			}else{
				r(res)
			}
		})
	})
}
export async function readFileAll(path){//这里的path对应需要获取的文件的pwd
	let search_str=path
	if(search_str.endsWith("/")&&search_str.length>1){
		search_str=search_str.slice(0,-1)
	}
	const fileList=await db.findIndexAll(tableName,"pwd",search_str)
	return fileList.map(dbToFile)
}
export async function readFile(path){//这里的path对应需要获取的文件的pwd
	const dbFile=await _readFile(path)
	if(!dbFile)return null
	return dbToFile(dbFile)
}
function sleep(time){
	return new Promise(r=>{
		setTimeout(()=>{
			r()
		},time)
	})
}