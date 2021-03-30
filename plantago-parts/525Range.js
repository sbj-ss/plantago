// TODO тут кучка напрашивающихся расширений, начиная со вхождения
plantago.Range = function()
{
  return this.init();
}

plantago.Range.prototype = {
  init: function()
  {
    this.from = "";
    this.to = "";
    return this;
  }, 

  toString: function()
  {
    return this.from + "to" + this.to;
  }
};

plantago.Range.bounds = new plantago.Enum({
  values: {
    "none": { 
      parts: [],
      single: false 
    },
    "from": { 
      position: 0, 
      counterpart: "to", 
      alias: "left",
      parts: ["to"],
      single: true 
    },
    "to": { 
      position: 1, 
      counterpart: "from", 
      alias: "right",
      parts: ["from"],
      single: true
    },
    "both": { 
      parts: ["from", "to"],
      single: false
    }
  },
  searchKeys: ["position", "alias"],
  defaultValue: "from"
});
