//------------------
// Ленивый контейнер
//------------------
plantago.LazyContainer = class extends Object
{
  constructor(params)
  {
    super();
    this.createObject = $.noop;
    this.updateObject = $.noop;
    this.object = null;
    for (let key in params)
      if (this[key] && (typeof(this[key]) === typeof(params[key])))
        this[key] = params[key];
    return this;
  }

  get(...params)
  {
    if (!this.object)
      this.object = this.createObject();
    if (this.updateObject)
      this.updateObject(this.object, ...params);
    return this.object;
  }

  toString() 
  {
    return "LazyContainer";
  }
};
