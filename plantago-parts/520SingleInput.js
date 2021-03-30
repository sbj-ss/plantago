//-----------
// Поле ввода
//-----------

plantago.addDefaultLocalization("Очистить");

$(function() {
  $.widget("plantago.singleInput", $.plantago.basicInput,
  {
    options:
    {
      initialValue: "",
      checkInitialValue: false,
      valueType: "any",
      minValue: NaN,
      maxValue: NaN,
      pattern: "",
      hasClearBtn: false
    },

    _create: function()
    {
      this._superApply(arguments);
      this.element.data("plantagoClass-singleInput", 1);
      if (!this.options.initialValue)
        this.options.initialValue = this.element.val();
      this.options.valueType = plantago.inputValueType.get(this.options.valueType);
      this._on({
        keyup: "_checkValue",
        paste: "_checkValue",
        change: "_checkValue",
        input: "_checkValue"
      });
      this._reflectHasClearBtnChange();
    },

    _checkValue: function(e)
    { 
      if (this.options.valueType.name === "any")
        return;
      let value = this.element.val();
      if (!value || !value.length)
        return;
      let reText;
      if (this.options.valueType.name === "pattern")
      {
        if (!this.options.pattern || !this.options.pattern.length)
          return;
        reText = this.options.pattern;
      } else
        reText = this.options.valueType.pattern;
      this._wholeRegex || (this._wholeRegex = new RegExp("^" + reText + "$"));
      if (!this._wholeRegex.test(value))
      {
        this._partialRegex || (this._partialRegex = new RegExp(reText));
        const values = this._partialRegex.exec(value);
        value = values? values[0]: "";
      }
      if (this.options.valueType.isNumeric && value.length)
      {
        value = value | 0;
        if ((this.options.minValue !== NaN) && (value < this.options.minValue))
          value = this.options.minValue;
        if ((this.options.maxValue !== NaN) && (value > this.options.maxValue))
          value = this.options.maxValue;       
      }
      this.element.val(value);
      this._trigger("change", e, value);
      return this;
    },

    _reflectHasClearBtnChange: function()
    {
      if (!!this._clearBtn === this.options.hasClearBtn)
        return;
      if (this.options.hasClearBtn)
      {
        const that = this;
        this._tieElement({
          name: "_clearBtn",
          elementName: "span",
          cssClass: "ui-icon ui-icon-clear-left",
          after: this.element,
          creationProps: {
            "title": this._localize("Очистить")
          }
        });
        this._clearBtn
          .icon()
          .click(function(e) {
            e.stopPropagation();
            that.clear();
            that.element.focus();
          });
      } else 
        this._untieElement("_clearBtn");
      return this;
    },

    _setOption: function(key, value)
    {
      if (key == "valueType")
        value = plantago.inputValueType.get(value);
      this._superApply(key, value);
      switch(key)
      {
        case "valueType":
        case "minValue":
        case "maxValue":
        case "pattern":
          this._wholeRegex = this._partialRegex = null;
          this._checkValue();
          break;
        case "hasClearBtn":
          this._reflectHasClearBtnChange();
          break;
        default:;
      }
    },

    clear: function()
    {
      this.element.val("").trigger("input");
      return this;
    },

    reset: function()
    {
      this.element.val(this.options.initialValue).trigger("input");
      return this;
    },

    hasData: function()
    {
      if (this.options.checkInitialValue)
        return (this.element.val() != this.options.initialValue);
      return (!!this.element.val());
    },

    getValue: function()
    {
      return this.element.val();
    },

    setData: function(hash)
    {
      if (!this.options.name)
        return this;
      const value = hash[this.options.name];
      if (typeof(value) !== "undefined")
      {
        this.element.val(value.toString());
        this._checkValue();
      }
      return this;
    },

    _destroy: function()
    {
      this.element.removeData("plantagoClass-singleInput");
      this._superApply(arguments);
    }
  });
});
