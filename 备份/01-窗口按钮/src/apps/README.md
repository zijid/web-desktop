# 如何添加应用

现在往这个桌面加应用非常简单，有两种方式：

---

## 方式一：HTML 应用（推荐，最简单）

**三步完成：**

```
public/apps/你的应用/
├── index.html    ← 你的 HTML 文件
└── app.json      ← 应用配置
```

**app.json 格式：**
```json
{
  "name": "应用名称",
  "icon": "🕐",                      // 也可以用 SVG 或图片 URL
  "url": "index.html",               // HTML 文件路径（相对于 public/）
  "windowWidth": 50,                 // 窗口默认宽度 (%)
  "windowHeight": 60                 // 窗口默认高度 (%)
}
```

**然后在 `scanner.js` 里注册一行：**
```js
registerApp('your-app', {
  name: '你的应用',
  icon: '🚀',
  url: '/apps/your-app/index.html',
  windowWidth: 50,
  windowHeight: 60
})
```

或者不想写 scanner，直接在 `App.js` 的 `install` 函数里注册：
```js
import { registerApp } from '@/system/apps'
registerApp('myapp', {
  name: '我的 App',
  icon: '🔧',
  url: '/apps/myapp/index.html'
})
```

---

## 方式二：Vue 组件应用（原生体验）

需要开发 Vue 组件时用：

```
src/apps/你的应用/
├── app.json
└── index.vue      ← Vue 组件
```

组件通过 `inject('appContext')` 获取上下文信息（appId, title, pid, pwd, filePath, args）。

然后在 `scanner.js` 注册：
```js
const comp = (await import('@/apps/你的应用/index.vue')).default
registerApp('你的应用', {
  name: '应用名称',
  icon: '<svg>...</svg>',
  component: comp,
  extensions: ['txt', 'md']  // 可选：关联的文件类型
})
```

---

## 实际例子

现在已经有三个应用：
- **文件管理器** — Vue 原生应用
- **记事本** — Vue 原生应用
- **简约时钟** — HTML 应用（`public/apps/clock/index.html`）

加第四个应用，只需要在 `public/apps/` 下新建一个文件夹就行了。
