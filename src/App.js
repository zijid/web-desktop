import { File } from "./utils";

const systemDirectory=[
	new File("C:","系统",true,[
		new File("C:/系统","用户",true,[
			new File("C:/系统/用户","桌面",true,[
				
			]),
			new File("C:/系统/用户","文档",true,[
				
			])
		]),
		new File("C:/系统","临时文件",true,[
		]),
		new File("C:/系统","系统文件",true,[
		]),
		new File("C:/系统","系统软件",true,[
		])
	]),
	new File("D:","软件",true,[
		
	]),
	new File("E:","文档",true,[
		
	])
]
console.log("systemDirectory:",JSON.parse(JSON.stringify(systemDirectory)));//以后可以保存到本地，只在本地没有时在创建