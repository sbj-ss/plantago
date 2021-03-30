//----------------------------
// Выпадающий список чекбоксов
//----------------------------

plantago.addDefaultLocalization(["Применить", "Отмена", "Вернуть в предыдущее состояние", "не выбрано"]);

$(function() {
  $.widget("plantago.multiSelect", $.plantago.basicInput, {
    options: 
    {
      checkInitialValue: false,
      cssClass: "multiSelect",
      delimiter: ", ",
      sortValue: true,
      sticky: false, // при включённом выпадающий список нужно явно закрыть
      // events
      cancel: $.noop,
      change: $.noop,
      dropdown: $.noop,
      undo: $.noop
    },

    _initialValue: [], // это значение было у виджета на момент создания
    _prevValue: [], // это - на момент раскрытия
    _value: [], // а это мы отдаём по запросу панели

    _create: function()
    {
      this._superApply(arguments);
      this.element.data("plantagoClass-multiSelect", 1);
      this._initialValue = this._value = this._addControls()._valueFromState();
      this._refreshCaption();
    },

    _addNonStickyControls: function()
    {
      this._untieElement("_undoBtn");
      this._tieElement({
        name: "_okBtn",
        elementName: "span",
        cssClass: "ui-icon ui-icon-check",
        selector: "span[name=okBtn]",
        setName: true,
        owner: this._content,
        creationProps: {
          title: plantago.localize("Применить")
        }
      })._tieElement({
        name: "_cancelBtn",
        elementName: "span",
        cssClass: "ui-icon ui-icon-closethick",
        selector: "span[name=cancelBtn]",
        setName: true,
        owner: this._content,
        creationProps: {
          title: plantago.localize("Отмена")
        }
      });
      const that = this;
      this._okBtn
        .icon()
        .on("click.multiSelect", function(e) { that._acceptChanges(e); });
      this._cancelBtn
        .icon()
        .on("click.multiSelect", function(e) { that._cancel(e); });
    },

    _addStickyControls: function()
    {
      this._untieElements(["_okBtn", "_cancelBtn"]);
      this._tieElement({
        name: "_undoBtn",
        elementName: "span",
        cssClass: "ui-icon ui-icon-arrowreturnthick-1-w",
        selector: "span[name=undoBtn]",
        setName: true,
        owner: this._content,
        creationProps: {
          title: plantago.localize("Вернуть в предыдущее состояние")
        }
      });
      const that = this;
      this._undoBtn
        .icon()
        .on("click.multiSelect", function(e) { that._undo(e); });
    },

    _addControls: function()
    {
      this._tieElement({
        name: "_caption",
        elementName: "div",
        cssClass: true,
        selector: "div:first-child"
      })._tieElement({
        name: "_content",
        elementName: "div",
        cssClass: true,
        selector: "div:nth-of-type(2)"
      })._tieElement({
        name: "_dropDownBtn",
        elementName: "span",
        cssClass: "ui-icon ui-icon-caret-1-s",
        selector: "span:first-child",
        setName: true,
        after: this._caption
      });
      if (this.options.sticky)
        this._addStickyControls();
      else
        this._addNonStickyControls();
      const that = this;
      this._content
        .hide()
        .on("click.multiSelect", function(e) {
          e.stopPropagation();
        });
      this._dropDownBtn.icon();
      // раскроемся при клике в любом месте, а не только по стрелке - как select
      this._dropDownBtn.on("click.multiSelect", function(e) { that._dropDown(e); });
      this._caption.on("click.multiSelect", function(e) { that._dropDown(e); });
      return this;
    },

    _refreshCaption: function()
    {
      const texts = [];
      this._content.find("input[type=checkbox]").each((idx, el) => {
        if (el.checked)
        {
          el = $(el);
          texts.push((el.data("shortName") || el.ownText() || el.parent().ownText()).trim());
        }
      });
      let title = texts.map((s, idx) => {
        return idx? s.substring(0, 1).toLowerCase() + s.substring(1): s;
      }).join(this.options.delimiter);
      if (!title)
      {
        this.element.addClass("empty");
        title = plantago.localize("не выбрано");
      } else
        this.element.removeClass("empty");
      this._caption.ownText(title).prop("title", title);
      return this;
    },

    _valueFromState: function()
    {
      const value = [];
      this._content.find("input[type=checkbox]").each((idx, el) => {
        if (el.checked)
          value.push(el.value);
      });
      return value;
    },

    _valueToState: function(value)
    {
      value = value || this._value;
      this._content.find("input[type=checkbox]").each((idx, el) => {
        el.checked = value.indexOf(el.value) > -1;
      });
      return this;
    },

    _dropDown: function(e)
    {
      if (this._content.is(":visible"))
      {
        if (this.options.sticky)
          this._hideDropDown();
        return;
      }
      this._prevValue = this._value;
      this._content
        .show()
        .position({
          my: "left top",
          at: "left bottom-1",
          of: this.element,
          collision: "flipfit"
        });
      this._dropDownBtn.removeClass("ui-icon-caret-1-s");
      this._trigger("dropdown");
      if (this.options.sticky)
      {
        this._dropDownBtn.addClass("ui-icon-pin-s");
        const that = this;
        this._content.on("click.multiSelect", function(e) {
          that._value = that._valueFromState();
          that._refreshCaption();
        });
      } else {
        this._dropDownBtn.addClass("ui-icon-caret-1-n");
        const that = this;
        setTimeout(function() {
          $(document).on("click.multiSelect", function(e) {
            that._cancel();
          });
        }, 5);
      }
    },

    _hideDropDown: function()
    {
      this._content.hide();
      this._dropDownBtn.removeClass("ui-icon-caret-1-n ui-icon-pin-s").addClass("ui-icon-caret-1-s");
      if (!this.options.sticky)
        $(document).off("click.multiSelect");
      else
        this._content.off("click.multiSelect");
    },

    _acceptChanges: function(e)
    {
      this._hideDropDown();
      this._value = this._valueFromState();
      this._refreshCaption();
      this._trigger("change", e, this._value);
    },

    _cancel: function(e)
    {
      this._hideDropDown();
      this._valueToState()._refreshCaption();
      this._trigger("cancel");
    },

    _undo: function(e)
    {
      this._value = this._prevValue;
      this._valueToState()._refreshCaption();
      this._trigger("undo");
      // нужно ли здесь закрывать?
    },

    reset: function()
    {
      this._value = this._initialValue;
      this._valueToState()._refreshCaption();
      return this;
    },

    clear: function()
    {
      this._value = [];
      this._valueToState()._refreshCaption();
      return this;
    },

    checkAll: function()
    {
      this.element.find("input[type=checkbox]").each((idx, el) => {
        el.checked = true;
      });
      this._value = this._valueFromState();
      this._refreshCaption();
      return this;
    },

    toggleSelection: function()
    {
      this.element.find("input[type=checkbox]").each((idx, el) => {
        el.checked = !el.checked;
      });
      this._value = this._valueFromState();
      this._refreshCaption();
      return this;
    },

    hasData: function()
    {
      if (this.options.sticky)
        this._value = this._valueFromState(); // из "липкого" контрола забираются живые данные
      if (this.options.checkInitialValue)
        return !plantago.memberwiseCompare(this._value, this._initialValue);
      return !!this._value.length;
    },

    getValue: function()
    {
      return this.options.sortValue? this._value.sort(): this._value;
    },

    _internalSetData: function(hash, displayOnly)
    {
      if (!this.options.name)
        return this;
      let newValue = hash[this.options.name];
      if (typeof newValue === "undefined")
        return this;
      newValue = $.isArray(newValue)? newValue: newValue.split(/,\s*/);
      if (displayOnly)
        return this._valueToState(newValue);
      this._value = newValue;
      return this._valueToState()._refreshCaption();
    },

    setDisplayedDataOnly: function(data)
    {
      return this._internalSetData(data, true);
    },

    setData: function(data)
    {
      return this._internalSetData(data);
    },

    _unbindEvents: function()
    {
      this._content.off("click.multiSelect");
      this._dropDownBtn.off("click.multiSelect");
      this._okBtn && this._okBtn.off("click.multiSelect");
      this._cancelBtn && this._cancelBtn.off("click.multiSelect");
      this._undoBtn && this._undoBtn.off("click.multiSelect");
      return this;
    },

    _destroy: function()
    {
      this.element.removeData("plantagoClass-multiSelect");
      this._unbindEvents()._superApply(arguments);        
    }
  });
});

