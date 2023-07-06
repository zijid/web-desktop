class path {
	static join(...paths){
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

		return fullPath;
	}
}
class File {
	constructor(p, name, isFolder = false, content = null, extension = "", attr = {}) {
		this.name = name; // 文件或文件夹的名称
		this.isFolder = isFolder; // 是否是文件夹
		this.content = content; // 文件的内容（仅适用于文件），文件夹显示数组
		this.extension = extension; // 文件的后缀（仅适用于文件）
		this.pwd=p
		this.attribute = Object.assign({ name, path: path.join(p,name+extension) }, attr)//文件或文件夹属性
		/*
		 文件名
		 位置
		 大小
		 包含文件和文件夹数量
		 创建时间
		 属性//待定吧
		 图标
		 */
	}
	open() {
		if (this.isFolder) {//使用文件夹管理器打开
			console.log(`打开文件夹: ${this.name}`);
		} else {//如果是文件先判断后缀对应的打开应用是否存在，存在就打开，不存在就使用弹窗程序提示

		}
	}
}

export {
	path,File
}