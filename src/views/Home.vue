<template>
  <div class="home-page">
    <header class="header">
      <h1>wave-todo</h1>
      <button class="icon-btn" @click="router.push('/setup')" title="设置">⚙</button>
    </header>

    <div class="card-list">
      <div class="card" @click="router.push('/writing')">
        <div class="card-icon">✍️</div>
        <div class="card-body">
          <div class="card-title">写作任务</div>
          <div class="card-desc">改写 / mini 图文 / 头条</div>
        </div>
        <div class="card-arrow">›</div>
      </div>

      <div class="card" @click="router.push('/publish')">
        <div class="card-icon">📤</div>
        <div class="card-body">
          <div class="card-title">发布任务</div>
          <div class="card-desc">发布已有文章到草稿箱</div>
        </div>
        <div class="card-arrow">›</div>
      </div>

      <div class="card" @click="router.push('/adhoc')">
        <div class="card-icon">🔧</div>
        <div class="card-body">
          <div class="card-title">临时任务</div>
          <div class="card-desc">手动触发日报等</div>
        </div>
        <div class="card-arrow">›</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #e8e8e8;
}

.header h1 { font-size: 20px; font-weight: 700; }

.icon-btn {
  background: none;
  border: none;
  font-size: 20px;
  padding: 4px 8px;
  color: #666;
  border-radius: 6px;
  cursor: pointer;
}
.icon-btn:hover { background: #f0f0f0; }

.card-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 500px;
  margin: 0 auto;
}

.card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: white;
  border-radius: 12px;
  padding: 18px 16px;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  transition: box-shadow 0.15s;
}
.card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.card:active { background: #f6f8fa; }

.card-icon { font-size: 28px; flex-shrink: 0; }

.card-body { flex: 1; }
.card-title { font-size: 16px; font-weight: 600; color: #1a1a1a; }
.card-desc  { font-size: 13px; color: #888; margin-top: 2px; }

.card-arrow { font-size: 20px; color: #ccc; font-weight: 300; }
</style>
