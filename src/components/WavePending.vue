<template>
  <section v-if="pending" class="pending-submission">
    <strong>待确认任务</strong>
    <p>{{ pending.task.filename }}</p>
    <p>网络异常可能发生在提交成功之后。请用原请求重试，避免重复执行。</p>
    <details><summary>查看原始任务</summary><pre>{{ pending.task.content }}</pre></details>
    <button :disabled="busy" @click="retry">{{ busy ? '核对中…' : '重试原提交' }}</button>
    <button :disabled="busy" @click="discard">已核查，清除此提示</button>
    <p role="status">{{ status }}</p>
  </section>
</template>
<script setup>
import {ref,onMounted,onUnmounted} from 'vue'
import {useStorage} from '../composables/useStorage.js'
import {useGitHub} from '../composables/useGitHub.js'
const pending=ref(null),busy=ref(false),status=ref('')
function load(){try{pending.value=JSON.parse(sessionStorage.getItem('wavetodo_pending_submission'))}catch{status.value='提交记录无法读取，请先核查队列。'}}
async function retry(){
  busy.value=true
  try{
    const [owner,repo]=pending.value.repo.split('/')
    await useGitHub(useStorage().getToken()).queueTask(owner,repo,pending.value.task)
    status.value='已确认提交远端队列'
    load()
  }catch(error){status.value=error.message}
  finally{busy.value=false}
}
function discard(){
  if(!confirm('请先确认远端任务是否存在。清除此提示不会撤销已提交任务，之后再次提交可能重复执行。'))return
  sessionStorage.removeItem('wavetodo_pending_submission');load()
}
onMounted(()=>{load();window.addEventListener('wave-pending-changed',load)})
onUnmounted(()=>window.removeEventListener('wave-pending-changed',load))
</script>
<style scoped>
.pending-submission{max-width:640px;margin:16px auto;padding:16px;border:1px solid #e5c88a;border-radius:12px;background:#fff9eb;color:#655130;font-size:13px;overflow-wrap:anywhere}.pending-submission button{padding:8px 12px;margin:6px;border:1px solid #d7c9a9;border-radius:6px;background:white}.pending-submission pre{white-space:pre-wrap}
</style>
