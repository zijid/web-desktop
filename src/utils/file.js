function stringToBlobUrl(str, type) {
  const blob = new Blob([str], { type });
  return URL.createObjectURL(blob);
}

const utils = {
  uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8) }
};

// 绾?IndexedDB 灏佽锛屾棤闇€澶栭儴渚濊禆
function openIndexedDB(dbName, version, upgradeFn) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName, version);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      upgradeFn(db, e);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

let idbInstance = null;
let idbReady = (async () => {
  idbInstance = await openIndexedDB('web-desktop', 5, (db, e) => {
    if (!db.objectStoreNames.contains('files')) {
      const store = db.createObjectStore('files', { keyPath: 'path' });
      store.createIndex('_pwd', '_pwd', { unique: false });
      store.createIndex('type', 'type', { unique: false });
    }
  });
})();

function getStore(mode) {
  return idbInstance.transaction('files', mode).objectStore('files');
}

const db = {
  data: null,
  async isCreate() {
    const count = await new Promise((resolve, reject) => {
      const req = getStore('readonly').count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return count > 0;
  },
  async add(t, d, k) {
    const raw = JSON.parse(JSON.stringify(d));
    raw.path = k;
    await new Promise((resolve, reject) => {
      const req = getStore('readwrite').put(raw);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    return d;
  },
  async find(t, k) {
    const result = await new Promise((resolve, reject) => {
      const req = getStore('readonly').get(k);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
    return result;
  },
  async findIndexAll(t, idx, val) {
    const list = await new Promise((resolve, reject) => {
      const req = getStore('readonly').index(idx).getAll(val);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    return list;
  },
  async delete(t, k) {
    await new Promise((resolve, reject) => {
      const req = getStore('readwrite').delete(k);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },
  async clearAll() {
    await new Promise((resolve, reject) => {
      const req = getStore('readwrite').clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
};

export const dir_str = `<?xml version="1.0" encoding="UTF-8"?><svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 8C5 6.89543 5.89543 6 7 6H19L24 12H41C42.1046 12 43 12.8954 43 14V40C43 41.1046 42.1046 42 41 42H7C5.89543 42 5 41.1046 5 40V8Z" fill="#ffc25b" stroke="#9013fe" stroke-width="4" stroke-linejoin="round"/><path d="M43 22H5" stroke="#ffffff" stroke-width="4" stroke-linejoin="round"/><path d="M5 16V28" stroke="#9013fe" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M43 16V28" stroke="#9013fe" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export const file_str = `<?xml version="1.0" encoding="UTF-8"?><svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M40 23V14L31 4H10C8.89543 4 8 4.89543 8 6V42C8 43.1046 8.89543 44 10 44H22" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M33 29V43" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 36H33H40" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 4V14H40" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
export const txt_str = `<?xml version="1.0" encoding="UTF-8"?><svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 6C8 4.89543 8.89543 4 10 4H30L40 14V42C40 43.1046 39.1046 44 38 44H10C8.89543 44 8 43.1046 8 42V6Z" fill="#ffffff" stroke="#000000" stroke-width="4" stroke-linejoin="round"/><path d="M16 20H32" stroke="#707070" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 28H32" stroke="#707070" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
export const no_str = `<?xml version="1.0" encoding="UTF-8"?><svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 44H38C39.1046 44 40 43.1046 40 42V14H30V4H10C8.89543 4 8 4.89543 8 6V42C8 43.1046 8.89543 44 10 44Z" fill="#ffffff" stroke="#000000" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 4L40 14" stroke="#000000" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 22L30 34" stroke="#707070" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 22L18 34" stroke="#707070" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
export const my_computer="<?xml version=\"1.0\" encoding=\"UTF-8\"?><svg width=\"24\" height=\"24\" viewBox=\"0 0 48 48\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12 33H4V7H44V33H36H12Z\" fill=\"#2F88FF\" stroke=\"#333\" stroke-width=\"4\" stroke-linejoin=\"round\"/><path d=\"M16 22V26\" stroke=\"#50e3c2\" stroke-width=\"4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M24 33V39\" stroke=\"#333\" stroke-width=\"4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M24 18V26\" stroke=\"#50e3c2\" stroke-width=\"4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M32 14V26\" stroke=\"#50e3c2\" stroke-width=\"4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M12 41H36\" stroke=\"#333\" stroke-width=\"4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>"
export const drive_str = `<?xml version="1.0" encoding="UTF-8"?><svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="10" width="40" height="28" rx="3" fill="#0078d4" stroke="#005a9e" stroke-width="2"/><rect x="10" y="17" width="28" height="3" rx="1" fill="#ffffff" opacity="0.2"/><rect x="10" y="23" width="28" height="3" rx="1" fill="#ffffff" opacity="0.2"/><circle cx="37" cy="26" r="2.5" fill="#ffffff"/></svg>`;
const tableName = "web-desktop-table"

function createFileError(message) {
  const error = new Error(message);
  error.name = "FileCreateError";
  return error;
}

async function _readFile(path) {
// 棣栨杩愯鍒涘缓鍒濆鏂囦欢
  await idbReady;
  return await db.find(tableName, path);
}

async function _readAll(path) {
// 棣栨杩愯鍒涘缓鍒濆鏂囦欢
  await idbReady;
  return await db.findIndexAll(tableName, "_pwd", path);
}

async function _writeFile(path, content) {
  return await db.add(tableName, JSON.parse(JSON.stringify(content)), path);
}

async function _removeFile(path) {
// 棣栨杩愯鍒涘缓鍒濆鏂囦欢
  await idbReady;
  return await db.delete(tableName, path);
}

export function dbToFile(params, newFile) {
  if (!params) return;
  if (params.type === "WebFile") {
    const file = new WebFile(params._pwd, params._name);
    file.init(params);
    if (params.content !== undefined) file.write(params.content);
    return file;
  } else {
    const dir = new WebDir(params._pwd, params._name, params.nickname, params.system);
    dir.init(params);
    if (params.icon && !params.system) dir.setIcon(params.icon);
    return dir;
  }
}

function nameRepetitive(file, index) {
  if (index === undefined) index = 0;
  return new Promise(r => {
    readFile(file.path).then(res => {
      if (!res) {
        if (index) {
          let [name, suffix = ""] = file.name.split(".");
          if (suffix) suffix = "." + suffix;
          const names = name.split("-");
          if (names.length > 1) {
            names[names.length - 1] = index;
          } else {
            names.push(index);
          }
          file.name = names.join("-") + suffix;
        }
        file.save();
        r();
      } else {
        ++index;
        let [name, suffix = ""] = file.name.split(".");
        if (suffix) suffix = "." + suffix;
        const names = name.split("-");
        if (names.length > 1) {
          names[names.length - 1] = index;
        } else {
          names.push(index);
        }
        file.name = names.join("-") + suffix;
        nameRepetitive(file, index).then(r);
      }
    });
  });
}

class FilesystemObject {
  uid = utils.uid();
  createTime = Date.now();
  icon = "";
  init(obj) {
    this.uid = obj.uid || this.uid;
    this.createTime = obj.createTime || this.createTime;
    if (obj._appId) this._appId = obj._appId;
    if (obj.icon) this.icon = obj.icon;
  }
  setIcon(str) {
    this.icon = str;
  }
  async write(txt) {
    return this.content = txt;
  }
  async save() {
    if (this.content === undefined) {
      await this.read();
    }
    return await _writeFile(this.path, this);
  }
  async _read() {
    return await _readFile(this.path);
  }
  async _readDir() {
    return await _readAll(this.path);
  }
  async copy(path) {
    const newFile = dbToFile(this, true);
    newFile.pwd = path;
    newFile.uid = utils.uid();
    newFile.createTime = Date.now();
    function getNewName(path, name) {
      return readFile(pathJoin(path, name)).then(res => {
        if (res) {
          const newName = window.prompt("Name exists, please re-enter:", name);
          if (newName === null) return null;
          else return getNewName(path, newName);
        } else {
          return Promise.resolve(name);
        }
      });
    }
    const newName = await getNewName(path, this.name);
    if (newName != null) {
      newFile.name = newName;
      if (this.type === "WebFile") {
        return newFile.save();
      } else {
        return readFileAll(this.path).then(res => {
          const arr = [newFile.save()];
          arr.push(...res.map(file => file.copy(newFile.path)));
          return Promise.all(arr);
        });
      }
    } else {
      return Promise.resolve();
    }
  }
  shear(path) {
    if (this.type === "WebDir" && path.startsWith(this.path)) {
      return false;
    }
    const oldPath = this.path;
    return this.move(path).then(() => {
      if (this.type === "WebFile") {
        return this.save();
      }
      return readFileAll(oldPath).then(res => {
        const arr = [this.save()];
        arr.push(...res.map(file => file.shear(this.path)));
        return Promise.all(arr);
      });
    });
  }
  move(toPwd) {
    const p = _removeFile(this.path);
    this.pwd = toPwd;
    return p;
  }
  rename(name) {
    if (this.nickname) {
      this.nickname = name;
      return this.save();
    } else {
      const path = this.path;
      return _removeFile(path).then(() => {
        this.name = name;
        if (this.type === "WebFile") {
          return _writeFile(this.path, this);
        } else {
          const arr = [_writeFile(this.path, this)];
          return readFileAll(path).then(res => {
            arr.push(...res.map(file => file.shear(this.path)));
            return Promise.all(arr);
          });
        }
      });
    }
  }
  delete() {
    if (this.type === "WebFile") {
      return _removeFile(this.path);
    } else {
      const arr = [_removeFile(this.path)];
      return readFileAll(this.path).then(res => {
        arr.push(...res.map(file => file.delete()));
        return Promise.all(arr);
      });
    }
  }
}

function pathJoin(...paths) {
  let fullPath = paths.join("/");
  const pathSegments = fullPath.split("/");
  const normalizedSegments = [];
  for (let segment of pathSegments) {
    if (segment === "..") {
      normalizedSegments.pop();
    } else {
      normalizedSegments.push(segment);
    }
  }
  fullPath = normalizedSegments.join("/");
  fullPath = fullPath.replace(/\/\.\//g, "/");
  fullPath = fullPath.replace(/\/+/g, "/");
  fullPath = fullPath.replace(/:\//g, ":");
  return fullPath;
}

class WebFile extends FilesystemObject {
  extension = "";
  _name = "";
  _pwd = "";
  path = "";
  nickname = "";
  type = "WebFile";
  constructor(pwd, name, nickname) {
    if (nickname === undefined) nickname = "";
    if (!pwd || !name) {
      throw createFileError("鍒涘缓鏂囦欢澶辫触锛屾棤璺緞鎴栨枃浠跺悕:pwd:" + pwd + " name:" + name);
    }
    super();
    this.name = name;
    this.pwd = pwd;
    this.nickname = nickname;
    this.content = undefined;
  }
  init(obj) {
    super.init(obj);
    this.extension = obj.extension || this.extension;
    this.name = obj._name || obj.name || this.name;
    this._pwd = obj._pwd || this._pwd;
    this.nickname = obj.nickname || this.nickname;
  }
  async read() {
    const file = await this._read();
    this.content = file.content;
    return this.content;
  }
  set pwd(value) {
    this._pwd = value;
    this.path = pathJoin(value, this.name);
  }
  set name(value) {
    let names = value.split(".");
    let extension = "";
    if (names.length > 1) {
      extension = names[names.length - 1];
      this.extension = "." + extension;
    } else {
      this.extension = "";
    }
    this._name = value;
    this.path = pathJoin(this._pwd, value);
    switch (this.extension) {
      case ".txt":
        this.setIcon(txt_str);
        break;
      case ".png":
      case ".jpg":
      case ".jpeg":
      case ".gif":
        this.setIcon(file_str);
        break;
      default:
        this.setIcon(no_str);
    }
  }
  get pwd() { return this._pwd; }
  get name() { return this._name; }
}

class WebDir extends FilesystemObject {
  _name = "";
  _pwd = "";
  path = "";
  nickname = "";
  type = "WebDir";
  system = false;
  constructor(pwd, name, nickname, system) {
    if (system === undefined) system = false;
    if (!pwd || !name) {
      throw createFileError("鍒涘缓鏂囦欢澶瑰け璐ワ紝鏃犺矾寰勬垨鏂囦欢澶瑰悕:pwd:" + pwd + " name:" + name);
    }
    super();
    this.pwd = pwd;
    this.system = system;
    this.nickname = nickname;
    this.content = null;
    this.name = name;
  }
  init(obj) {
    super.init(obj);
    this.name = obj._name || obj.name || this.name;
    this._pwd = obj._pwd || this._pwd;
    this.nickname = obj.nickname || this.nickname;
  }
  async read() {
    const dir = await this._readDir();
    this.content = dir.map(i => dbToFile(i));
    return this.content;
  }
  set pwd(value) {
    this._pwd = value;
    this.path = pathJoin(value, this.name);
  }
  get pwd() { return this._pwd; }
  set name(value) {
    this._name = value;
    this.path = pathJoin(this._pwd, value);
    switch (this.pwd) {
      case "/system-app":
        this.setIcon(my_computer);
        break;
      default:
        this.setIcon(this.system ? drive_str : dir_str);
    }
  }
  get name() { return this._name; }
  delete(isDeep) {
    if (isDeep === undefined) isDeep = true;
    super.delete();
    if (isDeep) {
      _readAll(this.path).then(res => {
        res.forEach(i => dbToFile(i).delete());
      });
    }
  }
}

export { WebFile, WebDir };

async function testFile() {
  const initDir = [
    { pwd: "/C", name: "Desktop", nickname: "桌面" },
    { pwd: "/C", name: "Document", nickname: "文档" },
    { pwd: "/C", name: "Downloads", nickname: "下载" },
  ];
  const initFile = [];
  await db.clearAll();
  for (const i of initDir) {
    let dir = new WebDir(i.pwd, i.name, i.nickname, i.system);
    dir.setIcon(dir_str);
    await dir.save();
  }
  for (const i of initFile) {
    let file = new WebFile(i.pwd, i.name);
    let names = i.name.split(".");
    if (names.length > 1 && names[names.length - 1] === "txt") {
      file.setIcon(txt_str);
    } else {
      file.setIcon(no_str);
    }
    await file.write(i.content || "");
    await file.save();
  }
}
// 棣栨杩愯鍒涘缓鍒濆鏂囦欢
await idbReady;
const existingFiles = await db.findIndexAll(tableName, "_pwd", "/C/Desktop");
if (!existingFiles || existingFiles.length === 0) {
  await testFile();
}



export function loadSystemFile(config) {
  let fileConfig = config.file;
  return new Promise(r => {
    readFileAll("/").then(async res => {
      const dels = (res || []).map(f => _removeFile(f.path));
      await Promise.all(dels);
      fileConfig = config.file.map(i => {
        const systemDir = new WebDir(i.pwd, i.name, (i.title || i.name) + " (" + i.name + ":)", true);
        systemDir.save();
        return systemDir;
      });
      r(fileConfig);
    });
  });
}

export async function readFileAll(path) {
  let search_str = path;
  if (search_str.endsWith("/") && search_str.length > 1) {
    search_str = search_str.slice(0, -1);
  }
  const fileList = await db.findIndexAll(tableName, "_pwd", search_str);
  return fileList.map(dbToFile);
}

export async function readFile(path) {
  const dbFile = await _readFile(path);
  if (!dbFile) return null;
  return dbToFile(dbFile);
}

export async function deleteFile(path) {
  return await _removeFile(path);
}
