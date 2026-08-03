<script setup lang="ts">
import { NButton, NIcon, useMessage } from 'naive-ui'
import {
  AlarmOutline,
  ChatbubbleOutline,
  CheckmarkDoneOutline,
  ClipboardOutline,
  DocumentTextOutline,
  InformationCircleOutline,
  LockClosedOutline,
  RefreshOutline,
  ShieldCheckmarkOutline,
} from '@vicons/ionicons5'
import MainHeader from '../components/MainHeader.vue'

const message = useMessage()
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
              <div><h3>聚合作业</h3><p>集中展示学在重邮、学习通和雨课堂的任务。</p></div>
            </article>
            <article class="surface-card feature-card">
              <span class="icon-circle feature-icon orange"><NIcon :size="30"><AlarmOutline /></NIcon></span>
              <div><h3>截止提醒</h3><p>按剩余时间标记临期与逾期任务。</p></div>
            </article>
            <article class="surface-card feature-card">
              <span class="icon-circle feature-icon teal"><NIcon :size="30"><RefreshOutline /></NIcon></span>
              <div><h3>同步扩展</h3><p>支持 QQChan 提醒与 Meet 课程表同步。</p></div>
            </article>
          </div>
        </section>

        <section class="privacy-section">
          <h2 class="section-title">数据与隐私</h2>
          <div class="surface-card privacy-card">
            <div><NIcon :size="29"><ShieldCheckmarkOutline /></NIcon><span>仅在获得授权后同步学习平台数据。</span></div>
            <i />
            <div><NIcon :size="29"><LockClosedOutline /></NIcon><span>聚合截止线登录账号不会用于获取作业。</span></div>
            <i />
            <div><NIcon :size="29"><DocumentTextOutline /></NIcon><span>绑定前会明确说明所需信息、用途与保存方式。</span></div>
          </div>
        </section>

        <section class="surface-card project-card">
          <div class="version"><NIcon :size="27"><InformationCircleOutline /></NIcon><strong>项目版本</strong><span>v1.0.0</span></div>
          <div class="project-actions">
            <NButton size="large" type="primary" ghost @click="message.info('隐私说明页面将在后端接入阶段补充')">
              <template #icon><NIcon><DocumentTextOutline /></NIcon></template>
              查看隐私说明
            </NButton>
            <NButton size="large" type="primary" @click="message.info('感谢反馈，反馈渠道将在服务上线后开放')">
              <template #icon><NIcon><ChatbubbleOutline /></NIcon></template>
              意见反馈
            </NButton>
          </div>
          <p><NIcon><CheckmarkDoneOutline /></NIcon>我们希望减少遗漏，让学习安排更从容。</p>
        </section>
      </div>
    </main>
  </div>
</template>

<style scoped>
.about-main {
  min-height: calc(100vh - 68px);
  padding: 0 0 48px;
  border-radius: 30px 30px 0 0;
  background: linear-gradient(180deg, #fbfdff, #f7faff);
}

.about-hero {
  min-height: 320px;
  display: grid;
  grid-template-columns: 1.08fr 0.92fr;
  align-items: center;
  gap: 30px;
  padding: 38px 70px 20px;
}

.about-hero h1 {
  margin: 0;
  font-size: clamp(38px, 4vw, 54px);
  line-height: 1.2;
  letter-spacing: 1px;
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
  max-height: 280px;
  object-fit: contain;
  justify-self: center;
}

.feature-section,
.privacy-section {
  padding: 0 70px;
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

.privacy-card {
  min-height: 85px;
  display: grid;
  grid-template-columns: 1fr 1px 1fr 1px 1fr;
  align-items: center;
  margin-top: 14px;
  padding: 18px 32px;
}

.privacy-card > div {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  color: #506686;
  font-size: 14px;
}

.privacy-card :deep(.n-icon) {
  flex: 0 0 auto;
  color: var(--primary);
}

.privacy-card i {
  width: 1px;
  height: 42px;
  background: #dfe7f2;
}

.project-card {
  min-height: 150px;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: start;
  gap: 18px;
  margin: 25px 70px 0;
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

  .privacy-card {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .privacy-card i {
    width: 100%;
    height: 1px;
  }

  .privacy-card > div {
    justify-content: flex-start;
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
