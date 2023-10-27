# 右键菜单

点击后拿到xy 根据屏幕宽度和大小

第一层需要返回 计算后的xy 下层需要计算的xy，下层改变方向时需要的左边坐标,宽度

```js
import Menu from "@/components/system/menu/menu.vue"

import { FUNCTION,DIR } from "@/utils/types";
const show=ref(true)
const position=reactive({
	x:-1000,y:-1000
})
function showMenu(e,i){
	position.x=e.clientX
	position.y=e.clientY
	show.value=true
	if(i){
		item.value=i
	}else{
		item.value=""
	}
}
const menuData=[
	{
		title:"文本a",
		type:FUNCTION,
		hander:()=>{
			show.value=false
		}
	},
	{
		title:"文本b",
		type:FUNCTION,
		hander:()=>{
		}
	},
	{
		title:"新建",
		type:DIR,
		children:[
			{
				title:"文本",
				type:FUNCTION,
				hander:()=>{
				}
			},
			{
				title:"目录",
				type:FUNCTION,
				hander:()=>{
				}
			},
			{
				title:"更多",
				type:DIR,
				children:[
					{
						title:"文本2",
						type:DIR,
						children:[
							{
								title:"文本3",
								type:FUNCTION,
								hander:()=>{
								}
							},
							{
								title:"目录3",
								type:FUNCTION,
								hander:()=>{
								}
							}
						],
					},
					{
						title:"目录2",
						type:FUNCTION,
						hander:()=>{
							addApp("文本")
						}
					}
				],
			}
		],
	}
]
```
```html
<Menu :data="menuData" :position="position" :show="show"></Menu>
```