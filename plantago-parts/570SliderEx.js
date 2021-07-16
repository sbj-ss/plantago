//--------------------------
// Слайдер на базе jquery-ui
//--------------------------

plantago.sliderExGradient = new plantago.Enum({
  values: {
    none: {
      use: false
    },
    ltr: {
      use: true,
      leftColor: "red",
      rightColor: "lime"
    },
    rtl: {
      use: true,
      leftColor: "lime",
      rightColor: "red"
    }, custom: {
      use: true
    }
  },
  searchKeys: [],
  defaultValue: "none"
});

plantago.addDefaultLocalization(["Установить минимальное значение", "Установить максимальное значение"]);

// TODO логарифмический масштаб
$(function() {
  $.widget("plantago.sliderEx", $.plantago.basicInput, 
  {  
    options:
    {
      minValue: 0.0,
      maxValue: 1.0,
      initialValue: .707,
      step: .01,
      hasInput: true,
      hasEdgeButtons: false,
      forceBounds: "none",
      cssClass: "sliderEx",
      gradient: "ltr",
      customGradient: "",
      // пойдёт в слайдер
      orientation: "horizontal",
      range: ""
    },

    _valueDivisor: 1.0,

    _create: function()
    {
      this._superApply(arguments);
      const selfRef = this;
      this.element.data("plantagoClass-sliderEx", 1);
      this._tieElement({
        name: "_setMinBtn",
        selector: "span:first",
        elementName: "span",
        cssClass: "edgeBtn"
      })._tieElement({
        name: "_slider",
        elementName: "div",
        selector: "div:first",
        cssClass: true
      })._tieElement({
        name: "_setMaxBtn",
        selector: "span:nth-of-type(2)",
        elementName: "span",
        cssClass: "edgeBtn"
      })._tieElement({
        name: "_input",
        elementName: "input",
        selector: "input[type='text']",
        cssClass: false,
        creationProps: { 
          type: "text",
          size: 3
        }
      });
      if (this.options.orientation == "vertical")
        this.element.addClass("vertical");
      this._slider.slider({ 
        orientation: this.options.orientation,
        range: this.options.range,
        slide: function(e, ui) {
          selfRef._input.val(ui.value / selfRef._valueDivisor);
          selfRef._trigger("change", e, ui.value / selfRef._valueDivisor);
        }
      });
      this._input
        .data("bhv", "singleInput")
        .val(this.options.initialValue) // пусть запомнится
        .createPlantagoWidget({
          valueType: "float"        
        })
        .on({
          change: function() {
            selfRef._checkBounds();
            selfRef._slider.slider("option", "value", $(this).val()*selfRef._valueDivisor);
          }
        });
      this._setMinBtn
        .text(this.options.minValue)
        .prop("title", this._localize("Установить минимальное значение"))
        .click(function() {
          selfRef._input
           .val(selfRef.options.minValue)
           .trigger("change");
        });
      this._setMaxBtn
        .text(this.options.maxValue)
        .prop("title", this._localize("Установить максимальное значение"))
        .click(function() {
          selfRef._input
            .val(selfRef.options.maxValue)
            .trigger("change");
        });
      this._setSliderBounds();
      this._slider.slider("option", "value", this.options.initialValue*this._valueDivisor);
      this._input.val(this.options.initialValue);
      this.options.forceBounds = plantago.Range.bounds.get(this.options.forceBounds);
      this._checkBounds();
      this._setOptions({
        hasEdgeButtons: this.options.hasEdgeButtons,
        hasInput: this.options.hasInput,
        gradient: this.options.gradient
      });
    },

    _setSliderBounds: function()
    {
      let minValue = this.options.minValue;
      let maxValue = this.options.maxValue;
      let step = this.options.step;
      if (step < 1.0) // охохо
      {
        this._valueDivisor = 1.0 / step;
        minValue /= step;
        maxValue /= step;
        step = 1.0;
      } else {
        this._valueDivisor = 1.0;
      }
      this._slider.slider("option", {
        min: minValue,
        max: maxValue,
        step: step
      });
      return this;
    },

    _checkBounds: function()
    {
      if (this.options.forceBounds.name === "none")
        return this;      
      let curValue = parseFloat(this._input.val());
      if (this.options.forceBounds.parts)
      {
        if ((this.options.forceBounds.parts.indexOf("from") !== -1) && curValue < this.options.minValue)
          curValue = this.options.minValue;
        if ((this.options.forceBounds.parts.indexOf("to") !== -1) && curValue > this.options.maxValue)
          curValue = this.options.maxValue;
      }
      this._input.val(curValue);
      return this;
    },

    enable: function()
    {
      this.options.disabled = false;
      this.element.slider("option", "disabled", false);
      return this;
    },

    disable: function()
    {
      this.options.disabled = true;
      this.element.slider("option", "disabled", true);
      return this;
    },

    _setOption: function(key, value)
    {
      if (key == "gradient")
        value = plantago.sliderExGradient.get(value);
      this._super(key, value);
      switch (key)
      {
        case "minValue":
          this._setMinBtn.text(this.options.minValue);
          this._checkBounds();
          break;
        case "maxValue":
          this._setMaxBtn.text(this.options.maxValue);
          this._checkBounds();
          break;
        case "step":
          this._checkBounds();
          this._setSliderBounds();
          break;
        case "hasInput":
          if (value)
            this._input.show();
          else
            this._input.hide();
          break;
        case "hasEdgeButtons":
          if (value)
          {
            this._setMinBtn.show();
            this._setMaxBtn.show();
          } else {
            this._setMinBtn.hide();
            this._setMaxBtn.hide();
          }
          break;
        case "gradient":
          const gradData = this.options.gradient;
          if (gradData.use)
          {
            if (gradData.name === "custom")
              this._slider.css("background", "linear-gradient(" + this.options.customGradient + ")");
            else
              this._slider.css("background", "linear-gradient(to " 
                + (this.options.orientation == "vertical"? "bottom": "right") + ", " 
                + gradData.leftColor + ", " + gradData.rightColor);
          }
          break;
        case "orientation":
          this._slider.slider("option", "orientation", this.options.orientation);
          this.element.switchCall(this.options.orientation == "vertical", ["removeClass", "addClass"], "vertical");
          this._setOption("gradient", this.options.gradient);
          break;
        case "range":
          this._slider.slider("option", "range", this.options.range);
          break;
      }
    },
 
    forceChange: function(e)
    {
      this._trigger("change", e, parseFloat(this._input.val()));
    },

    // basicInput overrides
    clear: function()
    {
      this._input
        .val(this.options.minValue) // а что ещё?..
        .trigger("change");
      return this;
    },

    reset: function()
    {
      this._input
        .val(this.options.initialValue)
        .trigger("change");
      return this;
    },

    hasData: function()
    {
      return true;
    },

    getValue: function()
    {
      return parseFloat(this._input.val());
    },

    setValue: function(value) // TODO надо бы и для остальных, чтобы не выпадали
    {
      if (typeof(value) !== "undefined")
        this._input
          .val(value)
          .trigger("change");
      return this;
    },

    setData: function(data)
    {
      if (!this.options.name)
        return this;
      return this.setValue(data[this.options.name]);
    },

    _destroy: function() 
    {
      this.element.removeData("plantagoClass-sliderEx");
      this._superApply(arguments);
    }
  });
});
