System.register(['./utilities'], function (_export) {
  'use strict';

  var insertBeforeNode, DomStrategyLocator, TableStrategy, DivStrategy;

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  return {
    setters: [function (_utilities) {
      insertBeforeNode = _utilities.insertBeforeNode;
    }],
    execute: function () {
      DomStrategyLocator = (function () {
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

      _export('DomStrategyLocator', DomStrategyLocator);

      TableStrategy = (function () {
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
          insertBeforeNode(view, parent, parent.childNodes[1]);
        };

        TableStrategy.prototype.moveViewLast = function moveViewLast(view, scrollElement, childrenLength) {
          var parent = scrollElement.firstElementChild;
          insertBeforeNode(view, parent, parent.children[childrenLength]);
        };

        return TableStrategy;
      })();

      _export('TableStrategy', TableStrategy);

      DivStrategy = (function () {
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
          insertBeforeNode(view, scrollElement, scrollElement.childNodes[1]);
        };

        DivStrategy.prototype.moveViewLast = function moveViewLast(view, scrollElement, childrenLength) {
          insertBeforeNode(view, scrollElement, scrollElement.children[childrenLength]);
        };

        return DivStrategy;
      })();

      _export('DivStrategy', DivStrategy);
    }
  };
});