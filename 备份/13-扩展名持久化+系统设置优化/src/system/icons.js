/**
 * icons.js — 图标注册表
 *
 * 管理文件扩展名→图标的映射，支持增量配置。
 * 可自动从已注册应用的 manifest.icon 继承。
 *
 * 用法：
 *   import { getIcon } from '@/system/icons'
 *   file.icon = getIcon(file)  // 自动匹配扩展名
 */
import { getAllApps } from '@/system/apps'

// 内置默认图标（SVG）
const BUILTIN = {
  folder: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 8C5 6.89543 5.89543 6 7 6H19L24 12H41C42.1046 12 43 12.8954 43 14V40C43 41.1046 42.1046 42 41 42H7C5.89543 42 5 41.1046 5 40V8Z" fill="#ffc25b" stroke="#9013fe" stroke-width="4" stroke-linejoin="round"/><path d="M43 22H5" stroke="#ffffff" stroke-width="4" stroke-linejoin="round"/><path d="M5 16V28" stroke="#9013fe" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M43 16V28" stroke="#9013fe" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  file:   `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M40 23V14L31 4H10C8.89543 4 8 4.89543 8 6V42C8 43.1046 8.89543 44 10 44H22" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M33 29V43" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 36H33H40" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 4V14H40" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  txt:    `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 6C8 4.89543 8.89543 4 10 4H30L40 14V42C40 43.1046 39.1046 44 38 44H10C8.89543 44 8 43.1046 8 42V6Z" fill="#ffffff" stroke="#000000" stroke-width="4" stroke-linejoin="round"/><path d="M16 20H32" stroke="#707070" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 28H32" stroke="#707070" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  unknown: `<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 44H38C39.1046 44 40 43.1046 40 42V14H30V4H10C8.89543 4 8 4.89543 8 6V42C8 43.1046 8.89543 44 10 44Z" fill="#ffffff" stroke="#000000" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 4L40 14" stroke="#000000" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 22L30 34" stroke="#707070" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 22L18 34" stroke="#707070" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`
}

// 用户自定义扩展名→图标映射
const _extMap = new Map()

/**
 * 为一种扩展名注册图标
 * @param {string} ext   - 扩展名小写，如 'txt', 'jpg'
 * @param {string} icon  - SVG 字符串或图片 URL
 */
export function registerIcon(ext, icon) {
  _extMap.set(ext.toLowerCase(), icon)
}

/**
 * 批量注册图标
 * @param {object} map - { ext: icon, ... }
 */
export function registerIcons(map) {
  for (const [ext, icon] of Object.entries(map)) {
    registerIcon(ext, icon)
  }
}

/**
 * 获取文件对应的图标
 * @param {object} file - 文件对象，需有 isFolder / extension / name 属性
 * @returns {string} SVG 或 URL
 */
export function getIcon(file) {
  if (!file) return BUILTIN.unknown
  // 文件夹
  if (file.isFolder) return BUILTIN.folder
  // 从扩展名映射查找
  const ext = (file.extension || '').toLowerCase().replace(/^\./, '')
  if (_extMap.has(ext)) return _extMap.get(ext)
  // 从已注册应用查找：app 为该扩展名注册的图标
  const apps = getAllApps()
  for (const app of apps) {
    if (app.extensions && app.extensions.includes(ext)) {
      if (app.icon) return app.icon
    }
  }
  // 内置默认
  if (BUILTIN[ext]) return BUILTIN[ext]
  return BUILTIN.file
}

/**
 * 获取内置图标（用于直接引用）
 */
export function getBuiltin(name) {
  return BUILTIN[name] || BUILTIN.unknown
}

// 注册常用的扩展名图标（内置 SVG）
registerIcons({
  folder: BUILTIN.folder,
  txt: BUILTIN.txt,
  md: BUILTIN.txt,
  js: BUILTIN.file,
  html: BUILTIN.file,
  css: BUILTIN.file,
  json: BUILTIN.file,
  xml: BUILTIN.file,
  ini: BUILTIN.file,
  cfg: BUILTIN.file,
  png: BUILTIN.file,
  jpg: BUILTIN.file,
  jpeg: BUILTIN.file,
  gif: BUILTIN.file,
  svg: BUILTIN.file,
  pdf: BUILTIN.file,
  zip: BUILTIN.file,
  rar: BUILTIN.file,
  '': BUILTIN.file
})
