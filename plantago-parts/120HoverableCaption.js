//-------------------------
// Подсвечиваемый заголовок
// заменяет lItem.htc
//-------------------------
$(function() {
  $.widget("plantago.hoverableCaption", $.plantago.root,
  {
    options:
    {
      companion: "", // связанный виджет, подсвечиваемый вместе с заголовком
      active: true, // подсвечивать ли заголовок
      cssClass: "hoverableCaption"
    },

    _create: function()
    {    
      this._superApply(arguments);    
      this.element.data("plantagoClass-hoverableCaption", 1);
      this._on(this.element,
      {
        mouseenter: "showHover",
        mouseleave: "hideHover"
      });
      if (!this.options.active)
        this.element.addClass("inactive");
    },

    _setOption: function(key, value)
    {
      if (key == "active")
      {
        if (!value)
          this.element.addClass("inactive");
        else
          this.element.removeClass("inactive");
      }
      this._superApply(arguments);
    },

    showHover: function(e, stopFlag)
    {
      if (this.options.companion && !stopFlag)
        $(this.options.companion).callPlantagoWidget("showHover", e, true);
      if (!this.options.active)
        return;
      this.element.addClass("hi");
    },

    hideHover: function(e, stopFlag)
    {
      if (this.options.companion && !stopFlag)
        $(this.options.companion).callPlantagoWidget("hideHover", e, true);
      if (!this.options.active)
        return;
      this.element.removeClass("hi");
    },

    _destroy: function()
    {
      this.element
        .removeClass("inactive")
        .removeClass("hi")
        .removeData("plantagoClass-hoverableCaption");
      this._superApply(arguments);        
    }
  });
});
