/**

 * App auto scanner

 */

import { registerApp, getApp, getAllApps, launchApp } from './index.js'



export async function scanAndRegisterApps() {

  if (!getApp('explorer')) {

    const comp = (await import('@/apps/explorer/index.vue')).default

    registerApp('explorer', {
      hasWindow: true,

      name: '文件管理器',

      icon: '<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 8C5 6.89543 5.89543 6 7 6H19L24 12H41C42.1046 12 43 12.8954 43 14V40C43 41.1046 42.1046 42 41 42H7C5.89543 42 5 41.1046 5 40V8Z" fill="none" stroke="#333" stroke-width="4" stroke-linejoin="round"/><path d="M43 22H5" stroke="#333" stroke-width="4" stroke-linejoin="round"/><path d="M5 16V28" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M43 16V28" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>',

      component: comp,

      extensions: [''],

      windowWidth: 70,

      windowHeight: 80,

      minWidth: 400,

      minHeight: 300,

      menu: [

        { title: '打开', hander: () => launchApp('explorer', { title: '文件管理器' }) },

        { title: '新窗口打开', hander: () => launchApp('explorer', { title: '文件管理器 - 新窗口' }) },

      ]

    })

  }

  if (!getApp('notepad')) {

    const comp = (await import('@/apps/notepad/index.vue')).default

    registerApp('notepad', {
      hasWindow: true,

      name: '记事本',

      icon: '<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 8H11C10.4477 8 10 8.44772 10 9V43C10 43.5523 10.4477 44 11 44H39C39.5523 44 40 43.5523 40 43V9C40 8.44772 39.5523 8 39 8H32" stroke="#333" stroke-width="4"/><path d="M18 13V8H21.9505C21.9778 8 22 7.97784 22 7.9505V6C22 4.34315 23.3431 3 25 3C26.6569 3 28 4.34315 28 6V7.9505C28 7.97784 28.0222 8 28.0495 8H32V13C32 13.5523 31.5523 14 31 14H19C18.4477 14 18 13.5523 18 13Z" fill="none" stroke="#333" stroke-width="4"/></svg>',

      component: comp,

      extensions: ['txt'],

      windowWidth: 55,

      windowHeight: 60,

      minWidth: 300,

      minHeight: 200,

      menu: [

        { title: '打开', hander: () => launchApp('notepad', { title: '记事本' }) },

        { title: '新建文档', hander: () => launchApp('notepad', { title: '新建文本文档.txt' }) },

      ]

    })

  }

  if (!getApp('clock')) {

    registerApp('clock', {

      name: '简约时钟',

      icon: '\u{1F552}',

      url: '/apps/clock/index.html',

      windowWidth: 35,

      windowHeight: 30,

      minWidth: 250,

      minHeight: 180,

      menu: [

        { title: '打开', hander: () => launchApp('clock', { title: '简约时钟' }) },

        { title: '全屏模式', hander: () => launchApp('clock', { title: '简约时钟 - 全屏', args: 'fullscreen' }) },

      ]

    })

  }

  if (!getApp('editor')) {

    const comp = (await import('@/apps/editor/index.vue')).default

    registerApp('editor', {

      hasWindow: true,

      name: '代码编辑器',

      icon: '<svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M34 6H14C9 6 6 9 6 14V34C6 39 9 42 14 42H34C39 42 42 39 42 34V14C42 9 39 6 34 6Z" fill="none" stroke="#333" stroke-width="4"/><path d="M27 16L33 24L27 32" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 16L15 24L21 32" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>',

      component: comp,

      extensions: ['md', 'js', 'html', 'css', 'json', 'xml', 'ini', 'cfg', 'log', 'bat', 'sh', 'py', 'java', 'c', 'cpp', 'h', 'yml', 'yaml', 'toml', 'csv', 'ts', 'jsx', 'tsx', 'vue', 'php', 'rb', 'go', 'rs', 'swift', 'kt'],

      windowWidth: 70,

      windowHeight: 80,

      minWidth: 400,

      minHeight: 300,

      menu: [

        { title: '打开', hander: () => launchApp('editor', { title: '代码编辑器' }) },

        { title: '从 URL 打开', hander: () => { const url = prompt('输入文件 URL:'); if (url) launchApp('editor', { title: url, args: url }); } },

      ]

    })

  }



  const { rebuildAssociations } = await import('@/system/filetypes')

  rebuildAssociations()

  console.log('[AppScanner] scan done, ' + getAllApps().length + ' apps')

}



