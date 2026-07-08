/**
 * desktop-fs.js — Web 桌面文件系统 API
 *
 * 专供 HTML 应用使用的虚拟文件系统接口。
 * 在 HTML 应用中通过 <script src="/desktop-fs.js"></script> 引入。
 *
 * 依赖：iframe 必须带有 allow-same-origin sandbox 属性
 *       （AppFrame 已默认开启）
 *
 * 使用示例：
 *   // 读取文件内容
 *   const file = await DesktopFS.readFile('/C/Desktop/readme.txt')
 *   console.log(file.content)
 *
 *   // 列出桌面文件
 *   const files = await DesktopFS.readDir('/C/Desktop')
 *
 *   // 写入文件
 *   await DesktopFS.writeFile('/C/Desktop/hello.txt', 'Hello World')
 *
 *   // 获取桌面传入的上下文（打开文件时的 filePath 等）
 *   const ctx = await DesktopFS.getContext()
 */
(function() {
  'use strict'

  // ============================================================
  // IndexedDB 连接（与 src/utils/file.js 共用同一个数据库）
  // ============================================================
  var DB_NAME = 'web-desktop'
  var DB_VERSION = 5
  var STORE_NAME = 'files'

  var _dbPromise = null

  function _openDB() {
    if (_dbPromise) return _dbPromise
    _dbPromise = new Promise(function(resolve, reject) {
      var req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = function(e) {
        var db = e.target.result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          var store = db.createObjectStore(STORE_NAME, { keyPath: 'path' })
          store.createIndex('_pwd', '_pwd', { unique: false })
          store.createIndex('type', 'type', { unique: false })
        }
      }
      req.onsuccess = function() { resolve(req.result) }
      req.onerror = function() { reject(req.error) }
    })
    return _dbPromise
  }

  function _getStore(mode) {
    return _openDB().then(function(db) {
      return db.transaction(STORE_NAME, mode).objectStore(STORE_NAME)
    })
  }

  function _storeOp(mode, fn) {
    return _getStore(mode).then(function(store) {
      return new Promise(function(resolve, reject) {
        var req = fn(store)
        req.onsuccess = function() { resolve(req.result) }
        req.onerror = function() { reject(req.error) }
      })
    })
  }

  // ============================================================
  // 公开 API
  // ============================================================
  var DesktopFS = {

    // ---- 读取文件 ----
    // 返回 { path, _pwd, _name, content, type, extension, ... } 或 null
    readFile: function(path) {
      return _storeOp('readonly', function(store) { return store.get(path) })
    },

    // ---- 读取文件内容（快捷方式，直接返回 content 字符串） ----
    readFileContent: function(path) {
      return DesktopFS.readFile(path).then(function(file) {
        return file ? file.content : null
      })
    },

    // ---- 列出目录内容 ----
    // 返回数组 [{ path, _pwd, _name, type, ... }, ...]
    readDir: function(dirPath) {
      return _storeOp('readonly', function(store) {
        return store.index('_pwd').getAll(dirPath)
      })
    },

    // ---- 写入文件（创建或更新） ----
    // 自动处理 path 和 _pwd 字段
    writeFile: function(path, content, extra) {
      extra = extra || {}
      // 从路径解析文件名和父目录
      var parts = path.split('/')
      var name = parts.pop()
      var pwd = parts.join('/') || '/'
      // 获取扩展名
      var ext = ''
      var nameParts = name.split('.')
      if (nameParts.length > 1) ext = '.' + nameParts[nameParts.length - 1]

      var record = {
        path: path,
        _pwd: pwd,
        _name: name,
        type: 'WebFile',
        extension: ext,
        content: content,
        createTime: extra.createTime || Date.now(),
        uid: extra.uid || Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        icon: extra.icon || ''
      }
      // 合并额外字段
      for (var k in extra) {
        if (k !== 'content' && !record.hasOwnProperty(k)) {
          record[k] = extra[k]
        }
      }
      return _storeOp('readwrite', function(store) { return store.put(record) })
    },

    // ---- 创建文件夹 ----
    createDir: function(dirPath, extra) {
      extra = extra || {}
      var parts = dirPath.split('/')
      var name = parts.pop()
      var pwd = parts.join('/') || '/'

      var record = {
        path: dirPath,
        _pwd: pwd,
        _name: name,
        type: 'WebDir',
        nickname: extra.nickname || '',
        content: null,
        createTime: extra.createTime || Date.now(),
        uid: extra.uid || Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        icon: extra.icon || '',
        system: !!extra.system
      }
      for (var k in extra) {
        if (!record.hasOwnProperty(k)) {
          record[k] = extra[k]
        }
      }
      return _storeOp('readwrite', function(store) { return store.put(record) })
    },

    // ---- 删除文件或文件夹 ----
    deleteFile: function(path) {
      return _storeOp('readwrite', function(store) { return store.delete(path) })
    },

    // ---- 检查文件/文件夹是否存在 ----
    exists: function(path) {
      return DesktopFS.readFile(path).then(function(file) { return file !== null })
    },

    // ---- 获取应用上下文 ----
    // 返回 { appId, title, pid, pwd, filePath, args }
    // 由 AppFrame 在 iframe 加载后通过 postMessage 传入
    getContext: function() {
      return new Promise(function(resolve) {
        if (window.__appContext) {
          resolve(window.__appContext)
          return
        }
        function handler(e) {
          if (e.data && e.data.type === 'app-context') {
            window.__appContext = e.data
            window.removeEventListener('message', handler)
            resolve(e.data)
          }
        }
        window.addEventListener('message', handler)
        // 通知父窗口重新发送上下文
        try { window.parent.postMessage({ type: 'app-context-request' }, '*') } catch(e) {}
        // 超时保护：1 秒后如果没有收到上下文就返回空对象
        setTimeout(function() {
          window.removeEventListener('message', handler)
          if (!window.__appContext) {
            window.__appContext = {}
            resolve({})
          }
        }, 1000)
      })
    },

    // ---- 从上下文中读取传入的文件 ----
    // 如果应用是通过双击文件打开的，这会读取该文件内容
    readOpenedFile: function() {
      return DesktopFS.getContext().then(function(ctx) {
        if (ctx.filePath) {
          return DesktopFS.readFileContent(ctx.filePath)
        }
        return null
      })
    },

    // ---- 工具函数：路径拼接 ----
    joinPath: function() {
      var parts = Array.prototype.slice.call(arguments)
      var fullPath = parts.join('/')
      var segments = fullPath.split('/')
      var result = []
      for (var i = 0; i < segments.length; i++) {
        if (segments[i] === '..') {
          result.pop()
        } else if (segments[i] !== '.' && segments[i] !== '') {
          result.push(segments[i])
        }
      }
      return '/' + result.join('/')
    }
  }

  // 暴露到全局
  window.DesktopFS = DesktopFS

  console.log('[DesktopFS] 文件系统 API 已就绪')
})()
