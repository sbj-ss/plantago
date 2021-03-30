//---------
// Шуфлядка
//---------

plantago.collapseDirection = new plantago.Enum({
  values: {
    left:  { 
      visibleName: "влево", 
      switchPos: "", 
      openCaption: "◂",
      closedCaption: "▸",
      barExtraClass: "vert"
    },
    right: { 
      visibleName: "вправо", 
      switchPos: "makeFirst",
      openCaption: "▸",
      closedCaption: "◂",
      barExtraClass: "vert"
    },
    top: {
      visibleName: "вверх",
      switchPos: "",
      openCaption: "▴",
      closedCaption: "▾",
      barExtraClass: "horz"
    },
    bottom: {
      visibleName: "вниз",
      switchPos: "",
      openCaption: "▾",
      closedCaption: "▴",
      barExtraClass: "horz"
    }
  },
  defaultValue: "left"
});

plantago.addDefaultLocalization(["Свернуть", "Развернуть"]);

$(function() {
  $.widget("plantago.drawer", $.plantago.root, 
  {
    options:
    {
      cssClass: "drawer",
      contentSelector: ".content",
      open: true,
      direction: plantago.collapseDirection.defaultValue,
      toggleClass: false,
      // обработчики событий
      collapse: $.noop,
      expand: $.noop
    },
   
    _create: function() 
    {
      this._superApply(arguments);
      this.element.data("plantagoClass-drawer", 1);
      this._content = this.element.find(this.options.contentSelector);
      this.options.direction = plantago.collapseDirection.get(this.options.direction);
      const desc = {
        name: "_switchBar",
        elementName: "div",
        selector: "[name='_switchBar']",
        cssClass: "switchBar " + (this.options.direction.barExtraClass || ""),
        creationProps: {       
          title: plantago.localize("Свернуть")
        }
      };
      this.options.direction.switchPos && (desc[this.options.direction.switchPos] = true);
      this
        ._tieElement(desc)
        ._tieElement({
          owner: this._switchBar,
          name: "_switchBtn",
          elementName: "span",
          selector: "[name='_switchBtn']",
          cssClass: false,
          creationProps: {
            text: this.options.direction.openCaption
          }
        });
      this._on(this._switchBar, {
        click: "toggle"
      });
      if (!this.options.open)
        this.collapse();
      else
        this.expand();
    },

    toggle: function(e) {
      if (this.options.open)
        this.collapse(e);
      else
        this.expand(e);
    },

    expand: function(e)
    {
      this._content.show();
      this._switchBtn.ownText(this.options.direction.openCaption);
      this._switchBar.prop("title", plantago.localize("Свернуть"));
      this._trigger("expand", e, this.element);
      if (this.options.toggleClass)
        this.element.addClass("open");
      this.options.open = true;
    },

    collapse: function(e)
    {
      this._content.hide();
      this._switchBtn.ownText(this.options.direction.closedCaption);
      this._switchBar.prop("title", plantago.localize("Развернуть"));
      this._trigger("collapse", e, this.element);
      if (this.options.toggleClass)
        this.element.removeClass("open");
      this.options.open = false;
    },

    _setOption: function(k, v)
    {
      switch(k)
      {
        case "open":
          if (v != this.options.open)
            this.toggle();
          break;
        case "direction":
          v = plantago.collapseDirection.get(v);
          if (v.name !== this.options.direction)
          {
            if (v.name === "left")
              this._switchBar.appendTo(this.element);
            else
              this._switchBar.prependTo(this.element);
            this._switchBtn.ownText(v[this.options.open? "openCaption": "closedCaption"]);
          }
          break;
      }
      this._superApply(arguments);
    },

    _destroy: function()
    {
      this.element.removeData("plantagoClass-drawer");
      this._superApply(arguments);
    }
  });
});
