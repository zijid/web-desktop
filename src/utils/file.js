import {IndexedDB} from "zijid-ui"
const config=(await (await fetch("/config/index.json")).json())
const db = new IndexedDB("web-desktop")
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
	if(params.type==="WebFile"){
		const file=new WebFile(params._pwd,params.name)
		file.write(params.content)
		return file
	}else{
		const dir=new WebDir(params._pwd,params.name)
		return dir
	}
}
class FilesystemObject{
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
	constructor(pwd,name,nickname=name){
		if (!pwd||!name){
			throw createFileError(`创建文件夹失败，无路径或文件夹名:pwd:${pwd} name:${name}`);
		}
		super()
		this.name=name//文件名加后缀
		this.pwd=pwd
		this.nickname=nickname
		this.content=null
	}

	async read(){
		const dir=await this._readDir()
		console.log(`dir:`,dir);
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
{
	let a=new WebDir("/D","TT")
	a.save()
	setTimeout(async ()=>{
		console.log(`a:`,a);
		console.log(`await a.read("atttttttttttaa222a"):`,await a.read("atttttttttttaa222a"));
	},1000)
}
{
	let a=new WebDir("/D/TT","22222name.txt")
	a.save()
}
{
	let a=new WebFile("/D","2name.txt")
	a.save()
	a.read()
	a.write("aaaa")
	setTimeout(async ()=>{
		await a.write("atttttttttttaa222a")
	},3000)
}
{
	let a=new WebFile("/D","3name.txt")
	a.read()
	a.write("aaaa")
	setTimeout(async ()=>{
		
		await a.write("atttttttttttaa222a")
	},3000)
}
{
	let a=new WebDir("/","D")
	console.log(`+++++++++++++:`,	await a.read());
}
export function loadSystemFile(){
	const fileConfig=config.file
	return fileConfig.map(i=>{
		return new WebFile(i.pwd,"C",i.title)
	})
}
export async function readFileAll(path){//这里的path对应需要获取的文件的pwd
	const fileList=await db.findIndexAll(tableName,"pwd",path)
	return fileList.map(i=>{
		const file=new WebFile(i.pwd,i.name)
		file.content = i.content
		return file
	})
}

console.log(`loadSystemFile():`,loadSystemFile());