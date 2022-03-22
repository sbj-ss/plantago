//----------------------------------------------------------------------------
// Выпадающий список. С учётом возможных фишек подлежит бо-о-ольшой доработке.
//----------------------------------------------------------------------------

$(function() {
  $.widget("plantago.singleSelect", $.plantago.basicInput,
  {
    options:
    {
      allowIndeterminate: false,
      checkInitialValue: false,
      initialValue: ""
    },

    _initialIndex: -1,

    _create: function()
    {
      this._superApply(arguments);
      this.element.data("plantagoClass-singleSelect", 1);
      if (!this.options.initialValue)
        this.options.initialValue = this.element.val();
      this._initialIndex = this.element.get(0).selectedIndex;
      const that = this;
      this.element.change(function(e) {
        that._trigger("change", e, that.element.val());
      });
    },

    clear: function()
    {
      this.element.get(0).selectedIndex = -1;
      return this;
    },

    reset: function()
    {
      this.element.get(0).selectedIndex = this._initialIndex;
      return this;
    },

    hasData: function()
    {
      if (this.options.checkInitialValue)
        return (this.element.val() != this.options.initialValue);
      return true;
    },

    getValue: function()
    {
      return new plantago.SelectData({
        value: this.element.val(),
        text: this.element.children(":selected").text()
      });
    },

    setData: function(hash)
    { 
      if (!this.options.name)
        return this;
      const value = hash[this.options.name];
      let discreteValue;
      if ((value instanceof plantago.SelectData) || $.isPlainObject(value))
        discreteValue = value.value;
      else
        discreteValue = value;
      if (typeof discreteValue === "undefined" || discreteValue === null)
      {
        if (this.options.allowIndeterminate)
          this.element.prop("selectedIndex", -1);
        return this;
      }
      const newOpt = this.element.find(`option[value='${discreteValue}']`);
      if (!newOpt.length)
      {
        if (this.options.allowIndeterminate)
          this.element.prop("selectedIndex", -1);
        return this;
      }
      newOpt.prop("selected", 1);
      return this;
    },

    _destroy: function()
    {
      this.element.removeData("plantagoClass-singleSelect");
      this._superApply(arguments);
    }
  });
});
