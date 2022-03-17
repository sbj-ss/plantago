if (typeof(plantago.imagePaths.root) === "undefined")
  plantago.imagePaths.root = "/Icons";

$(function() {  
//--------------------------------
// Базовый класс для всех виджетов
//--------------------------------
  $.widget("plantago.root",
  {
    options:
    {
      cssClass: "",
      stateSave: false,
      stateOptions: [],
      stateKeys: ["id"]
    },

    _trackAttributes: true,
    _trackHtmlAttributes: false,

    _getPrototype: function()
    {
      return $.plantago[this.widgetName].prototype;
    },

    _typecastValue: function(targetTypeInstance, value)
    {
      if (typeof(targetTypeInstance) === typeof(value))
        return value;
      switch (typeof(targetTypeInstance))
      {
        case "number": 
          return parseFloat(value);
        case "string":
          return value;
        case "boolean":
          if (value == "" || value == "0" || value == "false" || value == 0.0)
            return false;
          return true;
        case "object":
          return JSON.parse(value); // никакого уважения к старой структуре :(
        case "function":
          return new Function("event", "data", value);
        default:
          return undefined; // что я забыл?..
      }
    },

    _getCreateOptions: function(existing)
    {
      // this.prototype - undefined
      const defaults = this._getPrototype().options;
      const overrides = existing || {};
      for (let opt in this.options)
      {    
        // если параметр задан в конструкторе, он имеет приоритет
        if ((typeof(this.options[opt]) !== "undefined") && !plantago.memberwiseCompare(this.options[opt], defaults[opt]))
          continue;
        let override = this.element.data(opt);
        if ((typeof(override) === "undefined") && cfgNonstandardAttrCompat)
          override = this.element.attr(opt);
        if (typeof(override) !== "undefined")
        {
          const newValue = this._typecastValue(defaults[opt], override);
          if (typeof(newValue) !== "undefined") 
            overrides[opt] = newValue;
        }
      }
      return overrides;
    },  

    setOptionByAttr: function (name, newValue) 
    {
      if (!this._trackAttributes)
        return;
      newValue = newValue || this.element.attr(name);
      let initialValue;
      if (name.indexOf("data-") === 0)
        name = name.substring(5);      
      else if (!this._trackHtmlAttributes && !cfgNonstandardAttrCompat) 
        return;
      if ($.isXMLDoc(document)) // регистр сохраняется, не надо искать
      {
        initialValue = this._getPrototype().options[name];
        if (typeof(initialValue) !== "undefined")
          this._setOption(name, this._typecastValue(initialValue, newValue)); 
        return;
      }
      const that = this;
      $.each(this.options, function(option, optValue) { // поиск с точностью до регистра
        if (option.toLowerCase() === name.toLowerCase())
        {
          initialValue = that._getPrototype().options[option];
          that._setOption(option, that._typecastValue(initialValue, newValue));
          return false; // break
        }
      });
      return this;
    },

    _enableAttributeTracking: function()
    {
      this._trackAttributes = false;
      return this;
    },

    _disableAttributeTracking: function()
    { 
      this._trackAttributes = true;
      return this;
    },

    _setAttributeWithoutTracking: function(name, value)
    {
      this._disableAttributeTracking();
      this.element.attr(name, value);
      this._enableAttributeTracking();
      return this;
    },

    _collectState: function()
    {
      return plantago.sliceObject(this.options, ...this.options.stateOptions);
    },

    _getStateId: function(suffix)
    {
      for (let k of this.options.stateKeys)
      {
        const sk = this.options[k] || this.element.prop(k) || this.element.attr(k) || this.element.data(k);
        if (sk)
          return sk + (suffix? "#" + suffix: "");
      }
      console.log("WARNING: can't deduce state key for this widget!", this.element, this);
      return null;
    },

    _getStateKey: function(suffix)
    {
      const id = this._getStateId(suffix);
      return id? window.location.pathname + "#" + id: null;
    },

    _saveState: function(suffix)
    {
      const state = this._collectState();
      window.localStorage.setItem(this._getStateKey(suffix), JSON.stringify(this._collectState()));
    },

    saveState: function()
    {
      if (this.options.stateSave)
        this._saveState();
    },

    _getSavedState: function(suffix)
    {
      let opts = window.localStorage.getItem(this._getStateKey(suffix));
      if (opts)
        opts = JSON.parse(opts);
      return opts;
    },

    loadState: function(suffix)
    {
      const opts = this._getSavedState(suffix);
      if (opts)
        this._setOptions(opts);
      return opts;
    },

    resetState: function()
    {
      if (this.options.stateSave)
        this.loadState("default");
    },

    _create: function()
    {
      this.element
        .addClass(this.options.cssClass)
        .data("plantagoWidgetName", this.widgetName)
        .data("plantagoClass-root", 1);
      if (cfgTrackAttributes && this._trackAttributes)
      {
        this.element.trackAttributeChange();
        this._attrTrackingInstalled = true;
      }
    },

    // по смыслу мы должны подчитать состояние, когда уже отработал дочерний конструктор
    // логичнее сделать это здесь, чем требовать подчитывание от дочернего
    _init: function()
    {
      if (this.options.stateSave && !this._stateLoaded)
      {
        this._saveState("default");
        this.loadState();
        this._stateLoaded = true;
      }
    },

    _setOption: function(key, value)
    {
      if (key == "cssClass")
        this.element
         .removeClass(this.options.cssClass)
         .addClass(value);
      return this._superApply(arguments);
    },

    _selectChild: function(selectorOrJq)
    {
      return selectorOrJq.jquery? selectorOrJq: this.element.find(selectorOrJq);
    },

    _tieElement: function(desc)
    {
      // name, elementName, cssClass, selector, [creationProps], [owner], [makeFirst | after | before], [createWidget]
      if (!desc.name)
        return desc.returnElement? null: this;
      if (this[desc.name] && !desc.forceSearch)
        return desc.returnElement? this[desc.name]: this;
      if (desc.owner && !desc.owner.jquery)
        desc.owner = $(desc.owner);
      let probe = (desc.owner || this.element).children(desc.selector);
      if (!probe.length)
      {
        probe = $("<" + desc.elementName + ">", desc.creationProps);
        if (desc.makeFirst)
          (desc.owner || this.element).prepend(probe);
        else if (desc.after)
          probe.insertAfter(desc.after);
        else if (desc.before)
          probe.insertBefore(desc.before);
        else
          (desc.owner || this.element).append(probe);
        probe.data("autoCreated", 1);
      }
      const woUnderscore = desc.name? (
        desc.name[0] === "_"? desc.name.substring(1): desc.name // "_content" -> "content"
      ): null;
      if (desc.cssClass !== false)
      {
        const deducedClass = typeof(desc.cssClass) === "string"? desc.cssClass: woUnderscore;
        if (deducedClass) 
        {
          probe.data("enforcedCssClass", deducedClass);
          probe.addClass(deducedClass);
        }
      }
      if (desc.setName)
      {
        const nameAttr = (typeof(desc.setName) === "string")? desc.setName: woUnderscore;
        if (nameAttr)
        {
          probe.data("originalName", probe.attr("name"));
          probe.attr("name", nameAttr); 
        }
      }
      if (desc.createWidget && !probe.data("plantagoWidgetName"))
        probe.createPlantagoWidget();
      if (!this._tiedElements)
        this._tiedElements = {};
      this[desc.name] = this._tiedElements[desc.name] = probe;
      return desc.returnElement? probe: this;
    },

    _untieElement: function(name)
    {
      if (!this._tiedElements) 
        return this;
      const el = this._tiedElements[name];
      if (!el)
        return this;
      if (el.isPlantagoWidget())
        el.callPlantagoWidget("destroy");
      if (el.data("autoCreated"))
        el.remove();
      else {
        el
          .removeClass(el.data("enforcedCssClass"))
          .attr("name", el.data("originalName"))
          .removeData("enforcedCssClass")
          .removeData("originalName");
      }        
      delete this._tiedElements[name];
      delete this[name];
      return this;
    },

    _untieElements: function(els)
    {
      if ($.isArray(els))
        for (let name in (els || this._tiedElements))
          this._untieElement(name);
      else if (typeof els === "string")
        this._untieElement(els);
      else if ($.isPlainObject(els)) {
        if (els.startsWith)
          for (let name in this._tiedElements)
            if (name.startsWith(els.startsWith))
              this._untieElement(name);
        if (els.endsWith)
          for (let name in this._tiedElements)
            if (name.endsWith(els.endsWith))
              this._untieElement(name);
        if (els.filter)
          for (let name in this._tiedElements)
            if (els.filter(name, this._tiedElements[name]))
              this._untieElement(name);
        if (els.regex)
        {
          const re = new RegExp(els.regex);
          for (let name in this._tiedElements)
            if (re.exec(name))
              this._untieElement(name);
        }
      }
      return this;
    },
 
    _delayUntilWidgetsCreation: function(callback)
    {
      if (!window.postInitQueue)
        return this;
      if (typeof(callback) === "function")
        postInitQueue.push(callback);
      else if (typeof(callback) === "string") {
        const that = this;
        postInitQueue.push(function() { 
          that[callback].call(that);
        });
      }
      return this;          
    },

    _localize: function(s)
    {
      return plantago.localize(s);
    },

    _getImagePath: function(s)
    {  
      return plantago.getImagePath(s);
    },
     
    _destroy: function()
    {
      this._untieElements();
      this.element
        .removeClass(this.options.cssClass)
        .removeData("plantagoWidgetName")
        .removeData("plantagoClass-root");
       if (this._attrTrackingInstalled)
         this.element.untrackAttributeChange();
    }
  });
}); 
