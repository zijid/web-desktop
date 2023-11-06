//初始化
import {IndexedDB,utils} from "zijid-ui"
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
				console.log(`err:`,err);
				j("初始化配置失败")
			})
		}).catch(err=>{
			j("初始化表失败，初始化配置失败")
		})
	})
	// console.log(` await db.find(tableName,path):`,await db.find(tableName,"config-versions"));
	loadingArr.push(DBInit,initConfg)//初始化db,初始化配置
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