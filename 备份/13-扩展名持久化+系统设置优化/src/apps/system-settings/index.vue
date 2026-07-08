<script setup>
/**
 * 系统设置 — System Settings
 */
import { ref, computed, onMounted } from 'vue'
import { getAllApps, getApp, launchApp, saveCustomApp, getCustomApps, saveExtensionsState } from '@/system/apps'
import { rebuildAssociations, getAppForExtension } from '@/system/filetypes'
import Win from '@/components/window/window.vue'
const props = defineProps({
  title: { type: String, default: '系统设置' },
  pid: { type: Number, default: 0 }
})

// ===== 左侧导航 =====
const navItems = [
  { id: 'ext', label: '扩展名设置', icon: '<svg width="16" height="16" viewBox="0 0 48 48" fill="none"><path d="M40 23V14L31 4H10C8.89543 4 8 4.89543 8 6V42C8 43.1046 8.89543 44 10 44H22" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M33 29V43" stroke="currentColor" stroke-width="4"/><path d="M26 36H40" stroke="currentColor" stroke-width="4"/></svg>' }
]
const activeNav = ref('ext')

// ===== 扩展名管理 =====
const apps = ref([])
const selectedAppId = ref('')
const newExt = ref('')
const statusMsg = ref('')

function loadData() {
  apps.value = getAllApps().filter(a => !a.hidden && a.id !== 'system-settings')
}
onMounted(loadData)

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

  // 检查是否已被其他应用关联
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
</script>

<template>
  <Win :pid="pid" :path="path">
    <template #title>系统设置</template>
    <div class="settings">
      <div v-if="statusMsg" class="status-bar">{{ statusMsg }}</div>
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
          <template v-if="activeNav === 'ext'">
            <div class="panel-hint">
              <p>选择一个应用，然后管理它能打开的扩展名类型。</p>
            </div>
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
                  <div class="ext-main-title">
                    扩展名 — {{ getApp(selectedAppId)?.name }}
                  </div>
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
                    <input v-model="newExt" placeholder="输入扩展名，如 md" class="ext-input"
                      @keydown.enter="addExtension" />
                    <button class="btn-add" @click="addExtension">添加</button>
                  </div>
                </template>
                <div v-else class="no-selection">请从左侧选择一个应用</div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </Win>
</template>

<style scoped>
.settings { height: 100%; display: flex; flex-direction: column; background: #f5f5f5; font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif; overflow: hidden; }
.status-bar { padding: 6px 16px; font-size: 13px; background: #e8f4fd; color: #0078d4; animation: fadeIn 0.2s; }
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
.settings-body { flex: 1; display: flex; overflow: hidden; }
.sidebar { width: 160px; background: #fff; border-right: 1px solid #e0e0e0; display: flex; flex-direction: column; flex-shrink: 0; }
.sidebar-title { padding: 14px 16px 8px; font-size: 11px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
.nav-list { flex: 1; padding: 4px 0; }
.nav-item { display: flex; align-items: center; gap: 8px; padding: 8px 16px; cursor: default; font-size: 13px; color: #444; transition: background 0.1s; }
.nav-item:hover { background: #f0f0f0; }
.nav-item.active { background: #e8f4fd; color: #0078d4; font-weight: 500; }
.nav-icon { width: 16px; height: 16px; display: flex; align-items: center; flex-shrink: 0; color: inherit; }
.main-panel { flex: 1; padding: 16px 20px; overflow-y: auto; }
.panel-hint { margin-bottom: 12px; font-size: 13px; color: #666; }
.ext-layout { display: flex; gap: 12px; height: calc(100% - 40px); }
.ext-sidebar { width: 160px; background: #fff; border: 1px solid #e0e0e0; border-radius: 4px; display: flex; flex-direction: column; flex-shrink: 0; }
.ext-sidebar-title { padding: 10px 12px 6px; font-size: 11px; font-weight: 600; color: #666; }
.ext-app-list { flex: 1; overflow-y: auto; padding: 2px 0; }
.ext-app-item { display: flex; align-items: center; gap: 6px; padding: 6px 12px; cursor: default; font-size: 12px; transition: background 0.1s; }
.ext-app-item:hover { background: #f0f0f0; }
.ext-app-item.active { background: #0078d4; color: #fff; }
.ext-app-icon { width: 16px; height: 16px; display: flex; align-items: center; flex-shrink: 0; }
.ext-app-icon :deep(svg) { width: 14px; height: 14px; }
.ext-app-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ext-main { flex: 1; display: flex; flex-direction: column; }
.ext-main-title { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 12px; }
.ext-list { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
.ext-item { display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: #fff; border: 1px solid #e0e0e0; border-radius: 4px; font-size: 13px; }
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
