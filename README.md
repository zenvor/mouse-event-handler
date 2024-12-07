## MouseEventHandler 类使用文档

`MouseEventHandler` 是一个帮助你处理鼠标事件的小工具类，主要用于监听和管理 HTML 元素上的拖拽、点击、双击、滚轮缩放等操作。这个类提供了多种自定义选项，让你可以根据具体需求控制事件的触发条件。

### 1. 安装与使用

确保你的项目支持模块化引入，然后你可以轻松在项目中导入并使用：

```javascript
import MouseEventHandler from './MouseEventHandler';
```

### 2. 构造函数

`MouseEventHandler(element, config)`

- `element`: 要绑定鼠标事件的目标元素，可以是一个 HTML 元素对象，也可以是元素的 `id` 字符串。
- `config`: 可选配置对象，允许自定义各种参数。

#### 配置参数 `config`

- `moveThreshold`：默认值为 5，指定鼠标拖拽多少像素后，开始视为拖拽操作。
- `clickDelay`：默认值为 200，双击判断的时间阈值，单位为毫秒。
- `ratioThreshold`：默认值为 7，当拖拽比例超过该阈值时，触发拖拽事件，用于防止事件过于频繁触发。
- `throttleTime`：默认值为 0，拖拽事件的节流时间，用于防止事件过于频繁触发。
- `eventHandlers`: 一个包含事件处理器的对象，键为事件类型，值为相应的回调函数。

### 3. 功能亮点

#### 3.1 事件绑定

`MouseEventHandler` 自动为你绑定了以下鼠标事件：

- `mouseleave`: 鼠标离开元素时触发。
- `mousedown`: 鼠标按下时触发。
- `mousemove`: 鼠标移动时触发。
- `mouseup`: 鼠标松开时触发。
- `wheel`: 滚动鼠标滚轮时触发，支持缩放操作。

#### 3.2 鼠标拖拽事件处理

在处理拖拽事件时，除了使用 **节流机制** 来控制高频事件的触发频率，我还添加了另一个控制机制：**比例阈值**（`ratioThreshold`）。当鼠标拖动的偏移量比例（`xOffsetRatio` 或 `yOffsetRatio`）超过我设定的阈值时，才会触发相应的拖拽事件。

```javascript
if (this.xOffsetRatio >= this.RATIO_THRESHOLD || this.yOffsetRatio >= this.RATIO_THRESHOLD) {
  // 计算拖拽方向
  const moveDirection = this.calculateMoveDirection();

  console.log('["LOG_INFO"]:', 'Drag distance: ', this.xOffset, this.yOffset, 'Drag ratio: ', this.xOffsetRatio, this.yOffsetRatio, 'Drag direction: ', moveDirection);

  const dragType = this.xOffsetRatio >= this.RATIO_THRESHOLD ? 'x' : 'y';

  // X 轴比例超出阈值时，触发 X 轴拖拽事件
  if (this.xOffsetRatio >= this.RATIO_THRESHOLD) {
    this.triggerEvent('dragX', {
      xOffset: this.xOffset,
      xOffsetRatio: this.xOffsetRatio,
      moveDirection, 
      dragType: 'x'
    });
  }

  // Y 轴比例超出阈值时，触发 Y 轴拖拽事件
  if (this.yOffsetRatio >= this.RATIO_THRESHOLD) {
    this.triggerEvent('dragY', {
      yOffset: this.yOffset,
      yOffsetRatio: this.yOffsetRatio,
      moveDirection, 
      dragType: 'y'
    });
  }

  // 触发拖拽事件，并带上方向信息
  this.triggerEvent('drag', {
    xOffset: this.xOffset,
    yOffset: this.yOffset,
    xOffsetRatio: this.xOffsetRatio,
    yOffsetRatio: this.yOffsetRatio,
    moveDirection,
    dragType
  });

  // 重置偏移和比例
  this.startX = event.offsetX;
  this.startY = event.offsetY;
  this.xOffset = 0;
  this.yOffset = 0;
  this.xOffsetRatio = 0;
  this.yOffsetRatio = 0;
}
```

通过这种机制，我可以确保只有当拖拽动作足够明显时（即比例达到设定的阈值），才会触发事件，从而减少高频次的事件触发，提升性能表现。

#### 3.3 支持的事件类型

以下是该类支持的鼠标事件类型，你可以根据需求为每个事件类型配置对应的处理函数：

- `mousedown`: 鼠标按下时触发。
- `mouseup`: 鼠标松开时触发。
- `click`: 鼠标单击后触发，如果在 `clickDelay` 时间内没有触发双击。
- `dblclick`: 鼠标双击时触发。
- `drag`: 鼠标拖拽时触发，包含拖拽方向及偏移信息。
- `dragX`: X 轴方向的拖拽事件，偏移比例超过阈值时触发。
- `dragY`: Y 轴方向的拖拽事件，偏移比例超过阈值时触发。
- `mouseleave`: 鼠标离开目标元素时触发。
- `zoomIn`: 鼠标滚轮向上滚动时触发，通常用于缩放。
- `zoomOut`: 鼠标滚轮向下滚动时触发，通常用于缩小。

### 4. 示例代码

以下是一个完整的示例，展示了如何使用 `MouseEventHandler`：

```javascript
const handler = new MouseEventHandler('myElement', {
  ratioThreshold: 10, // 拖拽比例阈值为 10
  eventHandlers: {
    mousedown: (params) => console.log('Mouse down:', params),
    mouseup: (params) => console.log('Mouse up:', params),
    click: (params) => console.log('Single click:', params),
    dblclick: (params) => console.log('Double click:', params),
    drag: (params) => console.log('Dragging:', params),
    dragX: (params) => console.log('Dragging on X-axis:', params),
    dragY: (params) => console.log('Dragging on Y-axis:', params),
    zoomIn: (params) => console.log('Zooming in:', params),
    zoomOut: (params) => console.log('Zooming out:', params),
  }
});

// 解绑所有事件
handler.destroy();
```

### 5. 总结

这个类的拖拽事件处理是通过设置 **拖拽比例阈值**（`ratioThreshold`）和 **节流** 来防止高频率触发，从而达到性能优化的目的。结合你项目的实际情况，你可以自由调整这些参数，使鼠标事件更加灵活地适应你的需求。

如果不再需要监听某个元素的鼠标事件，别忘了调用 `destroy()` 方法来清理事件，防止内存泄漏。