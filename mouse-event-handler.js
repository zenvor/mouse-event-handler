

export default class MouseEventHandler {
  constructor(element, config = {}) {
    this.element = typeof element === 'string' ? document.getElementById(element) : element;
    this.config = config;
    this.isMousedown = false;
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.endX = 0;
    this.endY = 0;
    this.xOffset = 0;
    this.yOffset = 0;
    this.xOffsetRatio = 0;
    this.yOffsetRatio = 0;
    this.isLeftMove = false;
    this.isRightMove = false;
    this.isUpMove = false;
    this.isDownMove = false;
    this.playerWidth = 0;
    this.playerHeight = 0;
    this.clickTimeout = null; // 点击事件的超时ID
    this.MOVE_THRESHOLD = config.moveThreshold || 5; // 5px 内不触发事件
    this.CLICK_DELAY = config.clickDelay || 200; // 200ms 内触发双击事件
    this.RATIO_THRESHOLD = config.ratioThreshold || 7; // 阈值比例 10%
    this.THROTTLE_TIME = config.throttleTime || 0; // 节流时间
    // 节流后的拖拽处理函数
    this.throttledDragging = throttle(this.handleDragging.bind(this), this.THROTTLE_TIME);
    this.eventHandlers = config.eventHandlers || {}; // 事件处理器
    // 绑定事件
    this.bindEvents();
  }

  // 获取播放器的宽高
  getPlayerDimensions() {
    if (!this.element) {
      console.error('Element is not found.');
      return { playerWidth: 0, playerHeight: 0 };
    }
    return {
      width: this.element.offsetWidth,
      height: this.element.offsetHeight,
    };
  }

  // 绑定鼠标事件
  bindEvents() {
    const eventNames = ['mouseleave', 'mousedown', 'mousemove', 'mouseup', 'wheel'];
    eventNames.forEach(event => {
      this.element.addEventListener(event, this[`handle${capitalizeFirstLetter(event)}`].bind(this));
    });

    // 获取初始宽高
    const { width, height } = this.getPlayerDimensions();
    this.playerWidth = width;
    this.playerHeight = height;
  }

  // 清理事件
  destroy() {
    const eventNames = ['mouseleave', 'mousedown', 'mousemove', 'mouseup', 'wheel'];
    eventNames.forEach(event => {
      this.element.removeEventListener(event, this[`handle${capitalizeFirstLetter(event)}`].bind(this));
    });
  }

  // 鼠标按下事件
  handleMousedown(event) {
    this.startX = event.offsetX;
    this.startY = event.offsetY;
    this.isMousedown = true;
    this.isDragging = false;
    this.triggerEvent('mousedown');
  }

  // 鼠标移动事件
  handleMousemove(event) {
    if (!this.isMousedown) return;

    const endX = event.offsetX;
    const endY = event.offsetY;

    if (Math.abs(endX - this.startX) > this.MOVE_THRESHOLD || Math.abs(endY - this.startY) > this.MOVE_THRESHOLD) {
      this.isDragging = true;
    }

    if (this.isDragging) {
      this.throttledDragging(event);  // 使用节流函数来处理拖拽
    }
  }

  // 鼠标松开事件
  handleMouseup(event) {
    if (!this.isMousedown) {
      this.isMousedown = false;
      return
    };

    // 取消未执行的节流操作
    this.throttledDragging.cancel();

    this.endX = event.offsetX
    this.endY = event.offsetY

    this.isMousedown = false;
    if (this.isDragging) {
      this.isDragging = false;
      this.element.style.cursor = 'default';
      this.triggerEvent('dragend');
      return;
    }



    if (this.clickTimeout) {
      clearTimeout(this.clickTimeout);
      this.clickTimeout = null;
      this.triggerEvent('dblclick');
    } else {
      this.clickTimeout = setTimeout(() => {
        this.triggerEvent('click');
        this.clickTimeout = null;
      }, this.CLICK_DELAY);
    }
  }

  // 鼠标离开事件
  handleMouseleave() {
    if (this.isMousedown) {
      this.isMousedown = false;
      this.isDragging = false;
      this.element.style.cursor = 'default';
      this.triggerEvent('mouseleave');

      // 取消未执行的节流操作
      this.throttledDragging.cancel();
    }
  }

  // 鼠标滚轮事件
  handleWheel(event) {
    const zoom = event.deltaY < 0 ? 'in' : 'out';
    this.startX = event.offsetX;
    this.startY = event.offsetY;
    this.endX = event.offsetX;
    this.endY = event.offsetY;
    this.triggerEvent(zoom === 'in' ? 'zoomIn' : 'zoomOut');
    this.triggerEvent('whell', { zoom });
  }

  // 鼠标拖动事件
  handleDragging(event) {
    this.element.style.cursor = 'move'
    this.xOffset = event.offsetX - this.startX;
    this.yOffset = event.offsetY - this.startY;

    // 计算偏移比例 要正数
    this.xOffsetRatio = Math.round((Math.abs(this.xOffset) / this.playerWidth) * 100);
    this.yOffsetRatio = Math.round((Math.abs(this.yOffset) / this.playerHeight) * 100);

    // 当xOffsetRatio或yOffsetRatio超过指定比例时，触发事件并重置
    if (this.xOffsetRatio >= this.RATIO_THRESHOLD || this.yOffsetRatio >= this.RATIO_THRESHOLD) {
      // 计算滑动方向
      const moveDirection = this.calculateMoveDirection();

      console.log('["LOG_INFO"]:', 'Drag distance: ', this.xOffset, this.yOffset, 'Drag ratio: ', this.xOffsetRatio, this.yOffsetRatio, 'Drag direction: ', moveDirection);

      const dragType = this.xOffsetRatio >= this.RATIO_THRESHOLD ? 'x' : 'y';

      // 如果 X 轴拖拽比例超过阈值，触发 X 轴拖拽事件
      if (this.xOffsetRatio >= this.RATIO_THRESHOLD) {
        this.triggerEvent('dragX', {
          xOffset: this.xOffset,
          xOffsetRatio: this.xOffsetRatio,
          moveDirection: moveDirection, // 传递方向信息
          dragType: 'x', // 标识当前为X轴拖拽事件
        });
      }

      // 如果 Y 轴拖拽比例超过阈值，触发 Y 轴拖拽事件
      if (this.yOffsetRatio >= this.RATIO_THRESHOLD) {
        this.triggerEvent('dragY', {
          yOffset: this.yOffset,
          yOffsetRatio: this.yOffsetRatio,
          moveDirection: moveDirection, // 传递方向信息
          dragType: 'y', // 标识当前为Y轴拖拽事件
        });
      }

      // 触发事件时，加入方向信息
      this.triggerEvent('drag', {
        xOffset: this.xOffset,
        yOffset: this.yOffset,
        xOffsetRatio: this.xOffsetRatio,
        yOffsetRatio: this.yOffsetRatio,
        moveDirection: moveDirection, // 传递方向信息
        dragType
      });

      // 触发事件后，重置起始点和偏移比例
      this.startX = event.offsetX;
      this.startY = event.offsetY;
      this.xOffset = 0;
      this.yOffset = 0;
      this.xOffsetRatio = 0;
      this.yOffsetRatio = 0;
    }
  }

  // 计算移动方向
  calculateMoveDirection() {
    this.isLeftMove = this.xOffset < 0;
    this.isRightMove = this.xOffset > 0;
    this.isUpMove = this.yOffset < 0;
    this.isDownMove = this.yOffset > 0;

    // 根据 xOffset 和 yOffset 的组合，返回复合方向
    if (this.isLeftMove && this.isUpMove) return 'left-up';
    if (this.isLeftMove && this.isDownMove) return 'left-down';
    if (this.isRightMove && this.isUpMove) return 'right-up';
    if (this.isRightMove && this.isDownMove) return 'right-down';

    // 单一方向
    if (this.isLeftMove) return 'left';
    if (this.isRightMove) return 'right';
    if (this.isUpMove) return 'up';
    if (this.isDownMove) return 'down';

    // 如果没有移动，返回空字符串
    return '';
  }

  // 触发事件
  triggerEvent(eventType, additionalParams = {}) {
    // 获取初始宽高
    const { width, height } = this.getPlayerDimensions();
    this.playerWidth = width;
    this.playerHeight = height;

    const params = {
      eventType,
      startX: this.startX,
      startY: this.startY,
      endX: this.endX,
      endY: this.endY,
      playerWidth: this.playerWidth,
      playerHeight: this.playerHeight,
      ...additionalParams
    };

    // 调用外部传入的事件处理器
    if (this.eventHandlers[eventType]) {
      console.log('params: ', params);
      this.eventHandlers[eventType](params);
    }
  }
}
// 帮助函数：节流函数
function throttle(func, limit) {
  let lastFunc;
  let lastRan;

  // 增加一个取消函数
  const throttled = (...args) => {
    if (!lastRan) {
      func.apply(this, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func.apply(this, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };

  // 增加取消功能，允许在外部调用以停止未执行的节流操作
  throttled.cancel = function () {
    clearTimeout(lastFunc);
  };

  return throttled;
}

// 帮助函数：首字母大写
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}