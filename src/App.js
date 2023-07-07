import { File } from "./utils";
import { openApp } from "./utils";
const systemDirectory=[
	new File("","C:",true,[
		new File("C:","用户",true,[
			new File("C:/用户","桌面",true),
			new File("C:/用户","文档",true)
		]),
		new File("C:","临时文件",true),
		new File("C:","系统文件",true),
		new File("C:","系统软件",true)
	]),
	new File("","D:",true),
	new File("","E:",true,[
		new File("E:","文本文件1",false,"文件内容1",{extension:".txt"}),
		new File("E:","文本文件2",false,"文件内容2",{extension:".txt"}),
		new File("E:","文件夹1",true,[
			new File("E:/文件夹1","文本文件3",false,"文件内容3",{extension:".txt"}),
			new File("E:/文件夹1","文本文件4",false,"文件内容4",{extension:".txt"}),
		]),
		new File("E:","文件夹2",true)
	])
]
openApp(0,"E:")
openApp(0,"E:")
openApp(0,"E:/文件夹1")
openApp(1,"")
export {
	systemDirectory
}
console.log("systemDirectory:",JSON.parse(JSON.stringify(systemDirectory)));//以后可以保存到本地，只在本地没有时在创建