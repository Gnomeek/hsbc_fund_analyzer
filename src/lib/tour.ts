import { driver } from 'driver.js'

export const TOUR_KEY = 'hsbc_fund_tour_done'

// DOM 里同一个 data-tour 可能出现两次（desktop hidden + mobile visible），取可见的那个
function visibleEl(key: string): Element {
  const all = document.querySelectorAll(`[data-tour="${key}"]`)
  for (const el of all) {
    const rect = (el as HTMLElement).getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) return el
  }
  return all[0]
}

let tourActive = false

export function startTour(onBeforeStart?: () => Promise<void>) {
  if (tourActive) return
  tourActive = true

  async function launch() {
    if (onBeforeStart) await onBeforeStart()
    driverObj.drive()
  }

  const driverObj = driver({
    showProgress: true,
    animate: true,
    overlayColor: 'rgba(0,0,0,0.4)',
    popoverClass: 'hsbc-tour-popover',
    nextBtnText: '下一步',
    prevBtnText: '上一步',
    doneBtnText: '完成',
    onDestroyed: () => {
      tourActive = false
      localStorage.setItem(TOUR_KEY, '1')
    },
    steps: [
      {
        element: () => visibleEl('search'),
        popover: {
          title: '搜索基金',
          description: '按基金代码或名称搜索',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: () => visibleEl('filter-status'),
        popover: {
          title: '标签筛选',
          description: '选择状态后，可点击底部开关切换"包含/排除"模式',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: () => visibleEl('filter-risk'),
        popover: {
          title: '风险等级筛选',
          description: '同样支持包含/排除切换',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: () => visibleEl('column-toggle'),
        popover: {
          title: '列显示设置',
          description: '显示/隐藏列，并可拖拽排序',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: () => visibleEl('table-header'),
        popover: {
          title: '排序 & 调整列宽',
          description: '点击列头排序，拖拽列头右边缘调整列宽',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: () => visibleEl('result-count'),
        popover: {
          title: '筛选结果',
          description: '实时显示当前条件下的基金数量',
          side: 'top',
          align: 'start',
        },
      },
    ],
  })

  launch()
}
