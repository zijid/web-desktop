//窗口控制
import { reactive } from "vue";
import {windowList,progressList,activeAppPid} from "@/hooks"
import {findProgress} from "@/system/progress"

let showDesktopState = false

export function createWindow(config) {
  // 兼容旧方式：传入 pid 数字
  if (typeof config === 'number') {
    const progress = findProgress(config)
    if (!progress) return null
    console.log('[Window] createWindow for pid=', config, 'title=', progress.title)
    activeAppPid.value = config
    const win = reactive({
      title: progress?.title,
      pid: config,
      args: progress?.args,
      exec: progress?.exec,
      z: nextZ()
    })
    windowList.push(win)
    return win
  }
  // 新方式：传入对象
  const { pid, title, exec, args } = config
  activeAppPid.value = pid
  const win = reactive({
    title: title || '',
    pid,
    args: args || '',
    exec: exec || null,
    z: nextZ()
  })
  windowList.push(win)
  return win
}

let _nextZ = 1
function nextZ() {
  return _nextZ++
}

export function closeWindow(pid) {
  let index = progressList.findIndex(i => i.pid === pid)
  if (index > -1) progressList.splice(index, 1)
  index = windowList.findIndex(i => i.pid === pid)
  if (index > -1) windowList.splice(index, 1)
  updateActive()
}

export function getWindow(pid) {
  return windowList.find(i => i.pid === pid)
}

function bringToTop(thisWin) {
  thisWin.z = nextZ()
  updateActive()
}

function hideWin(thisWin) {
  thisWin.z = -Math.abs(thisWin.z)
  updateActive()
}

function updateActive() {
  const top = windowList.reduce((best, w) => w.z > best.z ? w : best, { z: -1 })
  activeAppPid.value = top.pid || null
}

export function showCount() {
  return windowList.filter(i => i.z > 0).length
}

export function showWindow(pid, type = "window") {
  const win = windowList.find(i => i.pid === pid)
  if (!win) return
  if (type === "window") {
    bringToTop(win)
  } else if (type === "tab") {
    showDesktopState = false
    const topZ = Math.max(...windowList.map(w => w.z), 0)
    if (win.z === topZ) {
      hideWin(win)
    } else {
      bringToTop(win)
    }
  }
}

export function hideWindow(pid) {
  const win = windowList.find(i => i.pid === pid)
  if (win) hideWin(win)
}

export function showDesktop() {
  const allHidden = windowList.every(i => i.z < 0)
  if (allHidden || showDesktopState) {
    showDesktopState = false
    windowList.forEach(i => { if (i.z < 0) i.z = nextZ() })
  } else {
    showDesktopState = true
    windowList.forEach(i => { i.z = -Math.abs(i.z) })
    activeAppPid.value = null
  }
}
