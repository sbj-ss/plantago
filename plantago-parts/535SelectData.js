plantago.SelectData = function(params)
{ 
  return this.init(params);
}

plantago.SelectData.prototype = {
  init: function(params)
  {
    this.value = (params && params.value)? params.value: "";
    this.text  = (params && params.text)?  params.text:  "";
    return this;
  },

  toString: function() 
  {
    return this.value; // т.к. используем в контексте отправки на сервер
  }
};
