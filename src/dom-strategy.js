import {insertBeforeNode} from './utilities';

export class DomStrategyLocator {
  getStrategy(element) {
    if (element.parentNode.localName === 'tbody') {
      return new TableStrategy();
    } else {
      return new DivStrategy();
    }
  }
}

export class TableStrategy {
  getScrollList(element) {
    return element.parentNode;
  }

  getScrollContainer(element) {
    return this.getScrollList(element).parentElement;
  }

  moveViewFirst(view, scrollElement) {
    let parent = scrollElement.firstElementChild;
    insertBeforeNode(view, parent, parent.childNodes[1]);
  }

  moveViewLast(view, scrollElement, childrenLength) {
    let parent = scrollElement.firstElementChild;
    insertBeforeNode(view, parent, parent.children[childrenLength]);
  }
}

export class DivStrategy {
  getScrollList(element) {
    return element.parentNode;
  }

  getScrollContainer(element) {
    return this.getScrollList(element).parentElement;
  }

  moveViewFirst(view, scrollElement) {
    insertBeforeNode(view, scrollElement, scrollElement.childNodes[2]);
  }

  moveViewLast(view, scrollElement, childrenLength) {
    insertBeforeNode(view, scrollElement, scrollElement.children[childrenLength + 1]);
  }

  createTopBufferElement(scrollList, element) {
    let buffer = document.createElement('div');
    buffer.setAttribute("style","height: 0px");
    scrollList.insertBefore(buffer, element);
    return buffer;
  }

  createBottomBufferElement(scrollList, element) {
    let buffer = document.createElement('div');
    buffer.setAttribute("style","height: 0px");
    element.parentNode.insertBefore(buffer, element.nextSibling);
    return buffer;
  }
}
