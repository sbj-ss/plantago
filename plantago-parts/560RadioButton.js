//------------
// Радиокнопка
//------------

$(function() {
  $.widget("plantago.radioButton", $.plantago.basicInput, 
  {
    options:
    {
    },

    _create: function()
    {
      this._superApply(arguments);
      this.element.data("plantagoClass-radioButton", 1);
      this._originalChecked = this.element.prop("checked");
      const that = this;
      this.element.click(function(e) {
        that._trigger("change", e, that.element.prop("checked"));
      });
    },

    hasData: function()
    {
      return !!this.element.prop("checked");
    },

    getValue: function()
    {
      return $("input[type=radio][name=" + this.options.name + "]:checked").prop("value");
    },

    clear: function()
    {
      this.element
        .prop("checked", false)
        .trigger("change");
      return this;
    },

    reset: function()
    {
      this.element
        .prop("checked", this._originalChecked)
        .trigger("change");
      return this;
    },

    setData: function(hash)
    {
      if (!this.options.name)
        return this;
      if (hash[this.options.name] == this.element.prop("value"))
      {
        // опять разработчики браузера решили за пользователя.
        const that = this;
        window.setTimeout(function() {
          that.element.prop("checked", true);
        }, 1);
      }
      return this;
    },

    _destroy: function()
    {
      this.element.removeData("plantagoClass-radioButton");
      this._superApply(arguments);
    }
  });
});
