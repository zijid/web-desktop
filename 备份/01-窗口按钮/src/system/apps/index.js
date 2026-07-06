/**
 * App System — 应用系统
 * 
 * 两种方式添加应用：
 * 
 * 1. HTML 应用（最简单的）：
 *    registerApp('my-tool', {
 *      name: '我的工具',
 *      icon: '/apps/my-tool/icon.svg',
 *      url: '/apps/my-tool/index.html'
 *    })
 *    // 或者只要一行：
 *    registerApp('clock', { name: '时钟', icon: '🕒', url: 'https://time.is' })
 *
 * 2. Vue 组件应用（原生体验）：
 *    registerApp('explorer', {
 *      name: '文件管理器',
 *      icon: '<svg>...</svg>',
 *      component: Explorer
 *    })
 */

import { reactive, markRaw } from 'vue'
import { progressList } from '@/hooks'
import { createProgress } from '@/system/progress'
import { closeWindow } from '@/system/window'

// ──── 注册表 ────
const _registry = reactive(new Map())
export const appRegistry = _registry

let _pid = 0
export function nextPid() { return ++_pid }

// ──── 注册 API ────

export function registerApp(id, def) {
  if (_registry.has(id)) {
    console.warn(`[Apps] "${id}" 已注册，跳过`)
    return
  }
  const entry = {
    id,
    name: def.name || id,
    icon: def.icon || '',
    url: def.url || '',
    component: def.component ? markRaw(def.component) : null,
    singleton: !!def.singleton,
    extensions: def.extensions || [],
    hidden: !!def.hidden,
    type: def.url ? 'html' : 'vue',
    menu: def.menu || null,
    windowWidth: def.windowWidth || 65,
    windowHeight: def.windowHeight || 75,
    minWidth: def.minWidth || 300,
    minHeight: def.minHeight || 200,
    hasWindow: !!def.hasWindow  // 组件自身是否已包含窗口标题栏
  }
  _registry.set(id, entry)
  console.log(`[Apps] "${id}" (${entry.type}) 已注册`)
}

// ──── 查询 API ────

export function getApp(id) {
  return _registry.get(id) || null
}

export function getAllApps() {
  return Array.from(_registry.values())
}

export function getDesktopApps() {
  return getAllApps().filter(a => !a.hidden)
}

export function getAppByExtension(ext) {
  return getAllApps().find(a => a.extensions.includes(ext))
}

// ──── 启动 API ────

/**
 * 启动一个应用
 * @param {string} appId   - 应用标识
 * @param {object} [opts]
 * @param {string} [opts.title]    - 窗口标题
 * @param {string} [opts.filePath] - 关联文件路径
 * @param {string} [opts.pwd]      - 当前目录
 * @param {string} [opts.args]     - 附加参数
 */
export function launchApp(appId, opts = {}) {
  const appDef = getApp(appId)
  if (!appDef) {
    console.error(`[Apps] 未找到应用"${appId}"`)
    return null
  }

  const title = opts.title || appDef.name
  const pid = nextPid()

  if (appDef.type === 'html') {
    // HTML 应用：直接用 url，exec 传 null 避免提前渲染空壳
    createProgress(title, null, opts.pwd || '', opts.filePath || '')
    const last = progressList[progressList.length - 1]
    if (last) {
      last.appId = appDef.id
      last.url = appDef.url
      last.args = opts.args || ''
    }
  } else {
    // Vue 组件应用
    createProgress(title, appDef.component, opts.pwd || '', opts.filePath || '')
    const last = progressList[progressList.length - 1]
    if (last) {
      last.appId = appDef.id
      last.args = opts.args || ''
    }
    // 标记组件自身是否包含窗口标题栏
    if (last && appDef.hasWindow) {
      last._hasWindow = true
    }
  }

  console.log(`[Apps] 启动 "${appId}" (pid=${pid})`)
  return { pid, appId, title }
}

/**
 * 关闭一个应用
 */
export function closeApp(pid) {
  closeWindow(pid)
}
