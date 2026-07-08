<script setup>
/**
 * 系统设置 — System Settings
 */
import { ref, computed, onMounted } from 'vue'
import { getAllApps, getApp, launchApp, saveCustomApp, getCustomApps, saveExtensionsState } from '@/system/apps'
import { rebuildAssociations, getAppForExtension } from '@/system/filetypes'
import { getConfig } from '@/system'
import { WebFile, WebDir } from '@/utils/file'
import { bus } from '@/App'
import Win from '@/components/window/window.vue'

const props = defineProps({
  title: { type: String, default: '系统设置' },
  pid: { type: Number, default: 0 }
})

const navItems = [
  {
    id: 'ext',
    label: '扩展名设置',
    icon: '<svg width="16" height="16" viewBox="0 0 48 48" fill="none"><path d="M40 23V14L31 4H10C8.89543 4 8 4.89543 8 6V42C8 43.1046 8.89543 44 10 44H22" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M33 29V43" stroke="currentColor" stroke-width="4"/><path d="M26 36H40" stroke="currentColor" stroke-width="4"/></svg>'
  },
  {
    id: 'desktop',
    label: '桌面设置',
    icon: '<svg width="16" height="16" viewBox="0 0 48 48" fill="none"><path d="M4 7H44V35H4V7Z" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M4 35H44V39H4V35Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M24 35V43" stroke="currentColor" stroke-width="4"/><path d="M16 43H32" stroke="currentColor" stroke-width="4"/></svg>'
  },
  {
    id: 'reset',
    label: '重置',
    icon: '<svg width="16" height="16" viewBox="0 0 48 48" fill="none"><path d="M38 24C38 31.732 31.732 38 24 38C16.268 38 10 31.732 10 24C10 16.268 16.268 10 24 10C27.9 10 31.35 11.75 33.8 14.5" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M34 6L38 14L30 18" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  },
  {
    id: 'backup',
    label: '备份',
    icon: '<svg width="16" height="16" viewBox="0 0 48 48" fill="none"><path d="M37 18L42 13L37 8" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M42 13H21C15.4772 13 11 17.4772 11 23V25C11 30.5228 15.4772 35 21 35H37" stroke="currentColor" stroke-width="4"/><path d="M26 30L21 35L26 40" stroke="currentColor" stroke-width="4"/></svg>'
  }
]
const activeNav = ref('ext')
const statusMsg = ref('')

// ===== 扩展名管理 =====
const apps = ref([])
const selectedAppId = ref('')
const newExt = ref('')

function loadData() {
  apps.value = getAllApps().filter(a => !a.hidden && a.id !== 'system-settings')
}

const currentExts = computed(() => {
  if (!selectedAppId.value) return []
  const app = getApp(selectedAppId.value)
  return app ? [...app.extensions] : []
})

function selectApp(id) {
  selectedAppId.value = id
  newExt.value = ''
}

function addExtension() {
  const ext = newExt.value.trim().toLowerCase().replace(/^\./, '')
  if (!ext) { statusMsg.value = '请输入扩展名'; return }
  if (!selectedAppId.value) { statusMsg.value = '请先选择一个应用'; return }
  const app = getApp(selectedAppId.value)
  if (!app) return
  if (app.extensions.includes(ext)) { statusMsg.value = `扩展名 "${ext}" 已存在`; return }

  const otherApp = getAllApps().find(a => a.id !== selectedAppId.value && a.extensions.includes(ext))
  if (otherApp) {
    statusMsg.value = `扩展名 "${ext}" 已被 "${otherApp.name}" 关联，不能重复添加`
    return
  }

  app.extensions.push(ext)
  rebuildAssociations()
  saveExtensionsState()
  const _cApps = getCustomApps()
  if (_cApps[app.id]) {
    _cApps[app.id].extensions = [...app.extensions]
    saveCustomApp(app.id, _cApps[app.id])
  }
  newExt.value = ''
  apps.value = getAllApps().filter(a => !a.hidden && a.id !== 'system-settings')
  statusMsg.value = `已添加 .${ext} → ${app.name}`
}

function removeExtension(ext) {
  if (!selectedAppId.value) return
  const app = getApp(selectedAppId.value)
  if (!app) return
  app.extensions = app.extensions.filter(e => e !== ext)
  rebuildAssociations()
  saveExtensionsState()
  const _cApps = getCustomApps()
  if (_cApps[app.id]) {
    _cApps[app.id].extensions = [...app.extensions]
    saveCustomApp(app.id, _cApps[app.id])
  }
  apps.value = getAllApps().filter(a => !a.hidden && a.id !== 'system-settings')
  statusMsg.value = `已移除 .${ext}`
}

function getAssociatedAppName(ext) {
  const app = selectedAppId.value ? getApp(selectedAppId.value) : null
  return app ? app.name : '（无关联）'
}

// ===== 桌面设置 =====
const wallpaperUrl = ref('')
const desktopPath = ref('')
let config = null

function solidColorDataUrl(color) {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="' + color + '"/></svg>'
  return 'data:image/svg+xml,' + encodeURIComponent(svg)
}

const presetWallpapers = [
  { name: '极光', url: '/bg53k.jpg', color: '#0078d4' },
  { name: '纯黑', url: '', color: '#000000' },
  { name: '纯白', url: '', color: '#ffffff' },
  { name: '深空灰', url: '', color: '#2d2d2d' },
  { name: '青绿', url: '', color: '#009688' },
  { name: '珊瑚红', url: '', color: '#e74c3c' },
  { name: '薰衣草', url: '', color: '#9b59b6' },
  { name: '天空蓝', url: '', color: '#3498db' }
]

function loadDesktopSettings() {
  config = getConfig()
  if (!config) return
  wallpaperUrl.value = config.desktop?.bg?.base64 || config.desktop?.bg?.url || ''
  desktopPath.value = config.desktop?.path || '/C/Desktop'
}

function isActivePreset(item) {
  const cur = wallpaperUrl.value
  if (!cur) return false
  if (item.url && cur === item.url) return true
  if (!item.url) {
    const dataUrl = solidColorDataUrl(item.color)
    if (cur === dataUrl) return true
  }
  return false
}

function selectPresetWallpaper(item) {
  if (item.url) {
    wallpaperUrl.value = item.url
    applyWallpaper(item.url)
  } else {
    const dataUrl = solidColorDataUrl(item.color)
    wallpaperUrl.value = dataUrl
    applyWallpaper(dataUrl)
  }
}

function onFileImport(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    wallpaperUrl.value = reader.result
    applyWallpaper(reader.result)
  }
  reader.readAsDataURL(file)
  e.target.value = ''
}

function applyWallpaper(url) {
  if (!config || !config.desktop) return
  if (!url) { statusMsg.value = '请输入壁纸 URL 或选择预设'; return }
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) {
    config.desktop.bg = url.startsWith('data:') ? { url: '', base64: url } : { url, base64: '' }
    localStorage.setItem('web-desktop-bg', url)
    bus.emit('wallpaper-change', url)
    statusMsg.value = '壁纸已更新'
  } else {
    statusMsg.value = '不支持的图片格式'
  }
}

function updateDesktopPath() {
  if (!config || !config.desktop) return
  const path = desktopPath.value.trim()
  if (!path) { statusMsg.value = '请输入桌面路径'; return }
  config.desktop.path = path
  localStorage.setItem('web-desktop-desktop-path', path)
  statusMsg.value = '桌面路径已更新，刷新后生效'
}

// ===== 备份 =====
const backupStatus = ref('')
const restoring = ref(false)

const IDB_NAME = 'web-desktop'
const IDB_STORE = 'files'

async function _openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 5)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function _getAllFiles() {
  const db = await _openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly')
    const req = tx.objectStore(IDB_STORE).getAll()
    req.onsuccess = () => resolve(req.result || [])
    req.onerror = () => reject(req.error)
  })
}

async function _clearAllData() {
  const db = await _openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite')
    const req = tx.objectStore(IDB_STORE).clear()
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

async function _putFiles(files) {
  const db = await _openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite')
    const store = tx.objectStore(IDB_STORE)
    for (const f of files) store.put(f)
    tx.oncomplete = () => resolve(files.length)
    tx.onerror = () => reject(tx.error)
  })
}

async function exportBackup() {
  backupStatus.value = '正在打包...'
  try {
    const allFiles = await _getAllFiles()
    const settings = {}
    const keys = [
      'web-desktop-bg', 'web-desktop-desktop-path',
      'web-desktop-extensions', 'web-desktop-custom-apps',
      'web-desktop-config'
    ]
    for (const key of keys) {
      const val = localStorage.getItem(key)
      if (val) settings[key] = val
    }
    const data = { version: 1, time: new Date().toISOString(), files: allFiles, settings }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'web-desktop-backup-' + Date.now() + '.json'
    a.click()
    URL.revokeObjectURL(url)
    backupStatus.value = '备份完成（' + allFiles.length + ' 个文件）'
  } catch (e) {
    backupStatus.value = '导出失败：' + e.message
  }
}

async function importBackup(e) {
  const file = e.target.files?.[0]
  if (!file) return
  e.target.value = ''
  confirmText.value = '恢复备份'
  confirmSubText.value = '将从备份文件恢复所有数据，当前数据将被覆盖。'
  // 自定义确认弹窗
  showConfirm.value = true
  confirmAction.value = async () => {
    showConfirm.value = false
    restoring.value = true
    backupStatus.value = '正在恢复...'
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (!data.version) {
        backupStatus.value = '无效的备份文件'
        restoring.value = false
        return
      }
      await _clearAllData()
      localStorage.clear()
      const files = data.files || []
      if (files.length > 0) await _putFiles(files)
      if (data.settings) {
        for (const [key, val] of Object.entries(data.settings)) {
          localStorage.setItem(key, val)
        }
      }
      setTimeout(() => location.reload(), 500)
    } catch (e) {
      backupStatus.value = '恢复失败：' + e.message
    }
    restoring.value = false
  }
}

// ===== 重置 =====
const showConfirm = ref(false)
const confirmAction = ref(null)
const confirmText = ref('')
const confirmSubText = ref('')
const reseting = ref(false)

function openResetConfirm() {
  confirmText.value = '重置系统'
  confirmSubText.value = '此操作将清除所有用户数据，包括文件、设置、已创建的应用等，此操作不可撤销。'
  showConfirm.value = true
  confirmAction.value = async () => {
    showConfirm.value = false
    reseting.value = true
    statusMsg.value = '正在重置...'
    try {
      localStorage.clear()
      await _clearAllData()
      setTimeout(() => location.reload(), 500)
    } catch (e) {
      statusMsg.value = '重置失败：' + e.message
    }
    reseting.value = false
  }
}

function cancelConfirm() {
  showConfirm.value = false
  confirmAction.value = null
}

onMounted(() => {
  loadData()
  loadDesktopSettings()
})
</script>

<template>
  <Win :pid="pid" :path="path">
    <template #title>系统设置</template>
    <div class="settings">
      <div v-if="statusMsg" class="status-bar" @click="statusMsg = ''">{{ statusMsg }}</div>
      <div class="settings-body">
        <div class="sidebar">
          <div class="sidebar-title">设置</div>
          <div class="nav-list">
            <div v-for="nav in navItems" :key="nav.id"
              class="nav-item"
              :class="{ active: activeNav === nav.id }"
              @click="activeNav = nav.id">
              <span class="nav-icon" v-html="nav.icon"></span>
              <span>{{ nav.label }}</span>
            </div>
          </div>
        </div>
        <div class="main-panel">
          <!-- 扩展名设置 -->
          <template v-if="activeNav === 'ext'">
            <div class="panel-hint"><p>选择一个应用，管理它能打开的扩展名类型。</p></div>
            <div class="ext-layout">
              <div class="ext-sidebar">
                <div class="ext-sidebar-title">应用</div>
                <div class="ext-app-list">
                  <div v-for="app in apps" :key="app.id"
                    class="ext-app-item"
                    :class="{ active: selectedAppId === app.id }"
                    @click="selectApp(app.id)">
                    <span class="ext-app-icon" v-html="app.icon"></span>
                    <span class="ext-app-name">{{ app.name }}</span>
                  </div>
                  <div v-if="apps.length === 0" class="empty-hint">暂无应用</div>
                </div>
              </div>
              <div class="ext-main">
                <template v-if="selectedAppId">
                  <div class="ext-main-title">扩展名 — {{ getApp(selectedAppId)?.name }}</div>
                  <div class="ext-list">
                    <div v-for="ext in currentExts" :key="ext" class="ext-item">
                      <span class="ext-icon" v-html="getApp(selectedAppId)?.icon || ''"></span>
                      <span class="ext-name">.{{ ext }}</span>
                      <span class="ext-arrow">→</span>
                      <span class="ext-assoc">{{ getAssociatedAppName(ext) }}</span>
                      <button class="btn-remove" @click="removeExtension(ext)" title="移除此关联">✕</button>
                    </div>
                    <div v-if="currentExts.length === 0" class="empty-hint">该应用没有关联任何扩展名</div>
                  </div>
                  <div class="add-ext-row">
                    <input v-model="newExt" placeholder="输入扩展名，如 md" class="ext-input" @keydown.enter="addExtension" />
                    <button class="btn-primary" @click="addExtension">添加</button>
                  </div>
                </template>
                <div v-else class="no-selection">请从左侧选择一个应用</div>
              </div>
            </div>
          </template>

          <!-- 桌面设置 -->
          <template v-if="activeNav === 'desktop'">
            <div class="section">
              <h3 class="section-title">预设壁纸</h3>
              <div class="preset-grid">
                <div v-for="item in presetWallpapers" :key="item.name"
                  class="preset-card"
                  :class="{ active: isActivePreset(item) }"
                  @click="selectPresetWallpaper(item)">
                  <div class="preset-thumb" :style="{ background: item.color }">
                    <img v-if="item.url" :src="item.url" :alt="item.name" />
                  </div>
                  <span class="preset-name">{{ item.name }}</span>
                </div>
              </div>

              <h3 class="section-title" style="margin-top:20px">自定义壁纸</h3>
              <div class="custom-section">
                <div class="input-row">
                  <label class="input-label">图片链接</label>
                  <input v-model="wallpaperUrl" placeholder="https://..." class="text-input" />
                  <button class="btn-primary" @click="applyWallpaper(wallpaperUrl)">应用</button>
                </div>
                <div class="input-row">
                  <label class="input-label">本地文件</label>
                  <label class="file-btn">
                    <input type="file" accept="image/*" hidden @change="onFileImport" />
                    <span>选择图片</span>
                  </label>
                  <span class="file-hint">自动转为 base64</span>
                </div>
              </div>

              <h3 class="section-title" style="margin-top:20px">桌面路径</h3>
              <div class="input-row">
                <label class="input-label">路径</label>
                <input v-model="desktopPath" placeholder="/C/Desktop" class="text-input" />
                <button class="btn-primary" @click="updateDesktopPath">保存</button>
              </div>
              <p class="field-hint" style="margin-top:4px;margin-left:0">修改后刷新桌面生效</p>
            </div>
          </template>

          <!-- 重置 -->
          <template v-if="activeNav === 'reset'">
            <div class="section">
              <h3 class="section-title">重置</h3>
              <p class="field-hint" style="margin-bottom:16px">重置将清除所有用户数据，包括文件、设置、已创建的应用等。</p>
              <button class="btn-danger" @click="openResetConfirm" :disabled="reseting">
                {{ reseting ? '重置中...' : '重置系统' }}
              </button>
            </div>
          </template>

          <!-- 备份 -->
          <template v-if="activeNav === 'backup'">
            <div class="section">
              <p class="field-hint" style="margin-bottom:12px">备份所有文件数据和系统设置到 .json 文件，可在其他电脑上恢复。</p>
              <div class="backup-actions" style="margin-top:0">
                <button class="btn-primary" @click="exportBackup">备份</button>
                <label class="file-btn">
                  <input type="file" accept=".json" hidden @change="importBackup" :disabled="restoring" />
                  <span>{{ restoring ? '恢复中...' : '恢复' }}</span>
                </label>
              </div>
              <p v-if="backupStatus" class="backup-status">{{ backupStatus }}</p>
            </div>
          </template>
        </div>
      </div>

      <!-- 自定义确认弹窗 -->
      <div v-if="showConfirm" class="confirm-overlay" @click.self="cancelConfirm">
        <div class="confirm-dialog">
          <div class="confirm-title">{{ confirmText }}</div>
          <div class="confirm-body">{{ confirmSubText }}</div>
          <div class="confirm-actions">
            <button class="btn-primary" @click="confirmAction">确定</button>
            <button class="btn-cancel" @click="cancelConfirm">取消</button>
          </div>
        </div>
      </div>
    </div>
  </Win>
</template>

<style scoped>
.settings {
  height: 100%; display: flex; flex-direction: column;
  background: #f5f5f5; font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif; overflow: hidden;
  position: relative;
}
.status-bar {
  padding: 6px 16px; font-size: 13px;
  background: #e8f4fd; color: #0078d4; animation: fadeIn 0.2s; cursor: pointer;
}
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
.settings-body { flex: 1; display: flex; overflow: hidden; }
.sidebar {
  width: 160px; background: #fff;
  border-right: 1px solid #e0e0e0;
  display: flex; flex-direction: column; flex-shrink: 0;
}
.sidebar-title {
  padding: 14px 16px 8px; font-size: 11px; font-weight: 600;
  color: #666; text-transform: uppercase; letter-spacing: 0.5px;
}
.nav-list { flex: 1; padding: 4px 0; }
.nav-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px; cursor: default; font-size: 13px;
  color: #444; transition: background 0.1s;
}
.nav-item:hover { background: #f0f0f0; }
.nav-item.active { background: #e8f4fd; color: #0078d4; font-weight: 500; }
.nav-icon { width: 16px; height: 16px; display: flex; align-items: center; flex-shrink: 0; }
.main-panel { flex: 1; padding: 16px 20px; overflow-y: auto; }
.panel-hint { margin-bottom: 12px; font-size: 13px; color: #666; }

.section-title {
  font-size: 14px; font-weight: 600; color: #333; margin: 0 0 10px 0;
}
.preset-grid {
  display: grid; grid-template-columns: repeat(auto-fill, 80px);
  gap: 10px; margin-bottom: 8px;
}
.preset-card {
  display: flex; flex-direction: column; align-items: center;
  gap: 4px; padding: 10px 6px 8px;
  border: 2px solid transparent; border-radius: 6px;
  cursor: default; background: #fff;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.preset-card:hover {
  border-color: #0078d4; box-shadow: 0 1px 6px rgba(0,120,212,0.15);
}
.preset-card.active {
  border-color: #0078d4; background: #e8f4fd; box-shadow: 0 0 0 1px #0078d4;
}
.preset-thumb {
  width: 56px; height: 38px; border-radius: 4px;
  overflow: hidden; border: 1px solid #ddd;
  display: flex; align-items: center; justify-content: center;
}
.preset-thumb img { width: 100%; height: 100%; object-fit: cover; }
.preset-name { font-size: 11px; color: #555; white-space: nowrap; }
.custom-section {
  background: #fff; border: 1px solid #e0e0e0;
  border-radius: 6px; padding: 12px 14px; margin-bottom: 4px;
}
.input-row {
  display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
}
.input-row:last-child { margin-bottom: 0; }
.input-label {
  font-size: 13px; color: #555; min-width: 64px; flex-shrink: 0;
}
.text-input {
  flex: 1; min-width: 120px; padding: 6px 10px;
  border: 1px solid #d0d0d0; border-radius: 4px;
  font-size: 13px; outline: none; font-family: 'Consolas', monospace;
}
.text-input:focus { border-color: #0078d4; }
.file-btn { display: inline-flex; cursor: pointer; }
.file-btn span {
  display: inline-block; background: #f0f0f0; color: #333;
  border: 1px solid #d0d0d0; border-radius: 4px;
  padding: 6px 16px; font-size: 13px; transition: background 0.1s;
}
.file-btn span:hover { background: #e0e0e0; }
.file-hint { font-size: 12px; color: #999; }

.btn-primary {
  background: #0078d4; color: #fff; border: none;
  padding: 6px 16px; border-radius: 4px; font-size: 13px;
  cursor: pointer; white-space: nowrap;
}
.btn-primary:hover { background: #106ebe; }
.btn-danger {
  background: #d32f2f; color: #fff; border: none;
  padding: 8px 24px; border-radius: 4px; font-size: 13px;
  cursor: pointer; white-space: nowrap;
}
.btn-danger:hover { background: #c62828; }
.btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-cancel {
  background: #f0f0f0; color: #333; border: 1px solid #d0d0d0;
  padding: 6px 16px; border-radius: 4px; font-size: 13px; cursor: pointer;
}
.btn-cancel:hover { background: #e0e0e0; }

.backup-actions { display: flex; gap: 8px; margin: 12px 0; flex-wrap: wrap; }
.backup-status { font-size: 13px; color: #0078d4; margin: 8px 0; }

/* 自定义确认弹窗 */
.confirm-overlay {
  position: absolute; inset: 0; z-index: 100;
  background: rgba(0,0,0,0.3);
  display: flex; align-items: center; justify-content: center;
}
.confirm-dialog {
  background: #fff; border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  padding: 24px; min-width: 300px; max-width: 400px;
}
.confirm-title {
  font-size: 16px; font-weight: 600; color: #d32f2f; margin-bottom: 12px;
}
.confirm-body {
  font-size: 13px; color: #555; line-height: 1.6; margin-bottom: 20px;
}
.confirm-actions {
  display: flex; gap: 8px; justify-content: flex-end;
}

/* 扩展名设置 */
.ext-layout { display: flex; gap: 12px; height: calc(100% - 40px); }
.ext-sidebar {
  width: 160px; background: #fff;
  border: 1px solid #e0e0e0; border-radius: 4px;
  display: flex; flex-direction: column; flex-shrink: 0;
}
.ext-sidebar-title { padding: 10px 12px 6px; font-size: 11px; font-weight: 600; color: #666; }
.ext-app-list { flex: 1; overflow-y: auto; padding: 2px 0; }
.ext-app-item {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 12px; cursor: default; font-size: 12px; transition: background 0.1s;
}
.ext-app-item:hover { background: #f0f0f0; }
.ext-app-item.active { background: #0078d4; color: #fff; }
.ext-app-icon { width: 16px; height: 16px; display: flex; align-items: center; flex-shrink: 0; }
.ext-app-icon :deep(svg) { width: 14px; height: 14px; }
.ext-app-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ext-main { flex: 1; display: flex; flex-direction: column; }
.ext-main-title { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 12px; }
.ext-list { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
.ext-item {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 10px; background: #fff;
  border: 1px solid #e0e0e0; border-radius: 4px; font-size: 13px;
}
.ext-icon { width: 16px; height: 16px; display: flex; align-items: center; flex-shrink: 0; }
.ext-icon :deep(svg) { width: 14px; height: 14px; }
.ext-name { font-family: 'Consolas', monospace; color: #0078d4; font-weight: 500; min-width: 50px; }
.ext-arrow { color: #999; font-size: 12px; }
.ext-assoc { font-size: 12px; color: #666; flex: 1; }
.btn-remove { width: 20px; height: 20px; border: none; background: transparent; color: #e00; cursor: pointer; border-radius: 3px; font-size: 11px; display: flex; align-items: center; justify-content: center; }
.btn-remove:hover { background: #fee; }
.add-ext-row { display: flex; gap: 6px; }
.ext-input { flex: 1; padding: 6px 10px; border: 1px solid #d0d0d0; border-radius: 4px; font-size: 13px; outline: none; font-family: 'Consolas', monospace; }
.ext-input:focus { border-color: #0078d4; }
.btn-add { background: #0078d4; color: #fff; border: none; padding: 6px 16px; border-radius: 4px; font-size: 13px; cursor: pointer; }
.btn-add:hover { background: #106ebe; }
.empty-hint { font-size: 12px; color: #999; padding: 8px; }
.no-selection { display: flex; align-items: center; justify-content: center; height: 100%; font-size: 13px; color: #999; }
</style>
