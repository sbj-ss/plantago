(function(jq) {
  // Node attributes tracking
  function attrToOptionBridge(target, name, newValue) 
  {
    const targetWrapper = $(target);
    if (targetWrapper.data("plantagoWidgetName")) // объект инициализирован
      targetWrapper.callPlantagoWidget("setOptionByAttr", name, newValue);
  }

  const mutationObserverBase = window.MutationObserver 
    || window.WebKitMutationObserver
    || window.MozMutationObserver;
  const globalObserver = mutationObserverBase? new mutationObserverBase(function(records, observerInstance) {
    $.each(records, (index, record) => {
      if (record.type === "attributes")                            
        attrToOptionBridge(record.target, record.attributeName, undefined);
    });
  }): null;

  const DAMSupported = globalObserver? false: (function() {
    const d = document.createElement("div");
    let flag = false;

    if (d.addEventListener)
      d.addEventListener("DOMAttrModified", function() {
        flag = true;
      }, false);
    else if (d.attachEvent)
      d.attachEvent("onDOMAttrModified", function() {
        flag = true;
      });
    else 
      return false;
    d.setAttribute("id", Math.random());
    return flag;
  }) ();

  jq.fn.extend({
    eachWithContainer: function(callback)
    {
      this.each(plantago.curryRight(callback, this));
    },

    _ancestorOrSelf: function(selector, startFromSelf)
    {
      const s = new Set();
      this.each((i, el) => {
        el = $(el);
        if (!startFromSelf)
          el = el.parent();
        while (el.length)
        {
          if (el.is(selector))
          {
            s.add(el);
            break;
          }
          el = el.parent();
        }
      });
      return $().push(s);
    },

    ancestor: function(selector)
    {
      return this._ancestorOrSelf(selector, false);
    },

    ancestorOrSelf: function(selector)
    {
      return this._ancestorOrSelf(selector, true);
    },

    trackAttributeChange: function()
    {
      if (globalObserver)
        return this.each(function() {
          globalObserver.observe(this, {
            attributes: true,
            characterData: false,
            childList: false,
            subtree: false,
            attributeOldValue: false
          });
        });
      else if (DAMSupported) 
        return this.on("DOMAttrModified", function(e) { 
          attrToOptionBridge(e.target, e.attrName, e.newValue);
        });
      else // old IE, use onpropertychange and window.event
        return this.on("propertychange", function(e) {
          attrToOptionBridge(this, window.event.propertyName, window.event.newValue);
        });
    },

    untrackAttributeChange: function()
    {
      if (globalObserver)
        return this; // отцепить наблюдатель от отдельных узлов, как ни странно, нельзя
      else if (DAMSupported) 
        return this.off("DOMAttrModified");
      else
        return this.off("propertychange");
    },

    // uses first node in container, returns added fragment
    appendFetchedFragment: function(data, newerFirst)
    {
      const content = $.isXMLDoc(data)? $(data).children(): $(data);
      if (!content.length)
        return this;
      eval(content.find("script").html());
      const postloadFunction = content.attr("postload");
      const container = $(this).eq(0).switchCall(newerFirst, ["append", "prepend"], content);
      if (postloadFunction && window[postloadFunction])
        window[postloadFunction].call(window, container, content);
      return content;
    },

    // adds anything (selector, DOM nodes, jq, array, hash values) to the _existing_ object.
    // can handle arbitrary argument count.
    push: function() 
    { 
      for (let arg of arguments)
      {
        if (!arg) // тип можно не проверять
          continue;
        else if (typeof(arg) === "string")
          this.push($(arg));
        else if ($.isArray(arg) || arg instanceof $)
          for (let el of arg)
            this.push(el);
        else if ($.isPlainObject(arg)) {
            for (let key in arg) 
              this.push(arg[key]);
        } else if (arg instanceof Set || arg instanceof Map)
            for (let e of arg.entries())
              this.push(e[1]);
        else if (arg.nodeType || $.isWindow(arg))
          this[this.length++] = arg;        
      }
      return this;
    },

    // reads/modifies only text nodes instead of replacing the whole content as .text() does
    ownText: function(newText)
    {
      if (typeof(newText) !== "undefined")
        return this.each(function() { 
          if (!$(this)
            .contents()
            .filter(function() {
              return (this.nodeType === 3);
            })
            .replaceWith(document.createTextNode(newText))
            .length)
              $(this).append(document.createTextNode(newText));
        });
      else {
        let txt = "";
        $(this[0])
          .contents()
          .filter(function() {
            return (this.nodeType === 3);
          })
          .each(function() {
            txt += this.nodeValue;
          });
        return txt;
      }
    },

    swapWith: function(el)
    {
      // TODO what if sets overlap?
      if (!el)
        return this.remove();
      if (!el.jquery)
        el = $(el);
      let six = el.prev();
      if (six.length)
      {
        if (six.is(this))
          return this.insertAfter(el); 
        el.insertBefore(this);
        return this.insertAfter(six);
      }
      six = el.next();
      if (six.length)
      {
        if (six.is(this))
          return this.insertBefore(el);
        el.insertBefore(this);
        return this.insertBefore(six);
      }
      six = el.parent();
      myParent = this.parent();
      if (six.length && myParent.length)
        el.appendTo(myParent);
        return this.appendTo(six);
      console.log("Can't swap nodes without parents!");
      return this;
    },

    quickSort: function(getter, comparer, sameParent)
    {
      if (this.length <= 1)
        return this;
      if (typeof(getter) === "undefined")
        getter = function(o) {
          return o.text();
        };
      if (typeof(comparer) === "undefined")
        comparer = function(a, b)
        {
          if (a > b) return 1; 
          if (a < b) return -1;
          return 0;
        };
      // prefetch all values
      let values = [];
      for (let i = 0; i < this.length; i++)
        values[i] = getter(this.eq(i));
      // based on https://www.nczonline.net/blog/2012/11/27/computer-science-in-javascript-quicksort/
      const partition = function(items, left, right)
      {
        let pivot   = values[Math.floor((right + left) / 2)],
            i       = left,
            j       = right;
        while (i <= j) 
        {
          while (comparer(values[i], pivot) === -1)
            i++;
          while (comparer(values[j], pivot) === 1)
            j--;
          if (i <= j) 
          {
            plantago.swapArrayItems(items, i, j);  // swap within array
            plantago.swapArrayItems(values, i, j); // swap values order
            if (!sameParent)
              items.eq(i).swapWith(items.eq(j));   // swap DOM tree positions
            i++;
            j--;
          }
        }
        return i;
      };
      const quickSort = function(items, left, right)
      {
        if (items.length > 1) 
        {
          const index = partition(items, left, right);
          if (left < index - 1)
            quickSort(items, left, index - 1);
          if (index < right) 
            quickSort(items, index, right);
        }
      }
      quickSort(this, 0, this.length - 1);
      return this;
    },

    // nodes aren't checked for they really have the same parent
    quickSortSameParent: function(getter, comparer)
    {
      if (this.length <= 1)
        return this;
      let six = this.eq(0).prev();
      if (six.length)
        return this.detach().quickSort(getter, comparer, true).insertAfter(six);
      six = this.eq(this.length - 1).next();
      if (six.length)
        return this.detach().quickSort(getter, comparer, true).insertBefore(six);
      six = this.eq(0).parent();
      if (six.length)
        return this.detach().quickSort(getter, comparer, true).appendTo(six);
      return this.quickSort(getter, comparer);
    },

    shuffle: function(sameParent)
    {
      if (this.length <= 1)
        return this;
      // Durstenfeld algorithm
      for (let i = this.length - 1; i >= 1; i--)
      {
        const j = Math.floor((Math.random() - .0001)*(i+1));
        plantago.swapArrayItems(this, i, j);
        if (!sameParent)
          this.eq(i).swapWith(this.eq(j));
      }
      return this;
    },

    shuffleSameParent: function()
    {
      if (this.length <= 1)
        return this;
      let six = this.eq(0).prev();
      if (six.length)
        return this.detach().shuffle(true).insertAfter(six);
      six = this.eq(this.length - 1).next();
      if (six.length)
        return this.detach().shuffle(true).insertBefore(six);
      six = this.eq(0).parent();
      if (six.length)
        return this.detach().shuffle(true).appendTo(six);
      return this.shuffle();
    },

    // Искусственно выстраиваемая RTTI. Каждый "несущий" элемент виджетов получает data вида plantagoClass-имякласса;
    // каждый класс, наследующий от plantago.root, приписывает "несущему" элементу data plantagoWidgetName.
    // Это позволяет найти все наследованные классы по базовому и вызвать методы базового класса на полученной
    // коллекции, не дублируя поиск и вызов на каждый производный класс.

    // инициализация виджета по атрибуту bhvAttr (по умолчанию - bhv)
    createPlantagoWidget: function(options, bhvAttr)
    {
      const queueExists = !!window.postInitQueue;
      if (!queueExists)
        window.postInitQueue = [];
      this.each(function() {
        const carrier = $(this);
        let behavior;
        if (cfgNonstandardAttrCompat)
          behavior = carrier.attr(bhvAttr || "bhv");
        else
          behavior = carrier.data(bhvAttr || "bhv");
        if (behavior)
        {
          if (carrier[behavior])
            carrier[behavior].call(carrier, options);
          else
            plantago.debugLog("ERROR cannot create widget \"" + behavior + "\": no definition");
        }
      });
      if (!queueExists)
      {
        $.each(window.postInitQueue, (index, callback) => {
          callback.call();
        });
        window.postInitQueue = undefined;
      }
      return this;
    },

    // возвращает рез-т выполнения метода первого объекта коллекции
    callSinglePlantagoWidget: function()
    {
      if (!this.length)
        return undefined;
      const wrapper = $(this.get(0));
      const className = wrapper.data("plantagoWidgetName"); // e.g. "groupLeaf"
      const instanceMethod = wrapper[className]; // e.g. $.groupLeaf()      
      return instanceMethod.apply(wrapper, arguments); // e.g. $(this).groupLeaf("method", "param1", ...)
    },

    // вызывает метод каждого экземпляра коллекции
    callPlantagoWidget: function()
    {
      const argumentsToPass = arguments;
      return this.each(function() { 
        const wrapper = $(this);
        const className = wrapper.data("plantagoWidgetName");
        const instanceMethod = wrapper[className];
        if (instanceMethod) // объект мог быть уничтожен
          instanceMethod.apply(wrapper, argumentsToPass);
      });
    },

    // является ли первый узел коллекции виджетом
    isPlantagoWidget: function(widgetSelector)
    {
      // this.data() возвращает только значения, ассоц. с первым узлом
      switch(typeof(widgetSelector))
      {
        case "undefined": return !!this.data("plantagoWidgetName");
        case "string":    return !!this.data("plantagoClass-" + widgetSelector);
        case "object": 
          if ($.isArray(widgetSelector))
          {
            for (let ws of widgetSelector)
              if (this.data("plantagoClass-" + ws))
                return true;
            return false;
          }
      }
    },

    // поиск ближайших узлов (включая себя), несущих виджеты
    getNearestPlantagoDOS: function(widgetSelector)
    {
      const ret = $();
      this.each(function() {
        const t = $(this);
        if (t.isPlantagoWidget())
          ret.push(this);
        else
          ret.push(t.children().getNearestPlantagoDOS(widgetSelector));
      });
      return ret;
    },

    // поиск ближайших детей, несущих виджеты
    getNearestPlantagoDescendants: function(widgetSelector)
    {
      const ret = $();
      this.each(function() {
        ret.push($(this).children().getNearestPlantagoDOS(widgetSelector));
      });
      return ret;
    },

    // поиск ближайших родителей, несущих виджеты
    getNearestPlantagoAncestor: function(widgetSelector)
    {
      return this.parent().getNearestPlantagoAOS(widgetSelector);
    },

    // поиск ближайших родителей (включая себя), несущих виджеты
    getNearestPlantagoAOS: function(widgetSelector)
    {
      if (this.isPlantagoWidget(widgetSelector))
        return this;
      else
        return this.getNearestPlantagoAncestor(widgetSelector);
    },

    // условный вызов: пишем полную цепочку, не разрывая if'ами
    // if (cond) a.f(1); a.g(); -> a.condCall(cond, "f", 1).g()
    condCall: function(condition, method)
    {
      return condition? this[method].apply(this, Array.prototype.slice.call(arguments, 2)): this;
    },

    // вызов с ветвлением, чтобы не разводить индексы по тернарному оператору
    // a.[show? "show": "hide"].call(a) -> a.switchCall(show, ["hide", "show"]);
    switchCall: function(condition, options) 
    {
      const opt = options[condition] || options[condition | 0];
      return opt? this[opt].apply(this, Array.prototype.slice.call(arguments, 2)): this;
    }
  });
}) (jQuery);
