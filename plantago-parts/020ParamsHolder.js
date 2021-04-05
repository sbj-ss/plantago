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
    if (typeof this[key] !== "undefined")
    {
      if (!$.isArray(this[key]))
        this[key] = [this[key]];
      this[key].push(value);
    } else
      this[key] = value;
    return this;
  }

  parse(params)
  {
    for (let item of params.split("&"))
    {
      const cpl = item.split("=");
      this.append(cpl[0], cpl[1]);
    } 
    return this;
  }

  clear()
  {
    for (let f in Object.keys(this))
      delete this[f];
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
    else if ($.isPlainObject(names))
      for (let name in names)
        this.deleteParam(name);
    else
      delete this[names];
    return this;
  }

  clone()
  {
    return new plantago.ParamsHolder(this);
  }

  toString()
  {
    let s = "";
    for (let e of Object.entries(this))
    {
      if (s)
        s += "&";
      if ($.isArray(e[1]))
        s += e[1].map((v) => { return e[0] + "=" + v }).join("&");
      else
        s += e[0] + "=" + e[1];
    }
    return s;
  }

  buildUrl(href, parameters, overwrite)
  {
    return (href || plantago.resource()) + "?" + this.clone().extend(parameters, overwrite).toString();
  }
};
