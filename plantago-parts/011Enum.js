//------------------
// перечисляемый тип
//------------------
plantago.Enum = class extends Object
{
  constructor(desc) // дескриптор: values: {}, searchKeys: [], defaultValue: ""
  {
    super();
    if (!desc)
    {
      plantago.debugLog("ERROR plantago.Enum: missing description");
      return desc;
    }
    if (!desc.values)
    {
      plantago.debugLog("ERROR plantago.Enum: missing description.values", desc);
      return desc;
    }
    if (!desc.defaultValue)
      plantago.debugLog("WARNING plantago.Enum: missing description.defaultValue", desc);
    else if (!desc.values[desc.defaultValue])
      plantago.debugLog("WARNING plantago.Enum: description.defaultValue points to missing enum item", desc);
    this.values = plantago.makeConstant(desc.values);
    this.searchKeys = plantago.makeConstant(desc.searchKeys || []);
    this.defaultValue = desc.defaultValue;
    for (let m in desc.methods) // заказные методы, чтобы не наследовать на каждый чих
      this[m] = desc.methods[m];
    // допишем имена
    for (let key in this.values)
      this.values[key].name = key;
  }

  // унифицированный поиск
  get(newVal) 
  {
    // по главному ключу
    if (this.values[newVal])
      return this.values[newVal];
    // по значению
    // TODO: наблюдал дубликаты и несработку, посмотреть
    for (let key in this.values)
      if (this.values[key] == newVal)
          return this.values[key];
    // перебор по вторичным ключам
    if (this.searchKeys) 
      for (let key in this.values) 
        for (let subkey of this.searchKeys) 
          if (this.values[key][subkey] == newVal) // поле входящего составного типа равно ключу
            return this.values[key];
    return this.values[this.defaultValue]; // извините, ...
  }

  toString() 
  {
    return "Enum (" + Object.keys(this.values).toString() + ")";
  }
}
