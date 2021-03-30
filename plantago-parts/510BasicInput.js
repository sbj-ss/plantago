//-------------------------------------------------------------------------
// Базовый класс для произвольных эл-тов ввода, возвращающих своё состояние
//-------------------------------------------------------------------------
$(function() {
  $.widget("plantago.basicInput", $.plantago.root,
  {
    options: {
      disabled: false,
      name: "",
      stateKeys: ["name", "id"],
      stateSaveValue: true,
      uiWidget: "",
      // обработчик событий
      change: $.noop
    },

    _collectState: function()
    {
      const state = this._superApply(arguments);
      if (this.options.stateSave && this.options.stateSaveValue)
      {
        const value = this.getValue();
        state["value"] = value;
      }
      return state;
    },

    loadState: function(suffix)
    {
      const state = this._superApply(arguments);
      if (this.options.stateSave && this.options.stateSaveValue && state)
      {
        const key = this._getStateId(), data = {};
        data[key] = state["value"];
        const that = this;
        const change = function() {
          // вызовем оба обработчика
          that.setData(data)._trigger("change");
          that.element.trigger("change");
        };
        if (suffix)
          change();
        else
          this._delayUntilWidgetsCreation(change);
      }
    },

    _create: function()
    {
      this._superApply(arguments);
      this.element.data("plantagoClass-basicInput", 1);
      if (!this.options.name)
        this.options.name = this._getStateId();
      this.options.disabled = this.element.prop("disabled") || this.options.disabled;
      if (this.options.disabled)
        this.disable();
      this._assignWidget();
    },

    clear: $.noop,

    reset: $.noop,

    _removeWidget: function()
    {
      if (this.options.uiWidget)
        this.element[this.options.uiWidget].call(this.element, "destroy");
      return this;
    },

    _assignWidget: function(w)
    {
      if (w || this.options.uiWidget)
        this.element[w || this.options.uiWidget].call(this.element, plantago.widgetDefaultOpts[w || this.options.uiWidget]);
      return this;
    },

    enable: function() 
    {
      this._disableAttributeTracking();
      try { // теоретически может выйти так, что какой-то браузер заявит "нет такого свойства у div etc"
        this.element.get(0).disabled = false;
      } catch(e) {
      }
      this._enableAttributeTracking();
      this.options.disabled = false;
      this.element.removeClass("ui-disabled");
      return this;
    },

    disable: function()
    {
      this._disableAttributeTracking();
      try {
        this.element.get(0).disabled = true;
      } catch(e) {
      }
      this._enableAttributeTracking();
      this.options.disabled = true;
      this.element.addClass("ui-disabled");
      return this;
    },

    hasData: function()
    {
      return false;
    },

    getValue: function()
    {
      return null;
    },

    collectData: function(hash)
    {
      if (this.hasData() && this.options.name)
        hash[this.options.name] = this.getValue();
      return this;
    },

    setData: $.noop,

    _setOption: function(key, value)
    {
      switch(key)
      {
        case "disabled":
          if (value)
            this.disable();
          else
            this.enable();
          break;
        case "uiWidget":
          this._removeWidget()._assignWidget();
      }      
      return this._superApply(arguments);
    },

    _destroy: function()
    {
      this.element.removeData("plantagoClass-basicInput");
      this._superApply(arguments);        
    }
  });
});
