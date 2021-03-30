//--------------------------------------------
// Выпадающая под input'ом портянка вариантов.
// Для простоты считаем, что input внутри.
//--------------------------------------------

$(function() {
  $.widget("plantago.autoCompleter", $.plantago.root, {
    options: {
      cssClass: "autoCompleter",
      adjustWidth: false,
      itemSelector: "",
      autoHide: true,
      //events
      show: $.noop,
      hide: $.noop
    },

    _selIndex: -1,
    _selectables: $(),
    _contentVisible: false,

    _create: function() 
    {
      this._superApply(arguments);
      this.element.data("plantagoClass-autoCompleter", 1);
      this._tieElement({
        name: "_input",
        setName: false,
        elementName: "input",
        selector: "input", // надо бы в _tieElement указывать, что нам нужен только первый, и использовать селектор хитрее
        cssClass: false,
        creationProps: {
          type: "text"
        }
      })._tieElement({
        name: "_content",
        setName: false,
        selector: "div:first",
        elementName: "div",
        cssClass: true
      });
      this._content.hide();
      this._on(this._input, {
        keyup: $.proxy(this.handleKeys)
      });
      const selfRef = this;
      this._on(this._content, {
        click: function(e) {
          selfRef._content.condCall(selfRef.options.autoHide, "hide");
        }
      });
    },

    setContent: function(nodes)
    {
      this._content
        .empty()
        .append(nodes);
      if (!this.options.itemSelector)
        return this;
      this._selectables = this._content
        .find(this.options.itemSelector)
        .eq(0)
        .addClass("selected")
        .end();
      this._itemIndex = (this._selectables.length? 0: -1);
      this.selectItem(this._itemIndex);
      return this;
    },

    showContent: function()
    {
      this._content
        .show()
        .position({
          my: "left top",
          at: "left bottom",
          of: this._input
        })
        .scrollTop(0)
        .condCall(this.options.adjustWidth, "css", "width", this._input.outerWidth());
      this._contentVisible = true;
      if (this.options.autoHide)
      {
        const selfRef = this;
        $(document).one("click", function(e) {
          selfRef.hideContent();
        });
      }        
      this._trigger("show", null);
      return this;
    },

    hideContent: function()
    {
      this._content.hide();
      this._contentVisible = false;
      this._trigger("hide", null);
      return this;
    },

    suggest: function(nodes)
    {
      if (!nodes 
        || (typeof(nodes) === "string" && nodes.test(/^\s*$/))
        || (nodes.jquery && !nodes.length))
        return this.hideContent();
      return this.setContent(nodes).showContent();
    },

    selectItem: function(newIndex)
    {       
      newIndex = parseInt(newIndex);
      if (this._itemIndex === -1) // в принципе нет выбираемых узлов
        return;
      if (newIndex !== this._itemIndex)
        $(this._selectables[this._itemIndex]).removeClass("selected");
      if ((newIndex >= 0) && (newIndex < this._selectables.length))
      {
        $(this._selectables[newIndex]).addClass("selected");
        if (this._content[0].scrollHeight > this._content.outerHeight())
        {
          const itm = $(this._selectables[newIndex]);
          const pos = itm.offset().top 
            + itm.outerHeight(true)        // верх + высота = координаты низа, чтобы эл-т уместился
            + this._content.scrollTop()    // верх посчитан с учётом прокрутки, нормализуем
            - this._content.offset().top   // приведём к координатам внутри content
            - this._content.outerHeight(); // вот настолько не помещается
          this._content.scrollTop(Math.max(0, pos));
        }
        this._itemIndex = newIndex;
      }
    },

    handleKeys: function(e) 
    {
      //console.log(e.keyCode);
      if (!this.options.itemSelector || !this._contentVisible || !this._selectables.length)
        return;
      if (e.shiftKey || e.ctrlKey || e.altKey)
        return;
      switch(e.keyCode) 
      {
        case 38: // up
          this.selectItem(this._itemIndex > 0? this._itemIndex - 1: this._selectables.length - 1);
          e.preventDefault();
          break;
        case 40: // dn
          this.selectItem(this._itemIndex < this._selectables.length - 1? this._itemIndex + 1: 0);
          e.preventDefault();
          break;
        case 33: // pgup
          this.selectItem(0);
          break;
        case 34: // pgdn
          this.selectItem(this._selectables.length - 1);
          break;
        case 27: // esc
          this.hideContent();
          break;
        case 13: // enter
          if (this._itemIndex !== -1)
          {
            $(this._selectables[this._itemIndex]).trigger("click", e);
            if (this.options.autoHide)
              this._content.hide();
          }
          break;
      }
    },

    _destroy: function() 
    {
      this.element.removeData("plantagoClass-autoCompleter");
      this._superApply(arguments);
    }
  });
});
