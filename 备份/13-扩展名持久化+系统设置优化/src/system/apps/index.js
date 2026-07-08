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
    hasWindow: !!def.hasWindow,  // 组件自身是否已包含窗口标题栏
    _customHtml: def._customHtml || ''  // 自定义 HTML 内容（储存在 localStorage 中的应用）
  }
  _registry.set(id, entry)

  // 通知桌面刷新
  try { window.dispatchEvent(new CustomEvent('app-registered', { detail: { id } })) } catch(e) {}
  console.log(`[Apps] "${id}" (${entry.type}) 已注册`)
}

// ──── 自定义应用（从制作工具保存的） ────

const CUSTOM_APPS_KEY = 'web-desktop-custom-apps'

/**
 * 保存自定义应用（HTML类型）
 * 将应用信息存储到 localStorage，保证刷新后依然可用
 */
export function saveCustomApp(id, def) {
  let apps = {}
  try {
    apps = JSON.parse(localStorage.getItem(CUSTOM_APPS_KEY) || '{}')
  } catch(e) { apps = {} }
  apps[id] = {
    id,
    name: def.name,
    icon: def.icon,
    html: def.html,
    windowWidth: def.windowWidth || 50,
    windowHeight: def.windowHeight || 60,
    minWidth: def.minWidth || 300,
    minHeight: def.minHeight || 200,
    hidden: !!def.hidden,
    singleton: !!def.singleton,
    extensions: def.extensions || [],
    menu: def.menu || null
  }
  localStorage.setItem(CUSTOM_APPS_KEY, JSON.stringify(apps))
}

/**
 * 删除自定义应用
 */
export function removeCustomApp(id) {
  let apps = {}
  try {
    apps = JSON.parse(localStorage.getItem(CUSTOM_APPS_KEY) || '{}')
  } catch(e) { apps = {} }
  delete apps[id]
  localStorage.setItem(CUSTOM_APPS_KEY, JSON.stringify(apps))
  // 也从注册表移除
  if (_registry.has(id)) {
    _registry.delete(id)
    console.log(`[Apps] 自定义应用 "${id}" 已移除`)
  }
}

/**
 * 获取所有自定义应用
 */
export function getCustomApps() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_APPS_KEY) || '{}')
  } catch(e) { return {} }
}

/**
 * 加载所有自定义应用并注册到系统
 * 在桌面启动时调用
 */
export function loadCustomApps() {
  const apps = getCustomApps()
  let count = 0
  for (const [id, def] of Object.entries(apps)) {
    if (!_registry.has(id)) {
      // 生成 blob URL
      const blob = new Blob([def.html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      registerApp(id, {
        name: def.name,
        icon: def.icon,
        url: url,
        windowWidth: def.windowWidth,
        windowHeight: def.windowHeight,
        minWidth: def.minWidth,
        minHeight: def.minHeight,
        hasWindow: def.hasWindow,
        hidden: def.hidden,
        singleton: def.singleton,
        extensions: def.extensions || [],
        menu: def.menu,
        _customHtml: def.html
      })
      count++
    }
  }
  if (count > 0) {
    console.log(`[Apps] 已加载 ${count} 个自定义应用`)
    // 自定义应用注册完成后重建扩展名关联映射，否则刷新后关联丢失
    import('@/system/filetypes').then(m => m.rebuildAssociations())
  }
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
      // 如果是自定义应用，确保 blob URL 有效
      let url = appDef.url
      if (appDef._customHtml && !url.startsWith('blob:')) {
        // blob URL 可能已失效，重新生成
        try {
          const blob = new Blob([appDef._customHtml], { type: 'text/html' })
          url = URL.createObjectURL(blob)
          appDef.url = url  // 更新注册表中的 URL
        } catch(e) {
          console.error('[Apps] 自定义应用 URL 生成失败', e)
        }
      }
      last.url = url
      last.args = opts.args || ''
      last.windowWidth = appDef.windowWidth
      last.windowHeight = appDef.windowHeight
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


/**
 * 保存所有应用的扩展名状态到 localStorage
 */
export function saveExtensionsState() {
  const state = {}
  for (const [id, app] of _registry) {
    if (app.extensions && app.extensions.length) {
      state[id] = [...app.extensions]
    }
  }
  try { localStorage.setItem('web-desktop-extensions', JSON.stringify(state)) } catch(e) {}
}

/**
 * 恢复所有应用的扩展名状态（在应用注册完成后调用）
 */
export function restoreExtensions() {
  try {
    const raw = localStorage.getItem('web-desktop-extensions')
    if (!raw) return
    const state = JSON.parse(raw)
    for (const [id, exts] of Object.entries(state)) {
      if (_registry.has(id)) {
        _registry.get(id).extensions = exts
      }
    }
  } catch(e) {}
}
export function closeApp(pid) {
  closeWindow(pid)
}
