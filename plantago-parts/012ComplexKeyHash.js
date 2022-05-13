//---------------------------
// Словарь с составным ключом
//---------------------------
plantago.ComplexKeyHash = class extends Object
{
  constructor(key, value)
  {
    super();
    if (typeof(value) !== "undefined")
      this.put(key, value); // по паре значений
    else if (key instanceof plantago.ComplexKeyHash)
      Object.assign(this, key); // копирование
    else if ($.isPlainObject(key))
      this.extend(key);
    return this;
  }

  get(key)
  {
    const flatKey = plantago.memberwiseConcat(key);
    if (!(flatKey in this))
      return undefined;
    const pairs = this[flatKey];
    for (let pair of pairs)
      if (plantago.memberwiseCompare(key, pair.key))
        return pair.value;
    return undefined;
  }

  contains(key)
  {
    return typeof this.get(key) !== "undefined";
  }

  put(key, value)
  {
    const flatKey = plantago.memberwiseConcat(key);
    let pairs = this[flatKey];
    if (typeof pairs === "undefined")
      pairs = [{key: key, value: value}];
    else {
      let found = false;
      for (let pair of pairs)
        if (plantago.memberwiseCompare(key, pair.key))
        {
          found = true;
          break;
        }
      if (found)
        pair.value = value;
      else
        pairs.push({key: key, value: value});
    }
    this[flatKey] = pairs;
    return this;
  }
  
  extend(hash)
  {
    for (let k in hash)
      this.put(k, hash[k]);
    return this;
  }
}
