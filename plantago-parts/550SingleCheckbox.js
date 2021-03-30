//------------------------------------
// Чекбокс с тремя состояниями (HTML5)
//------------------------------------

plantago.cbState = new plantago.Enum({
  values: {
    indeterminate: { value: -1, indeterminate: true,  checked: false, next: "unchecked" },
    unchecked:     { value: 0,  indeterminate: false, checked: false, next: "checked" },
    checked:       { value: 1,  indeterminate: false, checked: true,  next: "indeterminate" },
  },
  methods: {
    getNext: function(prev) {
      return this.values[prev.next];
    }
  },
  searchKeys: ["value"],
  defaultValue: "unchecked"
});

plantago.addDefaultLocalization("Для отключения поиска по этому полю флажок должен находиться в \"третьем\" состоянии. Остальные состояния (отмеченное и неотмеченное) участвуют в поиске.");

$(function() {
  $.widget("plantago.singleCheckbox", $.plantago.basicInput,
  {
    options:
    {
      allowIndeterminate: false,
      forceValue: false,
      state: ""
    },

    _create: function()
    {
      this._superApply(arguments);
      this.element.data("plantagoClass-singleCheckbox", 1);
      this._on(this.element, {
        click: "rotateState"
      });
      // здесь нельзя так просто учесть checked - т.к. indeterminate не задаётся атрибутом
      this.options.state = this.options.state || (this.options.allowIndeterminate? "indeterminate": this.element.prop("checked"));
      this._initialState = this.options.state;
      this.setState(this.options.state);
      this._refresh();
    },

    _setOption: function(key, value)
    {
      switch(key)
      {
        case "allowIndeterminate":
          if (value)
            this.element.prop("title", this._localize("Для отключения поиска по этому полю флажок должен находиться в \"третьем\" состоянии. Остальные состояния (отмеченное и неотмеченное) участвуют в поиске."));
          else {
            if (this.options.state.name === "indeterminate")
              this.options.state = plantago.cbState.get("unchecked");
            this.element.prop("title", "");
          }
          break;
        case "state":
          this.setState(value);
          break;
      } 
      this._superApply(arguments);
    },

    _refresh: function()
    {
      this.element
        .prop("indeterminate", this.options.state.indeterminate)
        .prop("checked", this.options.state.checked);
      return this;
    },

    setState: function(value)
    {
      this.options.state = plantago.cbState.get(value);
      return this._refresh();
    },

    rotateState: function(e)
    {
      this.options.state = plantago.cbState.getNext(this.options.state);
      if (!this.options.allowIndeterminate && (this.options.state.name === "indeterminate"))
        this.options.state = plantago.cbState.getNext(this.options.state);        
      this._trigger("change", e, this.options.state.name);
      return this._refresh();
    },
    
    clear: function()
    {
      this.options.state = plantago.cbState.get(this.options.allowIndeterminate? "indeterminate": "unchecked");
      return this._refresh();
    },

    reset: function()
    {
      this.setState(this._initialState);
      return this._refresh();
    },

    hasData: function()
    {
      if (this.options.forceValue)
        return true;
      if (this.options.allowIndeterminate)
        return (this.options.state.name !== "indeterminate");
      else
        return (this.options.state.name === "checked");
    },

    getValue: function()
    {
      return this.options.state.value;
    },

    setData: function(hash)
    {
      if (!this.options.name)
        return this;
      const value = hash[this.options.name];
      if (typeof(value) !== "undefined")
      {
        this.options.state = plantago.cbState.get(value);
        const that = this;
        that._refresh();
      }
      return this;
    },

    _destroy: function()
    {
      this.element.removeData("plantagoClass-singleCheckbox");
      this._superApply(arguments);
    }
  });
});
