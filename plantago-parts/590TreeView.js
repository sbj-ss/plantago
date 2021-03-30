//-------------------------------------
// мостик с листьев/папок на basicInput
//-------------------------------------

$(function() {
  $.widget("plantago.treeView", $.plantago.basicInput, {
    _create: function() 
    {
      this._superApply(arguments);
      this.element.data("plantagoClass-treeView", 1);
    },

    hasData: function()
    {
      // TODO возможно, правильнее-таки итерировать по узлам
      return true;
    },

    reset: function()
    {
      // TODO узлы не хранят информации о начальном состоянии - а правильно ли?..
      this.element.find(":data('plantagoClass-basicListItem')").callPlantagoWidget("clearInput");
      return this;
    },
 
    clear: function()
    {
      this.element.find(":data('plantagoClass-basicListItem')").callPlantagoWidget("clearInput");
      return this;
    },

    // TODO enable/disable

    getValue: function()
    {
      let states = {};
      this.element.find(":data('plantagoClass-basicListItem')").callPlantagoWidget("collectTick", states);
      const ret = [];
      for (k in states)
      {
        switch(states[k])
        {
          case 0: // не отмечен
            break; 
          case 1: // собственная отметка
            ret.push(k);
            break;
          case 2: // групповая отметка
            ret.push(k + "↓");
            break;
          default: // затесался отмеченный в составе родителя
            break;
        }
      }
      return ret;
    },

    setData: function(hash)
    {
      if (!this.options.name || !hash[this.options.name])
        return this;
      // чтобы не дрыгать поиск на каждый узел, преобразуем формат и вызовем групповую операцию
      let states = {}, v = hash[this.options.name];
      const arr = $.isArray(v)? v: v.split("/,\s*/");
      for (let i = 0; i < arr.length; i++)
      {
        if ((typeof(arr[i]) === "string") && (arr[i][arr[i].length - 1] === "↓"))
          states[arr[i].substring(0, arr[i].length - 1)] = 2;
        else
          states[arr[i]] = 1;
      }
      if (keys(states).length)
        this.element.find(":data('plantagoClass-basicListItem')").callPlantagoWidget("setStateEx", states);
      return this;
    },

    _destroy: function()
    {
      this.element.removeData("plantagoClass-treeView");
      this._superApply(arguments);
    }
  });
});
