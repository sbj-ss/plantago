//------------
// Лист списка
//------------
plantago.leafTransitionMatrix = plantago.makeConstant({
  "normal": {
    tickChecked:     false,
    tickDisabled:    false,
    pushState:       false,
    stateIsPushable: true
  },
  "selectedLeaf": {
    tickChecked:     true,
    tickDisabled:    false,
    pushState:       false,
    stateIsPushable: true
  },
  "selectedByParent": {
    tickChecked:     true,
    tickDisabled:    true,
    pushState:       true,
    stateIsPushable: false
  }
});

$(function() {
  $.widget("plantago.leaf", $.plantago.basicListItem,
  {
    options:
    {
      cssClass: "leaf" // ovr
    },

    _createBullet: function() // ovr basicListItem
    {
      this._tieElement({
        name: "_bullet",
        selector: "*[name='bullet']",
        elementName: "span",
        cssClass: true,
        setName: true
      });
      this._bullet
        .prependTo(this.element)
        .icon({ companion: this._caption });
      return this;
    },

    _createTick: function(t, force)
    {
      this._superApply(arguments);
      if (this._transitionState)
      {
        this._tick
          .prop("checked", this._transitionState.tickChecked)
          .prop("disabled", this._transitionState.tickDisabled);
      }
      return this;
    },

    _create: function()
    {
      this._superApply(arguments);
      this.element.data("plantagoClass-leaf", 1);
      this._caption.callPlantagoWidget("option", "companion", this._bullet);
      this._on(this._bullet, {
        click: "_clickHandler"
      });
      this.options.state = plantago.liState.get(this.options.state);
      this.setState(this.options.state, true);
    },

    setState: function(newState, force)
    {
      if (!newState) 
        newState = this._selfState;
      else
        newState = plantago.liState.get(newState);
      if ((this.options.state == newState) && !force)
        return;
      const valuesFrom = plantago.leafTransitionMatrix[this.options.state.name];
      const valuesTo = plantago.leafTransitionMatrix[newState.name];
      this._tick
        .prop("checked", valuesTo.tickChecked)
        .prop("disabled", valuesTo.tickDisabled);
      if (valuesTo.pushState && valuesFrom.stateIsPushable)
        this._selfState = this.options.state;
      this.options.state = newState;
      this._transitionState = valuesTo;
    },

    toggleSelection: function()
    {
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

    _destroy: function()
    {
      this.element.removeData("plantagoClass-leaf");
      this._superApply(arguments);      
    }
  });

  plantago.widgetJsonConstructors["leaf"] = function(hash, node, bindToAttrs) 
  {
    $("<span>", { text: hash.caption }).appendTo(node);
    node.createPlantagoWidget(bindToAttrs? undefined: hash);
  };
});
