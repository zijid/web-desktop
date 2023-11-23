//初始化
import {IndexedDB,utils} from "zijid-ui"
import {bus} from "@/App"
import {fileList,selectList,isShear} from "@/hooks";
import {dir_str,readFileAll,readFile,WebDir} from "@/utils/file"

export const db = new IndexedDB("web-desktop")
export const tableName="web-desktop-config"
let system_config=null
export async function init(){
	const loadingArr=[]
	const DBInit=new Promise((r,j)=>{
		db.isCreate(tableName).then(isCreate=>{
			if(isCreate){
				r("已初始化过")
			}else{
				db.createTable(tableName).then((aa)=>{
					async function initC(){
						try {
							const config=await (await fetch("config/index.json")).json()
							await db.add(tableName,config,"system-config-default",true)
							await db.add(tableName,1,"config-versions",true)//版本控制还没办法如果要完成需要后端配合吧 配置也要放后端
							await db.add(tableName,1,"config-versions",true)
							r("初始化完成")
		
						} catch (error) {
							j("初始化失败")
						}
					}
					initC()
				}).catch(err=>{
					j("初始化失败,创建表失败")
					console.error(`createTable err:`,err);
				})
			}
		})
	})
	// if(!await db.isCreate(tableName)){
	// 	await db.createTable(tableName)
	// 	const config=await (await fetch("config/index.json")).json()
	// 	loadingArr.push(config)
	// 	loadingArr.push(await db.add(tableName,config,"system-config-default",true))
	// 	await db.add(tableName,1,"config-versions",true)//版本控制还没办法如果要完成需要后端配合吧 配置也要放后端
	// 	loadingArr.push(await db.add(tableName,1,"config-versions",true))
	// }
	const initConfg=new Promise((r,j)=>{
		DBInit.then(()=>{
			db.find(tableName,"system-config-default").then(res=>{
				system_config=res
				r("初始化配置完成")
			}).catch(err=>{
				console.error(`err:`,err);
				j("初始化配置失败")
			})
		}).catch(err=>{
			j("初始化表失败，初始化配置失败")
		})
	})
	const initFileFunction=new Promise((r)=>{
		bus.on("copy",(selectArr)=>{
			isShear.value=false
			selectList.value=selectArr
		})
		bus.on("shear",(selectArr)=>{
			isShear.value=true
			selectList.value=selectArr
		})
		bus.on("paste",(path)=>{
			if(!path)return
			if(selectList.value){
				const arr=[]
				let fun
				if(isShear.value===false){
					fun=file=>{
						arr.push(file.copy(path))
					}
				}else{
					fun=file=>{
						arr.push(file.shear(path))
					}
				}
				const selectFilter=selectList.value.filter(i=>i.pwd!="/system-app"&&i.pwd!="/")
				let pwds=selectFilter.map(i=>{
					const pwd=i.pwd
					fun(i)
					return pwd
				})
				console.log(`path:`,path);
				pwds.push(path)
				pwds=new Set(pwds)
				Promise.all(arr).then((e)=>{
					pwds.forEach(initList)//更新全部复制的内容
					if(isShear.value===true){
						selectList.value=[]
					}
					// if(desktop.value)
					// 	desktop.value.focus()
				})
			}
		})
		const system_file=[
			"/C/Desktop",
		]
		bus.on("delete",(selectArr)=>{
			selectList.value=selectArr
			const selectFilter=selectList.value.filter(i=>i.pwd!="/system-app"&&i.pwd!="/"&&!system_file.includes(i.path))
			const pwds=new Set(selectFilter.map(i=>{
				return i.pwd
			}))
			const paths=new Set(selectFilter.map(i=>{
				return i.path
			}))
			Promise.all(selectFilter.map(i=>i.delete())).then(()=>{
				pwds.forEach(initList)
				paths.forEach(i=>{
					delete fileList[i]
				})
			})
		})
		r()
	})
	loadingArr.push(DBInit,initConfg,initFileFunction)//初始化db,初始化配置
	const loading=Promise.all(loadingArr).then((r)=>{
		return (r.join("\n"))
	}).catch((err)=>{
		console.error(`err:`,err);
		return err
	})
	return await loading;
}
export function getConfig(){
	return system_config
}

//复制粘贴剪切删除操作

export function copy(selectArr){
	bus.emit("copy",selectArr)
}
export function shear(selectArr){
	bus.emit("shear",selectArr)
}
export function paste(path){
	// selectAppListEmpty()
	bus.emit("paste",path)
}
export function deleteFile(selectArr){
	bus.emit("delete",selectArr)
}


export function initList(path){
	return readFileAll(path).then(res=>{
		console.log(`path,res:`,path,res);
		fileList[path]=res
		console.log(`fileList:`,fileList);
		// openApp(systemAppList[0])
	})
}
//复制粘贴剪切删除操作end