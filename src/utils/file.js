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
	return await db.add(tableName,content,path,true)
}
async function _removeFile(path){
	return  await db.find(tableName,path)
}

function dbToFile(params){
	console.log(`params:`,params);
	if(params.type==="WebFile"){
		const file=new WebFile(params._pwd,params.name)
		file.write(params.content)
		return file
	}else{
		const dir=new WebDir(params._pwd,params.name,params.nickname,params.system)
		return dir
	}
}
class FilesystemObject{
	uid=utils.uid()
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
	move(toPwd){
		_removeFile(this.path)
		this.pwd=toPwd
		this.save()
	}
	rename(name){
		console.log("this.name:",this.name);
		_removeFile(this.path)
		this.name=name
		this.path=this.pwd+name
		localStorage.setItem(this.path,this.content)
	}
	delete(){
		_removeFile(this.path)
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
	name=""
	_pwd=""
	path=""
	nickname=""
	type="WebFile"
	constructor(pwd,name,nickname=name){
		if (!pwd || !name) {
			throw createFileError(`创建文件失败，无路径或文件名:pwd:${pwd} name:${name}`);
		}
		super()
		this.name=name
		this.pwd=pwd
		this.nickname=nickname
		this.content=undefined
		this.save()
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
	get pwd(){
		return this._pwd
	}
}
class WebDir extends FilesystemObject{
	name=""
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
		this.nickname=nickname||name
		this.content=null
		this.system=system
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
}
export {
	WebFile,
	WebDir
}
async function testFile(){
	// {
	// 	let a=new WebDir("/D","TT")
	// 	a.save()
	// }
	// {
	// 	let a=new WebDir("/D/TT","22222name.txt")
	// 	a.save()
	// }
	// {
	// 	let a=new WebFile("/D","2name.txt")
	// 	a.save()
	// 	a.read()
	// 	a.write("aaaa")
	// }
	// {
	// 	let a=new WebFile("/D","3name.txt")
	// 	a.read()
	// 	a.write("sssssss")
	// }
	// {
	// 	let a=new WebDir("/","D")
	// }
	// const initDir=[
	// 	"/C/用户/桌面",
	// 	"/C/用户/文档",
	// 	"/C/用户",
	// 	"/C/临时文件",
	// 	"/C/系统文件",
	// 	"/C/系统软件",
	// 	"/D",
	// 	"/E",
	// 	"/E/文件夹1",
	// 	"/E/文件夹1/文本文件2",
	// 	"/E/文件夹1/文本文件3",
	// 	"/E/文件夹2",
	// ]
	// initDir.forEach(i=>{
	// 	let names=i.split("/")
	// 	const name=names.splice(-1)[0]
	// 	const pwd=names.join("/")||"/"
	// 	let dir=new WebDir(pwd,name)
	// 	dir.save()
	// })
	// const initFile=[
	// 	"/E/文件夹1/文本文件2",
	// 	"/E/文件夹1/文本文件3",
	// 	"/E/文本文件1",
	// ]
	// initFile.forEach(i=>{
	// 	let names=i.split("/")
	// 	const name=names.splice(-1)[0]
	// 	const pwd=names.join("/")||"/"
	// 	let file=new WebFile(pwd,name)
	// 	file.save()
	// })
	const initDir=[
		// {
		// 	pwd:"/",
		// 	name:"C",
		// 	nickname:"系统",
		// 	system:true
		// },
		// {
		// 	pwd:"/",
		// 	name:"D",
		// 	nickname:"软件",
		// 	system:true
		// },
		// {
		// 	pwd:"/",
		// 	name:"E",
		// 	nickname:"文档",
		// 	system:true
		// },
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
	initDir.forEach(i=>{
		const pwd=i.pwd
		const name=i.name
		const nickname=i.nickname
		const system=i.system
		let dir=new WebDir(pwd,name,nickname,system)
		dir.save()
	})
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
	]
	initFile.forEach(i=>{
		const pwd=i.pwd
		const name=i.name
		const content=i.content
		let file=new WebFile(pwd,name)
		file.write(content)
		file.save()
	})
}
testFile()
export function loadSystemFile(config){
	const fileConfig=config.file
	return fileConfig.map(i=>{
		return new WebDir(i.pwd,i.name,i.title,true)
	})
}
export async function readFileAll(path){//这里的path对应需要获取的文件的pwd
	const fileList=await db.findIndexAll(tableName,"pwd",path)
	return fileList.map(dbToFile)
}
export async function readFile(path){//这里的path对应需要获取的文件的pwd
	const dbFile=await _readFile(path)
	return dbToFile(dbFile)
}
function sleep(time){
	return new Promise(r=>{
		setTimeout(()=>{
			r()
		},time)
	})
}