<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NIcon, NSwitch, useMessage } from 'naive-ui'
import {
  AlarmOutline,
  CalendarOutline,
  ChevronForwardOutline,
  InformationCircleOutline,
  KeyOutline,
  LayersOutline,
  LockClosedOutline,
  MailOutline,
  RefreshOutline,
  ShieldCheckmarkOutline,
  SyncOutline,
  WarningOutline,
} from '@vicons/ionicons5'
import MainHeader from '../components/MainHeader.vue'

const router = useRouter()
const message = useMessage()
const syncEnabled = ref(true)

function showStaticTip(label: string) {
  message.info(`${label}功能将在接入后端后启用`)
}
</script>

<template>
  <div class="profile-page">
    <MainHeader />

    <main class="page-shell profile-main">
      <h1>我的</h1>

      <section class="surface-card profile-section identity-section">
        <h2>基本信息</h2>
        <div class="identity-row">
          <div class="profile-avatar">张</div>
          <div class="identity-copy">
            <strong>张同学</strong>
            <p><NIcon><MailOutline /></NIcon> zhang****@stu.example.edu.cn <i /> ID: 1002003004</p>
          </div>
          <NButton type="primary" ghost @click="showStaticTip('编辑资料')">编辑资料</NButton>
        </div>
      </section>

      <section class="surface-card profile-section">
        <h2>账号与安全</h2>
        <div class="setting-row">
          <div class="setting-label"><NIcon><LockClosedOutline /></NIcon><strong>登录密码</strong></div>
          <div class="setting-value warning"><NIcon><WarningOutline /></NIcon>密码已太弱，建议立即重置</div>
          <NButton size="small" type="primary" ghost @click="showStaticTip('修改密码')">修改</NButton>
        </div>
        <div class="setting-row">
          <div class="setting-label"><NIcon><MailOutline /></NIcon><strong>绑定邮箱</strong></div>
          <div class="setting-value">zhang****@stu.example.edu.cn</div>
          <NButton size="small" type="primary" ghost @click="showStaticTip('修改邮箱')">修改</NButton>
        </div>
      </section>

      <section class="surface-card profile-section platform-section">
        <h2>学习平台绑定</h2>
        <div class="info-banner">
          <NIcon :size="18"><InformationCircleOutline /></NIcon>
          绑定学习平台时，我们会在提交前说明所需信息、用途与保存方式；仅在您确认授权后同步作业。
        </div>
        <div class="setting-row platform-row">
          <div class="setting-label"><span class="platform-logo cqupt">邮</span><strong>学在重邮</strong></div>
          <div class="setting-value bound">已绑定 <span>（zhang***）</span></div>
          <NButton size="small" type="primary" ghost @click="showStaticTip('重新绑定')">重新绑定</NButton>
        </div>
        <div class="setting-row platform-row">
          <div class="setting-label"><span class="platform-logo chaoxing">学</span><strong>学习通</strong></div>
          <div class="setting-value bound">已绑定 <span>（138****5678）</span></div>
          <NButton size="small" type="primary" ghost @click="showStaticTip('重新绑定')">重新绑定</NButton>
        </div>
        <div class="setting-row platform-row">
          <div class="setting-label"><span class="platform-logo yuketang">雨</span><strong>雨课堂</strong></div>
          <div class="setting-value warning"><NIcon><WarningOutline /></NIcon>授权已失效</div>
          <NButton size="small" type="primary" ghost @click="showStaticTip('重新绑定')">重新绑定</NButton>
        </div>
      </section>

      <section class="surface-card profile-section">
        <h2>同步与提醒</h2>
        <button class="setting-row row-button" type="button" @click="showStaticTip('自动刷新频率')">
          <span class="setting-label"><NIcon><RefreshOutline /></NIcon><strong>自动刷新频率</strong></span>
          <span class="setting-value">每 30 分钟</span>
          <NIcon><ChevronForwardOutline /></NIcon>
        </button>
        <button class="setting-row row-button" type="button" @click="showStaticTip('QQChan 提醒')">
          <span class="setting-label"><NIcon><AlarmOutline /></NIcon><strong>QQChan 提醒</strong></span>
          <span class="setting-value bound">已启用 <span>（12345678）</span></span>
          <NIcon><ChevronForwardOutline /></NIcon>
        </button>
        <button class="setting-row row-button" type="button" @click="showStaticTip('提醒时间设置')">
          <span class="setting-label"><NIcon><CalendarOutline /></NIcon><strong>提醒时间设置</strong></span>
          <span class="setting-value">截止前 30 分钟、2 小时、当天 9:00</span>
          <NIcon><ChevronForwardOutline /></NIcon>
        </button>
        <button class="setting-row row-button" type="button" @click="showStaticTip('Meet 课程表同步')">
          <span class="setting-label"><NIcon><LayersOutline /></NIcon><strong>Meet 课程表同步</strong></span>
          <span class="setting-value bound">已连接 <span>（API Key）</span></span>
          <NIcon><ChevronForwardOutline /></NIcon>
        </button>
        <div class="setting-row">
          <div class="setting-label"><NIcon><SyncOutline /></NIcon><strong>双向同步</strong></div>
          <div class="setting-value">启用后，将课程表变更同步到聚合截止线</div>
          <NSwitch v-model:value="syncEnabled" aria-label="双向同步开关" />
        </div>
      </section>

      <section class="surface-card profile-section">
        <h2>数据与隐私</h2>
        <button class="setting-row row-button" type="button" @click="showStaticTip('授权与数据管理')">
          <span class="setting-label"><NIcon><ShieldCheckmarkOutline /></NIcon><strong>授权与数据管理</strong></span>
          <span class="setting-value">查看、撤销授权或删除数据</span>
          <NIcon><ChevronForwardOutline /></NIcon>
        </button>
        <button class="setting-row row-button" type="button" @click="router.push('/about')">
          <span class="setting-label"><NIcon><KeyOutline /></NIcon><strong>数据与隐私说明</strong></span>
          <span class="setting-value">查看我们如何使用与保护您的数据</span>
          <NIcon><ChevronForwardOutline /></NIcon>
        </button>
      </section>

      <button class="surface-card logout-button" type="button" @click="router.push('/login')">退出登录</button>
    </main>
  </div>
</template>

<style scoped>
.profile-main {
  width: min(1225px, calc(100% - 48px));
  padding: 18px 0 42px;
}

.profile-main h1 {
  margin: 0 0 10px;
  font-size: 22px;
}

.profile-section {
  overflow: hidden;
  margin-bottom: 10px;
  padding: 0 12px;
  border-radius: 10px;
  box-shadow: 0 4px 14px rgba(20, 51, 91, 0.05);
}

.profile-section h2 {
  margin: 0;
  padding: 10px 0 7px;
  font-size: 14px;
  line-height: 1;
}

.identity-section {
  padding-bottom: 8px;
}

.identity-row {
  min-height: 64px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 14px;
}

.profile-avatar {
  width: 55px;
  height: 55px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: white;
  font-size: 25px;
  background: linear-gradient(135deg, #2589ff, #0758e9);
}

.identity-copy strong {
  font-size: 16px;
}

.identity-copy p {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 5px 0 0;
  color: #72839d;
  font-size: 12px;
}

.identity-copy i {
  width: 1px;
  height: 12px;
  margin: 0 6px;
  background: #c8d2df;
}

.setting-row {
  width: 100%;
  min-height: 38px;
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(280px, auto) auto;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
  border: 0;
  border-top: 1px solid #e5ebf3;
  color: #112849;
  background: transparent;
  text-align: left;
}

.profile-section h2 + .setting-row,
.info-banner + .setting-row {
  border-top: 0;
}

.row-button {
  cursor: pointer;
}

.row-button:hover {
  background: #f8fbff;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-left: 9px;
}

.setting-label :deep(.n-icon) {
  font-size: 17px;
}

.setting-label strong {
  font-size: 13px;
  font-weight: 600;
}

.setting-value {
  justify-self: end;
  display: flex;
  align-items: center;
  color: #71829e;
  font-size: 12px;
  white-space: nowrap;
}

.setting-value.warning {
  color: #ff6412;
}

.setting-value.bound {
  color: #039574;
}

.setting-value span {
  color: #71829e;
}

.platform-section {
  padding-bottom: 6px;
}

.info-banner {
  min-height: 27px;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 4px 9px;
  border: 1px solid #bdd8ff;
  border-radius: 6px;
  color: #176ce0;
  background: #f0f6ff;
  font-size: 11px;
}

.platform-row {
  min-height: 40px;
}

.platform-logo {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: white;
  font-size: 12px;
  font-weight: 700;
}

.platform-logo.cqupt { background: #126fec; }
.platform-logo.chaoxing { background: #e31b36; }
.platform-logo.yuketang { border-radius: 7px; background: #0aa7a0; }

.logout-button {
  width: 100%;
  height: 48px;
  border-radius: 10px;
  color: #ed2539;
  font-weight: 600;
  cursor: pointer;
}

.logout-button:hover {
  background: #fff8f8;
}

@media (max-width: 768px) {
  .profile-main {
    width: calc(100% - 24px);
    padding-top: 14px;
  }

  .identity-row {
    grid-template-columns: auto 1fr;
    padding-bottom: 10px;
  }

  .identity-row > :last-child {
    grid-column: 1 / -1;
    justify-self: stretch;
  }

  .identity-copy p {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .setting-row {
    grid-template-columns: 1fr auto;
    gap: 6px;
    padding: 9px 0;
  }

  .setting-value {
    grid-column: 1;
    grid-row: 2;
    justify-self: start;
    padding-left: 40px;
    white-space: normal;
  }

  .setting-row > :last-child {
    grid-column: 2;
    grid-row: 1 / span 2;
  }

  .platform-row .setting-value {
    padding-left: 51px;
  }

  .info-banner {
    align-items: flex-start;
    padding: 7px 9px;
  }
}
</style>
