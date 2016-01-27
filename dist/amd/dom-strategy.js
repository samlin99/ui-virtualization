define(['exports', './utilities'], function (exports, _utilities) {
  'use strict';

  exports.__esModule = true;

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  var DomStrategyLocator = (function () {
    function DomStrategyLocator() {
      _classCallCheck(this, DomStrategyLocator);
    }

    DomStrategyLocator.prototype.getStrategy = function getStrategy(element) {
      if (element.parentNode.localName === 'tbody') {
        return new TableStrategy();
      } else {
        return new DivStrategy();
      }
    };

    return DomStrategyLocator;
  })();

  exports.DomStrategyLocator = DomStrategyLocator;

  var TableStrategy = (function () {
    function TableStrategy() {
      _classCallCheck(this, TableStrategy);
    }

    TableStrategy.prototype.getScrollElement = function getScrollElement(element) {
      return element.parentNode.parentNode;
    };

    TableStrategy.prototype.getWrapperElement = function getWrapperElement(element) {
      return this.getScrollElement(element).parentElement;
    };

    TableStrategy.prototype.moveViewFirst = function moveViewFirst(view, scrollElement) {
      var parent = scrollElement.firstElementChild;
      _utilities.insertBeforeNode(view, parent, parent.childNodes[1]);
    };

    TableStrategy.prototype.moveViewLast = function moveViewLast(view, scrollElement, childrenLength) {
      var parent = scrollElement.firstElementChild;
      _utilities.insertBeforeNode(view, parent, parent.children[childrenLength]);
    };

    return TableStrategy;
  })();

  exports.TableStrategy = TableStrategy;

  var DivStrategy = (function () {
    function DivStrategy() {
      _classCallCheck(this, DivStrategy);
    }

    DivStrategy.prototype.getScrollElement = function getScrollElement(element) {
      return element.parentNode;
    };

    DivStrategy.prototype.getWrapperElement = function getWrapperElement(element) {
      return this.getScrollElement(element).parentElement;
    };

    DivStrategy.prototype.moveViewFirst = function moveViewFirst(view, scrollElement) {
      _utilities.insertBeforeNode(view, scrollElement, scrollElement.childNodes[1]);
    };

    DivStrategy.prototype.moveViewLast = function moveViewLast(view, scrollElement, childrenLength) {
      _utilities.insertBeforeNode(view, scrollElement, scrollElement.children[childrenLength]);
    };

    return DivStrategy;
  })();

  exports.DivStrategy = DivStrategy;
});