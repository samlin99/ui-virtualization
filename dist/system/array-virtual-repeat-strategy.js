System.register(['aurelia-templating-resources/array-repeat-strategy', 'aurelia-templating-resources/repeat-utilities'], function (_export) {
  'use strict';

  var ArrayRepeatStrategy, createFullOverrideContext, updateOverrideContexts, updateOverrideContext, updateOneTimeBinding, ArrayVirtualRepeatStrategy;

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  return {
    setters: [function (_aureliaTemplatingResourcesArrayRepeatStrategy) {
      ArrayRepeatStrategy = _aureliaTemplatingResourcesArrayRepeatStrategy.ArrayRepeatStrategy;
    }, function (_aureliaTemplatingResourcesRepeatUtilities) {
      createFullOverrideContext = _aureliaTemplatingResourcesRepeatUtilities.createFullOverrideContext;
      updateOverrideContexts = _aureliaTemplatingResourcesRepeatUtilities.updateOverrideContexts;
      updateOverrideContext = _aureliaTemplatingResourcesRepeatUtilities.updateOverrideContext;
      updateOneTimeBinding = _aureliaTemplatingResourcesRepeatUtilities.updateOneTimeBinding;
    }],
    execute: function () {
      ArrayVirtualRepeatStrategy = (function (_ArrayRepeatStrategy) {
        _inherits(ArrayVirtualRepeatStrategy, _ArrayRepeatStrategy);

        function ArrayVirtualRepeatStrategy() {
          _classCallCheck(this, ArrayVirtualRepeatStrategy);

          _ArrayRepeatStrategy.apply(this, arguments);
        }

        ArrayVirtualRepeatStrategy.prototype.createFirstItem = function createFirstItem(repeat) {
          var overrideContext = createFullOverrideContext(repeat, repeat.items[0], 0, 1);
          var view = repeat.viewFactory.create();
          view.bind(overrideContext.bindingContext, overrideContext);
          repeat.viewSlot.add(view);
        };

        ArrayVirtualRepeatStrategy.prototype.instanceChanged = function instanceChanged(repeat, items) {
          var _this = this;

          if (repeat.viewsRequireLifecycle) {
            var removePromise = repeat.viewSlot.removeAll(true);
            if (removePromise instanceof Promise) {
              removePromise.then(function () {
                return _this._standardProcessInstanceChanged(repeat, items);
              });
              return;
            }
            this._standardProcessInstanceChanged(repeat, items);
            return;
          }
          this._inPlaceProcessItems(repeat, items);
        };

        ArrayVirtualRepeatStrategy.prototype._standardProcessInstanceChanged = function _standardProcessInstanceChanged(repeat, items) {
          for (var i = 1, ii = repeat.numberOfDomElements; i < ii; ++i) {
            var overrideContext = createFullOverrideContext(repeat, items[i], i, ii);
            var view = repeat.viewFactory.create();
            view.bind(overrideContext.bindingContext, overrideContext);
            repeat.viewSlot.add(view);
          }
        };

        ArrayVirtualRepeatStrategy.prototype._inPlaceProcessItems = function _inPlaceProcessItems(repeat, items) {
          var itemsLength = items.length;
          var viewsLength = repeat.viewSlot.children.length;
          var first = repeat.first;

          while (viewsLength > repeat.numberOfDomElements) {
            viewsLength--;
            repeat.viewSlot.removeAt(viewsLength, true);
          }

          var local = repeat.local;

          for (var i = 0; i < viewsLength; i++) {
            var view = repeat.viewSlot.children[i];
            var last = i === itemsLength - 1;
            var middle = i !== 0 && !last;

            if (view.bindingContext[local] === items[i + first] && view.overrideContext.$middle === middle && view.overrideContext.$last === last) {
              continue;
            }

            view.bindingContext[local] = items[i + first];
            view.overrideContext.$middle = middle;
            view.overrideContext.$last = last;
            var j = view.bindings.length;
            while (j--) {
              updateOneTimeBinding(view.bindings[j]);
            }
            j = view.controllers.length;
            while (j--) {
              var k = view.controllers[j].boundProperties.length;
              while (k--) {
                var binding = view.controllers[j].boundProperties[k].binding;
                updateOneTimeBinding(binding);
              }
            }
          }

          for (var i = viewsLength; i < repeat.numberOfDomElements; i++) {
            var overrideContext = createFullOverrideContext(repeat, items[i], i, itemsLength);
            var view = repeat.viewFactory.create();
            view.bind(overrideContext.bindingContext, overrideContext);
            repeat.viewSlot.add(view);
          }

          repeat._updateSizes();
        };

        ArrayVirtualRepeatStrategy.prototype.instanceMutated = function instanceMutated(repeat, array, splices) {
          if (repeat.viewsRequireLifecycle) {
            this._standardProcessInstanceMutated(repeat, array, splices);
            return;
          }
          this._updateViews(repeat, repeat.items, splices);
        };

        ArrayVirtualRepeatStrategy.prototype._standardProcessInstanceMutated = function _standardProcessInstanceMutated(repeat, array, splices) {
          var _this2 = this;

          var removeDelta = 0;
          var viewSlot = repeat.viewSlot;
          var rmPromises = [];

          for (var i = 0, ii = splices.length; i < ii; ++i) {
            var splice = splices[i];
            var removed = splice.removed;

            if (this._isIndexInViewSlot(viewSlot, splice.index)) {
              for (var j = 0, jj = removed.length; j < jj; ++j) {
                var viewOrPromise = viewSlot.removeAt(splice.index + removeDelta + rmPromises.length, true);

                var _length = viewSlot.children.length;
                var overrideContext = createFullOverrideContext(repeat, repeat.items[_length], _length, repeat.items.length);
                var view = repeat.viewFactory.create();
                view.bind(overrideContext.bindingContext, overrideContext);
                repeat.viewSlot.isAttached = false;
                repeat.viewSlot.add(view);
                repeat.viewSlot.isAttached = true;

                if (viewOrPromise instanceof Promise) {
                  rmPromises.push(viewOrPromise);
                }
              }
              removeDelta -= splice.addedCount;
            }
          }

          if (rmPromises.length > 0) {
            Promise.all(rmPromises).then(function () {
              _this2._handleAddedSplices(array, splices);
              repeat._updateViews(repeat, array, splices);
              repeat._updateSizes();
            });
          } else {
            this._handleAddedSplices(array, splices);
            this._updateViews(repeat, array, splices);
            repeat._updateSizes();
          }
        };

        ArrayVirtualRepeatStrategy.prototype._updateViews = function _updateViews(repeat, items, splices) {
          var numberOfDomElements = repeat.numberOfDomElements,
              viewSlot = repeat.viewSlot,
              first = repeat.first,
              totalAdded = 0,
              view,
              i,
              ii,
              j,
              marginTop,
              addIndex,
              splice,
              end,
              atBottom;
          repeat.items = items;

          for (i = 0, ii = viewSlot.children.length; i < ii; ++i) {
            view = viewSlot.children[i];
            view.bindingContext[repeat.local] = items[repeat.first + i];
            updateOverrideContext(view.overrideContext, repeat.first + i, items.length);
          }

          for (i = 0, ii = splices.length; i < ii; ++i) {
            splice = splices[0];
            addIndex = splices[i].index;
            end = splice.index + splice.addedCount;
            totalAdded += splice.addedCount;

            for (; addIndex < end; ++addIndex) {
              if (addIndex < first + numberOfDomElements && !atBottom) {
                marginTop = repeat.itemHeight * first + "px";
                repeat.virtualScrollInner.style.marginTop = marginTop;
              }
            }
          }

          if (items.length < numberOfDomElements) {
            var limit = numberOfDomElements - (numberOfDomElements - items.length) - 1;
            for (j = 0; j < numberOfDomElements; ++j) {
              repeat.virtualScrollInner.children[j].style.display = j >= limit ? 'none' : 'block';
            }
          }

          repeat._calcScrollViewHeight();
          repeat._calcIndicatorHeight();
          repeat.scrollIndicator();
        };

        ArrayVirtualRepeatStrategy.prototype._handleAddedSplices = function _handleAddedSplices(repeat, array, splices) {
          var spliceIndex = undefined;
          var spliceIndexLow = undefined;
          var arrayLength = array.length;
          for (var i = 0, ii = splices.length; i < ii; ++i) {
            var splice = splices[i];
            var addIndex = spliceIndex = splice.index;
            var end = splice.index + splice.addedCount;

            if (typeof spliceIndexLow === 'undefined' || spliceIndexLow === null || spliceIndexLow > splice.index) {
              spliceIndexLow = spliceIndex;
            }

            for (; addIndex < end; ++addIndex) {
              var overrideContext = createFullOverrideContext(repeat, array[addIndex], addIndex, arrayLength);
              var view = repeat.viewFactory.create();
              view.bind(overrideContext.bindingContext, overrideContext);
              repeat.viewSlot.insert(addIndex, view);
            }
          }

          return spliceIndexLow;
        };

        ArrayVirtualRepeatStrategy.prototype._isIndexInViewSlot = function _isIndexInViewSlot(viewSlot, index) {
          if (viewSlot.children.length === 0) {
            return false;
          }

          var indexLow = viewSlot.children[0].overrideContext.$index;
          var indexHi = viewSlot.children[viewSlot.children.length - 1].overrideContext.$index;

          return index >= indexLow && index <= indexHi;
        };

        return ArrayVirtualRepeatStrategy;
      })(ArrayRepeatStrategy);

      _export('ArrayVirtualRepeatStrategy', ArrayVirtualRepeatStrategy);
    }
  };
});