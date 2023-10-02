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

更新

新的文件系统
根据配置加载系统设置，根据硬盘加载文件到系统
硬盘是本地数据库 如果一下加载全部是不是有点多？

什么是系统配置
背景 分区 桌面位置 桌面内容 打开方式 后缀和打开方式对应 右键内容 

后面可以考虑
加用户
索引


应用怎么实现？
如文件管理器 记事本这些

桌面也是是个应用吧

数据和操作数据的东西，然后加上应用生成一个正常可使用的应用

那需要大改吧 这个项目还要吗

系统api
数据操作api 系统操作api（文件、进程、）
并不是真系统是网页 还是基于vue的，还要考虑应用的实现，怎么实现先想一下
1. 使用网页
 	实现
		网页写好使用iframe载入
	数据传输
		去浏览器读取和url传输
	优缺点
		制作方便，导入新应用方便，传值方式也还行，可以制作好专门读取和写入的api被调用

2. 内置的vue组件
 	实现
		一个应用就是一个组件和当前的记事本和文件管理器一样，
	数据传输
		组件传值然后在提供的接口获取也可以在浏览器获取
	优缺点
		全部得自己实现
3. 动态添加的组件
 	实现
		使用vue编译器编译vue组件，并导入，怎么使用使用component导入吧
	数据传输
		去浏览器读取和url传输
	优缺点
		编译工具不好实现
4. 写个组件实现编译和显示。。。
 	实现
		组件传值，然后使用值进行渲染ui
	数据传输
		浏览器组件传值
	优缺点
		不好实现