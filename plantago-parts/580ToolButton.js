﻿//---------
// Пимпочка
//---------

$(function() {
  $.widget("plantago.toolButton", $.plantago.root, {
    options: 
    {
      cssClass: "toolButton",
      // event handler
      run: $.noop
    },
    
    _waiting: false,
 
    _create: function()
    {
      this._superApply(arguments);
      this.element.data("plantagoClass-toolButton", 1);
      const selfRef = this;
      this._on(this.element, {
        mouseover: "_showHover",
        mouseout: "_hideHover",
        mousedown: "_showClick",
        mouseup: function(e) {
          this._showHover();
          if (!this._waiting)
            this._trigger("run");
        }
      });
    },

    _showHover: function() 
    {
      if (this._waiting)
        return;
      this.element
        .removeClass("down")
        .addClass("hover");
    },

    _hideHover: function() 
    {
      if (this._waiting)
        return;
      this.element
        .removeClass("down")
        .removeClass("hover");
    },

    _showClick: function() 
    {
      if (this._waiting)
        return;
      this.element
        .removeClass("hover")
        .addClass("down");
    },

    enterWaitState: function(lockOnly)
    {
      if (!lockOnly)
      {
        if (!this._waitIcon)
          this._tieElement({
            name: "_waitIcon",
            elementName: "span",
            selector: "[name='waitIcon']",
            setName: true,
            cssClass: true,
            makeFirst: true
          });
        else
          this._waitIcon.show();
      }
      this.element.addClass("waiting");
      this._hideHover();
      this._waiting = true;
    },

    leaveWaitState: function(unlockOnly)
    {
      if (!unlockOnly)
        if (this._waitIcon)
          this._waitIcon.hide();
      this.element.removeClass("waiting");
      this._waiting = false;
    },

    _destroy: function() 
    {
      this.element.removeData("plantagoClass-toolButton");
      this._superApply(arguments);
    }
  });
});