//------------------------------------------------------------------
// Базовый класс для произвольных списков (неважно, лист или папка).
//------------------------------------------------------------------

plantago.liState = new plantago.Enum({
  values: {
    "normal":           { value: 0, isInformative: true,  isBlank: true  },
    "selectedLeaf":     { value: 1, isInformative: true,  isBlank: false },
    "selectedFolder":   { value: 2, isInformative: true,  isBlank: false },
    "selectedByParent": { value: 3, isInformative: false, isBlank: false }
  },
  searchKeys: ["value"],
  defaultValue: "normal"
});

plantago.liTickType = new plantago.Enum({
  values: {
    none:     { type: null },
    radio:    { type: "radio" },
    checkbox: { type: "checkbox" }
  },
  searchKeys: [],
  defaultValue: "none"
});

plantago.addDefaultLocalization("Перейти к ресурсу");

// По разграничению радиобатонов: группа - это то, что находится внутри *:data('plantago-radio-container')
// Остальное - детали. Если не устраивает - перекрываем метод _getRadioContainer()

$(function() {
  $.widget("plantago.basicListItem", $.plantago.root,
  {
    options: 
    {
      state: "normal",   // plantago.liState
      tickType: "none",  // plantago.liTickType
      active: true,
      url: "",
      urlTitle: П.localize("Перейти к ресурсу"),
      urlClass: 'extLink',
      objectId: ""       // поскольку узлы могут отмечаться, их нужно идентифицировать
    },

    _createBullet: function()
    {
      return this;
    },

    _removeBullet: function()
    {
      return this._untieElement("_bullet");
    },

    _getRadioContainer: function()
    {
      return this.element.parents(":data('plantago-radio-container'):first, [data-plantago-radio-container]").eq(0);
    },

    _createTick: function(t, force)
    {
      t = plantago.liTickType.get(t);
      if ((t == this.options.tickType) && !force)
        return;
      this._removeTick();
      this.options.tickType = t;
      let selfRef = this;
      switch (t.name)
      {
        case "none":
          this._tick = $();
          return this;
        case "radio":
          this._tick = $("<input>", {
            type: "radio"
          });
          this._on(this._tick, {
            click: function(e) {
              selfRef.setState("selectedLeaf");
              let ctnr = selfRef._getRadioContainer();
              let prev = ctnr.data("plantago-currentListItem");
              if (prev && (prev != this.element))
                prev.callPlantagoWidget("setState", "normal");
              ctnr.data("plantago-currentListItem", this.element);
            }
          });
          break;
        case "checkbox":
          this._tick = $("<input>", {
            type: "checkbox"
          });
          this._on(this._tick, {
            click: function(e) {
              selfRef.toggleSelection();
            }
          });
          break;
      }
      this._tick.insertBefore(this._caption);
      return this;
    },

    _removeTick: function()
    {
      if (!this._tick)
        this._tick = $();
      else if (this._tick.length) {
        this._off(this._tick, "click");
        this._tick.remove();
        this.setState("normal");
        this._tick = $();
      }
      return this;
    },

    _createExtLink: function()
    {
      this._removeExtLink();
      if (this.options.url)
      {
        this._tieElement({
          name: "_extLink",
          elementName: "a",
          cssClass: this.options.urlClass,
          setName: true,
          selector: "*[name='extLink']",
          creationProps: {
            target: "new",
            href: this.options.url,
            title: this.options.urlTitle
          },
          after: this._caption
        });
        this._extLink.icon();
      }
      return this;
    },

    _removeExtLink: function()
    {
      return this._untieElement("_extLink");
    },

    _clickHandler: $.noop, //function(e)

    _create: function()
    {
      this._superApply(arguments);    
      this.options.state = plantago.liState.get(this.options.state);
      this.options.tickType = plantago.liTickType.get(this.options.tickType);
      this.element.data("plantagoClass-basicListItem", 1);
      this._caption = this.element
        .children("span:first")
        .hoverableCaption({
          active: this.options.active
        });
      let selfRef = this;
      this._on(this.caption, {
        click: function(e) {
          if (selfRef.options.active)
            selfRef._clickHandler(e);
        }
      });
      this
        ._createBullet()
        ._createTick(this.options.tickType, true)
        ._createExtLink();
      // здесь рановато вызывать setState(), оставим явный вызов потомкам
    },

    highlight: function()
    {
      this.element.children("span:first").addClass("highlight");
    },

    removeHighlight: function()
    {
      this.element.children("span:first").removeClass("highlight");
    },

    _hlSearchDepth: 2,

    // считаем, что текст уже приведён к верхнему регистру
    _matches: function(txt)
    {
      // нельзя использовать text() - заденет всё дерево
      // в целом ситуация дурацкая: все методы (н.п. textContent()) собирают текст со всех уровней.
      // в качестве компромисса зададим глубину поиска параметром _hlSearchDepth
      let doHL = false;
      let subtree = this.element;
      for (let i = this._hlSearchDepth; i; i--)
        subtree = subtree.contents();
      for (let i = this._hlSearchDepth; i; i--)
        subtree = subtree.addBack();
      subtree.each(function() {
        if ((this.nodeType === 3) && $(this).text().toUpperCase().indexOf(txt) !== -1)
        {
          doHL = true;
          return false;
        }
      });
      return doHL;
    },

    highlightOnMatch: function(txt)
    {
      if (this._matches(txt))
      {
        this.highlight();
        this.element
          .parents(":data('plantagoClass-folder')")
          .callPlantagoWidget("open");
      } else
        this.removeHighlight();
    },

    highlightInput: function()
    {
      let doHL = this.options.state.isInformative;
      if (!doHL)
        this.element
          .children(":data('plantagoClass-basicInput')")
          .each(function() {
            if ($(this).callSinglePlantagoWidget("hasData"))
            {
              doHL = true;
              return false; // break
            }
        });
      if (doHL)
      {
        this.highlight();
        this.element
          .parents(":data('plantagoClass-folder')")
          .callPlantagoWidget("open");
      } else
        this.removeHighlight();
    },

    collectTick: function(hash)
    {
      if (this.options.objectId && this.options.state.isInformative)
        hash[this.options.objectId] = this.options.state.value;
    },

    clearInput: function()
    {
      this.removeHighlight();
      this.element
        .children(":data('plantagoClass-basicInput')")
        .callPlantagoWidget("clear");
      this.setState("normal");
    },

    setState: $.noop,

    setStateEx: function(hash)
    {
      if (this.options.objectId && hash[this.options.objectId])
        this.setState(hash[this.options.objectId]);
    },

    toggleSelection: $.noop,

    _setOption: function(k, v)
    {
      switch(k)
      {
        case "state":
          this.setState(v);
          return;
        case "tickType":
          this._createTick(v);
          return;
      }
      this._superApply(arguments);
      switch(k) 
      {
        case "url":
          this.createExtLink();
          break;
        case "active":
          this._caption.callPlantagoWidget("option", "active", v);
          break;
      }
    },

    _destroy: function()
    {
      this._caption.callPlantagoWidget("destroy");
      this._removeBullet()._removeTick()._removeExtLink();
      this.element.removeData("plantagoClass-basicListItem");
      this._superApply(arguments);
    }
  });
});
