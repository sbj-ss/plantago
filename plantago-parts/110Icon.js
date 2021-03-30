//------------------------------------------------
// Картинка, полупрозрачная в неактивном состоянии
// заменяет icon.htc
//------------------------------------------------
$(function() {
  $.widget("plantago.icon", $.plantago.root,
  {
    options:
    {
      inactiveOpacity: 0.54,
      companion: "", // связанный виджет, подсвечиваемый вместе с иконкой
      cssClass: "icon"
    },     

    _create: function()
    {
      this._superApply(arguments);
      this._originalOpacity = this.element.css("opacity");
      this.element
        .css("opacity", this.options.inactiveOpacity)
        .data("plantagoClass-icon", 1);
      this._on(this.element,
      {
        mouseenter: "showHover",
        mouseleave: "hideHover"
      });
    },

    showHover: function(e, stopFlag)
    {
      this.element.css("opacity", 1.0);
      if (this.options.companion && !stopFlag)
        $(this.options.companion).callPlantagoWidget("showHover", e, true);
    },

    hideHover: function(e, stopFlag)
    {
      this.element.css("opacity", this.options.inactiveOpacity);
      if (this.options.companion && !stopFlag)
        $(this.options.companion).callPlantagoWidget("hideHover", e, true);
    },

    _setOption: function(key, value)
    {
      if (key == "inactiveOpacity")
        this.element.css("opacity", value);
      this._super(key, value);
    },

    _destroy: function()
    {
      this.element
        .css("opacity", this._originalOpacity)
        .removeData("plantagoClass-icon");
      this._superApply(arguments);        
    }
  });
});
