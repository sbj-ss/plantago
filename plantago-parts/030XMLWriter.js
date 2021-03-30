//------------------------------
// XMLWriter, по мотивам libxml2
//------------------------------
plantago.XMLWriter = class extends Object
{
  constructor(options, atomicValue)
  {
    super();
    // internals are set by clear()
    this.clear();
    // options
    this.ignoreStyles = false;
    this.styleAttrNames = new Set(["class", "style"]);
    this.indent = false;
    this.indentStep = 2;
    this.indentChar = " ";
    if (options)
    { 
      if ($.isPlainObject(options))
        this.setOptions(options);
      else if (options && options.toString())
        this.setOption(options, atomicValue);
    }
    return this;
  }

  clear()
  {
    this._inElementDecl = false;
    this._documentStarted = false;
    this._value = "";
    this._elementStack = [];
    this._lastChildIsText = false;
    this.indentLevel = 0;
  }

  getOption(key)
  {
    if (key[0] === "_")
      return undefined;
    return this[key];
  }

  setOption(key, value)
  {
    if (key[0] === "_")
      return; // forbid internals change
    if (typeof(value) === typeof(this[key]))
      this[key] = value;
    return this;
  }

  setOptions(hash)
  {
    for (let key in hash)
      this.setOption(key, hash[key]);
    return this;
  }

  escapeValue(value)
  {
    if (typeof(value) === "undefined")
      return "";
    // непечатаемыми символами пренебрежём: они не могли попасть в X[HT]ML
    return new String(value)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  closeElementDecl()
  {
    if (this._inElementDecl)
    {
      this._value += ">";
      this._inElementDecl = false;
    }
    return this;
  }

  startElement(name) // ns идёт в name
  { 
    this.closeElementDecl();
    this._elementStack.push(name);
    this._inElementDecl = true;
    if (this.indent && !this._lastChildIsText)
    {
      this.indentLevel += this.indentStep;
      this._value += "\r\n" + this.indentChar.repeat(this.indentLevel);
    }
    this._lastChildIsText = false;
    this._value += "<" + name;
    return this;
  }

  endElement()
  {
    const tagName = this._elementStack.pop();
    if (!tagName)
      throw new Error("XMLWriter: unbalanced endElement()");
    if (!this._inElementDecl)
    {
      if (this.indent && !this._lastChildIsText)
      {
        this._value += "\r\n";
        this._value += this.indentChar.repeat(this.indentLevel);
      }
      this._value += "</" + tagName + ">";
    } else {
      this._value += "/>";
      this._inElementDecl = false;
    }
    if (this.indent)
      this.indentLevel -= this.indentStep;
    this._lastChildIsText = false;
    return this;
  }

  attribute(name, value) // ns идёт в name
  {
    if (!this._inElementDecl)
      throw new Error("XMLWriter: not in element declaration");
    this._value += " " + name + "=" + "\"" + this.escapeValue(value) + "\"";
    return this;
  }

  text(content)
  {
    this.closeElementDecl();
    this._lastChildIsText = true;
    this._value += this.escapeValue(content);
    return this;
  }

  CDATA(value)
  {
    this.closeElementDecl();
    this._lastChildIsText = false;
    this._value += "<![CDATA[" + value + "]]>";
    return this;
  }

  PI(name, value)
  {
    this.closeElementDecl();
    this._lastChildIsText = false;
    this._value += "<?" + name + " " + value + "?>";
    return this;
  }

  startDocument(version="1.0", encoding="utf-8")
  {
    if (this._documentStarted)
      throw new Error("XMLWriter: document already started");
    this._documentStarted = true;
    this._value = "<?xml version=\"" + version;
    if (encoding)
      this._value += "\" encoding=\"" + encoding;
    this._value += "\"?>";
    return this;
  }

// мостик
  startSerializeElement(node)
  {
    if (!node)
      return this;
    if (!node.nodeType)
      return this;
    return this.startElement($.isXMLDoc(node.ownerDocument)? node.nodeName: node.nodeName.toLowerCase());
  }

  serializeAttributes(node)
  {
    if (node.attributes)
      for (let i = 0; i < node.attributes.length; i++)
        this.serializeAttribute(node.attributes.item(i));
    return this;
  }

  serializeElementChildren(node)
  {
    for (let i = 0; i < node.childNodes.length; i++)
      this.serializeNode(node.childNodes.item(i));
    return this;
  }

  serializeElement(node)
  {
    if (!node)
      return this;
    if (node.jquery)
      node = node.get(0);
    return this
      .startSerializeElement(node)
      .serializeAttributes(node)
      .serializeElementChildren(node)
      .endElement();
  }

  serializeAttribute(attrNode)
  {
    if (!attrNode)
      return this;
    if (this.ignoreStyles && this.styleAttrNames.has(attrNode.name))
      return this;
    return this.attribute(attrNode.name, attrNode.value || attrNode.nodeValue);
  }

  serializeTextNode(textNode)
  {
    if (!textNode)
      return this;
    return this.text(textNode.nodeValue);
  }

  serializeCDATA(cdNode)
  {
    if (!cdNode)
      return this;
    return this.CDATA(cdNode.data || cdNode.nodeValue);
  }

  serializePI(piNode)
  {
    if (!piNode)
      return this;
    return this.PI(piNode.target, piNode.data);
  }

  serializeDocument(docNode)
  {
    if (!docNode)
      return;
    this.startDocument(docNode.xmlVersion || "1.0", docNode.xmlEncoding || docNode.charset || docNode.characterSet || "utf-8");
    return this.serializeElement(docNode.childNodes.item(0));
  }

// ...и самое вкусное
  serializeNode(node)
  {
    if (!node)
      return this;
    if (node.jquery)
      node = node.get(0);
    if (!node.nodeType)
      return this;
    switch (node.nodeType) 
    {
      case 1: return this.serializeElement(node);
      case 2: return this.serializeAttribute(node);
      case 3: return this.serializeTextNode(node);
      case 4: return this.serializeCDATA(node);
      // 5 = entity     \ not needed
      // 6 = entity ref /
      case 7: return this.serializePI(node);
      // 8 = comment, no way
      case 9: return this.serializeDocument(node);
      // 10 = doc type (not needed for xml)
      // 11 = doc fragment - todo?..
      // 12 = notation, not needed
      default: return this;
    }  
  }

  serializePlantagoSubtrees(elementsCollection, widgetSelector)
  {
    const that = this;
    elementsCollection.each((index, element) => {
      if (element.nodeType === 3) // сохраним непосредственно входящие в виджет текстовые узлы
      {
        that.serializeTextNode(element);
        return true; // continue
      }
      const carrier = $(element);
      if (carrier.isPlantagoWidget(widgetSelector))
        that
          .startSerializeElement(element)
          .serializeAttributes(element)
          .serializePlantagoSubtrees(carrier.contents(), widgetSelector) // дети, включая текстовые узлы
          .endElement();
      else 
        that.serializePlantagoSubtrees(carrier.children(), widgetSelector); // только дети-элементы, т.к. несущий узел не наш
    });
    return this;
  }

  serializePlantagoTree(rootElement, widgetSelector)
  {
    return this.serializePlantagoSubtrees($(rootElement).getNearestPlantagoDOS(widgetSelector), widgetSelector);
  }

  toString()
  {
    return this._value;
  }
};
