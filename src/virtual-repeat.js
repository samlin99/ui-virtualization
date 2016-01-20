import {inject} from 'aurelia-dependency-injection';
import {
  ObserverLocator,
  calcSplices,
  getChangeRecords,
  createOverrideContext
} from 'aurelia-binding';
import {
  BoundViewFactory,
  ViewSlot,
  TargetInstruction,
  customAttribute,
  bindable,
  templateController
} from 'aurelia-templating';
import {
  updateOverrideContext,
  createFullOverrideContext,
  updateOverrideContexts,
  getItemsSourceExpression,
  isOneTime,
  unwrapExpression
} from 'aurelia-templating-resources/repeat-utilities';
import {viewsRequireLifecycle} from 'aurelia-templating-resources/analyze-view-factory';
import {
  calcScrollHeight,
  calcOuterHeight,
  getNthNode,
  moveViewFirst,
  moveViewLast
} from './utilities';
import {VirtualRepeatStrategyLocator} from './virtual-repeat-strategy-locator';
import {DomStrategyLocator} from './dom-strategy';

@customAttribute('virtual-repeat')
@templateController
@inject(Element, BoundViewFactory, TargetInstruction, ViewSlot, ObserverLocator, VirtualRepeatStrategyLocator, DomStrategyLocator)
export class VirtualRepeat {
  first = 0;
  bufferSize = 10;
  nextRebind = this.bufferSize;
  previousFirst = 0;
  numberOfDomElements = 0;

  @bindable items
  @bindable local
  constructor(element, viewFactory, instruction, viewSlot, observerLocator, strategyLocator, domStrategyLocator){
    this.element = element;
    this.viewFactory = viewFactory;
    this.instruction = instruction;
    this.viewSlot = viewSlot;
    this.observerLocator = observerLocator;
    this.strategyLocator = strategyLocator;
    this.domStrategyLocator = domStrategyLocator;
    this.local = 'item';
    this.sourceExpression = getItemsSourceExpression(this.instruction, 'virtual-repeat.for');
    this.isOneTime = isOneTime(this.sourceExpression);
    this.viewsRequireLifecycle = viewsRequireLifecycle(viewFactory);
  }

  attached(){
    this.isAttached = true;
    let element = this.element;

    this.domStrategy = this.domStrategyLocator.getStrategy(element);
    this.scrollList = this.domStrategy.getScrollList(element);
    this.scrollContainer = this.domStrategy.getScrollContainer(element);

    this.topBuffer = this.domStrategy.createTopBufferElement(this.scrollList, element);
    this.bottomBuffer = this.domStrategy.createBottomBufferElement(this.scrollList, element);
    this.topBufferHeight = 0;
    this.bottomBufferHeight = 0;

    this.itemsChanged();
    this.scroll();
  }

  bind(bindingContext, overrideContext){
    this.scope = { bindingContext, overrideContext };

    // TODO Fix this
    window.onresize = () => { this.handleContainerResize(); };
  }

  call(context, changes) {
    this[context](this.items, changes);
  }

  detached() {
    this.isAttached = false;
    this.scrollList = null;
    this.scrollContainer = null;
    this.numberOfDomElements = null;
    this.scrollContainerHeight = null;
    this.first = null;
    this.previousFirst = null;
    this.viewSlot.removeAll(true);
    if(this.scrollHandler) {
      this.scrollHandler.dispose();
    }
    this._unsubscribeCollection();
  }

  itemsChanged() {
    this._unsubscribeCollection();

    // still bound?
    if (!this.scope) {
      return;
    }

    let items = this.items;
    this.strategy = this.strategyLocator.getStrategy(items);
    this.strategy.createFirstItem(this);
    this._calcInitialHeights();

    if (!this.isOneTime && !this._observeInnerCollection()) {
      this._observeCollection();
    }

    this.strategy.instanceChanged(this, items, this.numberOfDomElements);
  }

  unbind(){
    this.scope = null;
    this.items = null;
  }

  handleContainerResize() {
    var children = this.viewSlot.children,
      childrenLength = children.length,
      overrideContext, view, addIndex;

    this.scrollContainerHeight = calcScrollHeight(this.scrollContainer);
    this.numberOfDomElements = Math.ceil(this.scrollContainerHeight / this.itemHeight) + 1;

    if(this.numberOfDomElements > childrenLength){
      addIndex = children[childrenLength - 1].overrideContext.$index + 1;
      overrideContext = createFullOverrideContext(this, this.items[addIndex], addIndex, this.items.length);
      view = this.viewFactory.create();
      view.bind(overrideContext.bindingContext, overrideContext);
      this.viewSlot.insert(childrenLength, view);
    }else if (this.numberOfDomElements < childrenLength){
      this.numberOfDomElements = childrenLength;
    }
  }

  scroll() {
    let itemHeight = this.itemHeight;
    let scrollTop = this.scrollContainer.scrollTop;
    this.first = Math.round(scrollTop / itemHeight);
    console.log(this.first);
    if(this._isScrollingDown() && this._isTopBufferScrolled()) {
      console.log('move views down', this.first, this.nextRebind);
      this.isAtTop = false;
      let movedViewsCount = this._moveViewsToBottom();
      this.topBufferHeight = this.topBufferHeight + itemHeight * movedViewsCount;
      this.bottomBufferHeight = this.bottomBufferHeight - itemHeight * movedViewsCount;
      if (this.bottomBufferHeight >= 0) {
        this._adjustBufferHeights();
      }
    } else if (this._isScrollingUp() && this._isBottomBufferScrolled()) {
      console.log('move views up', this.first, this.nextRebind);
      this.isLastIndex = false;
      let movedViewsCount = this._moveViewsToTop();
      console.log(movedViewsCount);
      this.topBufferHeight = this.topBufferHeight - itemHeight * movedViewsCount;
      this.bottomBufferHeight = this.bottomBufferHeight + itemHeight * movedViewsCount;
      if (this.topBufferHeight >= 0) {
        this._adjustBufferHeights();
      }
    }

    this.previousFirst = this.first;
    requestAnimationFrame(() => this.scroll());
  }

  handleCollectionMutated(collection, changes) {
    this.strategy.instanceMutated(this, collection, changes);
  }

  handleInnerCollectionMutated(collection, changes) {
    // guard against source expressions that have observable side-effects that could
    // cause an infinite loop- eg a value converter that mutates the source array.
    if (this.ignoreMutation) {
      return;
    }
    this.ignoreMutation = true;
    let newItems = this.sourceExpression.evaluate(this.scope, this.lookupFunctions);
    this.observerLocator.taskQueue.queueMicroTask(() => this.ignoreMutation = false);

    // call itemsChanged...
    if (newItems === this.items) {
      // call itemsChanged directly.
      this.itemsChanged();
    } else {
      // call itemsChanged indirectly by assigning the new collection value to
      // the items property, which will trigger the self-subscriber to call itemsChanged.
      this.items = newItems;
    }
  }

  _isScrollingDown() {
    return this.first > this.previousFirst && (this.bottomBufferHeight > 0 || !this.isLastIndex);
  }

  _isTopBufferScrolled() {
    if (this.first > this.nextRebind) {
      this.nextRebind = this.nextRebind + this.bufferSize;
      return true;
    }
  }

  _isBottomBufferScrolled() {
    if ((this.nextRebind - this.first) > this.bufferSize) {
      this.nextRebind = this.nextRebind - this.bufferSize;
      return true;
    }
  }

  _isScrollingUp() {
    return this.first < this.previousFirst && (this.topBufferHeight >= 0 || !this.isAtTop);
  }

  _adjustBufferHeights() {
    this.topBuffer.setAttribute('style', `height:  ${this.topBufferHeight}px`);
    this.bottomBuffer.setAttribute("style", `height: ${this.bottomBufferHeight}px`);
  }

  _getDelta(itemsSkipped) {
    if(itemsSkipped >= this.numberOfDomElements * 2) {
      return Math.round(itemsSkipped / 2);
    }
    return 1;
  }

  _unsubscribeCollection() {
    if (this.collectionObserver) {
      this.collectionObserver.unsubscribe(this.callContext, this);
      this.collectionObserver = null;
      this.callContext = null;
    }
  }

  _moveViewsToBottom() {
    let first = this.first;
    let viewSlot = this.viewSlot;
    let childrenLength = viewSlot.children.length;
    let items = this.items;
    let scrollList = this.scrollList;
    let index = childrenLength + this.nextRebind - (this.bufferSize * 2);
    for(let i = 0; i < this.bufferSize; ++i) {
      if(this.isLastIndex) {
        return this.bufferSize - (this.bufferSize - i);
      }
      let view = viewSlot.children[0];
      updateOverrideContext(view.overrideContext, i + index, items.length);
      view.bindingContext[this.local] = items[i + index];
      viewSlot.children.push(viewSlot.children.shift());
      this.domStrategy.moveViewLast(view, scrollList, childrenLength);
      this.isLastIndex = i + index >= items.length - 1;
    }
    return this.bufferSize;
  }

  _moveViewsToTop() {
    let first = this.first;
    let viewSlot = this.viewSlot;
    let childrenLength = viewSlot.children.length;
    let items = this.items;
    let scrollList = this.scrollList;
    let index = this.nextRebind;

    for(let i = 0; i < this.bufferSize; ++i) {
      if(this.isAtTop) {
        return this.bufferSize - (this.bufferSize - i);
      }
      let view = viewSlot.children[childrenLength - 1];
      view.bindingContext[this.local] = items[index - i];
      updateOverrideContext(view.overrideContext, first, items.length);
      viewSlot.children.unshift(viewSlot.children.splice(-1,1)[0]);
      this.domStrategy.moveViewFirst(view, scrollList);
      this.isAtTop = index - i <= 0;
      console.log('index - i', index - i);
    }
    return this.bufferSize;
  }

  _calcInitialHeights() {
    if (this.numberOfDomElements > 0) {
      return;
    }
    let listItems = this.scrollList.children;
    this.itemHeight = calcOuterHeight(listItems[1]); // TODO: 0 or 1 depending on scroll strategy
    this.scrollContainerHeight = calcScrollHeight(this.scrollContainer);
    this.elementsInView = Math.ceil(this.scrollContainerHeight / this.itemHeight) + 1;
    this.numberOfDomElements = (this.elementsInView * 2) + this.bufferSize;
    this.bottomBufferHeight = this.itemHeight * this.items.length - this.itemHeight * this.numberOfDomElements;
    this.bottomBuffer.setAttribute("style", `height: ${this.bottomBufferHeight}px`);
  }

  _observeInnerCollection() {
    let items = this._getInnerCollection();
    let strategy = this.strategyLocator.getStrategy(items);
    if (!strategy) {
      return false;
    }
    this.collectionObserver = strategy.getCollectionObserver(this.observerLocator, items);
    if (!this.collectionObserver) {
      return false;
    }
    this.callContext = 'handleInnerCollectionMutated';
    this.collectionObserver.subscribe(this.callContext, this);
    return true;
  }

  _getInnerCollection() {
    let expression = unwrapExpression(this.sourceExpression);
    if (!expression) {
      return null;
    }
    return expression.evaluate(this.scope, null);
  }

  _observeCollection() {
    let items = this.items;
    this.collectionObserver = this.strategy.getCollectionObserver(this.observerLocator, items);
    if (this.collectionObserver) {
      this.callContext = 'handleCollectionMutated';
      this.collectionObserver.subscribe(this.callContext, this);
    }
  }
}
