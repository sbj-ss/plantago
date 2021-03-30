//-------
// Таймер
//-------

$(function() {
  $.widget("plantago.operationTimer", $.plantago.root, {
    options:
    {
      cssClass: "operationTimer",
      increment: 100, // в мс
      hideOnStop: false
    },

    _intervalId: -1,
    _originalVisibility: "",
    _elapsed: 0,
   
    _create: function() 
    {
      this._superApply(arguments);
      this._originalVisibility = this.element.css("visibility");
      this.element
        .data("plantagoClass-operationTimer", 1)
        .css("visibility", "hidden");
    },
  
    _refresh: function() 
    {
      let strValue = new String(this._elapsed / 1000);
      if (strValue.indexOf(".") == -1)
        strValue += ".0";
      this.element.text(strValue);
      this._elapsed += this.options.increment;
      return this;
    },

    start: function()
    {
      if (this._intervalId != -1)
        return;
      this._elapsed = 0;
      const selfRef = this;
      this._refresh();
      this._intervalId = setInterval(function() { 
        selfRef._refresh(); 
      }, this.options.increment);
      this.element.css("visibility", "visible");
      return this;
    },

    hide: function()
    {
      this.element.css("visibility", "hidden");
      return this;
    },

    stop: function()
    {
      if (this._intervalId == -1)
        return this;
      clearInterval(this._intervalId);
      this._intervalId = -1;
      if (this.options.hideOnStop)
        this.hide();
      return this;
    },    
  
    _setOption: function(key, value) 
    {
      if (key == "hideOnStop")
        if ((this._intervalId == -1) && value)
          this.element.css("visibility", "hidden"); 
      return this._superApply(arguments);
    },

    _destroy: function()
    {
      this.element
        .css("visibility", this._originalVisibility)
        .removeData("plantagoClass-operationTimer");
      this._superApply(arguments);
    }
  });
});
