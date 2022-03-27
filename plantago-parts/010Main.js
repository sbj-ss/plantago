var plantago = {
  // заморозка объекта
  makeConstant: function(o)
  {
    if (Object.freeze)
      Object.freeze(o);
    return o;
  },

  swapArrayItems: function(v, a, b)
  {
    let tmp = v[a];
    v[a] = v[b];
    v[b] = tmp;
  },

  // для динамической подгрузки
  injectScripts: function(arr)
  {
    $.each(arr, function(index, value) {
      if (!$("head > script[src='" + value + "']").length)
        $("<script>", {
          src: value
        }).appendTo(document.body); // не document.head: IE8 не понимает
    });
  },

  injectStyleSheets: function (arr)
  {
    $.each(arr, function(index, value) {
      if (!$("link[rel='stylesheet'][href='" + value + "']").length)
        // $("<link>", { ... }) не работает в IE8
        $("<link rel='stylesheet' type='text/css' href='" + value + "'/>").appendTo("head"); 
     });
  },

  // Отладочное сообщение
  debugLog: function()
  {
    if (window.console && window.console.log)
      console.log.apply(console, arguments);
    else { // картошку без батьки перебрать не могут
      let cumulativeString = "";
      for (let i = 0; i < arguments.length; i++)
        cumulativeString += arguments[i].toString() + " "; 
      uiAlert.call(window, cumulativeString);
    }
  },

  uiAlert: function(msg)
  {
    alert(msg);
  },

  uiConfirm: function(msg)
  {
    return confirm(msg);
  },

  uiPrompt: function(msg)
  {
    return prompt(msg);
  },

  // преобразование данных для наследников basicInput.
  // вход: массив хэшей "имя эл-та": значение, где значение - строка или хэш (для составных эл-тов ввода).
  // выход: хэш с набором значений того же типа.
  mergeInputData: function(rawData)
  {
    let ret = {};
    if (!$.isArray(rawData))
      return ret;
    for (let i = 0; i < rawData.length; i++)
    {
      let inputAtom = rawData[i];
      for (let name in inputAtom) // теоретически здесь одна пара
      {
        if (ret[name] && $.isPlainObject(inputAtom[name]))
          $.extend(ret[name], inputAtom[name]);
        else
          ret[name] = inputAtom[name]; // строки перезаписываются
      }
    }
    return ret;
  },

  // случайный 16-байтный идентификатор в binary-записи
  // плохо то, что random(), как правило, генерирует ПСЕВДОслучайную последовательность,
  // в которой все члены однозначно определяются первым. надёжность сомнительна.
  newId128: function()
  {
    let four = function() {
      let ret = ((Math.random()*0x100000000) | 0).toString(0x10); // FF любезно цифрует дробную часть, | 0
      ret = ret.replace("-", "0");
      switch(ret.length)
      {
        case 9: return ret.substring(0, 8); // random === 1.0, известный баг
        case 8: return ret;
        default: return ("0").repeat(8 - ret.length) + ret; // padding
      }
    }
    return "0x" + four() + four() + four() + four();
  },

  atom2str: function(v)
  {
    if (typeof(v) !== "undefined")
      return v.toString();
    return "";
  },

  // отладка
  any2str: function(c, format, indent)
  {
    indent = indent || 0;
    let pad = function(extra)
    {
      return format? " ".repeat(indent + (extra || 0)): "";
    }, br = function() {
      return format? "\n": "";
    };
    switch(typeof(c))
    {
      case "undefined": 
        return pad() + "undefined";
      case "string":
        return pad() + '"' + c + '"';
      case "number":
      case "boolean":
        return pad() + c.toString();
      case "object":
        // todo тут надо бы собирать строки в массив, а потом склеивать - они immutable и начинается O(n^2)
        if (!c)
          return null;
        if ($.isArray(c))
        {
          let s = pad() + "[";
          for (let i = 0; i < c.length; i++)
            s += (i? ", ": "") + br() + pad() + plantago.any2str(c[i], format, indent);
          return s + br() + pad() + "]"; 
        }
        if ($.isPlainObject(c))
        {
          let s = pad() + "{";
          let i = 0;
          for (let key in c)
             s += (i++? ", ": "") + br() + pad(1) + key + ":" + plantago.any2str(c[key], format, indent + 1);
          return s + br() + pad() + "}";
        }
        return pad() + "??: " + c.toString();
      default:
        return pad() + typeof(c) + '"' + c.toString() + '"';
    }
  },

  // для виджетов
  imagePaths: {},

  getImagePath: function(img)
  {
    if (typeof(plantago.imagePaths[img]) === "undefined")
      plantago.debugLog("WARNING image path for \"" + img + "\" not found");
    return plantago.imagePaths.root + plantago.imagePaths[img];
  },

  localization: {},
  
  addDefaultLocalization: function(txt)
  {
    if ($.isArray(txt))
    {
      for (let i = 0; i < txt.length; i++)
        if (typeof(plantago.localization[txt[i]]) === "undefined")
          plantago.localization[txt[i]] = txt[i];
    } else if (typeof(plantago.localization[txt]) === "undefined")
      plantago.localization[txt] = txt;
    return plantago;
  },

  localize: function(s)
  {
    let loc = plantago.localization[s];
    if (!loc)
      plantago.debugLog("WARNING no localization for \"" + s + "\" found");
    return loc || s;
  },

  // требуется некое универсальное решение для JSON. частные фокусы вида grpAddBla-bla приносят слишком мало пользы.
  // идея "фабрик" из термогенеза не слишком красива их навешиванием на прототипы виджетов - хотя код и собран
  // в одно место, но доступ к нему неудобен; кроме того, механизм несистемен.
  // положим следующее:
  // 1. есть универсальный мех-м построения структур произвольной сложности из JSON, лежащий за пределами виджетов;
  // 2. т.к. для создания виджета нужен "несущий эл-т", и тип узла DOM может быть разным, используем явное задание
  //    этой информации при необходимости. по умолчанию предположим div как наиболее универсальный;
  // 3. в общем виде вполне достаточно перебросить все не имеющие специального значения пары k-v напрямую конструктору
  //    либо в атрибуты узла (второе универсальнее, но замедляет работу). заложим переключатель;
  // 4. если виджет слишком сильно выпадает за вышеизложенные рамки, оставим возможность перекрыть его создание полностью.
  defaultWidgetJsonConstructor: function(hash, node, bindToAttrs)
  {
    node.createPlantagoWidget(bindToAtts? undefined: hash);
  },

  createElementFromJson: function(hash, parent, bindToAttrs, createWidgets)
  {
    if (!parent)
    {
      parent = hash.parent;
      bindToAttrs = hash.bindToAttrs;
      createWidgets = hash.createWidgets;
      hash = hash.hash;
    }
    let elName = hash.elementName || plantago.widgetElementNames[hash.bhv] || "div";
    let nodeDesc = "<" + elName;
    if (bindToAttrs || !hash.bhv) // для обычных узлов разметки атрибуты придётся записать явно
      for (k in hash)
        if ((k != "elementName") && (k != "children"))
          nodeDesc += " " + k + "='" + hash[k] + "'";
    nodeDesc += ">";
    let node = $(nodeDesc).appendTo(parent);
    hash.children && plantago.createElementListFromJson(hash.children, node, bindToAttrs, createWidgets);
    if (hash.bhv)
    {
      node.data("bhv", hash.bhv)
      let constructor = plantago.widgetJsonConstructors[hash.bhv] || plantago.defaultWidgetJsonConstructor;
      constructor(hash, node, bindToAttrs);
    }
    return node;
  },

  createElementListFromJson: function(array, parent, bindToAttrs, createWidgets)
  {
    if (!parent)
    {
      parent = array.parent;
      bindToAttrs = array.bindToAttrs;
      createWidgets = array.createWidgets;
      array = array.array;
    }
    if ($.isArray(array))
      for (let i = 0; i < array.length; i++)
        plantago.createElementFromJson(array[i], parent, bindToAttrs, createWidgets);
    else // пришёл pO на один узел
      plantago.createElementFromJson(array, parent, bindToAttrs, createWidgets);
  },

  widgetElementNames: {},

  widgetJsonConstructors: {},

  // раз назвали антидребезгом - пущай им и будет
  debounce: function(interval, handler)
  {
    return (function() {
      let intervalId;
      return function() {
        if (intervalId)
          clearTimeout(intervalId);
        const that = this;
        intervalId = setTimeout(function() {
          handler.call(that);
        }, interval);
      }
    })();
  },

  curryLeft: function(f, ...extra)
  {
    return function(...params)
    {
      return f(...extra.concat(params));
    };
  },

  curryRight: function(f, ...extra)
  {
    return function(...params)
    {
      return f(...params.concat(extra));
    };
  },

  memberwiseCompare: function(a, b)
  {
    if (typeof a !== typeof(b))
      return false;
    if (typeof a === "number" && typeof b === "number" && isNaN(a) && isNaN(b))
      return true;
    if (typeof a === "object")
    {
      if (typeof b === "object")
        return plantago.compareHashes(a, b);
      return false;
    }
    if ($.isArray(a))
    {
      if ($.isArray(b))
        return plantago.compareArrays(a, b);
      else 
        return false;
    }
    return (a == b);
  },
 
  compareHashes: function(a, b)
  {
    if (a === null && b === null)
      return true;
    if (a === null || b === null)
      return false;
    const knownKeys = Object.keys(a).sort();
    const testKeys = Object.keys(b).sort();
    if (knownKeys.length !== testKeys.length)
      return false;

    for (let i = 0; i < knownKeys.length; i++)
    {
      const knownKey = knownKeys[i];
      const testKey = testKeys[i];
      if (knownKey != testKey)
        return false;
      if (!plantago.memberwiseCompare(a[knownKey], b[knownKey]))
        return false;
    }
    return true;
  },

  compareArrays: function(a, b)
  {
    if (a.length !== b.length)
      return false;
    for (let i = 0; i < a.length; i++)
      if (!plantago.memberwiseCompare(a[i], b[i]))
        return false;
    return true;
  },

  // навешивание чего попало на Object.prototype приводит к дурным глюкам
  sliceObject: function(obj, ...keys) 
  {
    if ($.isArray(keys[0]))
      keys = keys[0];
    return keys.reduce((result, key) => {
      result[key] = obj[key];
      return result;
    }, {});
  },

  reduceObject: function(obj, fn, initialState)
  {
    let state = initialState;
    for (let k in obj)
      state = fn(state, obj[k], k);
    return state;
  },

  mapObject: function(obj, fn)
  {
    const ret = {};
    for (let k in obj)
      ret[k] = fn(obj[k], k);
    return ret;
  },

  chain: function(...members)
  {
    return function(...args)
    {
      for (let m of members)
        m(...args);
    }
  },

  parseBool: function(s, dflt)
  {
    if (typeof s === "undefined")
      return dflt;
    if (typeof s === "number")
      return !!s;
    if (typeof s === "boolean")
      return s;
    if (s === null)
      return false;
    if (typeof s === "object")
      return true;
    if (typeof s !== "string")
      return dflt;
    if (s.search(/_t|true|yes/i) >= 0)
      return true;
    if (s.search(/_f|false|no/i) >= 0)
      return false;
    let n = parseInt(s);
    if (!isNaN(n))
      return !!n;
    return dflt;
  }
};

var П = plantago;
