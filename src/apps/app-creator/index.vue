<script setup>
/**
 * 新软件制作工具 — App Creator
 * 图形化生成 + 代码编辑器 + 一键保存启动
 */
import { ref, computed, inject } from 'vue'
import { registerApp, saveCustomApp, removeCustomApp, getCustomApps, getApp, launchApp } from '@/system/apps'
import Win from '@/components/window/window.vue'
import { WebDir } from '@/utils/file'
import { fileList } from '@/hooks'
import { getConfig } from '@/system'

const props = defineProps({
  title: { type: String, default: '新软件制作工具' },
  pid: { type: Number, default: 0 },
  path: { type: String, default: '' }
})

// ===== 表单数据 =====
const appId = ref('myapp')
const appName = ref('我的应用')
const appType = ref('html')
const icon = ref('📦')
const iconType = ref('emoji')
const customIcon = ref('')
const windowWidth = ref(55)
const windowHeight = ref(65)
const minWidth = ref(300)
const minHeight = ref(200)
const extensions = ref('')

// ===== 编辑器 =====
const activeTab = ref('form')
const codeContent = ref('')
const scannerCode = ref('')

// ===== 已保存的应用列表 =====
const savedApps = ref([])

function loadSavedApps() {
  savedApps.value = Object.values(getCustomApps())
}
loadSavedApps()

const finalIcon = computed(() => {
  if (iconType.value === 'svg') return customIcon.value
  return icon.value
})

// ===== 生成代码 =====
function generate() {
  const id = appId.value.trim()
  const name = appName.value.trim()
  if (!id || !name) { alert('请填写应用ID和名称'); return }

  const extArr = extensions.value.split(/[,，]/).map(s => s.trim()).filter(Boolean)
  const extStr = extArr.length ? extArr.map(e => `'${e}'`).join(', ') : ''

  if (appType.value === 'html') {
    generateHtmlApp(id, name, extArr, extStr)
  } else {
    generateVueApp(id, name, extArr, extStr)
  }
  activeTab.value = 'editor'
}

function generateHtmlApp(id, name, extArr, extStr) {
  const iconStr = finalIcon.value
  const html = `<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>${name}</title>\n  <style>\n    * { margin: 0; padding: 0; box-sizing: border-box; }\n    body {\n      font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;\n      padding: 24px;\n      color: #333;\n      background: #f9f9f9;\n    }\n    h1 { color: #0078d4; }\n  </style>\n</head>\n<body>\n  <h1>${name}</h1>\n  <p>请编辑此 HTML 来构建你的应用。</p>\n  <div id="app"></div>\n</body>\n</html>`

  codeContent.value = html
  scannerCode.value = `  if (!getApp('${id}')) {\n    registerApp('${id}', {\n      name: '${name}',\n      icon: '${iconStr}',\n      url: '/apps/${id}/index.html',\n      windowWidth: ${windowWidth.value},\n      windowHeight: ${windowHeight.value},\n      minWidth: ${minWidth.value},\n      minHeight: ${minHeight.value}\n    })\n  }`
}

function generateVueApp(id, name, extArr, extStr) {
  const iconStr = finalIcon.value
  const vue = `<!-- ${id}/index.vue -->\n<script setup>\n/**\n * ${name}\n */\nimport { ref, inject } from 'vue'\n\nconst appContext = inject('appContext', {})\nconsole.log('${name} 已启动', appContext)\n\nconst count = ref(0)\n<\/script>\n\n<template>
  <Win :pid="pid" :path="path">
    <template #title>新软件制作工具</template>\n  <div class="${id}-app">\n    <h2>${name}</h2>\n    <p>应用 ID: ${id}</p>\n    <button class="btn" @click="count++">\n      点击了 {{ count }} 次\n    </button>\n  </div>\n</template>\n\n<style scoped>\n.${id}-app {\n  padding: 24px;\n  font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;\n}\nh2 { color: #0078d4; }\n.btn {\n  background: #0078d4; color: #fff; border: none;\n  padding: 8px 20px; border-radius: 4px; cursor: pointer;\n  margin-top: 12px;\n}\n.btn:hover { background: #106ebe; }\n</style>`

  codeContent.value = vue
  const hw = ''
  scannerCode.value = `  if (!getApp('${id}')) {\n    const comp = (await import('@/apps/${id}/index.vue')).default\n    registerApp('${id}', {\n      name: '${name}',\n      icon: '${iconStr}',\n      component: comp,${hw}\n      windowWidth: ${windowWidth.value},\n      windowHeight: ${windowHeight.value},\n      minWidth: ${minWidth.value},\n      minHeight: ${minHeight.value}\n    })\n  }`
}

// ===== 保存并启动 =====
async function doSave() {
  const id = appId.value.trim()
  const name = appName.value.trim()
  const iconStr = finalIcon.value

  // 生成 blob URL 并注册到系统
  const blob = new Blob([codeContent.value], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  // 如果已存在先移除（编辑/更新场景）
  if (getApp(id)) {
    try {
      const existing = getApp(id)
      if (existing.url && existing.url.startsWith('blob:')) {
        URL.revokeObjectURL(existing.url)
      }
    } catch(e) {}
    removeCustomApp(id)
  }
  registerApp(id, {
    name,
    icon: iconStr,
    url,
    windowWidth: windowWidth.value,
    windowHeight: windowHeight.value,
    minWidth: minWidth.value,
    minHeight: minHeight.value,
    extensions: extensions.value.split(/[,，]/).map(s => s.trim()).filter(Boolean),
    _customHtml: codeContent.value
  })

  // 创建桌面快捷方式（存到虚拟文件系统 IndexedDB）
  const desktopPath = getConfig().desktop.path
  const shortcut = new WebDir(desktopPath, id)
  shortcut.uid = id
  shortcut.nickname = name
  shortcut.icon = iconStr
  shortcut._appId = id
  await shortcut.save()
  // 通知桌面刷新文件列表
  const { initList } = await import('@/system')
  await initList(desktopPath)

  // 保存到 localStorage（持久化）
  saveCustomApp(id, {
    name,
    icon: iconStr,
    html: codeContent.value,
    windowWidth: windowWidth.value,
    windowHeight: windowHeight.value,
    minWidth: minWidth.value,
    minHeight: minHeight.value,
    extensions: extensions.value.split(/[,，]/).map(s => s.trim()).filter(Boolean),
    menu: [{ title: '打开', hander: () => launchApp(id, { title: name }) }]
  })

  // 重建文件类型关联
  const { rebuildAssociations } = await import('@/system/filetypes')
  rebuildAssociations()

  loadSavedApps()
}

async function handleSaveOnly() {
  if (appType.value !== 'html') {
    alert('目前仅支持 HTML 类型应用的即时保存。')
    return
  }
  if (!codeContent.value.trim()) {
    alert('请先生成代码')
    return
  }
  // 检查重复应用
  if ((getApp(appId.value.trim()) || getSavedAppById(appId.value.trim())) && !confirm('应用 ' + appId.value.trim() + ' 已存在，确定覆盖吗？')) return
  await doSave()
  statusMsg.value = `✅ 已保存`
  statusType.value = 'success'
  setTimeout(() => statusMsg.value = '', 2000)
}

async function handleSaveAndLaunch() {
  if (appType.value !== 'html') {
    alert('目前仅支持 HTML 类型应用的即时保存和启动。')
    return
  }
  if (!codeContent.value.trim()) {
    alert('请先生成代码')
    return
  }
  const id = appId.value.trim()
  const name = appName.value.trim()

  // 检查重复应用
  if ((getApp(id) || getSavedAppById(id)) && !confirm('应用 ' + id + ' 已存在，确定覆盖吗？')) return

  // 保存
  await doSave()

  statusMsg.value = `✅ 已保存！正在启动...`
  statusType.value = 'success'

  // 启动
  setTimeout(() => {
    launchApp(id, { title: name })
    statusMsg.value = ''
  }, 500)
}

// ===== 删除已保存的应用 =====
async function handleDelete(id) {
  if (!confirm(`确定删除应用 "${id}" 吗？`)) return
  removeCustomApp(id)
  try {
    const { initList } = await import('@/system')
    const dp = getConfig().desktop.path
    const { readFile } = await import('@/utils/file')
    const shortcut = await readFile(dp + '/' + id)
    if (shortcut) { await shortcut.delete(); await initList(dp) }
  } catch(e) { console.warn('清除桌面快捷方式失败', e) }
  loadSavedApps()
  statusMsg.value = `已删除 "${id}"`
  statusType.value = 'info'
  setTimeout(() => statusMsg.value = '', 2000)
}
function getSavedAppById(id) {
  const apps = getCustomApps()
  return apps[id] || null
}

// ===== 编辑已保存的应用 =====
function editSavedApp(id) {
  const apps = getCustomApps()
  const app = apps[id]
  if (!app) return

  appId.value = app.id
  appName.value = app.name
  icon.value = app.icon
  windowWidth.value = app.windowWidth
  windowHeight.value = app.windowHeight
  minWidth.value = app.minWidth
  minHeight.value = app.minHeight


  extensions.value = (app.extensions || []).join(', ')
  appType.value = 'html'

  // 从注册表和 localStorage 移除，等保存时重新注册
  removeCustomApp(id)
  codeContent.value = app.html
  activeTab.value = 'editor'
}

// ===== 状态消息 =====
const statusMsg = ref('')
const statusType = ref('')

// ===== 复制 =====
function copyText(text) {
  navigator.clipboard.writeText(text).catch(() => {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  })
}

const copied = ref('')
function copyWithFeedback(text, label) {
  copyText(text)
  copied.value = label
  setTimeout(() => copied.value = '', 1500)
}
</script>

<template>
  <Win :pid="pid" :path="path">
    <template #title>新软件制作工具</template>
  <div class="creator">
    <div v-if="statusMsg" class="status-bar" :class="statusType">
      {{ statusMsg }}
    </div>

    <div class="top-bar">
      <div class="tabs">
        <button :class="{ active: activeTab === 'form' }" @click="activeTab = 'form'">
          <svg width="16" height="16" viewBox="0 0 48 48" fill="none">
            <path d="M38 4H10C7 4 6 5 6 8v6h36V8c0-3-1-4-4-4z" fill="none" stroke="currentColor" stroke-width="4"/>
            <path d="M6 14v26c0 3 1 4 4 4h28c3 0 4-1 4-4V14H6z" fill="none" stroke="currentColor" stroke-width="4"/>
          </svg>
          应用定义
        </button>
        <button :class="{ active: activeTab === 'editor' }" @click="activeTab = 'editor'" :disabled="!codeContent">
          <svg width="16" height="16" viewBox="0 0 48 48" fill="none">
            <path d="M34 6H14C9 6 6 9 6 14V34C6 39 9 42 14 42H34C39 42 42 39 42 34V14C42 9 39 6 34 6Z" fill="none" stroke="currentColor" stroke-width="4"/>
            <path d="M27 16L33 24L27 32" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M21 16L15 24L21 32" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
          </svg>
          代码编辑器
        </button>
        <button :class="{ active: activeTab === 'saved' }" @click="activeTab = 'saved'; loadSavedApps()">
          <svg width="16" height="16" viewBox="0 0 48 48" fill="none">
            <path d="M24 44C35 44 44 35 44 24S35 4 24 4 4 13 4 24s9 20 20 20z" fill="none" stroke="currentColor" stroke-width="4"/>
            <path d="M24 16v12" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
            <circle cx="24" cy="32" r="2" fill="currentColor"/>
          </svg>
          已保存的应用
        </button>
      </div>
    </div>

    <!-- Tab: 表单 -->
    <div v-show="activeTab === 'form'" class="tab-content form-tab">
      <div class="form-grid">
        <div class="field">
          <label>应用 ID <span class="hint">（唯一标识，如 mytool）</span></label>
          <input v-model="appId" placeholder="myapp" />
        </div>
        <div class="field">
          <label>应用名称 <span class="hint">（显示在桌面和菜单）</span></label>
          <input v-model="appName" placeholder="我的应用" />
        </div>
        <div class="field">
          <label>应用类型</label>
          <div class="radio-group">
            <label class="radio-label" :class="{ active: appType === 'html' }">
              <input type="radio" v-model="appType" value="html" /> HTML（可即时预览）
            </label>
            <label class="radio-label" :class="{ active: appType === 'vue' }">
              <input type="radio" v-model="appType" value="vue" /> Vue 组件
            </label>
          </div>
        </div>
        <div class="field">
          <label>图标</label>
          <div class="icon-row">
            <select v-model="iconType" class="icon-select">
              <option value="emoji">Emoji</option>
              <option value="svg">SVG</option>
            </select>
            <input v-if="iconType === 'emoji'" v-model="icon" placeholder="📦" class="icon-input" />
            <textarea v-else v-model="customIcon" placeholder="粘贴 SVG 代码..." rows="2" class="icon-svg"></textarea>
          </div>
        </div>
        <div class="field-row">
          <div class="field"><label>宽 (%)</label><input v-model.number="windowWidth" type="number" min="20" max="100" /></div>
          <div class="field"><label>高 (%)</label><input v-model.number="windowHeight" type="number" min="20" max="100" /></div>
          <div class="field"><label>最小宽(px)</label><input v-model.number="minWidth" type="number" min="200" /></div>
          <div class="field"><label>最小高(px)</label><input v-model.number="minHeight" type="number" min="150" /></div>
        </div>
        <div class="field">
          <label>扩展名关联 <span class="hint">逗号分隔，如 txt,md</span></label>
          <input v-model="extensions" placeholder="txt, md" />
        </div>

      </div>
      <div class="actions">
        <button class="btn-primary" @click="generate">生成代码 → 进入编辑器</button>
      </div>
    </div>

    <!-- Tab: 代码编辑器 -->
    <div v-show="activeTab === 'editor'" class="tab-content editor-tab">
      <div class="editor-toolbar">
        <span class="file-label">{{ appType === 'html' ? 'index.html' : 'index.vue' }}</span>
        <div class="editor-actions">
          <button class="btn-sm" @click="copyWithFeedback(codeContent, 'code')">
            {{ copied === 'code' ? '已复制 ✓' : '复制代码' }}
          </button>
          <button class="btn-sm" @click="handleSaveOnly" v-if="appType === 'html'">保存</button>
          <button class="btn-sm btn-preview" @click="handleSaveAndLaunch" v-if="appType === 'html'">
            <svg width="14" height="14" viewBox="0 0 48 48" fill="none">
              <path d="M24 44c11 0 20-9 20-20S35 4 24 4 4 13 4 24s9 20 20 20z" fill="none" stroke="currentColor" stroke-width="4"/>
              <path d="M20 16l12 8-12 8V16z" fill="currentColor"/>
            </svg>
            保存并启动
          </button>
        </div>
      </div>
      <div class="editor-wrap">
        <div class="line-numbers">
          <div v-for="n in codeContent.split('\n').length" :key="n" class="ln">{{ n }}</div>
        </div>
        <textarea v-model="codeContent" class="code-input" spellcheck="false" wrap="off"></textarea>
      </div>
    </div>

    <!-- Tab: 已保存的应用 -->
    <div v-show="activeTab === 'saved'" class="tab-content saved-tab">
      <div v-if="savedApps.length === 0" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <path d="M24 44c11 0 20-9 20-20S35 4 24 4 4 13 4 24s9 20 20 20z" fill="none" stroke="#ccc" stroke-width="4"/>
          <path d="M24 16v12" stroke="#ccc" stroke-width="4" stroke-linecap="round"/>
          <circle cx="24" cy="32" r="2" fill="#ccc"/>
        </svg>
        <p>还没有已保存的应用</p>
        <p class="hint">先在"应用定义"中填写信息，生成代码后保存即可</p>
      </div>
      <div v-else class="app-list">
        <div v-for="app in savedApps" :key="app.id" class="app-card">
          <div class="card-icon">{{ app.icon }}</div>
          <div class="card-body">
            <div class="card-name">{{ app.name }}</div>
            <div class="card-id">{{ app.id }}</div>
          </div>
          <div class="card-actions">
            <button class="btn-icon" title="启动" @click="launchApp(app.id, { title: app.name })">
              <svg width="16" height="16" viewBox="0 0 48 48" fill="none">
                <path d="M20 16l12 8-12 8V16z" fill="#0078d4"/>
              </svg>
            </button>
            <button class="btn-icon" title="编辑" @click="editSavedApp(app.id)">
              <svg width="16" height="16" viewBox="0 0 48 48" fill="none">
                <path d="M40 33l2 2-5 5-2-2" fill="none" stroke="#666" stroke-width="4" stroke-linecap="round"/>
                <path d="M30 6H10C8 6 6 8 6 10v28c0 2 2 4 4 4h12" fill="none" stroke="#666" stroke-width="4"/>
                <path d="M22 26l12-12 4 4-12 12-4-4z" fill="none" stroke="#666" stroke-width="4"/>
              </svg>
            </button>
            <button class="btn-icon" title="删除" @click="handleDelete(app.id)">
              <svg width="16" height="16" viewBox="0 0 48 48" fill="none">
                <path d="M12 38l-2-26h28l-2 26H12z" fill="none" stroke="#e00" stroke-width="4"/>
                <path d="M20 30V18" stroke="#e00" stroke-width="4" stroke-linecap="round"/>
                <path d="M28 30V18" stroke="#e00" stroke-width="4" stroke-linecap="round"/>
                <path d="M8 12h32" stroke="#e00" stroke-width="4" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  </Win>
</template>

<style scoped>
.creator {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
  overflow: hidden;
}
.status-bar {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  animation: fadeIn 0.2s;
}
.status-bar.success { background: #dff6dd; color: #0e6b0e; }
.status-bar.info { background: #e8f4fd; color: #0078d4; }
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

.top-bar {
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  padding: 0 12px;
  flex-shrink: 0;
}
.tabs { display: flex; gap: 2px; }
.tabs button {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 16px; border: none; background: transparent;
  font-size: 13px; color: #666; cursor: pointer;
  border-bottom: 2px solid transparent; transition: all 0.15s;
}
.tabs button:hover { color: #333; background: #f0f0f0; }
.tabs button.active { color: #0078d4; border-bottom-color: #0078d4; background: #e8f4fd; }
.tabs button:disabled { opacity: 0.4; cursor: default; }

.tab-content { flex: 1; overflow-y: auto; padding: 20px 24px; }

.form-grid { max-width: 600px; display: flex; flex-direction: column; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 4px; }
.field label { font-size: 13px; font-weight: 500; color: #444; }
.hint { font-weight: 400; color: #999; font-size: 12px; }
.field input[type="text"], .field input[type="number"], .field select, .field textarea {
  padding: 8px 12px; border: 1px solid #d0d0d0; border-radius: 4px;
  font-size: 14px; font-family: inherit; background: #fff;
  outline: none; transition: border-color 0.15s;
}
.field input:focus, .field select:focus, .field textarea:focus { border-color: #0078d4; }
.field textarea { resize: vertical; font-family: 'Consolas', monospace; font-size: 13px; }
.field-row { display: flex; gap: 12px; }
.field-row .field { flex: 1; }
.radio-group { display: flex; gap: 8px; }
.radio-label {
  flex: 1; display: flex; align-items: center; gap: 6px;
  padding: 8px 14px; border: 1px solid #d0d0d0; border-radius: 4px;
  cursor: pointer; font-size: 13px; transition: all 0.15s;
}
.radio-label.active { border-color: #0078d4; background: #e8f4fd; color: #0078d4; }
.radio-label input { display: none; }
.icon-row { display: flex; gap: 8px; align-items: stretch; }
.icon-select { width: 90px; flex-shrink: 0; }
.icon-input, .icon-svg { flex: 1; }
.checkbox-group { gap: 8px; }
.checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; }
.checkbox-label input { width: 16px; height: 16px; accent-color: #0078d4; }
.actions { margin-top: 16px; }
.btn-primary {
  background: #0078d4; color: #fff; border: none;
  padding: 10px 32px; border-radius: 4px;
  font-size: 15px; font-weight: 500; cursor: pointer;
  transition: background 0.15s;
}
.btn-primary:hover { background: #106ebe; }

.editor-toolbar {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;
}
.file-label { font-size: 13px; color: #0078d4; font-weight: 500; font-family: 'Consolas', monospace; }
.editor-actions { display: flex; gap: 8px; }
.btn-sm {
  background: #f0f0f0; color: #333; border: 1px solid #d0d0d0;
  padding: 5px 14px; border-radius: 3px; font-size: 12px; cursor: pointer;
  display: flex; align-items: center; gap: 4px; transition: all 0.15s;
}
.btn-sm:hover { background: #e0e0e0; }
.btn-preview { background: #0078d4; color: #fff; border-color: #0078d4; }
.btn-preview:hover { background: #106ebe; }

.editor-wrap {
  display: flex; border: 1px solid #d0d0d0; border-radius: 4px;
  overflow: hidden; height: calc(100% - 40px);
}
.line-numbers {
  background: #f0f0f0; padding: 12px 8px; text-align: right;
  color: #999; font-size: 12px; font-family: 'Consolas', monospace;
  line-height: 1.5; user-select: none; min-width: 36px; overflow: hidden;
}
.ln { line-height: 1.5; }
.code-input {
  flex: 1; padding: 12px 16px; border: none; outline: none; resize: none;
  font-family: 'Consolas', 'Cascadia Code', monospace;
  font-size: 13px; line-height: 1.5; background: #1e1e1e; color: #d4d4d4; tab-size: 2;
}

.empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 60px 20px; color: #999;
}
.empty-state p { margin: 8px 0 0; font-size: 14px; }
.empty-state .hint { font-size: 12px; color: #bbb; }

.app-list { display: flex; flex-direction: column; gap: 8px; max-width: 500px; }
.app-card {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px; background: #fff;
  border: 1px solid #e0e0e0; border-radius: 6px; transition: box-shadow 0.15s;
}
.app-card:hover { box-shadow: 0 1px 4px rgba(0,0,0,.08); }
.card-icon { font-size: 24px; width: 36px; text-align: center; }
.card-body { flex: 1; }
.card-name { font-size: 14px; font-weight: 500; color: #333; }
.card-id { font-size: 12px; color: #999; font-family: 'Consolas', monospace; }
.card-actions { display: flex; gap: 4px; }
.btn-icon {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border: none; background: transparent; cursor: pointer;
  border-radius: 4px; transition: background 0.15s;
}
.btn-icon:hover { background: #f0f0f0; }
</style>
