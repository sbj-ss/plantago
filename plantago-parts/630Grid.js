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
      autoTickFirstRow: false,
      colsHideable: true,
      colsMoveable: true,
      colsOrder: [], // придётся здесь не делать полный список, неудобно
      cssClass: "grid",
      displayName: П.localize("Таблица"), // для шапки контекстного меню
      emphasizeModifiedRows: false,
      emphasizeTicks: false,
      moveTickOnDeletion: false,
      multiSort: true,
      name: "", // для эл-та управления с птичками/выбором
      showContextMenu: true,
      showResetViewMenuItem: false,
      sortable: true,
      sortOrder: "",
      stateOptions: ["colsOrder", "sortOrder", "visibleCols"],
      stateSaveValue: false, // нечего. потом будут рандомные птички
      tickByClick: false,
      tickType: "none",
      visibleCols: [], // и здесь тоже пустой список = ничего не делать 
      // events
      change: $.noop,
      colHidden: $.noop,
    },

    _augmenters: {},
    _tickedRow: null,

    _create: function()
    {
      this._superApply(arguments);
      this.element.data("plantagoClass-grid", 1);
      this
        ._checkOptionsSanity(this.options)
        ._refreshSortCols()
        ._hideShowCols()
        ._bindSortHandlers()
        ._appendMoveHideControls()
        ._prependTickCols()
        ._bindTickByClickHandler()
        ._prependRowNumbersCol()
        ._reorderCols()
        ._createPopup()
        ._sort();
      const that = this;
      this._on(this.element, {
        contextmenu: function(e) {
          if (!that.options.showContextMenu)
            return;
          const hasTicks = that.options.tickType.name === "checkbox";
          that._popup
            .callPlantagoWidget("showItems", {
              checkAll: hasTicks,
              reset: hasTicks,
              toggleCheck: hasTicks
            })
            .callPlantagoWidget("showMenu", that.element, e);
        }
      });
      if (this.options.autoTickFirstRow)
        this.tickFirstRow();
    },

    getDisplayName: function()
    {
      return this.options.displayName;
    },

    _checkOptionsSanity: function(options)
    {
      if (options.colsMoveable || options.colsHideable)
      {
        const offenders = this.element.find("th[colspan]").push(this.element.find("th[rowspan]"));
        if (offenders.length)
        {
          console.log("Переупорядочивание и скрытие столбцов не поддерживаются для многострочных заголовков!");
          options.colsMoveable = options.colsHideable = false;
        }
      }
      if (typeof options.tickType === "string")
        options.tickType = plantago.liTickType.get(options.tickType);
      return this;
    },

    _getAutoColumnCount: function()
    {
      return this.options.tickType.name !== "none";
    },

    _refreshSortCols: function()
    {
      this._sortHeaders = [];
      // шапка может иметь сложную структуру, придётся пройтись
      const headerRows = this.element
        .children("thead")
        .children("tr")
        .not(":data[name=controlsRow]");
      const that = this;
      headerRows.each((i, row) => {
        $(row).children("th").each((j, col) => {
          col = $(col);
          if ((col.prop('rowspan') || 1) + i === headerRows.length && col.data("name") !== "tickTh")
            that._sortHeaders.push(col);
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
        // повесим ровно необходимое кол-во кнопок, чтобы не растягивать столбцы
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
              that._swapCols(order, order - 1);
            }));
        if (index < total - 1)
           ret.push($("<span>")
            .addClass("ui-icon-seek-next headerCtrl")
            .prop("title", П.localize("Переместить вправо"))
            .icon()
            .click(function(e) {
              const order = that._getHeaderPosition(this);
              that._swapCols(order, order + 1);
            }));
        if (index < total - 2)
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
          selector: "[name='controlsRow']",
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
    
    _trackTickChange: function(e)
    {
      const newTickedRow = $(e.target).parent().parent();
      if (this.options.tickType.name === "radio")
      {
        if (this.options.emphasizeTicks)
        {
          if (this._tickedRow)
            this._tickedRow.removeClass("ticked");
          newTickedRow.addClass("ticked");
        }
        this._tickedRow = newTickedRow;
      }
      this._trigger("change", e, newTickedRow.data("row-id"));
    },
    
    _prependTickCol: function(tr)
    {
      if (this.options.tickType.name === "none")
        return;
      const that = this;
      const tdName = "tickTd" + (tr.data("row-id") || plantago.newId128());
      this._tieElement({
        elementName: "th",
        name: tdName,
        setName: true,
        selector: `[name='${tdName}']`,
        owner: tr,
        makeFirst: true,
        cssClass: "tick",
        returnElement: true
      }).append(
        $("<input>", {
          type: this.options.tickType.name,
          name: this.options.name,
          checked: П.parseBool(tr.data("row-checked"), false)
        }).on("change.grid", e => that._trackTickChange(e))
      );
    },

    _prependTickCols: function()
    {
      this._untieElements({ startsWith: "tick" }); // сносит всё, включая сами ячейки
      // TODO: оптимизировать с учётом предыдущего типа, чтобы не перестраивать таблицу каждый раз
      if (this.options.tickType.name === "none")
        return this;
      this._tieElement({
        elementName: "th",
        name: "tickTh",
        setName: true,
        selector: "[name='tickTh']",
        owner: this.element.find("thead > tr:first-child"),
        makeFirst: true,
        creationProps: {
          rowspan: this.element.find("thead > tr").length
        }
      });
      const that = this;
      this.element.find("tbody > tr").each((i, tr) => that._prependTickCol($(tr)));
      return this;
    },

    _bindTickByClickHandler: function()
    {
      if (this.options.tickByClick && this.options.tickType.name === "radio")
      {
        const name = this.options.name;
        this.element.on("click.grid.tick", "tbody tr", function(e) {
          $(this).find(`input[name='${name}']`).prop("checked", true).trigger("change");
        });
      } else
        this.element.off("click.grid.tick");
      return this;
    },

    _prependRowNumbersCol: function()
    {
      // TODO
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

    _getColNameByHeader: function(hdr)
    {
      return hdr.data("col-name");
    },

    _getChildSelectorByHeader: function(hdr)
    {
      return hdr.data("child-selector");
    },

    _getIsNumberByHeader: function(hdr)
    {
      return П.parseBool(hdr.data("is-number"), false);
    },

// сортировка
    _getSortOrderByColClick: function(e)
    {
      const colName = this._getColNameByHeader($(e.currentTarget));
      if (!e.ctrlKey || !this.options.multiSort)
      {
        if (this.options.sortOrder === colName)
          return "-" + colName; // реверс
        return colName; // сортировки не было, будет по этому полю
      }
      // множественная сортировка
      const curOrder = this.options.sortOrder.split("|");
      for (let prefix of ["", "-"])
      {
        const pos = curOrder.indexOf(prefix + colName);
        if (pos !== -1) // поле входит в существующий порядок сортировки
        {
          if (e.shiftKey) // запрошено удаление
          {
            if (curOrder.length < 2) // не сбрасываем последнее поле
              return curOrder.join("|");
            if (pos < curOrder.length - 1) // не последнее
              return cur.slice(0, pos).concat(curOrder.slice(pos + 1)).join("|");
            return curOrder.slice(0, pos).join("|"); // последнее
          }
          curOrder[pos] = (prefix? "": "-") + colName;  // реверс по этому полю
          return curOrder.join("|");
        }
      }
      // поля не было в списке, добавляем
      return curOrder.concat(colName).join("|");
    },

    _sortByClick: function(e)
    {
      const oldOrder = this.options.sortOrder;
      this.options.sortOrder = this._getSortOrderByColClick(e);
      if (oldOrder !== this.options.sortOrder)
        this._sort();
      // здесь не надо return: это обработчик события
    },    

    _showSortMarkersAndGetColData: function()
    {
      // выполняем это после перевычисления порядка сортировки, но перед самой сортировкой.
      // перерисовываем маркеры на заголовках, снимаем с заголовков необходимую информацию
      const curOrder = this.options.sortOrder.split("|");
      const ret = [];
      const that = this;
      this._sortHeaders.forEach((hdr, i) => {
        hdr.children().remove(); // удаляем существующие маркеры
        const colName = this._getColNameByHeader(hdr);
        let pos = curOrder.indexOf(colName);
        if (pos > -1)
          hdr.append($("<span>").addClass("ui-icon-arrowthick-1-n headerCtrl"));
        else {
          pos = curOrder.indexOf("-" + colName);
          if (pos > - 1)
            hdr.append($("<span>").addClass("ui-icon-arrowthick-1-s headerCtrl"));
        }
        if (pos > -1) // нашли в том или ином виде
        {
          ret[pos] = {
            pos: i,
            isNumber: this._getIsNumberByHeader(hdr),
            childSelector: this._getChildSelectorByHeader(hdr)
          }; 
          if (curOrder.length > 1) // покажем номер во множественной сортировке
            hdr.append($("<span>").addClass("sortOrder").text(pos + 1));
        }
      });
      return ret;
    }, 

    _compileSortGetter: function(colData)
    {
      const colGetters = [];
      for (let colDatum of colData)
      {
        const childSel = colDatum.childSelector? ".children('" + colDatum.childSelector + "')": "";
        if (colDatum.isNumber)
          colGetters.push("parseFloat(c.eq(" + colDatum.pos + ")" + childSel + ".ownText())");
        else
          colGetters.push("c.eq(" + colDatum.pos + ")" + childSel + ".ownText().trim()");
      }
      colGetters.push("r.data('row-id')");
      return new Function("r", "c = r.children('td'); return [" + colGetters.join(", ") + "];");
    },

    _compileSortComparator: function()
    {
      let src = "let f = function(a, b) { if (a > b) return 1; if (a < b) return -1; return 0; };";
      src += "let orders = [" +
        this.options.sortOrder.split("|").map((v) => {
          return v[0] === "-"? -1: 1;
        }) + ", 1];";
      src += "for (let i = 0; i < a.length; i++) {";
      src += "  ret = f(a[i], b[i])*orders[i];"
      src += "  if (ret) return ret;";
      src += "} return 0;"
      return new Function("a", "b", src);
    },

    _sort: function()
    {
      const colData = this._showSortMarkersAndGetColData();
      if (!this.options.sortOrder)
        return;
      const getter = this._compileSortGetter(colData);
      const comparator = this._compileSortComparator();
      this.element.children('tbody').children('tr').quickSortSameParent(getter, comparator);
      return this;
    },

// перестановка столбцов
    _getColsOrder: function()
    {
      return this._sortHeaders.map(hdr => this._getColNameByHeader(hdr));
    },

    _swapCols: function(oldIndex, newIndex)
    {
      const offset = this._getAutoColumnCount();
      let swap;
      if (oldIndex < newIndex)
        swap = function(a, b) { a.insertAfter(b); };
      else
        swap = function(a, b) { a.insertBefore(b); };
      // поменяем местами все ячейки с данными
      for (let row of this.element.children("tbody").children("tr"))
      {
        c = $(row).children();
        swap(c.eq(offset + oldIndex), c.eq(offset + newIndex));
      }
      // поменяем местами заголовки
      swap(this._sortHeaders[oldIndex], this._sortHeaders[newIndex]);
      // переставим заголовки в массиве
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
      // обновим в опциях порядок следования столбцов
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
      const colName = this._getColNameByHeader(this._sortHeaders[index]);
      const curOrder = this.options.sortOrder.split("|");
      const pos = Math.max(curOrder.indexOf(colName), curOrder.indexOf("-" + colName));
      if (pos > -1)
      {
        this.options.sortOrder = curOrder.slice(0, pos).concat(curOrder.slice(pos + 1, curOrder.length)).join("|");
        this._sort();
      }
      return this;
    },

    _updateVisibleColsOption: function(getAll)
    {
      const cols = [];
      for (let hdr of this._sortHeaders)
        if (getAll || (hdr.css("display") != "none"))
          cols.push(this._getColNameByHeader(hdr));
      this.options.visibleCols = cols;
      return this;
    },

    _hideShowCol: function(index, show)
    {
      const offset = this._getAutoColumnCount();
      this.element
        .find("thead > tr").each((i, tr) => {
          $(tr).children().eq(index+(!i? offset: 0)).switchCall(show, ["hide", "show"]);
        })
        .end()
        .find(`tbody > tr > td:nth-of-type(${index + 1})`)
        .switchCall(show, ["hide", "show"]);
      this._trigger("colHidden", index, show);
      return this;
    },

    _hideCol: function(index)
    {
      if (this.options.visibleCols.length === 1)
      {
        const remaining = this._sortHeaders.find(
          item => this._getColNameByHeader(item) === this.options.visibleCols[0]
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
      return this._updateVisibleColsOption();
    },

    _hideShowCols: function()
    {
      if (!this.options.visibleCols.length)
        return this.showAllCols();
      this._sortHeaders.forEach((hdr, i) => {
        const show = this.options.visibleCols.indexOf(this._getColNameByHeader(hdr)) > -1;
        this._hideShowCol(i, show);
      });
      return this;
    },

// динамическое управление
    _setOptions: function(options)
    {
      if (!options.sortOrder)
        delete options.sortOrder; // не уводим сортировку в никуда TODO: снять маркеры?..
      this._checkOptionsSanity(options);
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
        this._prependTickCols();
      if ("showResetViewMenuItem" in options)
        this._showResetViewMenuItem();
      if ("autoTickFirstRow" in options && options.autoTickFirstRow)
        this.tickFirstRow();
      if ("tickByClick" in options)
        this._bindTickByClickHandler();
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
      if (this.options.tickType.name === "checkbox")
        this._getInputs().each((i, input) => {
          if (!input.disabled)
            input.checked = true;
        });
      return this;
    },

    toggleCheck: function()
    {
      if (this.options.tickType.name === "checkbox")
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
      if (this.options.tickType.name === "none")
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
      if (this.options.tickType.name === "none")
        return false;
      return !!this._getInputs().filter(":checked").length;
    },

    setData: function(hash)
    {
      // TODO оптимизировать для radio
      if (this.options.tickType.name === "none")
        return;
      let arr = hash[this.options.name];
      if (!arr)
        return;
      arr = $.isArray(arr)? arr: arr.split(",");
      this._getInputs().val(false);
      const tbody = this.element.children("tbody");
      arr.forEach((id) => {
        tbody.find("tr[data-row-id=" + id + "] th:first-child input").prop("checked", true).trigger("change");
      });
    },
    
    tickFirstRow: function()
    {
      if (this.options.tickType.name === "radio" && !this.element.find(`input[type='radio'][name='${this.options.name}']:checked`).length)
        this.setData({[this.options.name]: [this.element.find("tr:data('row-id'):first").data("row-id")]});
    },

// вспомогательные функции для достройки контента по заказу
    _getCol: function(fieldName, what)
    {
      let n = -1, hdr = null;
      const that = this;
      this.element.find("th").each((i, th) => {
        th = $(th);
        if (that._getColNameByHeader(th) === fieldName)
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

// управление на клиенте - CRUD
    _prepareCrudMeta: function()
    {
      return {
        autoColCount: this._getAutoColumnCount(),
        colNames: this._sortHeaders.map(th => this._getColNameByHeader(th)),
        childSelectors: this._sortHeaders.map(th => this._getChildSelectorByHeader(th)),
        isNumber: this._sortHeaders.map(th => this._getIsNumberByHeader(th)),
      };
    },

    getRow: function(rowIdOrJq, meta)
    {
      if (meta === undefined)
        meta = this._prepareCrudMeta();
      let tr;
      if (rowIdOrJq.jquery)
        tr = rowIdOrJq;
      else
        tr = this.element.find(`tr[data-row-id='${rowIdOrJq}']`);
      if (!tr.length)
        return null;
      const fieldValues = {};
      tr.children().slice(meta.autoColCount).each((i, td) => {
        const carrier = meta.childSelectors[i]? $(td).children(meta.childSelectors[i]): $(td);
        let value = carrier.ownText();
        if (meta.isNumber[i])
          value = parseFloat(value);
        fieldValues[meta.colNames[i]] = value;
      });
      return {
        fieldValues: fieldValues,
        rowData: tr.data()
      };
    },

    getRows: function(rowIds)
    { 
      const meta = this._prepareCrudMeta();
      return rowIds.reduce((acc, item) => {
        acc[item] = this.getRow(item, meta);
        return acc;
      }, {});
    },

    deleteRow: function(rowIdOrJq)
    {
      let tr;
      let rowId;
      if (rowIdOrJq.jquery) {
        tr = rowIdOrJq;
        rowId = tr.data("row-id");
      } else {
        tr = this.element.find(`tr[data-row-id='${rowIdOrJq}']`);
        rowId = rowIdOrJq;
      }
      if (!tr.length)
        return this;
      if (this.options.moveTickOnDeletion && this.options.tickType.name === "radio")
      {
        const tick = tr.find(`input[name='${this.options.name}']`);
        if (tick[0].checked)
        {
          let adjacent = tr.next("tr");
          if (!adjacent.length)
            adjacent = tr.prev("tr");
          if (adjacent.length)
          {
            const newTick = adjacent.find(`input[name='${this.options.name}']`);
            newTick.trigger("click");
          } else
            this._tickedRow = null;
        }
      } else
        this._tickedRow = null;
      this._untieElement('tickTd' + rowId);
      tr.remove();
      return this;
    },

    deleteRows: function(rowIdsOrJq)
    {
      for (let rowId of rowIds)
        this.deleteRow(rowId);
      return this;
    },

    deleteTickedRow: function()
    {
      if (this.options.tickType.name === "radio" && this._tickedRow)
      {
        this.deleteRow(this._tickedRow);
        return true;
      }
      return false;
    },

    _postProcessRow: function(tr, options)
    {
      if (options && options.scrollIntoView)
        tr[0].scrollIntoViewIfNeeded();
      if (this.options.tickType.name === "radio" && options && options.tick)
        tr.find(`input[type='radio'][name='${this.options.name}']`).trigger("click");
      if (this.options.emphasizeModifiedRows)
        tr.addClass("modified");
      return this;
    },

    changeRow: function(rowIdOrJq, data, options, meta, dontSort)
    {
      if (meta === undefined)
        meta = this._prepareCrudMeta();
      let tr;
      if (rowIdOrJq.jquery)
      {
        if (!rowIdOrJq.length)
          return this;
        tr = rowIdOrJq;
      } else {
        tr = this.element.find(`tr[data-row-id='${rowIdOrJq}']`);
        if (!tr.length)
          return this.addRow(rowIdOrJq, fields, options, meta, dontSort);
      }
      const fields = data.fieldValues;
      tr.children().slice(meta.autoColCount).each((i, td) => {
        if (!(meta.colNames[i] in fields)) // не трогаем поле, которое не передавали
          return 0;
        td = $(td);
        const oldText = (meta.childSelectors[i]? td.children(meta.childSelectors[i]): td).ownText();
        const newText = fields[meta.colNames[i]] || String.fromCharCode(160);
        if (oldText != newText) // оптимизация: не трогать то, что не меняли
        {
          td.empty().ownText(newText);
          if (this._augmenters[name])
            this.augmenters[name](-1, td);
        }
      });
      tr.data(data.rowData);
      if (!dontSort)
        this._sort();
      this._postProcessRow(tr, options);
      return tr;
    },

    changeRows: function(dof, options)
    {
      const meta = this._prepareCrudMeta();
      const ret = Object.keys(dof).map(rowId => this.changeRow(rowId, dof[rowId], options, meta, true));
      this._sort();
      return ret;
    },

    changeTickedRow: function(data, options)
    {
      if (this.options.tickType.name === "radio")
        this.changeRow(this._tickedRow, data, options);
    },

    addRow: function(rowId, data, options, meta, dontSort)
    {
      if (meta === undefined)
        meta = this._prepareCrudMeta();
      let tr = this.element.find(`tr[data-row-id='${rowId}']`);
      if (tr.length)
        return this.changeRow(rowId, data, options, meta, dontSort);
      const hadRows = this.element.find("tbody tr:first").length > 0;
      tr = $("<tr>").data("row-id", rowId).appendTo(this.element.children("tbody"));
      this._prependTickCol(tr);
      const fields = data.fieldValues;
      meta.colNames.forEach((name, i) => {
        $("<td>").ownText(fields[name] || String.fromCharCode(160)).appendTo(tr);
        if (this._augmenters[name])
          this.augmenters[name](-1, td);
      });
      tr.data(data.rowData);
      tr.attr("data-row-id", rowId);
      if (!dontSort)
        this._sort();
      if (!hadRows && this.options.autoTickFirstRow)
        this.tickFirstRow();
      this._postProcessRow(tr, options);
      return tr;
    },

    addRows: function(dof, options)
    {
      const meta = this._prepareCrudMeta();
      const ret = Object.keys(dof).map(rowId => this.addRow(rowId, dof[rowId], options, meta, true));
      this._sort();
      return ret;
    },

    _deduplicate: function(filters, callback)
    // mode: delete, show
    // filters: {rowData: ["a", "b"], "fieldValues": ["c", "d"]. пустой массив - взять все поля
    {
      const meta = this._prepareCrudMeta();
      let tr = this.element.find("tbody tr:first");
      let oldData = this.getRow(tr, meta), newData;
      let found = false;
      while (true)
      {
        const next = tr.next();
        if (!next.length)
          break;
        newData = this.getRow(next, meta);
        let same = false;
        if (typeof filters === "undefined")
          same = plantago.memberwiseCompare(oldData, newData);
        else
          for (let key of ["fieldValues", "rowData"])
          {
            if (filters[key])
            {
              const oldSubset = filters[key].length? П.sliceObject(oldData[key], filters[key]): oldData[key];
              const newSubset = filters[key].length? П.sliceObject(newData[key], filters[key]): newData[key];
              same = plantago.memberwiseCompare(oldSubset, newSubset);
              if (same)
                break;
            }
          }
        if (same)
        {
          callback(tr);
          found = true;        
        }
        tr = next;
        oldData = newData;
      }
      return found;
    },

    deduplicate: function(filters)
    {
      this._deduplicate(filters, tr => this.deleteRow(tr));
      return this;
    },

    showDuplicateRows: function(filters)
    {
      this.element.find("tbody > tr").removeClass("duplicate")
      return this._deduplicate(filters, tr => tr.addClass("duplicate"));
    },
    
    enumRows: function(callback) // callback(i, tr, data)
    {
      const that = this;
      const meta = this._prepareCrudMeta();
      this.element.find("tbody tr").each((i, tr) => {
        tr = $(tr);
        callback(i, tr, that.getRow(tr, meta))
      });
    },

    _destroy: function()
    {
      this.element.removeData("plantagoClass-grid");
      this._superApply(arguments);        
    }
  });
});

