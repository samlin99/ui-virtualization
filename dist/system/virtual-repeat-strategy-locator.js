System.register(['aurelia-templating-resources/repeat-strategy-locator', './array-virtual-repeat-strategy'], function (_export) {
  'use strict';

  var RepeatStrategyLocator, ArrayVirtualRepeatStrategy, VirtualRepeatStrategyLocator;

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  return {
    setters: [function (_aureliaTemplatingResourcesRepeatStrategyLocator) {
      RepeatStrategyLocator = _aureliaTemplatingResourcesRepeatStrategyLocator.RepeatStrategyLocator;
    }, function (_arrayVirtualRepeatStrategy) {
      ArrayVirtualRepeatStrategy = _arrayVirtualRepeatStrategy.ArrayVirtualRepeatStrategy;
    }],
    execute: function () {
      VirtualRepeatStrategyLocator = (function (_RepeatStrategyLocator) {
        _inherits(VirtualRepeatStrategyLocator, _RepeatStrategyLocator);

        function VirtualRepeatStrategyLocator() {
          _classCallCheck(this, VirtualRepeatStrategyLocator);

          _RepeatStrategyLocator.call(this);
          this.matchers = [];
          this.strategies = [];

          this.addStrategy(function (items) {
            return items instanceof Array;
          }, new ArrayVirtualRepeatStrategy());
        }

        return VirtualRepeatStrategyLocator;
      })(RepeatStrategyLocator);

      _export('VirtualRepeatStrategyLocator', VirtualRepeatStrategyLocator);
    }
  };
});