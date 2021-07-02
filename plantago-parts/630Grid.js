$(function() {
  П.addDefaultLocalization([
    "Инвертировать отметки",
    "Отметить все строки",
    "Переместить в конец",
    "Переместить в начало",
    "Переместить влево",
    "Переместить вправо",
    "Сбросить параметры отображения",
    "Скрыть",
    "Снять все отметки",
    "Таблица",
    "Щелчок - сортировка/реверс, Ctrl+щелчок - добавление/реверс, Ctrl+Shift+щелчок - удаление",
    "Это последний видимый столбец!"
  ]);

  $.widget("plantago.gridPopup", $.plantago.basicPopup,
  {
    _create: function()
    {
      this._superApply(arguments);
      this.element.data("plantagoClass-gridPopup", 1);
    },

    _createPopup: function()
    {
      return this._buildMenuTree([
        { name: "✓ " + plantago.localize("Отметить все строки"), action: "checkAll" },
        { name: "✗ " + plantago.localize("Снять все отметки"), action: "reset" },
        { name: "⊕ " + plantago.localize("Инвертировать отметки"), action: "toggleCheck" },
        { name: plantago.localize("Сбросить параметры отображения"), action: "resetState" }
      ], "").menu();
    },

    _destroy: function() 
    {
      this.element.removeData("plantagoClass-gridPopup");
      this._superApply(arguments);
    }
  });


  $.widget("plantago.grid", $.plantago.basicInput,
  {
    options:
    {
      colsHideable: true,
      colsMoveable: true,
      colsOrder: [], // придётся здесь не делать полный список, неудобно
      cssClass: "grid",
      displayName: П.localize("Таблица"), // для шапки контекстного меню
      multiSort: true,
      name: "", // для эл-та управления с птичками/выбором
      showResetViewMenuItem: false,
      sortable: true,
      sortOrder: "",
      stateOptions: ["colsOrder", "sortOrder", "visibleCols"],
      stateSaveValue: false, // нечего. потом будут рандомные птички
      tickType: "none",
      visibleCols: [], // и здесь тоже пустой список = ничего не делать 
      // events
      change: $.noop
    },

    _create: function()
    {
      this._superApply(arguments);
      this.element.data("plantagoClass-grid", 1);
      this
        ._checkOptionsSanity()
        ._refreshSortCols()
        ._hideShowCols()
        ._bindSortHandlers()
        ._appendMoveHideControls()
        ._prependTicksCol()
        ._prependRowNumbersCol()
        ._reorderCols()
        ._createPopup()
        ._sort();
      const that = this;
      this._on(this.element, {
        contextmenu: function(e) {
          const hasTicks = plantago.liTickType.get(that.options.tickType).name === "checkbox";
          that._popup
            .callPlantagoWidget("showItems", {
              checkAll: hasTicks,
              reset: hasTicks,
              toggleCheck: hasTicks
            })
            .callPlantagoWidget("showMenu", that.element, e);
        }
      });
    },

    getDisplayName: function()
    {
      return this.options.displayName;
    },

    _checkOptionsSanity: function() {
      if (this.options.colsMoveable || this.options.colsHideable)
      {
        const offenders = this.element.find("th[colspan]").push(this.element.find("th[rowspan]"));
        if (offenders.length)
        {
          console.log("Переупорядочивание и скрытие столбцов не поддерживаются для многострочных заголовков!");
          this.options.colsMoveable = this.options.colsHideable = false;
        }
      }
      return this;
    },

    _getAutoColumnCount: function()
    {
      return (plantago.liTickType.get(this.options.tickType).name !== "none");
    },

    _refreshSortCols: function()
    {
      const _sortHeaders = this._sortHeaders = [];
      // шапка может иметь сложную структуру, придётся пройтись
      const headerRows = this.element
        .children("thead")
        .children("tr")
        .not(":data[name=controlsRow]");
      headerRows.each((i, row) => {
        $(row).children("th").each((j, col) => {
          col = $(col);
          if ((col.prop('rowspan') || 1) + i === headerRows.length && col.data("name") !== "tickTh")
            _sortHeaders.push(col);
        });
      });
      return this;
    },

    _bindSortHandlers: function()
    {
      const that = this;
      for (let col of this._sortHeaders)
      {
        col.off("click.sort");
        if (that.options.sortable) 
          col.on("click.sort", function(e) {
            that._sortByClick(e);
          }).addClass("sortHeader");
        else
          col.removeClass("sortHeader");
      }
      return this;
    },

    _getHeaderPosition: function(header)
    {
      return $(header).parent().prevAll(".headerCtrlGroup").length;
    },

    _getMoveHideControlsForCol: function(index, total)
    {
      const ret = $();
      const that = this;
      if (this.options.colsMoveable)
      {
        if (index > 1)
          ret.push($("<span>")
            .addClass("ui-icon-seek-first headerCtrl")
            .prop("title", П.localize("Переместить в начало"))
            .icon()
            .click(function(e) {
              const order = that._getHeaderPosition(this);
              that._swapCols(order, 0);
            }));
         if (index > 0)
          ret.push($("<span>")
            .addClass("ui-icon-seek-prev headerCtrl")
            .prop("title", П.localize("Переместить влево"))
            .icon()
            .click(function(e) {
              const order = that._getHeaderPosition(this);
              that._swapCols(order, order-1);
            }));
        if (index < total-1)
           ret.push($("<span>")
            .addClass("ui-icon-seek-next headerCtrl")
            .prop("title", П.localize("Переместить вправо"))
            .icon()
            .click(function(e) {
              const order = that._getHeaderPosition(this);
              that._swapCols(order, order+1);
            }));
        if (index < total-2)
          ret.push($("<span>")
            .addClass("ui-icon-seek-end headerCtrl")
            .prop("title", П.localize("Переместить в конец"))
            .icon()
            .click(function(e) {
              const order = that._getHeaderPosition(this);
              that._swapCols(order, that._sortHeaders.length - 1);
            }));
       }
      if (this.options.colsHideable)
        ret.push($("<span>")
          .addClass("ui-icon-closethick headerCtrl")
          .prop("title", П.localize("Скрыть"))
          .icon()
          .click(function(e) {
            that._hideCol(that._getHeaderPosition(this));
          }));
      return ret;
    },

    _appendMoveHideControls: function()
    {
      const that = this;
      this._untieElement("_controlsRow");
      if (this.options.colsMoveable || this.options.colsHideable)
      {
        this._tieElement({
          elementName: "tr",
          name: "_controlsRow",
          setName: true,
          selector: "[name=controlsRow]",
          owner: this.element.children("thead")
        });
        this._sortHeaders.forEach((col, i) => {
          that._controlsRow
            .append($("<th>")
              .addClass("headerCtrlGroup")
              .condCall($(col).css("display") == "none", "hide")
              .append(that._getMoveHideControlsForCol(i, that._sortHeaders.length))
            );
        });
      }
      return this;
    },

    _prependTicksCol: function()
    {
      this._untieElements({ startsWith: "tick" });
      const tt = П.liTickType.get(this.options.tickType).name;
      if (tt === "none")
        return this;
      this._tieElement({
        elementName: "th",
        name: "tickTh",
        setName: true,
        selector: "[name=tickTh]",
        owner: this.element.find("thead > tr:first-child"),
        makeFirst: true,
        creationProps: {
          rowspan: this.element.find("thead > tr").length
        }
      });
      const gridId = this.element.prop("id");
      const that = this;
      this.element.find("tbody > tr").each((i, tr) => {
        this._tieElement({
          elementName: "th",
          name: "tickTd" + i,
          setName: true,
          selector: "[name^=tickTd]",
          owner: tr,
          makeFirst: true,
          cssClass: "tick"
        });
        const td = this["tickTd" + i];
        td.append(
          $("<input>", {
            type: tt,
            name: gridId
          }).on("change.grid", e => that._trigger("change", e))
        );
      });
      return this;
    },

    _prependRowNumbersCol: function()
    {
      return this;
    },

    _showResetViewMenuItem: function()
    {
      this._popup.callPlantagoWidget("showItems", {
        resetState: this.options.showResetViewMenuItem
      });
      return this;
    },

    _createPopup: function()
    {
      this._popup = $("<div>")
        .data("bhv", "gridPopup")
        .createPlantagoWidget();
      return this._showResetViewMenuItem();
    },

    _getHeaderId: function(hdr)
    {
      return hdr.data("col-name");
    },

    _getHeaderChildSelector: function(hdr)
    {
      return hdr.data("child-selector");
    },

    _getHeaderIsNumber: function(hdr)
    {
      return hdr.data("is-number");
    },

// сортировка
    _getSortOrderByColClick: function(e)
    {
      const what = this._getHeaderId($(e.currentTarget));
      if (!e.ctrlKey || !this.options.multiSort)
      {
        if (this.options.sortOrder === what)
          // реверс
          return "-" + what;
        return what;
      }
      // множественная сортировка
      const cur = this.options.sortOrder.split("|");
      for (let prefix of ["", "-"])
      {
        const pos = cur.indexOf(prefix + what);
        if (pos !== -1) {
          if (e.shiftKey) 
          {
            if (cur.length < 2) // не сбрасываем последнее поле
              return cur.join("|");
            // удаление из сортировки
            if (pos < cur.length - 1)
              return cur.slice(0, pos).concat(cur.slice(pos+1)).join("|");
            return cur.slice(0, pos).join("|");
          }
          // реверс
          cur[pos] = (prefix? "": "-") + what;
          return cur.join("|");
        }
      }
      // добавление
      return cur.concat(what).join("|");
    },

    _sortByClick: function(e)
    {
      const oldOrder = this.options.sortOrder;
      this.options.sortOrder = this._getSortOrderByColClick(e);
      if (oldOrder !== this.options.sortOrder)
        this._sort();
      // здесь не надо return: это обработчик события
    },    

    _showSortMarkersAndComputeIndexes: function()
    {
      const cur = this.options.sortOrder.split("|");
      const ret = [];
      const that = this;
      this._sortHeaders.forEach((hdr, i) => {
        hdr.children().remove();
        const field = this._getHeaderId(hdr);
        let pos = cur.indexOf(field);
        if (pos > -1)
          hdr.append($("<span>").addClass("ui-icon-arrowthick-1-n headerCtrl"));
        else {
          pos = cur.indexOf("-" + field);
          if (pos > - 1)
            hdr.append($("<span>").addClass("ui-icon-arrowthick-1-s headerCtrl"));
        }
        if (pos > -1)
        {
          ret[pos] = {
            pos: i,
            isNumber: this._getHeaderIsNumber(hdr),
            childSelector: this._getHeaderChildSelector(hdr)
          }; // TODO П.parseBool
          if (cur.length > 1)
            hdr.append($("<span>").addClass("sortOrder").text(pos + 1));
        }
      });
      return ret;
    }, 

    _compileSortGetter: function(indexes)
    {
      const fields = [];
      for (let ind of indexes)
      {
        const childSel = ind.childSelector? ".children('" + ind.childSelector + "')": "";
        if (ind.isNumber)
          fields.push("parseFloat(c.eq(" + ind.pos + ")" + childSel + ".ownText())");
        else
          fields.push("c.eq(" + ind.pos + ")" + childSel + ".ownText().trim()");
      }
      return new Function("r", "c = r.children('td'); return [" + fields.join(", ") + "];");
    },

    _compileSortComparator: function()
    {
      let src = "let f = function(a, b) { if (a > b) return 1; if (a < b) return -1; return 0; };";
      src += "let orders = [" +
        this.options.sortOrder.split("|").map((v) => {
          return v[0] === "-"? -1: 1;
        }) + "];";
      src += "for (let i = 0; i < a.length; i++) {";
      src += "  ret = f(a[i], b[i])*orders[i];"
      src += "  if (ret) return ret;";
      src += "} return 0;"
      return new Function("a", "b", src);
    },

    _sort: function()
    {
      const indexes = this._showSortMarkersAndComputeIndexes();
      if (!this.options.sortOrder)
        return;
      const getter = this._compileSortGetter(indexes);
      const comparator = this._compileSortComparator();
      this.element.children('tbody').children('tr').quickSortSameParent(getter, comparator);
      return this;
    },

// перестановка столбцов
    _getColsOrder: function()
    {
      return this._sortHeaders.map(hdr => this._getHeaderId(hdr));
    },

    _swapCols: function(oldIndex, newIndex)
    {
      const ofs = this._getAutoColumnCount();
      let swap;
      if (oldIndex < newIndex)
        swap = function(a, b) { a.insertAfter(b); };
      else
        swap = function(a, b) { a.insertBefore(b); };
      for (let row of this.element.children("tbody").children("tr"))
      {
        c = $(row).children();
        swap(c.eq(ofs + oldIndex), c.eq(ofs + newIndex));
      }
      swap(this._sortHeaders[oldIndex], this._sortHeaders[newIndex]);
      if (newIndex === 0) 
        this._sortHeaders = [this._sortHeaders[oldIndex]]
          .concat(this._sortHeaders.slice(0, oldIndex))
          .concat(this._sortHeaders.slice(oldIndex + 1));
      else if (newIndex === this._sortHeaders.length - 1)
        this._sortHeaders = this._sortHeaders.slice(0, oldIndex)
          .concat(this._sortHeaders.slice(oldIndex + 1))
          .concat([this._sortHeaders[oldIndex]]);
      else
        П.swapArrayItems(this._sortHeaders, oldIndex, newIndex);
      this.options.colsOrder = this._getColsOrder();
      return this;
    },

    _reorderCols: function()
    {
      const oldOrder = this._getColsOrder();
      if (!this.options.colsOrder || !this.options.colsOrder.length)
      {
        this.options.colsOrder = oldOrder;
        return this;
      }
      if (plantago.memberwiseCompare(oldOrder, this.options.colsOrder))
        return this;
      const series = [...Array(oldOrder.length).keys()];
      const that = this;
      this.options.colsOrder
        .map(col => oldOrder.indexOf(col))
        .filter(col => col >= 0)
        .forEach((col, idx) => {
          const pos = series.indexOf(col);
          if (pos !== idx)
          {
            that._swapCols(pos, idx); 
            plantago.swapArrayItems(series, pos, idx);
          }
        });         
      return this;
    },

// скрытие/показ столбцов
    _excludeColFromSort: function(index)
    {
      const field = this._sortHeaders[index].ownText();
      const cur = this.options.sortOrder.split("|");
      const pos = Math.max(cur.indexOf(field), cur.indexOf("-" + field));
      if (pos > -1)
      {
        this.options.sortOrder = cur.slice(0, pos).concat(cur.slice(pos+1, cur.length)).join("|");
        this._sort();
      }
      return this;
    },

    _updateVisibleColsOption: function(getAll)
    {
      const cols = [];
      for (let hdr of this._sortHeaders)
        if (getAll || (hdr.css("display") != "none"))
          cols.push(this._getHeaderId(hdr));
      this.options.visibleCols = cols;
      return this;
    },

    _hideShowCol: function(index, show)
    {
      const acc = this._getAutoColumnCount();
      this.element
        .find("thead > tr").each((i, tr) => {
          $(tr).children().eq(index+(!i? acc: 0)).switchCall(show, ["hide", "show"]);
        })
        .end()
        .find("tbody > tr > td:nth-of-type(" + (index+1) + ")")
        .switchCall(show, ["hide", "show"]);
      return this;
    },

    _hideCol: function(index)
    {
      if (this.options.visibleCols.length === 1)
      {
        const remaining = this._sortHeaders.find(
          item => this._getHeaderId(item) === this.options.visibleCols[0]
        );
        const content = remaining.children().detach();
        const text = remaining.ownText();
        remaining.ownText("").append($("<div>")
          .text(П.localize("Это последний видимый столбец!"))
          .addClass("hidingError"));
        setTimeout(function() {
          remaining.empty().ownText(text).append(content);
        }, 2000);
        return;
      }
      return this._excludeColFromSort(index)
        ._hideShowCol(index, false)
        ._updateVisibleColsOption();
    },

    showAllCols: function()
    {
      this.element
        .find("th:not(:visible)")
        .add("td:not(:visible)")
        .show();
      return this;
    },

    _hideShowCols: function()
    {
      if (!this.options.visibleCols.length)
        return this._updateVisibleColsOption(true).showAllCols();
      this._sortHeaders.forEach((hdr, i) => {
        const show = this.options.visibleCols.indexOf(this._getHeaderId(hdr)) > -1;
        this._hideShowCol(i, show);
      });
      return this;
    },

// динамическое управление
    _setOptions: function(options)
    {
      // не уводим сортировку в никуда
      if (!options.sortOrder)
        delete options.sortOrder;
      this._superApply(arguments);
      if ("colsMoveable" in options || "colsHideable" in options)
        this._appendMoveHideControls();
      if ("visibleCols" in options)
        this._hideShowCols();
      if ("colsOrder" in options)
        this._reorderCols();
      if ("multiSort" in options && !this.options.multiSort)
        this.options.sortOrder = this.options.sortOrder.split("|").slice(0, 1).join("|");
      if ("sortable" in options)
      {
        if (!this.options.sortable)
          this.options.sortOrder = "";
        this._bindSortHandlers();
      }
      if ("sortable" in options || "sortOrder" in options || "multiSort" in options)
        this._sort();
      if ("tickType" in options)
        this._prependTicksCol();
      if ("showResetViewMenuItem")
        this._showResetViewMenuItem();
    },

// методы basicInput
    reset: function()
    {
      return this.clear();
    },

    _getInputs: function(f)
    {
      const tds = this.element.find("tbody > tr > th:first-child");
      return tds.children("input[type=checkbox]").push(tds.children("input[type=radio]"));
    },

    clear: function()
    {
      this._getInputs().each((i, input) => {
        if (!input.disabled)
          input.checked = false;
      });
      return this;
    },

    checkAll: function()
    {
      if (П.liTickType.get(this.options.tickType).name === "checkbox")
        this._getInputs().each((i, input) => {
          if (!input.disabled)
            input.checked = true;
        });
      return this;
    },

    toggleCheck: function()
    {
      if (П.liTickType.get(this.options.tickType).name === "checkbox")
        this._getInputs().each((i, input) => {
          if (!input.disabled)
            input.checked = !input.checked;
        });
      return this;
    },

    enable: function()
    {
      this._getInputs().prop("disabled", false);
      return this;
    },

    disable: function()
    {
      this._getInputs().prop("disabled", true);
      return this;
    },

    getValue: function()
    {
      if (plantago.liTickType.get(this.options.tickType).name === "none")
        return null;
      if (!this.hasData())
        return [];
      const values = [];
      for (let input of this._getInputs().filter(":checked"))
        values.push($(input).parent().parent().data("row-id"));
      return values;
    },

    hasData: function()
    {
      if (plantago.liTickType.get(this.options.tickType).name === "none")
        return false;
      return !!this._getInputs().filter(":checked").length;
    },

    setData: function(hash)
    {
      if (plantago.liTickType.get(this.options.tickType).name === "none")
        return;
      let arr = hash[this.options.name];
      if (!arr)
        return;
      arr = $.isArray(arr)? arr: arr.split(",");
      this._getInputs().val(false);
      const tbody = this.element.children("tbody");
      arr.forEach((id) => {
        tbody.find("tr[row-id=" + id + "] th:first-child input").prop("checked", true);
      });
    },

// вспомогательные функции для достройки контента по заказу
    _getCol: function(fieldName, what)
    {
      let n = -1, hdr = null;
      const that = this;
      this.element.find("th").each((i, th) => {
        th = $(th);
        if (that._getHeaderId(th) === fieldName)
        {
          n = i + 1 - this._getAutoColumnCount();
          hdr = th; 
          return false;
        }
      });
      switch(what)
      {
        case "index": return n;
        case "self": return hdr;
      }
    },

    getColPos: function(fieldName)
    {
      return this._getCol(fieldName, "index");
    },

    getHeaderByFieldName: function(fieldName)
    {
      return this._getCol(fieldName, "self");
    },

    getAdjacentCell: function(fieldNameOrIndex, td) 
    {
      let idx = typeof(fieldNameOrIndex) === 'number'? fieldNameOrIndex: this.getColPos(fieldNameOrIndex);
      return $(td).parent().children(`td:nth-of-type(${idx})`);
    },

    augmentCells: function(fieldNameOrIndex, f)
    {
      let idx = typeof(fieldNameOrIndex) === 'number'? fieldNameOrIndex: this.getColPos(fieldNameOrIndex);
      this.element.find(`td:nth-of-type(${idx})`).each(f);
      return this;
    },

    getRowIdByCell: function(td)
    {
      return $(td).parent().data("row-id");
    },

    addCustomMenuItems: function(itemArr)
    {
      this._popup.callPlantagoWidget("addCustomItems", itemArr);
    },

    _destroy: function()
    {
      this.element.removeData("plantagoClass-grid");
      this._superApply(arguments);        
    }
  });
});

