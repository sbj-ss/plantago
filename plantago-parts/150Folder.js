//-------------
// Папка (узел)
//-------------
plantago.addDefaultLocalization([
  "Перезагрузить содержимое", 
  "Пожалуйста, подождите…", 
  "Произошла ошибка",
  "Отметить все объекты группы",
  "Отменить групповое выделение",
  "Объект отмечен в составе группы"
]);

plantago.folderTransitionMatrix = plantago.makeConstant({
  "uninitialized": {
    tickVisible:      true,
    tickChecked:      false,
    iconClass:        "",
    iconActive:       false,
    propagationState: null,
    pushState:        false,
    stateIsPushable:  false
  },
  "normal": {
    tickVisible:      true,
    tickChecked:      false,
    iconClass:        "",
    iconActive:       true,
    propagationState: null,
    pushState:        false,
    stateIsPushable:  true
  },
  "selectedLeaf": {
    tickVisible:      true,
    tickChecked:      true,
    iconClass:        "",
    iconActive:       true,
    propagationState: null,
    pushState:        false,
    stateIsPushable:  true
  },
  "selectedFolder": {
    tickVisible:      false,
    tickChecked:      false,
    iconClass:        "selected",
    iconActive:       true,
    propagationState: "selectedByParent",
    pushState:        true,
    stateIsPushable:  true
  },
  "selectedByParent": {
    tickVisible:      false,
    tickChecked:      false,
    iconClass:        "grayed",
    iconActive:       false,
    propagationState: "selectedByParent", // такого не дб
    pushState:        true,
    stateIsPushable:  false
  }
});

$(function() {
  $.widget("plantago.folder", $.plantago.basicListItem,
  {
    options:
    {
      autoCreateWidgetsOnLoad: true,
      clearOnLoad: true,
      contentSelector: "div:first", // TODO _sO
      cssClass: "folder",
      hasReloadButton: false,
      httpMethod: "GET",
      isRadioContainer: true,
      loadable: false,
      loadParams: [], // [param1, param2] -> uri?param1=data(param1)&...
      newerFirst: false,
      openAtOnce: false,
      paramsAsJson: false,
      preventCaching: true,
      selectableAsAWhole: false,
      uri: "",
      // обработчики событий
      addExtraQueryParams: $.noop,
      close: $.noop,
      load: $.noop,
      open: $.noop
    },

    _opened: false, // флаги состояния
    _loaded: false,
    _prevStates: [],

    _createBullet: function()
    {
      if (this._bullet)
        return this;
      this._tieElement({
        name: "_bullet",
        elementName: "span",
        selector: "[name='bullet']",
        setName: true,
        cssClass: "bullet",
        makeFirst: true
      });
      this._on(this._bullet, {
        click: "toggle"
      });
      this._bullet.icon();
      return this;
    },

    _createTick: function(t, force)
    {
      this._superApply(arguments);
      if (this._transitionState)
      {
        this._tick.prop("checked", this._transitionState.tickChecked);
        this._tick.switchCall(this._transitionState.tickVisible, ["hide", "show"]);
      }
      return this;
    },

    _createReloadBtn: function()
    {
      if (!this.options.hasReloadButton)
        return this._untieElement("_reloadBtn");
      if (this._reloadBtn)
        return this;
      this._tieElement({
        after: this._caption,
        name: "_reloadBtn",
        elementName: "span",
        selector: "*[name='reloadBtn']",
        setName: true,
        cssClass: true,
        creationProps: {
          title: this._localize("Перезагрузить содержимое")
        }
      });
      this._reloadBtn.icon();
      this._on(this._reloadBtn, {
        click: "reload"
      });
      return this;
    },

    _createPlaceholder: function()
    {
      if (!this.options.loadable)
        return this._untieElement("_placeholder");
      if (this._placeholder)
        return this;
      this._tieElement({
        owner: this._content,
        name: "_placeholder",
        elementName: "span",
        selector: "*[name='placeholder']",
        setName: true,
        cssClass: true,
        creationProps: {
          text: this._localize("Пожалуйста, подождите…")
        }
      });
      this._placeholder.hide();
      return this;
    },

    _createMarker: function()
    {
      if (!this.options.selectableAsAWhole)
        return this._untieElement("_marker");
      if (this._marker)
        return this;
      this._tieElement({
        name: "_marker",
        selector: "*[name='marker']",
        elementName: "span",
        before: (this._tick && this._tick.length)? this._tick: this._caption,
        cssClass: true,
        setName: true
      });
      this._on(this._marker, {
        click: "_toggleGroupSelection"
      });
      return this;
    },

    _getCreateOptions: function(options, element)
    {
      // т.к. мы используем динамический набор свойств из loadParams,
      // нужно эти свойства заранее навесить.
      // здесь опции ещё не инициализированы из DOM
      let lp = this.element.data("loadParams");
      if (!lp && cfgNonstandardAttrCompat)
        lp = this.element.attr("loadParams");
      if (lp)
      {
        if (typeof lp === "string")
          lp = lp.split(/,\s*/);
        for (let name of lp)
          this.options[name] = "";
        this.options.loadParams = lp;
      }
      return this._superApply();
    },

    _create: function()
    {
      this._superApply(arguments);
      this.element.data("plantagoClass-folder", 1);
      // содержимое
      this._tieElement({
        name: "_content",
        elementName: "div",
        selector: this.options.contentSelector,
        setName: false,
        cssClass: "content"
      });
      this._content.hide();
      this._createPlaceholder()._createReloadBtn()._createMarker();
      const that = this;
      this._on(this._caption, {
        click: function(e) {
          if (that.options.active)
            that._clickHandler(e);
        }
      });
      if (this.options.openAtOnce)
        this.open();
      if (this.options.isRadioContainer)
        this.element.attr("data-plantago-radio-container", true);
      // если мы хотим, чтобы это распространилось на детей, похоже, придётся отложить (_delayUntilWidgetsCreation)
      // на первое время отбросим ситуацию, когда дети уже есть, а не создаются при подгрузке
      this.setState(this.options.state, true);
    },

    load: function(e)
    {
      if (this._loaded || !this.options.loadable || !this.options.uri)
      {
        this._loaded = true;
        return;
      }
      if (this.options.clearOnLoad)
        this._content
          .empty()
          .append(this._placeholder.show());
      // сначала выполним тупой сбор по списку, потом при наличии дадим возможность перекрыть
      const that = this;
      const extraParams = this.options.loadParams.reduce((state, param) => {
        state[param] = that.options[param];
        return state;
      }, {});
      this._trigger("addExtraQueryParams", null, extraParams);
      const xhr = $.ajax({
        url: this.options.uri,
        contentType: this.options.paramsAsJson? "application/json; charset=UTF-8": undefined,
        data: this.options.paramsAsJson? JSON.stringify(extraParams): extraParams,
        cache: !this.options.preventCaching,
        method: this.options.httpMethod,
        processData: !this.options.paramsAsJson
      }).done(data => {
        that._loaded = 1;
        const fragment = that._parseResponse(data, xhr); // замыкание на xhr
        that._trigger("load", null, {
          "fragment": fragment,
          "widgetElement": that.element
        });
      }).fail((jqXHR, textStatus, errorThrown) => {
        that._content
          .condCall(this.options.clearOnLoad, 'empty')
          .append($("<span>", {
            text: that._localize("Произошла ошибка") + ": " + (errorThrown.message || errorThrown)
          }));
      }).always(() => {
        that._placeholder.detach();
      });
    },

    _getPropagatedOptions: function()
    {
      return {
        active: { value: this.options.active },
        loadable: { value: this.options.loadable },
        loadParams: { value: this.options.loadParams },
        selectableAsAWhole: { value: this.options.selectableAsAWhole },
        tickType: { value: this.options.tickType.name },
        uri: { value: this.options.uri }
      };
    },

    _getManagedWidgetClasses: function()
    {
      return ["leaf", "folder"];
    },

    _extendLoadedJsonObject: function(j)
    {
      const classes = this._getManagedWidgetClasses();
      if (classes.indexOf(j.bhv) === -1)
        return j;
      const o = this._getPropagatedOptions();
      for (let k in o)
      {          
        if (o[k].force || (typeof(j[k]) === "undefined"))
          j[k] = o[k].value;
      }
      return j;
    },

    _extendLoadedJson: function(ja)
    {
      if ($.isPlainObject(ja))
        return this._extendLoadedJsonObject(ja);
      const that = this;
      return ja.map(obj => that._extendLoadedJsonObject(obj));
    },

    _parseResponse: function(data, xhr)
    {
      if (!data)
        return; // так тоже бывает
      // будем считать, что jquery уже разобрался с MIME-типами и выполнил преобразование.
      // второй раз анализировать заголовки не будем.
      // "an XML MIME type will yield XML, in 1.4 JSON will yield a JavaScript object, 
      // in 1.4 script will execute the script, and anything else will be returned as a string"
      if (this.options.clearOnLoad)
        this._content
          .find(":data('plantagoWidgetName')")
          .callPlantagoWidget("destroy")
          .end()
          .empty();
      let fragment;
      if ($.isArray(data) || $.isPlainObject(data)) // массив или объект JSON под узлы/узел
      {
        data = this._extendLoadedJson(data);
        // TODO honor newerFirst
        fragment = plantago.createElementListFromJson({
          array: data,
          parent: this._content,
          bindToAttrs: false,
          createWidgets: false // создадим в конце
        });
      } else if (data.ownerDocument) // документ XML/XHTML
        fragment = this._content.appendFetchedFragment(data, this.options.newerFirst);
      else { // документ HTML или plain text, попробуем HTML
        fragment = this._content.appendFetchedFragment(data, this.options.newerFirst);
        if (!this._content.contents().length)
          this._content.ownText((this.options.clearOnLoad? "": this._content.ownText()) + data); // откат на текст
      }
      this._content.show();
      if (this.options.autoCreateWidgetsOnLoad)
      {
        const sel = cfgNonstandardAttrCompat? "[bhv], [data-bhv]": "[data-bhv]";
        this._content.find(sel).createPlantagoWidget();
      }
      this._propagationState && this._propagateState(this._propagationState);
      return fragment;
    },

    reload: function()
    {
      if (!this.options.loadable)
        return;
      this._loaded = false;
      this._opened = false;
      this.open();
    },

    open: function(e)
    {
      if (this._opened)
        return;
      if (!this._loaded && this.options.loadable)
        this.load(e);
      else
        this._content.show();
      this._opened = true;
      this._bullet.addClass("open");
      this._trigger("open");
    },

    close: function(e)
    {
      if (!this._opened)
        return;
      this._content.hide();
      this._opened = false;
      this._bullet.removeClass("open");
      this._trigger("close");
    },

    toggle: function(e)
    {
      if (this._opened)
        this.close(e);
      else
        this.open(e);
      e.stopPropagation();
    },

    clear: function()
    {
      this._content.empty();
      this.close();
      this._loaded = false;
    },

    _setOption: function(k, v)
    {
      this._superApply(arguments);
      switch(k)
      {
        case "hasReloadButton":
          this._createReloadBtn();
          break;
        case "selectableAsAWhole":
          this._createMarker();
          break;
        case "uri":
          if (this._loaded)
            this.reload();
          break;
        case "isRadioContainer":
          if (v)
            this.element.attr("data-plantago-radio-container", 1);
          else
            this.element.removeAttr("data-plantago-radio-container");
      }
    },

    // вынужденно выносим из П.folderTransitionMatrix, т.к. не хочется нарушать локализацию на уровне объекта
    _getMarkerTitle: function(s)
    {
      const stateMap = {
        uninitialized: "",
        normal: "Отметить все объекты группы",
        selectedLeaf: "Отметить все объекты группы",
        selectedFolder: "Отменить групповое выделение",
        selectedByParent: "Объект отмечен в составе группы"
      };
      return stateMap[s]? this._localize(stateMap[s]): "";
    },

    // TODO теоретически возможна ситуация, когда внутри содержимое оторвано по смыслу и требует отдельные птички.
    // пока трудно придумать практический пример - не рассматриваем и не обрабатываем.
    _propagateState: function(state)
    {
      this._content
        .children(":data('plantagoClass-basicListItem')")
        .callPlantagoWidget("setState", state);
    },

    setState: function(newState, force)
    {
      if (!newState)
        newState = this._prevStates.pop(); // возврат
      else
        newState = plantago.liState.get(newState);
      if (!newState)
      {
        plantago.debugLog("Поймали баг: folder.setState: пустое новое состояние!");
        return;
      }
      if ((this.options.state == newState) && !force)
        return;
      const stateFrom = plantago.folderTransitionMatrix[this.options.state.name || this.options.state];
      const stateTo = plantago.folderTransitionMatrix[newState.name];
      this._tick.switchCall(stateTo.tickVisible, ["hide", "show"]);
      this._tick.prop("checked", stateTo.tickChecked);
      this._marker && this._marker
        .removeClass(stateFrom.iconClass)
        .addClass(stateTo.iconClass)
        .prop("title", this._getMarkerTitle(newState.name));
      this._markerEnabled = stateTo.iconActive;
      if (stateFrom.propagationState || stateTo.propagationState) // если есть, откуда или куда переключать
        this._propagateState(stateTo.propagationState);
      this._propagationState = stateTo.propagationState; // запомним для подгрузки
      if (stateTo.pushState && stateFrom.stateIsPushable)
        this._prevStates.push(this.options.state);
      this.options.state = newState;
      this._transitionState = stateTo;
    },

    toggleSelection: function(e)
    {
      //e.preventDefault();
      switch(this.options.state.name)
      {
        case "selectedByParent":
          return;
        case "normal":
          this.setState("selectedLeaf");
          break;
        default:
          this.setState("normal");
      }
    },

    _toggleGroupSelection: function()
    {
      if (this._markerEnabled)
        this.setState(this.options.state.name === "selectedFolder"? null: "selectedFolder");
    },

    _destroy: function()
    {
      this.element
        .removeData("plantagoClass-folder")
        .removeAttr("data-plantago-radio-container");
      this._caption.hoverableCaption("destroy");
      this._superApply(arguments);
    }
  });

  plantago.widgetJsonConstructors["folder"] = function(hash, node, bindToAttrs) 
  {
    $("<span>", { text: hash.caption }).appendTo(node);
    node.createPlantagoWidget(bindToAttrs? undefined: hash);
  };
});
