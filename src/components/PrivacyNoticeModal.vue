<script setup lang="ts">
import { NIcon, NModal } from 'naive-ui'
import { CloseOutline, ShieldCheckmarkOutline } from '@vicons/ionicons5'
import {
  PRIVACY_NOTICE_HIGHLIGHTS,
  PRIVACY_NOTICE_SECTIONS,
  PRIVACY_NOTICE_UPDATED_AT,
} from '../content/privacyNotice'

defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
}>()
</script>

<template>
  <NModal
    :show="show"
    :mask-closable="true"
    @update:show="emit('update:show', $event)"
  >
    <section
      class="privacy-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-notice-title"
    >
      <header>
        <span class="privacy-mark"><NIcon><ShieldCheckmarkOutline /></NIcon></span>
        <div>
          <h2 id="privacy-notice-title">隐私说明</h2>
          <p>最后更新：{{ PRIVACY_NOTICE_UPDATED_AT }}</p>
        </div>
        <button type="button" aria-label="关闭隐私说明" @click="emit('update:show', false)">
          <NIcon><CloseOutline /></NIcon>
        </button>
      </header>

      <div class="privacy-content">
        <p class="privacy-intro">使用聚合截止线前，请花一点时间了解我们会处理哪些信息、为什么需要这些信息，以及您可以怎样管理它们。请特别留意<strong>密码保存相关内容</strong>，再决定是否继续使用。</p>
        <section class="privacy-highlights" aria-label="隐私说明重点">
          <ul>
            <li v-for="highlight in PRIVACY_NOTICE_HIGHLIGHTS" :key="highlight.title">
              <strong>{{ highlight.title }}</strong>
              <span>{{ highlight.detail }}</span>
            </li>
          </ul>
        </section>
        <section v-for="section in PRIVACY_NOTICE_SECTIONS" :key="section.title">
          <h3>{{ section.title }}</h3>
          <p
            v-for="paragraph in section.paragraphs"
            :key="paragraph.summary"
            :class="{ 'is-warning': paragraph.tone === 'warning' }"
          >
            <strong>{{ paragraph.summary }}</strong>
            <span>{{ paragraph.detail }}</span>
          </p>
        </section>
      </div>

      <footer>
        <button type="button" @click="emit('update:show', false)">我知道了</button>
      </footer>
    </section>
  </NModal>
</template>

<style scoped>
.privacy-modal {
  width: min(640px, calc(100vw - 32px));
  max-height: min(760px, calc(100vh - 40px));
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 20px;
  color: var(--text);
  background: var(--surface);
  box-shadow: var(--shadow-modal);
}

.privacy-modal > header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding: 21px 22px 18px;
  border-bottom: 1px solid var(--line-soft);
  background: var(--surface-subtle);
}

.privacy-mark {
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  color: var(--primary-text);
  background: var(--primary-soft);
  font-size: 23px;
}

.privacy-modal h2 {
  margin: 0;
  font-size: 21px;
  letter-spacing: -0.3px;
}

.privacy-modal header p {
  margin: 3px 0 0;
  color: var(--text-tertiary);
  font-size: 11px;
}

.privacy-modal header button {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  color: var(--text-secondary);
  background: var(--neutral-container);
  font-size: 18px;
  cursor: pointer;
}

.privacy-modal header button:hover {
  color: var(--text-strong);
  background: var(--surface-hover);
}

.privacy-content {
  overflow-y: auto;
  padding: 22px 24px 10px;
  overscroll-behavior: contain;
}

.privacy-intro {
  margin: 0 0 21px;
  border-radius: 11px;
  padding: 12px 14px;
  color: var(--text-secondary);
  background: var(--surface-soft);
  font-size: 13px;
  line-height: 1.7;
}

.privacy-highlights {
  margin: 0 0 24px;
  padding: 0;
}

.privacy-highlights ul {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.privacy-highlights li {
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 10px 11px;
  background: var(--surface-subtle);
}

.privacy-highlights li strong,
.privacy-highlights li span {
  display: block;
}

.privacy-highlights li strong {
  margin-bottom: 3px;
  color: var(--text-strong);
  font-size: 12px;
}

.privacy-highlights li span {
  color: var(--text-secondary);
  font-size: 11px;
  line-height: 1.55;
}

.privacy-content section {
  padding: 0 2px 18px;
}

.privacy-content .privacy-highlights {
  padding-bottom: 0;
}

.privacy-content h3 {
  margin: 0 0 8px;
  color: var(--text-strong);
  font-size: 15px;
}

.privacy-content section p {
  margin: 0 0 8px;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.8;
  overflow-wrap: anywhere;
}

.privacy-content section p > strong {
  color: var(--text-strong);
  font-weight: 700;
}

.privacy-intro strong {
  color: var(--primary-text);
}

.privacy-content section p.is-warning {
  margin: 10px 0 12px;
  border-left: 3px solid var(--warning-text);
  border-radius: 0 8px 8px 0;
  padding: 9px 11px;
  color: var(--text-secondary);
  background: var(--warning-container);
}

.privacy-content section p.is-warning > strong {
  color: var(--warning-text);
}

.privacy-modal > footer {
  display: flex;
  justify-content: flex-end;
  padding: 14px 22px;
  border-top: 1px solid var(--line-soft);
  background: var(--surface);
}

.privacy-modal > footer button {
  min-width: 96px;
  height: 38px;
  border: 0;
  border-radius: 10px;
  color: #fff;
  background: var(--primary);
  font-weight: 650;
  cursor: pointer;
}

.privacy-modal > footer button:hover {
  background: var(--primary-deep);
}

@media (max-width: 520px) {
  .privacy-modal {
    width: calc(100vw - 20px);
    max-height: calc(100vh - 20px);
    border-radius: 16px;
  }

  .privacy-modal > header {
    padding: 16px;
  }

  .privacy-mark {
    width: 38px;
    height: 38px;
  }

  .privacy-content {
    padding: 18px 17px 6px;
  }

  .privacy-highlights ul {
    grid-template-columns: 1fr;
  }

  .privacy-modal > footer {
    padding: 12px 16px;
  }

  .privacy-modal > footer button {
    width: 100%;
  }
}
</style>
