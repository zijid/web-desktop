# 桌面
[演示demo](https://zijid.gitee.io/web-desktop/)
## 模拟文件系统

### C://系统
	用户
		桌面
		文档
	临时文件
	系统文件//系统配置、系统加载内容


### D://软件
	空//安装东西可以都放这里


### E://数据

	空//文件可以存这里

## 文件

### 快捷方式  
	可以指向文件系统内的文件 创建时可以选择或者输入 如果内容不存在不可以创建 创建后打开 内容不存在改变图标并显示删除提示

### 文件  
	有后缀，右键显示不同的菜单，后缀可以隐藏，文件类型txt、exe等

电脑  
	打开文件系统

### 系统管理
	打开可视化配置

## 文件信息保存到浏览器

# git

	git add .
	git commit -m "1.0"
	git push https://github.com/zijid/web-desktop.git

# 桌面
做的不是系统是桌面
开始加载数据
加载完后渲染桌面加载应用

应用有两种一种内置
一种html代码

做应用加载

桌面加载需要进配置读取

## 配置
定义在c:系统文件/config.json中
```json
{
	"bg":{
		"img":"/bg53k.jpg"
	},
	"file":[//文件系统
		{
			"pwd":"C:",
			"title":"系统",
		},
		{
			"pwd":"D:",
			"title":"软件"
		},
		{
			"pwd":"E:",
			"title":"数据"
		}
	],
	"menu":[
		{
			"postfix":".exe",
			"ments":[
				{
					title:"打开",
					hander:"exe"
				},
				{
					title:"重命名",
					hander:"rename"
				}
			]
		}
	]
}
```