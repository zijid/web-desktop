function createFileError(message) {
	const error = new Error(message);
	error.name = 'FileCreateError';
	return error;
}
function _readFile(path){
	return localStorage.getItem(path)
}
function _writeFile(path,content){
	return localStorage.setItem(path,content)
}
function _removeFile(path){
	return localStorage.removeItem(path)
}
class FilesystemObject{
	/**
	 文件读取可以加类型的，不过现在用的存储只有字符串所以不加
	*/
	write(txt){//使用indexedDB制作然后可以加类型
		this.content=txt
		_writeFile(this.path,this.content)
	}
	read(){
		return this.content=_readFile(this.path)
	}
	move(toPwd){
		console.log("this.name:",this.name);
		_removeFile(this.path)
		console.log("toPwd:",toPwd);
		
		this.pwd=toPwd
		_writeFile(this.path,this.content)
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
class File extends FilesystemObject{
	name=""
	_pwd=""
	path=""
	constructor(pwd,name){
		if (!pwd || !name) {
			throw createFileError("创建文件失败，无路径或文件名");
		}
		super()
		this.name=name//文件名加后缀
		this.pwd=pwd
		
		this.content=""
		// let file=_readFile(this.name)
		// if(file){
		// 	this.content=file
		// }else{
		// 	_writeFile(this.path,"")
		// 	this.content=""
		// }
	}
	set pwd(value){
		this._pwd = value
		console.log("value:",value);
		this.path=value+this.name
	}
	get pwd(){
		return this._pwd
	}
}
class Dir{
	constructor(){
		this.name=""//目录名
		this.content=[]
	}
}
let a=new File("/","name.txt")
a.read()
a.write("aaaa")
export {
	File,
	Dir
}