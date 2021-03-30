//---------------
// Диапазон ввода
//---------------

$(function() {
  $.widget("plantago.rangeInput", $.plantago.singleInput,
  {
    options:
    {
      rangePosition: ""
    },

    _create: function()
    {
      this._superApply(arguments);
      this.element.data("plantagoClass-rangeInput", 1);
      this.options.rangePosition = plantago.Range.bounds.get(this.options.rangePosition);
      if (!this.options.rangePosition.single)
      {
        plantago.debugLog("invalid rangeInput.rangePosition: ", this.options.rangePosition.name);
        this.options.rangePosition = plantago.range.bounds.get("from");
      }
    },

    _setOption: function(key, value)
    {
      if (key == "rangePosition")
      {
        this.options.rangePosition = plantago.Range.bounds.get(value);
        return;
      }
      return this._superApply(arguments);
    },

    clear: function()
    {
      this.element.val("");
      return this;
    },

    hasData: function()
    {
      return !!this.element.val();
    },

    getValue: function()
    {
      return this.element.val();
    },

    // TODO доработать _checkValue(), не давая вводить правую границу меньше левой

    collectData: function(hash)
    {
      if (!this.hasData() || !this.options.name)
        return this;
      if (!hash[this.options.name])
        hash[this.options.name] = new plantago.Range();
      hash[this.options.name][this.options.rangePosition.name] = this.element.val();
      return this;
    },

    setData: function(hash)
    {
      const value = hash[this.options.name];
      let discreteValue;
      if ((value instanceof plantago.Range) || $.isPlainObject(value))
        discreteValue = value[this.options.rangePosition.name];
      else if ($.isArray(value))
        discreteValue = value[this.options.rangePosition.position];
      else
        discreteValue = value;
      if (typeof(discreteValue) !== "undefined")
        this.element.val(discreteValue);
      return this;
    },

    _destroy: function()
    {
      this.element.removeData("plantagoClass-rangeInput", 1);
      this._superApply(arguments);
    }
  });
});
