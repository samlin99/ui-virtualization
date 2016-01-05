export function calcOuterHeight(element){
  var height;
  height = element.getBoundingClientRect().height;
  height += getStyleValue(element, 'marginTop');
  height += getStyleValue(element, 'marginBottom');
  return height;
}

export function calcScrollHeight(element){
  var height;
  height = element.getBoundingClientRect().height;
  height -= getStyleValue(element, 'borderTopWidth');
  height -= getStyleValue(element, 'borderBottomWidth');
  return height;
}

export function insertBeforeNode(view, scrollView, node) {
  let viewStart = view.firstChild;
  let element = viewStart.nextSibling;
  let viewEnd = view.lastChild;  

  scrollView.insertBefore(viewEnd, node);
  scrollView.insertBefore(element, viewEnd);
  scrollView.insertBefore(viewStart, element);
}

function getStyleValue(element, style){
  var currentStyle, styleValue;
  currentStyle = element.currentStyle || window.getComputedStyle(element);
  styleValue = parseInt(currentStyle[style]);
  return Number.isNaN(styleValue) ? 0 : styleValue;
}
