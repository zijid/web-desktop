/**
 * filetypes.js — 文件类型与应用关联
 *
 * 自动从已注册应用的 extensions 字段建立
 * 扩展名 → 应用 的映射，用于双击文件时
 * 选择正确的应用打开。
 *
 * 如果找不到关联应用，显示"打开方式"对话框。
 */
import { getAllApps, launchApp } from '@/system/apps'
import { createProgress } from '@/system/progress'
import { progressList } from '@/hooks'

// 扩展名 → appId 映射
const _assocMap = new Map()

/**
 * 重建关联表（通常在 app 注册完成后调用）
 */
export function rebuildAssociations() {
  _assocMap.clear()
  const apps = getAllApps()
  for (const app of apps) {
    if (app.extensions && app.extensions.length) {
      for (const ext of app.extensions) {
        const key = ext.toLowerCase()
        // 后注册的 app 优先级更高（覆盖前面的）
        _assocMap.set(key, app.id)
      }
    }
  }
}

/**
 * 获取能打开某扩展名的应用
 */
export function getAppForExtension(ext) {
  const key = (ext || '').toLowerCase().replace(/^\./, '')
  return _assocMap.get(key) || null
}

/**
 * 根据文件获取关联的应用
 * @param {object} file - { extension, isFolder, name }
 * @returns {object|null} { appId, appDef }
 */
export function getAppForFile(file) {
  if (!file) return null
  if (file.isFolder) {
    const app = getAllApps().find(a => a.id === 'explorer')
    return app ? { appId: 'explorer', appDef: app } : null
  }
  const ext = (file.extension || '').toLowerCase().replace(/^\./, '')
  const appId = getAppForExtension(ext)
  if (!appId) return null
  const appDef = getAllApps().find(a => a.id === appId)
  return appDef ? { appId, appDef } : null
}

/**
 * 获取所有能打开某扩展名的应用列表（用于"打开方式"菜单）
 */
export function getOpenWithApps(ext) {
  const key = (ext || '').toLowerCase().replace(/^\./, '')
  const apps = getAllApps()
  return apps.filter(a => a.extensions.includes(key))
}

/**
 * 打开文件，自动选择关联应用
 * @returns {boolean} 是否成功打开
 */
export function openFile(file) {
  const assoc = getAppForFile(file)
  if (!assoc) return false

  if (assoc.appId === 'explorer') {
    createProgress(file.name, assoc.appDef.component || 'Explorer', file.pwd, file.path)
    // 标记自带窗口的组件
    if (assoc.appDef && assoc.appDef.hasWindow) {
      const p = progressList[progressList.length - 1]
      if (p) p._hasWindow = true
    }
  } else {
    launchApp(assoc.appId, {
      title: file.name,
      filePath: file.path,
      pwd: file.pwd
    })
  }
  return true
}

/**
 * "打开方式"对话框
 * 当没有关联应用时调用
 */
export function showOpenWithDialog(file) {
  // 扫描所有应用，看哪些能打开这种扩展名
  const ext = (file.extension || '').toLowerCase().replace(/^\./, '')
  const candidates = getAllApps().filter(a => {
    // 文件夹只能用 Explorer
    if (file.isFolder) return a.id === 'explorer'
    // 不限制扩展名的应用（extensions包含''）也可以
    return a.extensions.includes('') || a.extensions.includes(ext)
  })

  // 返回候选列表，由 UI 层渲染对话框
  return {
    file,
    ext,
    candidates
  }
}
