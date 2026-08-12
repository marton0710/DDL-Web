<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NIcon } from 'naive-ui'
import {
  AlarmOutline,
  CheckmarkDoneOutline,
  ClipboardOutline,
  InformationCircleOutline,
  RefreshOutline,
  ShieldCheckmarkOutline,
} from '@vicons/ionicons5'
import MainHeader from '../components/MainHeader.vue'
import PrivacyNoticeModal from '../components/PrivacyNoticeModal.vue'

const router = useRouter()
const privacyVisible = ref(false)
</script>

<template>
  <div class="about-page">
    <MainHeader />

    <main class="about-main">
      <div class="page-shell">
        <section class="about-hero">
          <div>
            <h1>关于聚合截止线</h1>
            <h2>让每一个截止时间，都清晰可见</h2>
            <p>聚合截止线用于整合多个学习平台的作业与截止时间，帮助学生集中查看、及时安排。</p>
          </div>
          <img src="/assets/illustrations/deadline-calendar.png" alt="日历与截止时间插画" />
        </section>

        <section class="feature-section">
          <h2 class="section-title">我们能做什么</h2>
          <div class="feature-grid">
            <article class="surface-card feature-card">
              <span class="icon-circle feature-icon blue"><NIcon :size="30"><ClipboardOutline /></NIcon></span>
              <div><h3>聚合作业</h3><p>集中展示学在重邮、学习通和雨课堂的作业任务。</p></div>
            </article>
            <article class="surface-card feature-card">
              <span class="icon-circle feature-icon orange"><NIcon :size="30"><AlarmOutline /></NIcon></span>
              <div><h3>截止提醒</h3><p>按剩余时间清晰标记临期与逾期任务。</p></div>
            </article>
            <article class="surface-card feature-card">
              <span class="icon-circle feature-icon teal"><NIcon :size="30"><RefreshOutline /></NIcon></span>
              <div><h3>同步扩展</h3><p>支持 QQ 提醒与 Meet 课程表同步。</p></div>
            </article>
          </div>
        </section>

        <section class="privacy-section">
          <h2 class="section-title">数据与隐私</h2>
          <button class="surface-card privacy-entry" type="button" @click="privacyVisible = true">
            <span class="privacy-entry-icon"><NIcon :size="27"><ShieldCheckmarkOutline /></NIcon></span>
            <span><strong>查看隐私说明</strong><small>了解系统处理的信息、使用目的、保存方式和您的控制选项。</small></span>
            <em>查看详情</em>
          </button>
        </section>

        <section class="surface-card project-card">
          <div class="version"><NIcon :size="27"><InformationCircleOutline /></NIcon><strong>网页版本</strong><span>v1.0.0</span></div>
          <div class="project-actions">
            <NButton size="large" type="primary" ghost @click="router.push('/home')">
              <template #icon><NIcon><ClipboardOutline /></NIcon></template>
              查看作业
            </NButton>
            <NButton
              tag="a"
              href="https://github.com/marton0710/CQUPTDDL/issues"
              target="_blank"
              rel="noopener noreferrer"
              size="large"
              type="primary"
            >
              <template #icon><NIcon><ShieldCheckmarkOutline /></NIcon></template>
              如有建议，欢迎反馈给我们
            </NButton>
          </div>
          <!-- <p><NIcon><CheckmarkDoneOutline /></NIcon>我们希望减少遗漏，让学习安排更从容。</p> -->
        </section>
      </div>
    </main>

    <PrivacyNoticeModal v-model:show="privacyVisible" />
  </div>
</template>

<style scoped>
.about-main {
  min-height: calc(100vh - 64px);
  padding: 0 0 48px;
  background: transparent;
}

.about-main .page-shell {
  width: min(1180px, calc(100% - 48px));
}

.about-hero {
  min-height: 290px;
  display: grid;
  grid-template-columns: 1.08fr 0.92fr;
  align-items: center;
  gap: 30px;
  padding: 38px 42px 20px;
}

.about-hero h1 {
  margin: 0;
  font-size: clamp(36px, 4vw, 48px);
  line-height: 1.2;
  letter-spacing: -1.2px;
}

.about-hero h2 {
  margin: 19px 0 22px;
  color: var(--primary);
  font-size: clamp(24px, 2.2vw, 33px);
}

.about-hero p {
  margin: 0;
  color: #556b8b;
  font-size: 16px;
}

.about-hero img {
  width: min(100%, 500px);
  max-height: 245px;
  object-fit: contain;
  justify-self: center;
}

.feature-section,
.privacy-section {
  padding: 0 42px;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 14px;
}

.feature-card {
  min-height: 124px;
  display: flex;
  align-items: center;
  gap: 22px;
  padding: 22px;
}

.feature-icon {
  width: 62px;
  height: 62px;
  color: white;
}

.feature-icon.blue { background: linear-gradient(135deg, #2187fc, #0a58db); }
.feature-icon.orange { background: linear-gradient(135deg, #ff9a0b, #ff5d00); }
.feature-icon.teal { background: linear-gradient(135deg, #2ec2b6, #0a9e97); }

.feature-card h3 {
  margin: 0 0 7px;
  font-size: 20px;
}

.feature-card p {
  margin: 0;
  color: #657793;
  font-size: 14px;
  line-height: 1.7;
}

.privacy-section {
  margin-top: 28px;
}

.privacy-entry {
  width: 100%;
  min-height: 90px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  margin-top: 14px;
  padding: 18px 22px;
  color: #506686;
  font: inherit;
  text-align: left;
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
}

.privacy-entry:hover {
  border-color: #b9d2f5;
  transform: translateY(-1px);
  box-shadow: 0 12px 32px rgba(23, 105, 232, 0.08);
}

.privacy-entry-icon {
  width: 46px;
  height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 13px;
  color: var(--primary);
  background: #eaf2ff;
}

.privacy-entry > span:nth-child(2) {
  min-width: 0;
  display: grid;
  gap: 5px;
}

.privacy-entry strong {
  color: #273b59;
  font-size: 15px;
}

.privacy-entry small {
  overflow: hidden;
  color: #75849a;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.privacy-entry em {
  color: var(--primary);
  font-size: 12px;
  font-style: normal;
  font-weight: 650;
}

.project-card {
  min-height: 150px;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: start;
  gap: 18px;
  margin: 25px 42px 0;
  padding: 25px 32px 18px;
}

.version {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 16px;
}

.version span {
  color: var(--primary);
  font-weight: 600;
}

.project-actions {
  display: flex;
  gap: 18px;
}

.project-actions :deep(.n-button) {
  min-width: 200px;
}

.project-card p {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0;
  color: #7485a0;
  font-size: 15px;
}

.project-card p :deep(.n-icon) {
  display: none;
}

@media (max-width: 900px) {
  .about-hero {
    grid-template-columns: 1fr;
    padding: 34px 24px 20px;
    text-align: center;
  }

  .about-hero img {
    max-height: 210px;
  }

  .feature-section,
  .privacy-section {
    padding: 0 24px;
  }

  .feature-grid {
    grid-template-columns: 1fr;
  }

  .project-card {
    grid-template-columns: 1fr;
    margin: 25px 24px 0;
  }

  .project-actions {
    flex-wrap: wrap;
  }

  .project-card p {
    grid-column: 1;
  }
}

@media (max-width: 520px) {
  .about-main {
    border-radius: 18px 18px 0 0;
  }

  .about-hero h1 {
    font-size: 34px;
  }

  .about-hero h2 {
    font-size: 23px;
  }

  .feature-section,
  .privacy-section {
    padding: 0;
  }

  .feature-card {
    min-height: 108px;
    padding: 18px;
  }

  .privacy-entry {
    grid-template-columns: auto minmax(0, 1fr);
    padding: 16px;
  }

  .privacy-entry small {
    white-space: normal;
    line-height: 1.55;
  }

  .privacy-entry em {
    grid-column: 2;
  }

  .project-card {
    margin-left: 0;
    margin-right: 0;
  }

  .project-actions {
    display: grid;
  }

  .project-actions :deep(.n-button) {
    min-width: 0;
  }
}
</style>
