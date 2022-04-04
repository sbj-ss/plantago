//----------------------------
// Контейнер адреса/параметров
//----------------------------
plantago.Location = class extends Object
{
  constructor(url)
  {
    super();
    url = url || window.location.href;
    this._defineProperties();
    this.setHref(url);
  }

  _defineProperties()
  {
    const props = {
      href: {
        enumerable: true,
        get: this.getHref,
        set: this.setHref
      }, origin: {
        enumerable: true,
        get: this.getOrigin,
        set: this.setOrigin
      }, protocol: {
        enumerable: true,
        writable: true
      }, _port: {
        enumerable: false,
        writable: true
      }, host: {
        enumerable: true,
        get: this.getHost,
        set: this.setHost
      }, hostname: {
        enumerable: true,
        writable: true
      }, port: {
        enumerable: true,
        get: this.getPort
      }, pathname: {
        enumerable: true,
        writable: true
      }, search: {
        enumerable: true,
        get: this.getSearch,
        set: this.setSearch
      }, hash: {
        enumerable: true,
        writable: true
      }
    };
    for (let name in props)
    {
      const prop = props[name];
      prop.configurable = false;
      Object.defineProperty(this, name, prop);
    }
  }

  getHref(url)
  {
    return this.getOrigin() + this.pathname + this.getSearch() + (this.hash? "#" + this.hash: "");
  }

  setHref(url)
  {
    let six = url.split("?");
    const originAndPathname = six[0];
    six = six.slice(1).join("?").split("#");
    this.setSearch("?" + six[0]);
    this.hash = six[1] || "";
    six = originAndPathname.split("/");
    this.setOrigin(six.slice(0, 3).join("/"));
    this.pathname = "/" + six.slice(3).join("/");
  }

  getOrigin()
  {
    return this.protocol + "//" + this.getHost();
  }

  setOrigin(newValue)
  {
    const six = newValue.split("//");
    this.protocol = six[0];
    this.setHost(six.slice(1).join("//"));
    return this;
  }

  getHost()
  {
    return this.hostname + (this._port? ":" + this._port: "");
  }

  setHost(newValue)
  {
    const six = newValue.split(":");
    this.hostname = six[0];
    this._port = six[1];
    return this;
  }

  getPort()
  {
    return (this._port | 0) || (this.protocol === "https:"? 443: 80);
  }

  getSearch()
  {
    const s = this.params.toString();
    return s? "?" + s: "";
  }

  setSearch(newValue)
  {
    this.params = new plantago.ParamsHolder(newValue.substring(1));
  }

  appendParams(params)
  {
    this.params.extend(params);
    return this;
  }

  replaceParams(params)
  {
    this.params.extend(params, true);
    return this;
  }

  deleteParam(name)
  {
    this.params.deleteParam(name);
    return this;
  }

  toString()
  {
    return this.getHref();
  }

  buildUrl(params)
  {
    if (typeof params === "undefined")
      return this.toString();
    return this.replaceParams(params).toString();
  }

  navigate(params)
  {
    window.location.assign(this.buildUrl(params));
  }
};
