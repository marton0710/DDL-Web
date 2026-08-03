<script setup lang="ts">
import { ref } from 'vue'
import { NIcon, NInput } from 'naive-ui'
import {
  AlarmOutline,
  CalendarClearOutline,
  CheckmarkCircleOutline,
  ChevronBackOutline,
  ChevronForwardOutline,
  ClipboardOutline,
  RefreshOutline,
  SearchOutline,
  TimeOutline,
} from '@vicons/ionicons5'
import MainHeader from '../components/MainHeader.vue'

const taskFilter = ref<'all' | 'soon' | 'overdue' | 'done'>('all')
const platformFilter = ref('all')
const courseFilter = ref('all')
const keyword = ref('')
</script>

<template>
  <div class="home-page">
    <MainHeader />

    <main class="page-shell home-main">
      <section class="hero-banner">
        <div class="hero-copy">
          <h1>让每一个截止时间，都清晰可见</h1>
          <p>集中查看来自不同学习平台的作业与截止时间</p>
        </div>
        <img src="/assets/illustrations/deadline-calendar.png" alt="日历与时钟插画" />
      </section>

      <section class="stats-grid" aria-label="任务统计">
        <article class="surface-card stat-card">
          <span class="icon-circle stat-icon blue"><NIcon :size="30"><ClipboardOutline /></NIcon></span>
          <div><span>全部任务</span><strong>18</strong></div>
        </article>
        <article class="surface-card stat-card">
          <span class="icon-circle stat-icon orange"><NIcon :size="31"><AlarmOutline /></NIcon></span>
          <div><span>24 小时内截止</span><strong class="orange-text">5</strong></div>
        </article>
        <article class="surface-card stat-card">
          <span class="icon-circle stat-icon red"><NIcon :size="31"><TimeOutline /></NIcon></span>
          <div><span>已逾期</span><strong class="red-text">2</strong></div>
        </article>
        <article class="surface-card stat-card">
          <span class="icon-circle stat-icon teal"><NIcon :size="31"><CheckmarkCircleOutline /></NIcon></span>
          <div><span>已完成</span><strong>11</strong></div>
        </article>
      </section>

      <div class="home-layout">
        <section class="task-column">
          <div class="filter-bar">
            <div class="status-tabs" role="tablist" aria-label="任务状态">
              <button :class="{ active: taskFilter === 'all' }" type="button" @click="taskFilter = 'all'">全部</button>
              <button :class="{ active: taskFilter === 'soon' }" type="button" @click="taskFilter = 'soon'">即将截止</button>
              <button :class="{ active: taskFilter === 'overdue' }" type="button" @click="taskFilter = 'overdue'">已逾期</button>
              <button :class="{ active: taskFilter === 'done' }" type="button" @click="taskFilter = 'done'">已完成</button>
            </div>
            <div class="select-filters">
              <select v-model="platformFilter" class="static-select" aria-label="选择平台">
                <option value="all">全部平台</option>
                <option value="cqupt">学在重邮</option>
                <option value="chaoxing">学习通</option>
                <option value="yuketang">雨课堂</option>
              </select>
              <select v-model="courseFilter" class="static-select" aria-label="选择课程">
                <option value="all">全部课程</option>
                <option value="software">软件工程</option>
                <option value="physics">大学物理实验</option>
                <option value="data">数据结构</option>
                <option value="math">高等数学</option>
                <option value="discrete">离散数学</option>
              </select>
              <NInput v-model:value="keyword" clearable placeholder="搜索任务或课程" aria-label="搜索任务或课程">
                <template #suffix><NIcon :size="20"><SearchOutline /></NIcon></template>
              </NInput>
            </div>
          </div>

          <div class="surface-card task-table-card">
            <div class="table-scroll">
              <table class="task-table">
                <thead>
                  <tr>
                    <th class="check-cell"><span class="fake-checkbox" /></th>
                    <th>任务</th>
                    <th>课程</th>
                    <th>来源</th>
                    <th>截止时间</th>
                    <th>剩余时间</th>
                    <th>状态</th>
                    <th>优先级</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-show="taskFilter === 'all' || taskFilter === 'soon'">
                    <td class="check-cell"><button class="fake-checkbox" type="button" aria-label="选中软件工程课程设计" /></td>
                    <td class="task-name">软件工程课程设计</td>
                    <td>软件工程</td>
                    <td><span class="platform-badge cqupt"><b>邮</b>学在重邮</span></td>
                    <td class="date-cell">2026-08-02 23:59</td>
                    <td><span class="remaining urgent">3 小时 42 分</span></td>
                    <td><span class="status unfinished">未完成</span></td>
                    <td><span class="priority-dot high" />高</td>
                  </tr>
                  <tr v-show="taskFilter === 'all' || taskFilter === 'soon'">
                    <td class="check-cell"><button class="fake-checkbox" type="button" aria-label="选中大学物理实验报告" /></td>
                    <td class="task-name">大学物理实验报告</td>
                    <td>大学物理实验</td>
                    <td><span class="platform-badge chaoxing"><b>学</b>学习通</span></td>
                    <td class="date-cell">2026-08-03 23:59</td>
                    <td><span class="remaining urgent">1 天 3 小时</span></td>
                    <td><span class="status unfinished">未完成</span></td>
                    <td><span class="priority-dot medium" />中</td>
                  </tr>
                  <tr v-show="taskFilter === 'all' || taskFilter === 'soon'">
                    <td class="check-cell"><button class="fake-checkbox" type="button" aria-label="选中数据结构第 6 次作业" /></td>
                    <td class="task-name">数据结构第 6 次作业</td>
                    <td>数据结构</td>
                    <td><span class="platform-badge yuketang"><b>雨</b>雨课堂</span></td>
                    <td class="date-cell">2026-08-04 12:00</td>
                    <td><span class="remaining urgent">1 天 15 小时</span></td>
                    <td><span class="status unfinished">未完成</span></td>
                    <td><span class="priority-dot medium" />中</td>
                  </tr>
                  <tr v-show="taskFilter === 'all' || taskFilter === 'overdue'">
                    <td class="check-cell"><button class="fake-checkbox" type="button" aria-label="选中高等数学在线测试" /></td>
                    <td class="task-name">高等数学在线测试</td>
                    <td>高等数学</td>
                    <td><span class="platform-badge chaoxing"><b>学</b>学习通</span></td>
                    <td class="date-cell">2026-07-31 20:00</td>
                    <td><span class="remaining overdue">已逾期 2 天</span></td>
                    <td><span class="status unfinished">未完成</span></td>
                    <td><span class="priority-dot high" />高</td>
                  </tr>
                  <tr v-show="taskFilter === 'all' || taskFilter === 'done'">
                    <td class="check-cell"><button class="fake-checkbox" type="button" aria-label="选中离散数学作业 5" /></td>
                    <td class="task-name">离散数学作业 5</td>
                    <td>离散数学</td>
                    <td><span class="platform-badge yuketang"><b>雨</b>雨课堂</span></td>
                    <td class="date-cell">2026-07-30 23:59</td>
                    <td><span class="remaining complete">已完成</span></td>
                    <td><span class="status completed">已完成</span></td>
                    <td><span class="priority-dot low" />低</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="table-footer">
              <span>共 18 条任务</span>
              <div class="pagination" aria-label="分页">
                <button type="button" aria-label="上一页"><NIcon><ChevronBackOutline /></NIcon></button>
                <button class="current" type="button">1</button>
                <button type="button">2</button>
                <button type="button" aria-label="下一页"><NIcon><ChevronForwardOutline /></NIcon></button>
              </div>
              <button class="page-size" type="button">10 条 / 页 <span>⌄</span></button>
            </div>
          </div>
        </section>

        <aside class="side-column">
          <section class="surface-card timeline-card">
            <header><h2>本周时间线</h2><button type="button">查看全部</button></header>
            <div class="timeline-list">
              <article class="timeline-item active">
                <div class="timeline-date"><b>8/2</b><span>周日</span></div>
                <div class="timeline-info"><span>23:59</span><strong>软件工程课程设计</strong><em class="cqupt-text">学在重邮</em></div>
                <span class="timeline-left">3 小时 42 分</span>
              </article>
              <article class="timeline-item active">
                <div class="timeline-date"><b>8/3</b><span>周一</span></div>
                <div class="timeline-info"><span>23:59</span><strong>大学物理实验报告</strong><em class="chaoxing-text">学习通</em></div>
                <span class="timeline-left">1 天 3 小时</span>
              </article>
              <article class="timeline-item active">
                <div class="timeline-date"><b>8/4</b><span>周二</span></div>
                <div class="timeline-info"><span>12:00</span><strong>数据结构第 6 次作业</strong><em class="yuketang-text">雨课堂</em></div>
                <span class="timeline-left">1 天 15 小时</span>
              </article>
              <article class="timeline-item">
                <div class="timeline-date"><b>8/5</b><span>周三</span></div>
                <div class="timeline-info"><span>20:00</span><strong>操作系统课程作业</strong><em class="cqupt-text">学在重邮</em></div>
                <span class="timeline-left">2 天 15 小时</span>
              </article>
            </div>
            <button class="calendar-link" type="button">查看完整日历 <NIcon><ChevronForwardOutline /></NIcon></button>
          </section>

          <section class="surface-card distribution-card">
            <h2>平台任务分布</h2>
            <div class="distribution-content">
              <div class="donut-chart" aria-label="18 个任务，三个平台各 6 个">
                <div><strong>18</strong><span>总任务</span></div>
              </div>
              <ul>
                <li><span class="legend-dot cqupt-bg" />学在重邮 <b>6 (33%)</b></li>
                <li><span class="legend-dot chaoxing-bg" />学习通 <b>6 (33%)</b></li>
                <li><span class="legend-dot yuketang-bg" />雨课堂 <b>6 (33%)</b></li>
              </ul>
            </div>
            <p class="updated">数据更新于 2026-08-01 10:30 <NIcon><RefreshOutline /></NIcon></p>
          </section>
        </aside>
      </div>
    </main>
  </div>
</template>

<style scoped>
.home-main {
  padding: 22px 0 54px;
}

.hero-banner {
  position: relative;
  height: 142px;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: 24px 54px;
  border: 1px solid #dceaff;
  border-radius: 16px;
  background:
    radial-gradient(circle at 86% 35%, rgba(121, 172, 255, 0.22), transparent 7%),
    linear-gradient(110deg, #eef6ff 0%, #f8fbff 47%, #e7f1ff 100%);
}

.hero-copy {
  position: relative;
  z-index: 2;
}

.hero-banner h1 {
  margin: 0 0 10px;
  font-size: clamp(27px, 2.5vw, 40px);
  line-height: 1.2;
  letter-spacing: 1px;
  color: #061c45;
}

.hero-banner p {
  margin: 0;
  color: #526783;
  font-size: 18px;
}

.hero-banner img {
  position: absolute;
  right: 7%;
  top: -98px;
  width: 430px;
  filter: drop-shadow(0 15px 25px rgba(54, 109, 183, 0.1));
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 22px;
  margin-top: 20px;
}

.stat-card {
  min-height: 108px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  color: white;
}

.stat-icon.blue { background: linear-gradient(135deg, #1482ff, #0053d7); }
.stat-icon.orange { background: linear-gradient(135deg, #ff8e0b, #ff5a00); }
.stat-icon.red { background: linear-gradient(135deg, #ed3753, #cd0928); }
.stat-icon.teal { background: linear-gradient(135deg, #29bfa9, #04917d); }

.stat-card div {
  display: grid;
  gap: 2px;
}

.stat-card span:not(.stat-icon) {
  color: #556987;
  font-size: 16px;
}

.stat-card strong {
  color: #081b40;
  font-size: 35px;
  line-height: 1;
}

.stat-card strong.orange-text { color: var(--orange); }
.stat-card strong.red-text { color: var(--red); }

.home-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 374px;
  gap: 20px;
  margin-top: 22px;
}

.task-column {
  min-width: 0;
}

.filter-bar {
  min-height: 42px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
}

.status-tabs {
  display: flex;
  gap: 16px;
  flex: 0 0 auto;
}

.status-tabs button {
  height: 39px;
  padding: 0 22px;
  border: 1px solid #dbe4f0;
  border-radius: 22px;
  color: #60718e;
  background: white;
  cursor: pointer;
  transition: 0.18s ease;
}

.status-tabs button:hover {
  color: var(--primary);
  border-color: #90bcff;
}

.status-tabs button.active {
  color: white;
  border-color: var(--primary);
  background: linear-gradient(135deg, #1479ff, #075de8);
  box-shadow: 0 6px 15px rgba(15, 106, 245, 0.18);
}

.select-filters {
  display: grid;
  grid-template-columns: 152px 138px minmax(190px, 1fr);
  gap: 12px;
  width: min(100%, 550px);
}

.static-select {
  width: 100%;
  height: 34px;
  padding: 0 32px 0 13px;
  border: 1px solid #d8e1ed;
  border-radius: 8px;
  color: #425674;
  outline: none;
  background-color: #fff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.static-select:hover,
.static-select:focus {
  border-color: #5a9af5;
  box-shadow: 0 0 0 2px rgba(15, 106, 245, 0.08);
}

.task-table-card {
  overflow: hidden;
}

.table-scroll {
  overflow-x: auto;
}

.task-table {
  width: 100%;
  min-width: 950px;
  border-collapse: collapse;
  color: #263958;
  font-size: 14px;
}

.task-table th {
  height: 56px;
  color: #60718e;
  font-weight: 500;
  text-align: left;
  white-space: nowrap;
}

.task-table td {
  height: 66px;
  border-top: 1px solid #e7edf5;
  white-space: nowrap;
}

.task-table th,
.task-table td {
  padding: 0 12px;
}

.task-table th:first-child,
.task-table td:first-child {
  padding-left: 22px;
}

.task-table th:last-child,
.task-table td:last-child {
  padding-right: 18px;
}

.task-table tbody tr {
  transition: background 0.18s ease;
}

.task-table tbody tr:hover {
  background: #f8fbff;
}

.check-cell {
  width: 46px;
}

.fake-checkbox {
  width: 19px;
  height: 19px;
  display: inline-block;
  border: 1.5px solid #9cacc4;
  border-radius: 5px;
  background: white;
  cursor: pointer;
}

.task-name {
  color: #0b1e42;
  font-weight: 600;
  font-size: 15px;
}

.platform-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px 3px 4px;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 500;
}

.platform-badge b {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: white;
  font-size: 10px;
}

.platform-badge.cqupt { color: #0868e6; background: #edf5ff; }
.platform-badge.cqupt b { background: #1679f5; }
.platform-badge.chaoxing { color: #df1933; background: #fff0f2; }
.platform-badge.chaoxing b { background: #e31b36; }
.platform-badge.yuketang { color: #02968c; background: #ebf9f8; }
.platform-badge.yuketang b { background: #12aaa2; }

.date-cell {
  color: #1b3356;
  font-variant-numeric: tabular-nums;
}

.remaining.urgent { color: #ff5f00; }
.remaining.overdue { color: #e31325; }
.remaining.complete { color: #009c7c; }

.status {
  display: inline-flex;
  padding: 5px 11px;
  border-radius: 10px;
}

.status.unfinished { color: #f45f0c; background: #fff1e7; border: 1px solid #ffe1cd; }
.status.completed { color: #008e77; background: #e8f8f4; border: 1px solid #d2f0e8; }

.priority-dot,
.legend-dot {
  width: 10px;
  height: 10px;
  display: inline-block;
  margin-right: 8px;
  border-radius: 50%;
}

.priority-dot.high { background: #e50d27; }
.priority-dot.medium { background: #ff7107; }
.priority-dot.low { background: #09a38a; }

.table-footer {
  min-height: 72px;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0 22px;
  border-top: 1px solid #e7edf5;
}

.table-footer > span {
  color: #243b5f;
}

.pagination {
  display: flex;
  gap: 8px;
}

.pagination button,
.page-size {
  min-width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #dfe7f2;
  border-radius: 7px;
  color: #344967;
  background: white;
  cursor: pointer;
}

.pagination button.current {
  color: white;
  border-color: var(--primary);
  background: var(--primary);
}

.page-size {
  justify-self: end;
  min-width: 126px;
  gap: 12px;
}

.side-column {
  display: grid;
  gap: 16px;
  align-content: start;
}

.timeline-card,
.distribution-card {
  padding: 16px;
}

.timeline-card header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.timeline-card h2,
.distribution-card h2 {
  margin: 0;
  font-size: 17px;
}

.timeline-card header button,
.calendar-link {
  border: 0;
  color: var(--primary);
  background: transparent;
  cursor: pointer;
}

.timeline-list {
  padding-left: 6px;
}

.timeline-item {
  position: relative;
  display: grid;
  grid-template-columns: 53px minmax(0, 1fr) auto;
  align-items: center;
  gap: 5px;
  min-height: 57px;
  padding-left: 16px;
  border-left: 1px solid #dbe5f1;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: -5px;
  top: 15px;
  width: 8px;
  height: 8px;
  border: 2px solid #aabbd2;
  border-radius: 50%;
  background: white;
}

.timeline-item.active::before {
  border-color: var(--primary);
  background: var(--primary);
}

.timeline-date {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 12px;
}

.timeline-date b {
  font-size: 13px;
}

.timeline-date span,
.timeline-info span {
  color: #788aa6;
}

.timeline-info {
  min-width: 0;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 1px 6px;
  align-items: center;
  font-size: 11px;
}

.timeline-info strong {
  overflow: hidden;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timeline-info em {
  grid-column: 2;
  font-size: 10px;
  font-style: normal;
}

.cqupt-text { color: #126ef0; }
.chaoxing-text { color: #e11e36; }
.yuketang-text { color: #079d93; }

.timeline-left {
  color: #ff6200;
  font-size: 11px;
  white-space: nowrap;
}

.calendar-link {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 7px;
}

.distribution-content {
  display: grid;
  grid-template-columns: 145px 1fr;
  align-items: center;
  margin-top: 8px;
}

.donut-chart {
  width: 122px;
  height: 122px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: conic-gradient(#1478f7 0 33%, #ed2939 33% 66%, #10aea5 66% 100%);
}

.donut-chart > div {
  width: 76px;
  height: 76px;
  display: grid;
  place-content: center;
  text-align: center;
  border-radius: 50%;
  background: white;
}

.donut-chart strong {
  font-size: 22px;
}

.donut-chart span {
  color: #687a98;
  font-size: 12px;
}

.distribution-content ul {
  display: grid;
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
  color: #435674;
  font-size: 13px;
}

.distribution-content li {
  display: flex;
  align-items: center;
}

.distribution-content li b {
  margin-left: auto;
  color: #72839d;
  font-weight: 400;
}

.cqupt-bg { background: #1478f7; }
.chaoxing-bg { background: #ed2939; }
.yuketang-bg { background: #10aea5; }

.updated {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;
  margin: 10px 0 -5px;
  color: #8796ae;
  font-size: 11px;
}

@media (max-width: 1250px) {
  .home-layout {
    grid-template-columns: 1fr;
  }

  .side-column {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 1060px) {
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }

  .filter-bar {
    align-items: stretch;
    flex-direction: column;
  }

  .select-filters {
    width: 100%;
  }
}

@media (max-width: 720px) {
  .home-main {
    padding-top: 12px;
  }

  .hero-banner {
    height: 190px;
    align-items: flex-start;
    padding: 24px;
  }

  .hero-banner h1 {
    max-width: 330px;
    font-size: 27px;
  }

  .hero-banner p {
    max-width: 280px;
    font-size: 15px;
  }

  .hero-banner img {
    right: -55px;
    top: 65px;
    width: 240px;
    opacity: 0.72;
  }

  .stats-grid {
    gap: 12px;
  }

  .stat-card {
    min-height: 88px;
    gap: 10px;
    padding: 12px;
  }

  .stat-icon {
    width: 43px;
    height: 43px;
  }

  .stat-card span:not(.stat-icon) {
    font-size: 12px;
  }

  .stat-card strong {
    font-size: 26px;
  }

  .status-tabs {
    gap: 7px;
    overflow-x: auto;
    padding-bottom: 2px;
  }

  .status-tabs button {
    height: 36px;
    flex: 0 0 auto;
    padding: 0 16px;
  }

  .select-filters {
    grid-template-columns: 1fr 1fr;
  }

  .select-filters > :last-child {
    grid-column: 1 / -1;
  }

  .table-footer {
    grid-template-columns: 1fr auto;
    gap: 12px;
  }

  .pagination {
    justify-self: end;
  }

  .page-size {
    display: none;
  }

  .side-column {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 430px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-card {
    min-height: 80px;
  }

  .distribution-content {
    grid-template-columns: 130px 1fr;
  }
}
</style>
