//----------------------------------------
// Хранилище параметров вызываемого модуля
//----------------------------------------
plantago.ParamsHolder = class extends Object
{
  constructor(key, value)
  {
    super();
    if (typeof(value) !== "undefined")
      this[key] = value; // по паре значений
    else if ($.isPlainObject(key) || key instanceof plantago.ParamsHolder)
      Object.assign(this, key); // из "объекта"
    else if (typeof key === "string")
      this.parse(key);
    return this;
  }

  append(key, value)
  {
    if (key in this)
    {
      if (!$.isArray(this[key]))
        this[key] = [this[key]];
      if (this[key].indexOf(value) === -1)
        this[key].push(value);
    } else
      this[key] = value;
    return this;
  }

  parse(params)
  {
    if (params)
      params.split("&").map(pair => this.append(...pair.split("=")));
    return this;
  }

  clear()
  {
    Object.keys(this).map(k => delete this[k]);
    return this;
  }

  extend(o, overwrite)
  {
    if (overwrite)
      Object.assign(this, this, o);
    else
      for (let v in o)
        this.append(v, o[v]);
    return this;
  }

  delete(names)
  {
    if ($.isArray(names))
      for (let name of names)
        this.deleteParam(name);
    else if ($.isPlainObject(names) || names instanceof plantago.ParamsHolder)
      for (let name in names)
        this.deleteParam(name);
    else if (typeof names !== "undefined")
      delete this[names];
    else
      this.clear();
    return this;
  }

  clone()
  {
    return new plantago.ParamsHolder(this);
  }

  toString()
  {
    return Object.entries(this).map(
      v => $.isArray(v[1])?
        v[1].map(item => `${v[0]}=${item}`).join("&"):
        `${v[0]}=${v[1]}`
    ).join("&");
  }

  buildUrl(href, parameters, overwrite)
  {
    return (href || plantago.resource()) + "?" + this.clone().extend(parameters, overwrite).toString();
  }
};
