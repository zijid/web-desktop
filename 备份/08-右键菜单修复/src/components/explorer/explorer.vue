<script setup>
/**
 * Win10 风格文件管理器
 * 功能: 侧边栏、功能区、右键菜单、多视图、搜索、排序、文件操作
 */
import { ref, reactive, computed, watch, onMounted, onUnmounted } from "vue"
import { bus, systemDirectory } from "@/App"
import { readFileAll, readFile, WebDir, WebFile, dir_str } from "@/utils/file"
import Win from "../window/window.vue"
import { fileList, selectList } from "@/hooks"
import * as system from "@/system"
import { getAllApps, launchApp } from '@/system/apps'
import { openFile as openFileAssoc, getOpenWithApps, getAppForFile } from '@/system/filetypes'
import { useToast } from 'zijid-ui'

// 自定义指令：自动聚焦 contenteditable 并将光标移到末尾
const vFocus = {
  mounted(el) {
    el.focus()
    const range = document.createRange()
    const sel = window.getSelection()
    range.selectNodeContents(el)
    range.collapse(false)
    sel.removeAllRanges()
    sel.addRange(range)
  }
}

const props = defineProps({
  path: { type: String, default: "" },
  pid: { type: Number, default: 0 }
})

const currentPath = ref("")
const searchQuery = ref("")
const searchFilter = ref("")
const historyList = reactive([])
const historyIndex = ref(-1)
const isLoading = ref(false)
const viewMode = ref("icons")
const sortColumn = ref("name")
const sortAsc = ref(true)
const showSidebar = ref(true)

const selectedFiles = ref([])
const focusFile = ref(null)
const editFile = ref(null)
const editFileName = ref("")

const sidebarExpanded = reactive({ quickAccess: true, thisPC: true })
const toast = useToast()
const showOpenWithDlg = ref(false)
const openWithFile = ref(null)
const openWithApps = ref([])
const DEFAULT_APP_KEY = 'explorer-default-apps'
function getDefaultApps() { try { return JSON.parse(localStorage.getItem(DEFAULT_APP_KEY) || '{}') } catch { return {} } }
function setDefaultApp(ext, appId) { const d = getDefaultApps(); d[ext] = appId; localStorage.setItem(DEFAULT_APP_KEY, JSON.stringify(d)) }
function getDefaultApp(ext) { return getDefaultApps()[ext] || null }

const filteredDir = computed(() => {
  const list = fileList[currentPath.value]
  if (!list) return []
  let filtered = searchFilter.value
    ? list.filter(f => f.name.toLowerCase().includes(searchFilter.value.toLowerCase()))
    : [...list]
  filtered.sort((a, b) => {
    if (a.type === "WebDir" && b.type !== "WebDir") return -1
    if (a.type !== "WebDir" && b.type === "WebDir") return 1
    const aName = (a.nickname || a.name || "").toLowerCase()
    const bName = (b.nickname || b.name || "").toLowerCase()
    if (sortColumn.value === "name") {
      return sortAsc.value ? aName.localeCompare(bName) : bName.localeCompare(aName)
    }
    if (sortColumn.value === "time") {
      return sortAsc.value ? (a.createTime || 0) - (b.createTime || 0) : (b.createTime || 0) - (a.createTime || 0)
    }
    if (sortColumn.value === "type") {
      const aType = a.type || ""
      const bType = b.type || ""
      return sortAsc.value ? aType.localeCompare(bType) : bType.localeCompare(aType)
    }
    return sortAsc.value ? aName.localeCompare(bName) : bName.localeCompare(aName)
  })
  return filtered
})

const sidebarItems = computed(() => {
  const driveItems = (systemDirectory || []).map(d => ({
    label: d.nickname || `${d.name}:`,
    path: d.path
  }))
  return [
    {
      type: "group", key: "quickAccess", label: "快速访问",
      children: [
        { label: "桌面", path: "/C/Desktop" },
        { label: "下载", path: "/C/Downloads" },
        { label: "文档", path: "/C/Document" }
      ]
    },
    {
      type: "group", key: "thisPC", label: "此电脑",
      children: [
        ...driveItems
      ]
    }
  ]
})

function getFileIcon(file) {
  if (file.icon) { return file.icon }
  if (file.type === "WebDir") {
    if (file.system) {
      return '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="10" width="40" height="28" rx="3" fill="#0078d4" stroke="#005a9e" stroke-width="2"/><rect x="10" y="17" width="28" height="3" rx="1" fill="#ffffff" opacity="0.2"/><rect x="10" y="23" width="28" height="3" rx="1" fill="#ffffff" opacity="0.2"/><circle cx="37" cy="26" r="2.5" fill="#ffffff"/></svg>'
    }
    return '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 8C5 6.89543 5.89543 6 7 6H19L24 12H41C42.1046 12 43 12.8954 43 14V40C43 41.1046 42.1046 42 41 42H7C5.89543 42 5 41.1046 5 40V8Z" fill="none" stroke="#FFB900" stroke-width="4" stroke-linejoin="round"/></svg>'
  }
  return '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M40 23V14L31 4H10C8.89543 4 8 8.89543 8 10V42C8 43.1046 8.89543 44 10 44H22" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 4V14H40" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
}

async function navigate(path) { await endEdit()
  isLoading.value = true
  currentPath.value = path
  searchQuery.value = path
  bus.emit("select-path", path)
  if (path === "/" || path === "") {
    fileList[path] = systemDirectory
    isLoading.value = false
    return
  }
  readFileAll(path).then(res => {
    isLoading.value = false
    if (res && res.length >= 0) {
      fileList[path] = res
    } else {
      readFile(path).then(s => {
        if (s && s.type === "WebFile") {
          const parent = path.substring(0, path.lastIndexOf("/"))
          if (parent) navigate(parent)
        } else { fileList[path] = null }
      })
    }
  })
}function goBack() {
  if (historyIndex.value > 0) { historyIndex.value--; navigate(historyList[historyIndex.value]) }
}
function goForward() {
  if (historyIndex.value < historyList.length - 1) { historyIndex.value++; navigate(historyList[historyIndex.value]) }
}
function goUp() {
  if (!currentPath.value || currentPath.value === "/") return
  const parent = currentPath.value.substring(0, currentPath.value.lastIndexOf("/"))
  if (parent) { pushHistory(parent); navigate(parent) }
}
function goTo(path) { pushHistory(path); navigate(path) }
function pushHistory(path) {
  historyList.splice(historyIndex.value + 1, historyList.length)
  historyList.push(path)
  historyIndex.value = historyList.length - 1
}
function refresh() { if (currentPath.value) navigate(currentPath.value) }
function onAddressKeydown(e) {
  if (e.key === "Enter") { const val = searchQuery.value.trim(); if (val) goTo(val) }
}
function onSearchInput() { searchFilter.value = searchQuery.value }

function openFile(file) {
    if (file._appId) {
      const def = getAllApps().find(a => a.id === file._appId)
      if (def) { launchApp(file._appId, { title: file.name, filePath: file.path, pwd: file.pwd }); return }
    }
    if (file.type === "WebDir") { pushHistory(file.path); navigate(file.path); return }
    const ext = (file.extension || "").toLowerCase().replace(/^\./, "")
    const defaultAppId = getDefaultApp(ext)
    if (defaultAppId) { launchApp(defaultAppId, { title: file.name, filePath: file.path, pwd: file.pwd }); return }
    if (!ext) {
      const all = getAllApps().filter(a => !a.hidden && a.id !== 'explorer')
      openWithFile.value = file; openWithApps.value = all; showOpenWithDlg.value = true
      return
    }
    const assoc = getAppForFile(file)
    if (assoc) { launchApp(assoc.appId, { title: file.name, filePath: file.path, pwd: file.pwd }); return }
    const candidates = getOpenWithApps(ext)
    if (candidates.length === 1) { launchApp(candidates[0].id, { title: file.name, filePath: file.path, pwd: file.pwd }); return }
    if (candidates.length > 0) { openWithFile.value = file; openWithApps.value = candidates; showOpenWithDlg.value = true }
    else { toast.show({ title: '无法打开', message: '没有找到可以打开此文件的应用', type: 'warning', duration: 3000 }) }
  }

function toggleSelect(e, file) {
  if (e.ctrlKey) {
    const idx = selectedFiles.value.findIndex(i => i.uid === file.uid)
    if (idx > -1) selectedFiles.value.splice(idx, 1)
    else selectedFiles.value.push(file)
  } else if (e.shiftKey && selectedFiles.value.length > 0) {
    const list = filteredDir.value
    const lastIdx = list.findIndex(i => i.uid === selectedFiles.value[selectedFiles.value.length - 1].uid)
    const curIdx = list.findIndex(i => i.uid === file.uid)
    if (lastIdx > -1 && curIdx > -1) {
      const start = Math.min(lastIdx, curIdx)
      const end = Math.max(lastIdx, curIdx)
      selectedFiles.value = list.slice(start, end + 1)
    }
  } else { clearSelection(); selectedFiles.value.push(file) }
  if (selectedFiles.value.length > 0) focusFile.value = selectedFiles.value[0]
}

const vSelect = {
  mounted(el) {
    if (document.body.createTextRange) {
      const range = document.body.createTextRange()
      range.moveToElementText(el); range.select()
    } else if (window.getSelection) {
      const sel = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(el)
      sel.removeAllRanges(); sel.addRange(range)
    }
  }
}

function clearSelection() { selectedFiles.value.splice(0, selectedFiles.value.length) }
function isSelected(file) { return selectedFiles.value.some(i => i.uid === file.uid) }

function onEditNameInput(e) { editFileName.value = e.target.textContent }
function onEditNameKeydown(e) {
  if (e.key === "Enter") { e.preventDefault(); endEdit() }
  if (e.key === "Escape") { e.preventDefault(); editFile.value = null }
}

async function startEdit(file) {
  await endEdit(); editFile.value = file; editFileName.value = file.nickname || file.name
}

async function endEdit() {
  if (editFile.value === null) return true
  const file = editFile.value; const name = editFileName.value
  if (!name) { toast.show({ message: '文件名不能为空', type: 'warning' }); return false }
  const existing = await readFile(file.pwd + "/" + name)
  if (existing && existing.uid !== file.uid) { toast.show({ message: '文件已存在，请使用其他名称', type: 'error' }); return false }
  try { await file.rename(name); system.initList(file.pwd) }
  catch (e) { console.error("rename failed", e) }
  editFile.value = null; editFileName.value = ""; return true
}function copyFiles() { if (selectedFiles.value.length) system.copy([...selectedFiles.value]) }
function cutFiles() { if (selectedFiles.value.length) system.shear([...selectedFiles.value]) }
function pasteFiles() { if (selectList.value.length) { clearSelection(); system.paste(currentPath.value) } }
function deleteFiles() { if (selectedFiles.value.length) { system.deleteFile([...selectedFiles.value]); clearSelection() } }

function showProperties(file) {
  const lines = [
    "名称: " + (file.nickname || file.name),
    "路径: " + file.path,
    "类型: " + (file.type === "WebDir" ? "文件夹" : "文件"),
    "创建时间: " + (file.createTime ? new Date(file.createTime).toLocaleString() : "--"),
  ];
  if (file.type !== "WebDir") lines.push("扩展名: " + (file.extension || "--"));
  toast.show({ message: lines.join("\n"), type: "info", duration: 5000 })
}

async function createNewFolder() { await endEdit();
  let name = "新建文件夹"
  let counter = 2
  while ((fileList[currentPath.value]||[]).some(f => f.name === name)) { name = "新建文件夹 (" + counter + ")"; counter++ }
  let ndir = new WebDir(currentPath.value, name)
  ndir.setIcon(dir_str)
  try {
    await ndir.save()
    await system.initList(currentPath.value)
    const list = fileList[currentPath.value]
    if (list) { const created = list.find(f => f.name === ndir.name); if (created) startEdit(created) }
  } catch (e) { console.error("create folder failed", e) }
}

async function createNewFile() { await endEdit();
  let name = "新建文本文档.txt"
  let counter = 2
  while ((fileList[currentPath.value]||[]).some(f => f.name === name)) { name = "新建文本文档 (" + counter + ").txt"; counter++ }
  let nfile = new WebFile(currentPath.value, name)
  nfile.write("")
  try {
    await nfile.save()
    await system.initList(currentPath.value)
    const list = fileList[currentPath.value]
    if (list) { const created = list.find(f => f.name === nfile.name); if (created) startEdit(created) }
  } catch (e) { console.error("create file failed", e) }
}

function selectAll() { selectedFiles.value = [...filteredDir.value] }



function showCtxMenu(e, file) {
  bus.emit("menu-close")
  const items = buildMenuItems(file || null)
  bus.emit("menu-show", { x: e.clientX, y: e.clientY, data: items })
}
function showBlankCtxMenu(e) {
    bus.emit("menu-close")
    clearSelection()
    const items = buildMenuItems(null)
    bus.emit("menu-show", { x: e.clientX, y: e.clientY, data: items })
  }
  function showSidebarCtxMenu(e, child) {
    bus.emit("menu-close")
    const items = [
      { title: "打开", hander: () => goTo(child.path) },
      { type: "separator" },
      { title: "属性", hander: () => { toast.show({ message: "路径: " + child.path + "\n" + child.label, type: "info", duration: 4000 }) } }
    ]
    bus.emit("menu-show", { x: e.clientX, y: e.clientY, data: items })
  }
  function closeCtxMenu() { bus.emit("menu-close") }
function handleCtxMenuClick(item) { closeCtxMenu(); if (item.hander) item.hander() }
function buildMenuItems(file) {
  if (file && !isSelected(file)) { clearSelection(); selectedFiles.value.push(file) }
  const items = []
  const singleFile = selectedFiles.value.length > 0 ? selectedFiles.value[0] : null
    if (singleFile) {
      items.push({ title: "打开", hander: () => openFile(singleFile) })
      const ext = (singleFile.extension || "").toLowerCase().replace(/^\./, "")
      const candidates = getOpenWithApps(ext)
      if (candidates.length > 1 || (candidates.length > 0 && ext)) {
        const sub = candidates.filter(a => getAppForFile(singleFile)?.appId !== a.id).map(a => ({ title: a.name, hander: () => launchApp(a.id, { title: singleFile.name, filePath: singleFile.path, pwd: singleFile.pwd }) }))
        const cur = getAppForFile(singleFile)
        if (cur && candidates.length > 1) sub.unshift({ title: cur.appDef.name+' (默认)', hander: () => launchApp(cur.appId, { title: singleFile.name, filePath: singleFile.path, pwd: singleFile.pwd }) })
        items.push({ title: "打开方式", children: [
          ...sub,
          { type: 'separator' },
          { title: '选择默认应用...', hander: () => { openWithFile.value = singleFile; openWithApps.value = candidates; showOpenWithDlg.value = true } }
        ]})
      }
      if (!singleFile.system) {
        items.push({ title: "重命名", hander: () => startEdit(singleFile) })
        items.push({ type: "separator" })
        items.push({ title: "复制", hander: () => copyFiles() })
        items.push({ title: "剪切", hander: () => cutFiles() })
        items.push({ type: "separator" })
        items.push({ title: "删除", hander: () => deleteFiles() })
        items.push({ type: "separator" })
      }
      items.push({ title: "属性", hander: () => showProperties(singleFile) })
  } else {
    items.push({ title: "查看", children: [
      { title: "大图标", hander: () => { viewMode.value = "icons" } },
      { title: "列表", hander: () => { viewMode.value = "list" } },
      { title: "详细信息", hander: () => { viewMode.value = "details" } }
    ]})
    items.push({ title: "排序方式", children: [
      { title: "名称", hander: () => { sortColumn.value = "name"; sortAsc.value = !sortAsc.value } },
      { title: "修改日期", hander: () => { sortColumn.value = "time"; sortAsc.value = !sortAsc.value } },
      { title: "类型", hander: () => { sortColumn.value = "type"; sortAsc.value = !sortAsc.value } }
    ]})
    items.push({ type: "separator" })
    items.push({ title: "新建文件夹", hander: () => createNewFolder() })
    items.push({ title: "新建文本文档", hander: () => createNewFile() })
    items.push({ type: "separator" })
    if (selectList.value.length) items.push({ title: "粘贴", hander: () => pasteFiles() })
    items.push({ title: "全选", hander: () => selectAll() })
    items.push({ type: "separator" })
    items.push({ title: "属性", hander: () => { toast.show({ message: "路径: " + currentPath.value + "\n项目数: " + (filteredDir.value ? filteredDir.value.length : 0), type: "info", duration: 4000 }) } })
  }
  return items
}
function onKeydown(e) {
  if (!editFile.value) {
    if (e.ctrlKey && e.key === "c") { copyFiles(); e.preventDefault() }
    else if (e.ctrlKey && e.key === "x") { cutFiles(); e.preventDefault() }
    else if (e.ctrlKey && e.key === "v") { pasteFiles(); e.preventDefault() }
    else if (e.ctrlKey && e.key === "a") { selectAll(); e.preventDefault() }
    else if (e.key === "Delete") { deleteFiles(); e.preventDefault() }
    else if (e.key === "F2") { if (focusFile.value) startEdit(focusFile.value); e.preventDefault() }
    else if (e.key === "Enter") { if (selectedFiles.value.length === 1) openFile(selectedFiles.value[0]) }
  }
  if (e.key === "Escape") { closeCtxMenu(); if (editFile.value) editFile.value = null; clearSelection() }
}

function formatDate(ts) {
  if (!ts) return "--"
  const d = new Date(ts); const pad = n => n.toString().padStart(2, "0")
  return d.getFullYear() + "/" + pad(d.getMonth() + 1) + "/" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes())
}

onMounted(() => {
  currentPath.value = props.path && !props.path.startsWith("/system-app") ? props.path : "/C/Desktop"
  searchQuery.value = currentPath.value
  historyList.push(currentPath.value); historyIndex.value = 0
  navigate(currentPath.value)
})
// click-outside handling is done by system Menu component


watch(() => fileList, () => {
  const cur = fileList[currentPath.value]
  if (cur && selectedFiles.value.length > 0) {
    selectedFiles.value = selectedFiles.value.filter(sf => cur.some(f => f.uid === sf.uid))
  }
}, { deep: true })


const currentPathName = computed(() => {
  if (!currentPath.value || currentPath.value === "/") return "此电脑"
  return currentPath.value.split("/").pop() || currentPath.value
})

function openWithLaunch(appId) {
  if (!openWithFile.value) return
  const f = openWithFile.value
  const ext = (f.extension || '').toLowerCase().replace(/^\./, '')
  launchApp(appId, { title: f.name, filePath: f.path, pwd: f.pwd })
  showOpenWithDlg.value = false
  openWithFile.value = null
}
function openWithSetDefault(appId) {
  if (!openWithFile.value) return
  const f = openWithFile.value
  const ext = (f.extension || '').toLowerCase().replace(/^\./, '')
  setDefaultApp(ext, appId)
  launchApp(appId, { title: f.name, filePath: f.path, pwd: f.pwd })
  showOpenWithDlg.value = false
  openWithFile.value = null
  toast.show({ title: '已设置默认', message: `.${ext} 文件将默认使用此应用打开`, type: 'success', duration: 3000 })
}
</script>
<template>
<Win :path="path" :pid="pid" @keydown.stop="onKeydown">
  <template #title>
    <span class="win-title-text">{{ currentPathName }}</span>
    <span class="win-title-path">{{ currentPath }}</span>
  </template>
  <div class="explorer-win10">
    <!-- Ribbon -->
    <div class="ribbon">
      <div class="ribbon-row">
        <div class="ribbon-group">
          <button class="ribbon-btn" @click="goBack" :disabled="historyIndex <= 0" title="后退"><span class="ribbon-icon"><svg viewBox="0 0 48 48"><path d="M31 36L19 24L31 12" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="ribbon-label">后退</span></button>
          <button class="ribbon-btn" @click="goForward" :disabled="historyIndex >= historyList.length - 1" title="前进"><span class="ribbon-icon"><svg viewBox="0 0 48 48"><path d="M17 12L29 24L17 36" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="ribbon-label">前进</span></button>
          <button class="ribbon-btn" @click="goUp" title="向上"><span class="ribbon-icon"><svg viewBox="0 0 48 48"><path d="M24 6L24 42" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M12 18L24 6L36 18" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="ribbon-label">向上</span></button>
          <button class="ribbon-btn" @click="refresh" title="刷新"><span class="ribbon-icon"><svg viewBox="0 0 48 48"><path d="M42 24C42 14.0589 33.9411 6 24 6C18.6525 6 13.8429 8.25927 10.4449 12" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M6 24C6 33.9411 14.0589 42 24 42C29.3475 42 34.1571 39.7407 37.5551 36" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg></span><span class="ribbon-label">刷新</span></button>
        </div>
        <div class="ribbon-separator"></div>
        <div class="ribbon-group">
          <button class="ribbon-btn" @click="createNewFolder" title="新建文件夹"><span class="ribbon-icon"><svg viewBox="0 0 48 48"><path d="M5 8C5 6.89543 5.89543 6 7 6H19L24 12H41C42.1046 12 43 12.8954 43 14V40C43 41.1046 42.1046 42 41 42H7C5.89543 42 5 41.1046 5 40V8Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M18 26H30" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M24 20V32" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg></span><span class="ribbon-label">新建文件夹</span></button>
          <button class="ribbon-btn" @click="createNewFile" title="新建文本文档"><span class="ribbon-icon"><svg viewBox="0 0 48 48"><path d="M40 23V14L31 4H10C8.89543 4 8 8.89543 8 10V42C8 43.1046 8.89543 44 10 44H22" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M33 29V43" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 36H33H40" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 4V14H40" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="ribbon-label">新建文本文档</span></button>
        </div>
        <div class="ribbon-separator"></div>
        <div class="ribbon-group">
          <button class="ribbon-btn" @click="copyFiles" :disabled="selectedFiles.length === 0" title="复制"><span class="ribbon-icon"><svg viewBox="0 0 48 48"><path d="M10 44H38C39.1046 44 40 43.1046 40 42V18L30 8H10C8.89543 8 8 8.89543 8 10V42C8 43.1046 8.89543 44 10 44Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 8V18H40" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="ribbon-label">复制</span></button>
          <button class="ribbon-btn" @click="cutFiles" :disabled="selectedFiles.length === 0" title="剪切"><span class="ribbon-icon"><svg viewBox="0 0 48 48"><path d="M10 44H38C39.1046 44 40 43.1046 40 42V18L30 8H10C8.89543 8 8 8.89543 8 10V42C8 43.1046 8.89543 44 10 44Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 32H32" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M30 8V18H40" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="ribbon-label">剪切</span></button>
          <button class="ribbon-btn" @click="pasteFiles" :disabled="selectList.length === 0" title="粘贴"><span class="ribbon-icon"><svg viewBox="0 0 48 48"><path d="M10 44H38C39.1046 44 40 43.1046 40 42V18L30 8H10C8.89543 8 8 8.89543 8 10V42C8 43.1046 8.89543 44 10 44Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 32H32" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M16 24H24" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M30 8V18H40" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="ribbon-label">粘贴</span></button>
        </div>
        <div class="ribbon-separator"></div>
        <div class="ribbon-group">
          <button class="ribbon-btn" @click="deleteFiles" :disabled="selectedFiles.length === 0" title="删除"><span class="ribbon-icon"><svg viewBox="0 0 48 48"><path d="M9 10V44H39V10" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 10H42" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M20 20V33" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M28 20V33" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M16 10L19 4H29L32 10H16Z" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="ribbon-label">删除</span></button>
          <button class="ribbon-btn" @click="selectedFiles.length === 1 ? startEdit(selectedFiles[0]) : null" :disabled="selectedFiles.length !== 1" title="重命名"><span class="ribbon-icon"><svg viewBox="0 0 48 48"><path d="M7 42H43" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M11 26.7199V34H18.3172L39 13.3081L31.6951 6L11 26.7199Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/></svg></span><span class="ribbon-label">重命名</span></button>
        </div>
        <div class="ribbon-separator"></div>
        <div class="ribbon-group">
          <button class="ribbon-btn" :class="{ 'ribbon-btn-active': showSidebar }" @click="showSidebar = !showSidebar" title="导航窗格"><span class="ribbon-icon"><svg viewBox="0 0 48 48"><path d="M5 5H43V43H5V5Z" fill="none" stroke="currentColor" stroke-width="4"/><path d="M16 5V43" stroke="currentColor" stroke-width="4"/></svg></span><span class="ribbon-label">导航窗格</span></button>
        </div>
      </div>
      <div class="address-bar">
        <div class="address-bar-left">
          <button class="nav-btn small" @click="goBack" :disabled="historyIndex <= 0"><svg viewBox="0 0 48 48"><path d="M31 36L19 24L31 12" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          <button class="nav-btn small" @click="goForward" :disabled="historyIndex >= historyList.length - 1"><svg viewBox="0 0 48 48"><path d="M17 12L29 24L17 36" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          <button class="nav-btn small" @click="goUp"><svg viewBox="0 0 48 48"><path d="M24 6L24 42" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M12 18L24 6L36 18" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          <button class="nav-btn small" @click="refresh"><svg viewBox="0 0 48 48"><path d="M42 24C42 14.0589 33.9411 6 24 6C18.6525 6 13.8429 8.25927 10.4449 12" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M6 24C6 33.9411 14.0589 42 24 42C29.3475 42 34.1571 39.7407 37.5551 36" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg></button>
        </div>
        <div class="address-bar-input">
          <input type="text" v-model="searchQuery" @keydown.enter="onAddressKeydown" @input="onSearchInput" class="addr-input" placeholder="输入路径或搜索..." />
        </div>
        <div class="address-bar-right">
          <button class="view-btn" :class="{ active: viewMode === 'icons' }" @click="viewMode = 'icons'" title="大图标">&#9632;</button>
          <button class="view-btn" :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'" title="列表">&#9776;</button>
          <button class="view-btn" :class="{ active: viewMode === 'details' }" @click="viewMode = 'details'" title="详细信息">&#8807;</button>
        </div>
      </div>
    </div>    <!-- Main body -->
    <div class="explorer-body">
      <div class="sidebar" v-show="showSidebar">
        <div v-for="group in sidebarItems" :key="group.key" class="sidebar-group">
          <div class="sidebar-group-header" @click="sidebarExpanded[group.key] = !sidebarExpanded[group.key]; if(group.key==='thisPC') goTo('/')">
            <span class="sidebar-arrow" :class="{ expanded: sidebarExpanded[group.key] }">&#9654;</span>
            <span class="sidebar-group-label">{{ group.label }}</span>
          </div>
          <div v-show="sidebarExpanded[group.key]" class="sidebar-children">
            <div v-for="child in group.children" :key="child.path"
              class="sidebar-item" :class="{ active: currentPath === child.path }"
              @click="goTo(child.path)" @contextmenu.prevent.stop="showSidebarCtxMenu($event, child)">
              <span class="sidebar-item-icon" v-html="child.path.match(/^\/[A-Z]$/) ? '<svg viewBox=\'0 0 48 48\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\'><rect x=\'4\' y=\'10\' width=\'40\' height=\'28\' rx=\'3\' fill=\'#0078d4\' stroke=\'#005a9e\' stroke-width=\'2\'/><rect x=\'10\' y=\'17\' width=\'28\' height=\'3\' rx=\'1\' fill=\'#ffffff\' opacity=\'0.2\'/><rect x=\'10\' y=\'23\' width=\'28\' height=\'3\' rx=\'1\' fill=\'#ffffff\' opacity=\'0.2\'/><circle cx=\'37\' cy=\'26\' r=\'2.5\' fill=\'#ffffff\'/></svg>' : '&#128193;'"></span>
              <span class="sidebar-item-label">{{ child.label }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="content-area" @click.self="clearSelection" @contextmenu.prevent.stop="showBlankCtxMenu">
        <div v-if="isLoading" class="loading-indicator">加载中...</div>
        <div v-else-if="filteredDir.length === 0" class="empty-state">
          <div class="empty-icon">&#128193;</div>
          <div class="empty-text">此文件夹为空</div>
        </div>
        <div v-else-if="viewMode === 'icons'" class="icons-view">
          <div v-for="file in filteredDir" :key="file.uid"
            :class="['file-item icons', { selected: isSelected(file), editing: editFile && editFile.uid === file.uid }]"
            @click.stop="toggleSelect($event, file)" @dblclick="openFile(file)"
            @contextmenu.prevent.stop="showCtxMenu($event, file)">
            <div class="file-icon" v-html="getFileIcon(file)"></div>
            <div class="file-name" v-if="editFile && editFile.uid === file.uid" contenteditable v-focus
              @input="onEditNameInput" @click.stop @dblclick.stop
              @keydown="onEditNameKeydown" @blur="endEdit">{{ editFileName }}</div>
            <div class="file-name" v-else :title="file.nickname || file.name">{{ file.nickname || file.name }}</div>
          </div>
        </div>
        <div v-else-if="viewMode === 'list'" class="list-view">
          <div v-for="file in filteredDir" :key="file.uid"
            :class="['file-item list-row', { selected: isSelected(file), editing: editFile && editFile.uid === file.uid }]"
            @click.stop="toggleSelect($event, file)" @dblclick="openFile(file)"
            @contextmenu.prevent.stop="showCtxMenu($event, file)">
            <span class="file-icon-small" v-html="getFileIcon(file)"></span>
            <span class="file-name-text" v-if="editFile && editFile.uid === file.uid" contenteditable v-focus
              @input="onEditNameInput" @click.stop @dblclick.stop
              @keydown="onEditNameKeydown" @blur="endEdit">{{ editFileName }}</span>
            <span class="file-name-text" v-else>{{ file.nickname || file.name }}</span>
            <span class="file-date">{{ formatDate(file.createTime) }}</span>
            <span class="file-type">{{ file.type === "WebDir" ? "文件夹" : "文件" }}</span>
          </div>
        </div>
        <div v-else-if="viewMode === 'details'" class="details-view">
          <div class="details-header">
            <span class="col-name sortable" @click="sortColumn='name';sortAsc=!sortAsc">名称</span>
            <span class="col-date sortable" @click="sortColumn='time';sortAsc=!sortAsc">修改日期</span>
            <span class="col-type sortable" @click="sortColumn='type';sortAsc=!sortAsc">类型</span>
          </div>
          <div v-for="file in filteredDir" :key="file.uid"
            :class="['details-row', { selected: isSelected(file), editing: editFile && editFile.uid === file.uid }]"
            @click.stop="toggleSelect($event, file)" @dblclick="openFile(file)"
            @contextmenu.prevent.stop="showCtxMenu($event, file)">
            <span class="col-name"><span class="file-icon-tiny" v-html="getFileIcon(file)"></span><span v-if="editFile && editFile.uid === file.uid" contenteditable class="name-text edit" v-focus @input="onEditNameInput" @click.stop @dblclick.stop @keydown="onEditNameKeydown" @blur="endEdit">{{ editFileName }}</span><span v-else class="name-text">{{ file.nickname || file.name }}</span></span>
            <span class="col-date">{{ formatDate(file.createTime) }}</span>
            <span class="col-type">{{ file.type === "WebDir" ? "文件夹" : "文件" }}</span>
          </div>
        </div>
      </div>
    </div>
    <!-- Status bar -->
    <div class="status-bar">
      <span v-if="selectedFiles.length > 0">已选择 {{ selectedFiles.length }} 个项目</span>
      <span v-else>{{ filteredDir.length }} 个项目</span>
    </div>
  </div>
  </Win>

  <!-- 打开方式对话框 -->
  <Teleport to="body">
    <div v-if="showOpenWithDlg" class="openwith-overlay" @click.self="showOpenWithDlg = false">
      <div class="openwith-dlg">
        <div class="openwith-title">打开方式</div>
        <div class="openwith-file">{{ openWithFile?.name || '' }}</div>
        <div class="openwith-list">
          <div v-for="app in openWithApps" :key="app.id" class="openwith-app" @click="openWithLaunch(app.id)">
            <span class="openwith-app-icon" v-html="app.icon || ''"></span>
            <span class="openwith-app-name">{{ app.name }}</span>
            <button class="openwith-default-btn" @click.stop="openWithSetDefault(app.id)">设为默认</button>
          </div>
        </div>
        <div class="openwith-actions">
          <button class="openwith-cancel" @click="showOpenWithDlg = false">取消</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
<style scoped>
.explorer-win10 {
  display: flex; flex-direction: column; height: 100%;
  font-family: "Segoe UI", "Microsoft YaHei", sans-serif;
  font-size: 12px; color: #333; background: #fff;
}
/* Ribbon */
.ribbon {
  background: linear-gradient(to bottom, #f5f5f5, #e8e8e8);
  border-bottom: 1px solid #d0d0d0; flex-shrink: 0;
}
.ribbon-row {
  display: flex; align-items: flex-start; padding: 4px 6px; gap: 2px;
}
.ribbon-group {
  display: flex; align-items: flex-start; gap: 1px;
}
.ribbon-btn {
  display: flex; flex-direction: column; align-items: center;
  padding: 4px 8px; border: 1px solid transparent;
  background: transparent; cursor: pointer; min-width: 48px;
  font-family: inherit; font-size: 11px; color: #333; border-radius: 3px;
}
.ribbon-btn:hover { background: #d0d0d0; border-color: #b0b0b0; }
.ribbon-btn:active { background: #b0b0b0; }
.ribbon-btn:disabled { opacity: 0.4; cursor: default; }
.ribbon-btn:disabled:hover { background: transparent; border-color: transparent; }
.ribbon-btn-active { background: #c0c0c0; border-color: #0078d4; }
.ribbon-icon svg { width: 20px; height: 20px; display: block; }
.ribbon-label { margin-top: 2px; white-space: nowrap; }
.ribbon-separator {
  width: 1px; height: 48px; background: #c0c0c0; margin: 0 2px;
}
/* Address bar */
.address-bar {
  display: flex; align-items: center; padding: 4px 8px 6px; gap: 4px;
}
.address-bar-left { display: flex; gap: 1px; }
.nav-btn.small {
  width: 24px; height: 24px; padding: 0; display: flex;
  align-items: center; justify-content: center;
  background: transparent; border: 1px solid transparent; cursor: pointer;
  border-radius: 2px;
}
.nav-btn.small svg { width: 14px; height: 14px; }
.nav-btn.small:hover { background: #d0d0d0; border-color: #b0b0b0; }
.nav-btn.small:disabled { opacity: 0.3; cursor: default; }
.nav-btn.small:disabled:hover { background: transparent; }
.address-bar-input {
  flex: 1; display: flex; align-items: center;
  background: #fff; border: 1px solid #b0b0b0; border-radius: 2px;
  padding: 0 6px; height: 24px;
}
.addr-input {
  flex: 1; border: none; outline: none; font-size: 12px;
  font-family: inherit; background: transparent;
}
.address-bar-right { display: flex; gap: 2px; }
.view-btn {
  width: 26px; height: 24px; display: flex; align-items: center;
  justify-content: center; border: 1px solid transparent;
  background: transparent; cursor: pointer; border-radius: 2px;
  font-size: 14px; color: #555;
}
.view-btn:hover { background: #d0d0d0; }
.view-btn.active { background: #c0e0ff; border-color: #0078d4; color: #0078d4; }
/* Body */
.explorer-body {
  flex: 1; display: flex; overflow: hidden;
}
.sidebar {
  width: 200px; min-width: 160px; background: #f0f0f0;
  border-right: 1px solid #d0d0d0; overflow-y: auto;
  user-select: none;
}
.sidebar-group { border-bottom: 1px solid #e0e0e0; }
.sidebar-group-header {
  display: flex; align-items: center; padding: 6px 8px;
  cursor: pointer; font-size: 12px; font-weight: 600;
  color: #333; background: #e8e8e8;
}
.sidebar-group-header:hover { background: #d8d8d8; }
.sidebar-arrow { font-size: 8px; margin-right: 6px; transition: transform .15s; }
.sidebar-arrow.expanded { transform: rotate(90deg); }
.sidebar-group-label { }
.sidebar-children { }
.sidebar-item {
  display: flex; align-items: center; padding: 4px 8px 4px 22px;
  cursor: pointer; color: #333; font-size: 12px;
}
.sidebar-item:hover { background: #d8d8d8; }
.sidebar-item.active { background: #c0e0ff; color: #000; }
.sidebar-item-icon { margin-right: 6px; font-size: 14px; display: inline-flex; align-items: center; }
.sidebar-item-label { }
/* Content area */
.content-area {
  flex: 1; overflow: auto; background: #fff;
  position: relative;
}
.loading-indicator {
  text-align: center; padding: 40px; color: #888;
}
.empty-state {
  text-align: center; padding: 60px 20px; color: #999;
}
.empty-icon { font-size: 48px; margin-bottom: 12px; }
.empty-text { font-size: 14px; }
/* Icons view */
.icons-view {
  display: flex; flex-wrap: wrap; align-content: flex-start;
  padding: 12px; gap: 6px;
}
.file-item.icons {
  display: flex; flex-direction: column; align-items: center;
  width: 120px; padding: 10px 8px; cursor: default;
  border: 1px solid transparent; border-radius: 3px;
}
.file-item.icons:hover { background: #e8f0fe; }
.file-item.icons.selected { background: #c0e0ff; border-color: #0078d4; }
.file-item.icons .file-icon { width: 60px; height: 60px; margin-bottom: 6px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.file-item.icons .file-icon svg { width: 60px; height: 60px; display: block; }
.file-item.icons .file-name {
  width: 100%; text-align: center; font-size: 12px;
  line-height: 1.3; word-break: keep-all; overflow-wrap: break-word;
  overflow: hidden; text-overflow: ellipsis;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  max-height: 2.6em;
}
.file-item.icons .file-name.edit {
  background: #fff; border: 1px solid #0078d4; outline: none;
  min-width: 60px; cursor: text; -webkit-line-clamp: unset;
  overflow: visible;
}
/* List view */
.list-view { }
.file-item.list-row {
  display: flex; align-items: center; padding: 4px 12px; gap: 8px;
  cursor: default; border-bottom: 1px solid #f0f0f0;
}
.file-item.list-row:hover { background: #e8f0fe; }
.file-item.list-row.selected { background: #c0e0ff; }
.file-icon-small svg { width: 20px; height: 20px; display: block; flex-shrink: 0; }
.file-name-text { flex: 1; font-size: 12px; }
.file-name-text.edit { background: #fff; border: 1px solid #0078d4; outline: none; cursor: text; }
.file-date { width: 140px; color: #666; font-size: 11px; }
.file-type { width: 80px; color: #666; font-size: 11px; }
/* Details view */
.details-view { }
.details-header {
  display: flex; padding: 4px 12px; font-weight: 600;
  font-size: 11px; color: #666; border-bottom: 1px solid #d0d0d0;
  background: #f5f5f5; user-select: none;
}
.col-name { flex: 1; display: flex; align-items: center; gap: 6px; }
.col-date { width: 160px; }
.col-type { width: 100px; }
.sortable { cursor: pointer; }
.sortable:hover { color: #333; }
.details-row {
  display: flex; align-items: center; padding: 4px 12px;
  cursor: default;
}
.details-row:hover { background: #e8f0fe; }
.details-row.selected { background: #c0e0ff; }
.file-icon-tiny svg { width: 16px; height: 16px; display: block; flex-shrink: 0; }
.name-text { font-size: 12px; }
.name-text.edit { background: #fff; border: 1px solid #0078d4; outline: none; cursor: text; }
/* Status bar */
.status-bar {
  padding: 3px 12px; background: #f0f0f0; border-top: 1px solid #d0d0d0;
  font-size: 11px; color: #666; flex-shrink: 0;
}
.win-title-text { font-weight: 500; }
.win-title-path { color: #999; margin-left: 8px; font-weight: 400; }

/* 打开方式对话框 */
.openwith-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; z-index: 99999; }
.openwith-dlg { background: #f0f0f0; border: 1px solid #999; min-width: 320px; max-width: 420px; box-shadow: 2px 2px 16px rgba(0,0,0,0.25); }
.openwith-title { padding: 10px 14px; font-size: 13px; font-weight: 600; color: #333; background: linear-gradient(180deg,#fff,#ecebe9); border-bottom: 1px solid #d0d0d0; }
.openwith-file { padding: 6px 14px; font-size: 12px; color: #555; background: #fafafa; border-bottom: 1px solid #e0e0e0; word-break: break-all; }
.openwith-list { padding: 4px 0; }
.openwith-app { display: flex; align-items: center; padding: 7px 14px; cursor: default; gap: 8px; }
.openwith-app:hover { background: #d8e8f8; }
.openwith-app-icon svg { width: 20px; height: 20px; display: block; }
.openwith-app-name { flex: 1; font-size: 12px; color: #333; }
.openwith-default-btn { font-size: 11px; padding: 2px 8px; border: 1px solid #aaa; background: #fff; cursor: default; border-radius: 2px; }
.openwith-default-btn:hover { background: #e5e5e5; border-color: #0078d4; color: #0078d4; }
.openwith-actions { padding: 8px 14px; border-top: 1px solid #d0d0d0; display: flex; justify-content: flex-end; }
.openwith-cancel { font-size: 12px; padding: 4px 16px; border: 1px solid #aaa; background: #fff; cursor: default; border-radius: 2px; }
.openwith-cancel:hover { background: #e5e5e5; }
</style>













