<script setup>
/**
 * 文件导入工具 — Import files from local machine to web desktop
 */
import { ref, computed, onMounted } from 'vue'
import { getAllApps, getApp, launchApp } from '@/system/apps'
import { readFileAll, readFile, WebFile, WebDir, dir_str, drive_str } from '@/utils/file'
import { getConfig } from '@/system'
import { bus } from '@/App'
import Win from '@/components/window/window.vue'

const props = defineProps({
  title: { type: String, default: '文件导入工具' },
  pid: { type: Number, default: 0 },
  pwd: { type: String, default: '' },
  path: { type: String, default: '' },
  filePath: { type: String, default: '' },
  path: { type: String, default: '' },
  args: { type: String, default: '' }
})

// ── State ──
const selectedFiles = ref([])       // File[] from file picker
const destPath = ref('/C/Desktop')
const importing = ref(false)
const progress = ref({ current: 0, total: 0 })
const log = ref([])                 // { type, text }
const dirTree = ref([])             // Virtual directory tree

// ── Load directory tree ──
async function loadDirTree() {
  const dirs = await readFileAll('/')
  dirTree.value = dirs.filter(d => d.type === 'WebDir')
}

onMounted(() => { loadDirTree() })

// ── File picking ──
function pickFiles() {
  const input = document.createElement('input')
  input.type = 'file'
  input.multiple = true
  input.onchange = () => {
    if (input.files) {
      selectedFiles.value = Array.from(input.files)
      log.value.push({ type: 'info', text: 'Selected ' + selectedFiles.value.length + ' file(s)' })
    }
  }
  input.click()
}

function pickFolder() {
  const input = document.createElement('input')
  input.type = 'file'
  input.webkitdirectory = true
  input.onchange = () => {
    if (input.files) {
      selectedFiles.value = Array.from(input.files)
      log.value.push({ type: 'info', text: 'Selected ' + selectedFiles.value.length + ' file(s) from folder' })
    }
  }
  input.click()
}

// ── Import ──
async function startImport() {
  if (selectedFiles.value.length === 0 || importing.value) return
  importing.value = true
  progress.value = { current: 0, total: selectedFiles.value.length }
  log.value = []
  
  let ok = 0, err = 0
  for (const file of selectedFiles.value) {
    try {
      await importFile(file, destPath.value)
      ok++
    } catch (e) {
      err++
      log.value.push({ type: 'error', text: file.name + ': ' + e.message })
    }
    progress.value.current = ok + err
  }
  
  // refresh destination directory
  if (ok > 0) {
    const { initList } = await import('@/system')
    await initList(destPath.value)
    await initList('/')
    await loadDirTree()
    // notify desktop to refresh
    bus.emit('file-list-changed', destPath.value)
    log.value.push({ type: 'info', text: 'Refreshed: ' + destPath.value })
  }
  
  importing.value = false
  log.value.push({ type: ok > 0 ? 'success' : 'error', text: ok + ' imported, ' + err + ' failed' })
  selectedFiles.value = []
}

function importFile(file, targetPath) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const dataUrl = e.target.result
        let name = file.name
        // handle duplicate names
        const exists = await readFile(targetPath + '/' + name)
        if (exists) {
          const parts = name.split('.')
          const base = parts.length > 1 ? parts.slice(0, -1).join('.') : name
          const ext = parts.length > 1 ? '.' + parts.pop() : ''
          let c = 2
          while (await readFile(targetPath + '/' + base + '(' + c + ')' + ext)) c++
          name = base + '(' + c + ')' + ext
        }
        const wf = new WebFile(targetPath, name)
        wf.write(dataUrl)
        await wf.save()
        // refresh file listing
        const { initList } = await import('@/system')
        await initList(targetPath)
        resolve()
      } catch (e) { reject(e) }
    }
    reader.onerror = () => reject(new Error('read error'))
    reader.readAsDataURL(file)
  })
}

// ── Directory navigation ──
const expandedDirs = ref({})

function navigateToDir(dir) {
  destPath.value = dir.path
  log.value.push({ type: 'info', text: 'Destination: ' + dir.path })
}

async function toggleDir(dir) {
  const p = dir.path
  if (expandedDirs.value[p]) {
    expandedDirs.value[p] = null
    return
  }
  try {
    const children = await readFileAll(p)
    expandedDirs.value[p] = children.filter(c => c.type === 'WebDir')
  } catch (e) {
    expandedDirs.value[p] = []
  }
}

function isExpanded(dir) {
  return !!expandedDirs.value[dir.path]
}

function fmtSize(bytes) {
  if (!bytes) return ''
  const u = ['B','KB','MB','GB']
  const i = Math.min(Math.floor(Math.log(bytes)/Math.log(1024)), u.length-1)
  return (bytes/Math.pow(1024,i)).toFixed(i>0?1:0)+' '+u[i]
}
</script>

<template>
<Win :path="pwd || path" :pid="pid">
  <template #title>
    <span>📂 文件导入工具</span>
  </template>

  <div class="importer">
    <!-- Source -->
    <div class="section">
      <div class="section-title">源文件</div>
      <div class="btn-row">
        <button class="btn" @click="pickFiles">📄 选择文件</button>
        <button class="btn" @click="pickFolder">📁 选择文件夹</button>
      </div>
      <div v-if="selectedFiles.length" class="file-count">
        {{ selectedFiles.length }} 个文件已选择
        <span class="file-total-size">{{ fmtSize(selectedFiles.reduce((s,f)=>s+(f.size||0),0)) }}</span>
      </div>
    </div>

    <!-- Destination -->
    <div class="section">
      <div class="section-title">目标位置</div>
      <div class="dest-current">📂 {{ destPath }}</div>
      <div class="dir-tree">
        <div v-for="dir in dirTree" :key="dir.uid">
          <div class="dir-item"
            :class="{ active: destPath === dir.path }"
            @click="navigateToDir(dir)" @dblclick="toggleDir(dir)">
            <span class="dir-arrow" :class="{ expanded: isExpanded(dir) }" @click.stop="toggleDir(dir)">&#9654;</span>
            <span class="dir-icon" v-html="dir.icon || dir_str"></span>
            <span class="dir-name">{{ dir.nickname || dir.name }}</span>
            <span v-if="destPath === dir.path" class="dir-check">&#10003;</span>
          </div>
          <div v-if="isExpanded(dir)" class="dir-children">
            <div v-for="child in expandedDirs[dir.path]" :key="child.uid"
              class="dir-item dir-child"
              :class="{ active: destPath === child.path }"
              @click="navigateToDir(child)" @dblclick="toggleDir(child)">
              <span class="dir-arrow" :class="{ expanded: isExpanded(child) }" @click.stop="toggleDir(child)">&#9654;</span>
              <span class="dir-icon" v-html="child.icon || dir_str"></span>
              <span class="dir-name">{{ child.nickname || child.name }}</span>
              <span v-if="destPath === child.path" class="dir-check">&#10003;</span>
            </div>
            <div v-if="isExpanded(dir) && expandedDirs[dir.path] && expandedDirs[dir.path].length === 0" class="dir-empty">(empty)</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Import button -->
<!-- Import button -->
    <div class="section">
      <button class="btn btn-primary" :disabled="!selectedFiles.length || importing" @click="startImport">
        {{ importing ? '导入中 ' + progress.current + '/' + progress.total : '📥 导入' }}
      </button>
      <div v-if="importing" class="progress-bar">
        <div class="progress-fill" :style="{ width: (progress.total ? progress.current/progress.total*100 : 0) + '%' }"></div>
      </div>
    </div>

    <!-- Log -->
    <div v-if="log.length" class="log-section">
      <div class="section-title">日志</div>
      <div class="log-list">
        <div v-for="(item, i) in log" :key="i" :class="'log-item log-' + item.type">{{ item.text }}</div>
      </div>
    </div>
  </div>
</Win>
</template>

<style scoped>
.importer {
  padding: 12px 16px;
  font-size: 13px;
  color: #333;
  height: 100%;
  overflow-y: auto;
  font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
}
.section {
  margin-bottom: 16px;
}
.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.btn-row {
  display: flex;
  gap: 8px;
}
.btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border: 1px solid #d0d0d0;
  background: #f5f5f5;
  cursor: pointer;
  border-radius: 3px;
  font-size: 13px;
  font-family: inherit;
}
.btn:hover { background: #e8e8e8; border-color: #aaa; }
.btn:active { background: #ddd; }
.btn:disabled { opacity: 0.4; cursor: default; pointer-events: none; }
.btn-primary {
  background: #0078d4;
  color: #fff;
  border-color: #0078d4;
}
.btn-primary:hover { background: #1a8ae8; border-color: #1a8ae8; }
.file-count {
  margin-top: 4px;
  font-size: 12px;
  color: #666;
}
.file-total-size {
  margin-left: 8px;
  color: #999;
}
.dest-current {
  padding: 6px 10px;
  background: #f0f0f0;
  border-radius: 3px;
  margin-bottom: 6px;
  font-family: monospace;
  font-size: 12px;
}
.dir-tree {
  border: 1px solid #e0e0e0;
  border-radius: 3px;
  max-height: 140px;
  overflow-y: auto;
}
.dir-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 13px;
}
.dir-item:hover { background: #e8f0fe; }
.dir-item.active { background: #0078d4; color: #fff; }
.dir-icon { width: 18px; height: 18px; display: flex; align-items: center; }
.dir-icon svg { width: 18px; height: 18px; }
.dir-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dir-check { font-weight: bold; }
.progress-bar {
  margin-top: 6px;
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: #0078d4;
  transition: width 0.3s;
}
.log-section {
  border-top: 1px solid #e0e0e0;
  padding-top: 12px;
}
.log-list {
  max-height: 150px;
  overflow-y: auto;
  font-size: 12px;
  font-family: monospace;
}
.log-item {
  padding: 2px 4px;
}
.log-info { color: #666; }
.log-success { color: #107c10; }
.log-error { color: #d32f2f; }
.dir-arrow { font-size: 10px; color: #999; width: 14px; display: inline-block; transition: transform 0.15s; cursor: pointer; }
.dir-arrow.expanded { transform: rotate(90deg); }
.dir-children { padding-left: 20px; }
.dir-empty { padding: 4px 10px; color: #999; font-size: 12px; font-style: italic; }
.dir-child { padding-left: 16px; }
</style>
