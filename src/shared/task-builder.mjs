// Shared by Wave Console and wave-todo. Rules come from task_catalog.json.
export function buildTask(catalog, kind, values, requestId, created = new Date().toISOString(), source = 'wave-todo') {
  const spec = typeof kind === 'string' && Object.hasOwn(catalog.kinds,kind) ? catalog.kinds[kind] : null;
  if (!spec || !values || typeof values !== 'object' || Array.isArray(values)) throw Error('任务类型或字段无效');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(requestId)) throw Error('请求编号无效');
  if (Object.keys(values).some(key => !spec.fields.some(f => f.name === key))) throw Error('包含不支持的任务字段');
  const fields = {...spec.defaults};
  let taskType = spec.task_type;
  for (const f of spec.fields.filter(f => f.type === 'select')) {
    const choice = f.options.find(o => o.value === values[f.name]);
    if (!choice) throw Error(`请选择有效的${f.label}`);
    if (f.output) fields[f.output] = choice.value;
    Object.assign(fields, choice.fields || {});
    taskType = choice.task_type || taskType;
  }
  for (const f of spec.fields.filter(f => f.type !== 'select')) {
    let value = values[f.name] ?? f.default ?? '';
    if (Object.hasOwn(values, f.name) && values[f.name] === null) throw Error('字段不能为 null');
    if (f.type === 'boolean') {
      if (typeof value !== 'boolean') throw Error('开关值必须是布尔值');
      if (f.invert) value = !value;
    } else {
      if (typeof value !== 'string') throw Error('文本字段格式错误');
      value = value.trim();
      if (!value) continue;
      if ([...value].length > f.max_length || value.includes('\0')) throw Error('文本过长或包含无效字符');
      if (f.pattern && !new RegExp(f.pattern).test(value)) throw Error(`${f.label}格式错误`);
    }
    if (f.task_types && !f.task_types.includes(taskType)) throw Error(`此系列不支持${f.label}`);
    if (f.name === 'source' || (kind === 'publish' && f.name === 'series')) {
      if (f.name === 'series' && /^[\/~]/.test(value)) throw Error('系列目录必须相对于草稿目录');
      if (/[\\\r\n]/.test(value) || value.split('/').includes('..')) throw Error('路径不能包含上级目录或换行');
      if (f.name === 'source' && !value.toLowerCase().endsWith('.md')) throw Error('文章路径必须以 .md 结尾');
    }
    fields[f.output] = value;
  }
  const fingerprint = JSON.stringify({kind, task_type:taskType, fields});
  const filename = `web-${requestId}.${taskType}.md`;
  const metadata = {...fields, created, submission_id:requestId, submission_source:source};
  const content = '---\n' + Object.entries(metadata).map(([key,value]) => `${key}: ${JSON.stringify(value)}`).join('\n') + '\n---\n';
  return {filename, content, receipt:{request_id:requestId, filename, fingerprint, created}};
}

// request(method, path, body) returns parsed JSON; errors carry HTTP status.
export async function submitGitHub(request, repo, task, branch = 'main') {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo) || !/^[\w.-]+$/.test(branch)) throw Error('队列仓库配置无效');
  const base = `/repos/${repo}`;
  async function lookup() {
    let remote;
    try { remote = await request('GET', `${base}/contents/submissions/${task.receipt.request_id}.json?ref=${branch}`); }
    catch (error) { if (error.status === 404) return null; throw error; }
    const bytes = Uint8Array.from(atob(remote.content.replace(/\s/g,'')), c => c.charCodeAt(0));
    const existing = JSON.parse(new TextDecoder().decode(bytes));
    if (existing.fingerprint !== task.receipt.fingerprint || existing.filename !== task.filename) throw Error('此请求编号已用于不同内容，请新建任务');
    return existing;
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    let existing = await lookup();
    if (existing) return existing;
    const head = (await request('GET', `${base}/git/ref/heads/${branch}`)).object.sha;
    existing = await lookup();
    if (existing) return existing;
    const payload = JSON.parse(task.receipt.fingerprint);
    const seriesKey = payload.task_type === 'article-long' ? payload.fields.source_lib
      : payload.task_type === 'article-mini' ? ({'起源':'once_qiyuan','一事一悟':'once_yishiyiwu','小知识':'once_zhishi'})[payload.fields.series] : null;
    if (seriesKey) {
      let remote;
      try { remote = await request('GET', `${base}/contents/state/series/${encodeURIComponent(seriesKey)}.yaml?ref=${branch}`); }
      catch (e) { if (e.status !== 404) throw e; }
      if (remote) {
        const state = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(remote.content.replace(/\s/g,'')), c => c.charCodeAt(0))));
        if (state.lifecycle !== 'active') throw Error('该系列已暂停、完结或归档，不能创建新写作任务');
      }
    }
    const baseTree = (await request('GET', `${base}/git/commits/${head}`)).tree.sha;
    const tree = (await request('POST', `${base}/git/trees`, {base_tree:baseTree, tree:[
      {path:`pending/${task.filename}`, mode:'100644', type:'blob', content:task.content},
      {path:`submissions/${task.receipt.request_id}.json`, mode:'100644', type:'blob', content:JSON.stringify(task.receipt)+'\n'}
    ]})).sha;
    const commit = (await request('POST', `${base}/git/commits`, {message:`task(web): ${task.filename}`, tree, parents:[head]})).sha;
    try {
      await request('PATCH', `${base}/git/refs/heads/${branch}`, {sha:commit, force:false});
      return task.receipt;
    } catch (error) {
      existing = await lookup();
      if (existing) return existing;
      if (![409,422].includes(error.status) || attempt === 2) throw error;
    }
  }
}

export function newRequestId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = [...bytes].map(x => x.toString(16).padStart(2,'0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
