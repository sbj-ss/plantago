//---------------------------
// Носитель контекстного меню
//---------------------------
$(function() {
  $.widget("plantago.basicPopup", $.plantago.root, 
  {
    _create: function() {
      this._superApply(arguments);
      this.element
        .data("plantagoClass-basicPopup", 1)
        .hide();
      const that = this;
      this._lazyPopup = new plantago.LazyContainer({
        createObject: function() { 
          return that._createPopup();
        },
        updateObject: function() {
          return that._updatePopup();
        }
      });
    },

    _caller: null, // jquery

    _createPopup: $.noop,

    _updatePopup: $.noop,

    _buildMenuItems: function(itemArr, root)
    {
      const that = this;
      for (let nodeData of itemArr)
      {
        const itm = $("<li>").append($("<div>", {
          html: nodeData.name || "&nbsp;",
          "class": nodeData.cssClass
        }));
        if (nodeData.action)
        {
          itm.click(function(e) {
            that._popup.hide();
            if (!$(this).hasClass("ui-state-disabled"))
            {
              if (typeof nodeData.action === "function")
                nodeData.action.call(itm);
              else if (that._caller)
                that._caller.callPlantagoWidget(nodeData.action, itm);
              else window[nodeData.action].call(itm);
            }
            e.preventDefault();
          });
          if (typeof nodeData.action === "string")
            itm.attr("action", nodeData.action);
        } else {
          itm.click(function(e) {
            if (e.target === $(this).children().get(0))
              e.stopPropagation(); // по клику на группирующие узлы меню не должно закрываться
          });
        }
        if (nodeData.children)
          itm.append(this._buildMenuTree(nodeData.children));
        itm.appendTo(root);
      }
    },

    _buildMenuTree: function(itemArr, caption) // [{ name: "", handler: f(item) {}, children: [] }]
    {
      const root = $("<ul>");
      this._buildMenuItems(itemArr, root);
      if (typeof caption !== "undefined")
      {
        const cap = $("<li>", {
          "class": "menuCaption",
           commonText: caption,
           text: "здесь что-то должно быть"
        });
        cap.prependTo(root).click(function(e) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        });
      }
      return root;
    },

    addCustomItems: function(itemArr)
    {
      // TODO переделать так, чтобы к get() дописалась функция, а не генерировалось меню
      const menu = this._lazyPopup.get();
      this._buildMenuItems(itemArr, menu);
      menu.menu("refresh");
      return this;
    },

    enableItems: function(stateHash)
    {
      const menu = this._lazyPopup.get();
      $.each(stateHash, (action, enabled) => {
        menu.find("[action='" + action + "']").switchCall(enabled, ["addClass", "removeClass"], "ui-state-disabled");
      });
    },

    showItems: function(stateHash)
    {
      const menu = this._lazyPopup.get();
      $.each(stateHash, (action, enabled) => {
        menu.find("[action='" + action + "']").switchCall(enabled, ["addClass", "removeClass"], "ui-helper-hidden");
      });
    },

    hasActiveItems: function()
    {
      const menu = this._lazyPopup.get();
      return !!menu
        .find("[action]")
        .not(".ui-state-disabled")
        .not(".ui-helper-hidden")
        .length;
    },

    showMenu: function(caller, e)
    {
      if (!this.hasActiveItems())
        return false;
      e.preventDefault();
      this._caller = caller;
      if (window.visibleMenu)
        window.visibleMenu.hide();
      this._popup = window.visibleMenu = this._lazyPopup.get();
      if (!this._popup.parent().length)
        this._popup.appendTo(document.body);
      const cap = this._popup.children(".menuCaption");
      if (cap.length)
      {
        let capText = caller? caller.callSinglePlantagoWidget("getDisplayName"): null;
        if (capText && capText.length > 17)
        {
          cap.prop("title", capText);
          capText = capText.substring(0, 15) + "…";
        } else if (!capText) // здесь мб и null/undefined, заменим на пустую строку
          capText = "";
        const leftPart = cap.attr("commonText");
        cap.text(leftPart? (leftPart + ": " + capText): capText);
      }
      this._popup // сделать нормальное человеческое скрытие разработчики, конечно, не удосужились
/*        .menu("blur") 
        .menu("collapseAll") // если строчки раскомментировать - будет некорректно отображаться вложенный пункт при повторном открытии
        .children()
        .find("ul")
        .hide()
        .end()
        .end()*/
        .show()
        .position({
          my: "left top",
          at: "left top",
          collision: "flipfit",
          of: e
        });
      const that = this;
      $(document).one("click", function(e) {
        that._popup.hide();
      });
      return true;
    },

    _destroy: function() 
    {
      if (this._popup)
      {
        if (this._popup === window.visibleMenu)
          window.visibleMenu = null;
        this._popup.remove();
      }
      this.element.removeData("plantagoClass-basicPopup");
      this._superApply(arguments);
    }
  });
});
