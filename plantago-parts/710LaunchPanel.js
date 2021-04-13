//---------------
// Панель запуска
//---------------

$(function() {
  $.widget("plantago.launchPanel", $.plantago.root, {
    options: 
    {
      contentOutside: false,
      contentSelector: ".content",
      cssClass: "launchPanel",
      clearOnLaunch: true,
      excludeDescendants: ":data('plantagoClass-launchPanel')",
      forceHtmlContent: false,
      httpMethod: "POST",
      launchOnEnterKey: true,
      launcherSelector: ":data('plantagoClass-toolButton')",
      lockLaunchersUntilCompletion: true,
      lockSelector: ":data('plantagoClass-toolButton')",
      newerFirst: false, // приписывать свежее в начало
      paramsAsJson: false,
      preventCaching: true,
      reloadable: true,
      showWaitPlaceholder: false,
      uri: "",
      // events
      addExtraQueryParams: $.noop,
      beforeLoad: function(e, loadedData) { return true; }, // при возврате false стопорим обработку
      contextMenu: function(e) { e.stopPropagation(); },
      error: $.noop,      
      filterParams: $.noop,
      load: $.noop,
      validate: function(e, data) { return true; }
    },

    _loaded: false,
    _waiting: false,

    _create: function()
    {
      this._superApply(arguments);
      this.element.data("plantagoClass-launchPanel", 1);
      this._delayUntilWidgetsCreation("bindControls");
      this._on(this.element, {
        contextmenu: function(e) {
          this._trigger("contextMenu", e);
        }
      });
    },

    _getContentElement: function() 
    {
      return this.options.contentOutside? 
        $(this.options.contentSelector):
        this.element.find(this.options.contentSelector);
    },

    parseResponse: function(response, data)
    {       
      if (!this._trigger("beforeLoad", null, response))
        return; // просили дальше ничего не делать
      const content = this._getContentElement();
      if (!content.length)
      {
        plantago.debugLog("Launch panel with uri = '" 
          + this.options.uri 
          + "' has no nodes matching '" 
          + this.options.contentSelector
          + "', fetched content is lost.");
        return;
      }
      content.children("[data-name='placeholder']").remove();
      if (!response)
        return;
      let newContent;
      if (this.options.forceHtmlContent || response.nodeType)
      {
        const selector = "[data-bhv]" + (cfgNonstandardAttrCompat? ",[bhv]": "");
        newContent = content
          .appendFetchedFragment(response, this.options.newerFirst)
          .find(selector)
          .addBack(selector)
          .createPlantagoWidget()
          .end()
          .end()
          .show();
      }
      this._trigger("load", null, {
        rawData: response,
        content: newContent,
        inputData: data
      });
      return this;
    },

    _appendMessage: function(msg, cssClass)
    {
      msg = $("<span>", {
        "data-name": "placeholder",
        "class": cssClass,
        text: msg
      });
      const content = this._getContentElement();
      content.switchCall(this.options.newerFirst, ["append", "prepend"], msg);
      return this;
    },

    clear: function()
    {
      this.element
         .find(":data('plantagoClass-basicInput')")
         .callPlantagoWidget("clear");
      this._getContentElement().empty();
      return this;
    },

    _walkThroughControls: function(els, data)
    {
      if (els === undefined)
        els = this.element.children();
      if (data === undefined)
        data = {};
      for (let el of els)
      {
        el = $(el);
        if (el.is(this.options.excludeDescendants))
          continue;
        if (el.is(":data('plantagoClass-basicInput')"))
          el.callPlantagoWidget("collectData", data);
        this._walkThroughControls(el.children(), data);
      }
      return data;
    },

    _gatherData: function(extraData)
    {
      let allParams = this._walkThroughControls();
      if (extraData)
        allParams = {...allParams, ...extraData};
      this._trigger("addExtraQueryParams", null, allParams);
      if (!this._trigger("validate", null, allParams))
        return false;
      let filteredParams = {...allParams};
      this._trigger("filterParams", null, filteredParams);
      if (!this.options.paramsAsJson)
        filteredParams = plantago.mapObject(filteredParams, v => v.toString());
      return {
        "allParams": allParams,
        "filteredParams": filteredParams
      };
    },

    launch: function(invoker, extraData)
    {
      if (this._loaded && !this.options.reloadable)
        return;
      if (this._waiting)
        return;
      const params = this._gatherData(extraData);
      if (params === false)
        return;
      this.element
        .find(":data('plantagoClass-operationTimer'):first")
        .callPlantagoWidget("start");
      if (this.options.clearOnLaunch)
        this._getContentElement().empty();
      if (this.options.showWaitPlaceholder)
        this._appendMessage(this._localize("Пожалуйста, подождите…"), "waitPlease");  
      if (this.options.lockLaunchersUntilCompletion)
      {
        invoker && invoker.callPlantagoWidget("enterWaitState");
        this.element
          .find(this.options.lockSelector)
          .callPlantagoWidget("enterWaitState", true);
      }
      this._waiting = true;
      const that = this;
      $.ajax({
        method: this.options.httpMethod,
        url: this.options.uri,
        cache: !this.options.preventCaching,
        contentType: this.options.paramsAsJson? "application/json; charset=UTF-8": undefined,
        data: this.options.paramsAsJson? JSON.stringify(params.filteredParams): params.filteredParams,
        processData: !this.options.paramsAsJson,
        beforeSend: function(jqXHR, settings) {
          settings.data = settings.data? settings.data.replace(/\+/g, "%20"): settings.data;
        }
      }).done(function(response) {
          that._loaded = 1;
          that.parseResponse(response, params.allParams);
      }).fail(function(jqXHR, textStatus, errorThrown) {
// TODO: error - preventDefault
        that
          ._appendMessage(that._localize("Произошла ошибка") + ": " + 
            textStatus + " (" + (errorThrown.message || errorThrown) + ")", "error"
          )._trigger("error", null, errorThrown);
      })
      .always(function() {
        that.element
          .find(":data('plantagoClass-operationTimer')")
          .callPlantagoWidget("stop");
        if (that.options.lockLaunchersUntilCompletion) 
        {
          invoker && invoker.callPlantagoWidget("leaveWaitState");
          that.element
            .find(that.options.lockSelector)
            .callPlantagoWidget("leaveWaitState", true);
        }
        that._waiting = false;
      }); 
      return this;
    },

    bindControls: function()
    {
      const that = this;
      const f = function(e) {
        that.launch($(this));
      }
      this.element
        .find(this.options.launcherSelector)
        .on("run", f)
        .callPlantagoWidget("option", "run", f);
      const g = function(e) {
        if (e.keyCode == 13)
        {
          that.launch($(this));
          e.stopPropagation();
        }
      }
      if (this.options.launchOnEnterKey)
        // безымянные (например, в составе слайдеров) скорее вредят
        this.element
          .find("input[name]")
          .on("keypress", g);
      return this;
    },

    unbindControls: function()
    {
      this.element
        .find(this.options.launcherSelector)
        .off("run");
      return this;
    },

    _setOption: function(key, value)
    {
      if (key == "launcherSelector")
        this.unbindControls();
      this._superApply(arguments);
      if (key == "launcherSelector")
        this.bindControls();
    },

    _destroy: function()
    {
      this.unbindControls();
      this.element.removeData("plantagoClass-launchPanel");
      this._superApply(arguments);
    }
  });
});
