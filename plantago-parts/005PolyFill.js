//----------------------
// polyfills and helpers
//----------------------
if (typeof String.prototype.toCodePoints === "undefined")
{
  String.prototype.toCodePoints = function() 
  {
    const chars = [];
    for (let i = 0; i < this.length; i++) 
    {
      const c1 = this.charCodeAt(i);
      if ((c1 >= 0xD800) && (c1 < 0xDC00) && (i + 1 < this.length))
      {
        const c2 = this.charCodeAt(i + 1);
        if (c2 >= 0xDC00 && c2 < 0xE000) 
        {
          chars.push(0x10000 + ((c1 - 0xD800) << 10) + (c2 - 0xDC00));
          i++;
          continue;
        }
      }
      chars.push(c1);
    }
    return chars;
  };
}

if (typeof Array.prototype.levenshteinDamerauDistance === "undefined")
{
  Array.prototype.levenshteinDamerauDistance = function(b, threshold)
  {
    // http://stackoverflow.com/a/9454016
    let l1 = this.length, l2 = b.length, a = this; 
    // Ensure arrays [i] / length1 use shorter length 
    if (l1 > l2) 
    {
      a = b;
      b = this;
      l1 = a.length;
      l2 = b.length;
    }
    // Return trivial case - difference in string lengths exceeds threshhold
    if ((l2 - l1) > threshold)
      return Number.MAX_VALUE;

    const maxi = l1, maxj = l2;
    let dCurrent = [], dMinus1 = [], dMinus2 = [], dSwap;

    for (let i = 0; i <= maxi; i++)
    {
      dCurrent[i] = i;
      dMinus1[i] = 0;
      dMinus2[i] = 0;
    }

    let jm1 = 0, im1 = 0, im2 = -1;

    for (let j = 1; j <= maxj; j++) 
    {
      // Rotate
      dSwap = dMinus2;
      dMinus2 = dMinus1;
      dMinus1 = dCurrent;
      dCurrent = dSwap;
      // Initialize
      let minDistance = Number.MAX_VALUE;
      dCurrent[0] = j;
      im1 = 0;
      im2 = -1;

      for (let i = 1; i <= maxi; i++) 
      {
        const cost = (a[im1] === b[jm1])? 0: 1;
        const del = dCurrent[im1] + 1;
        const ins = dMinus1[i] + 1;
        const sub = dMinus1[im1] + cost;
        //Fastest execution for min value of 3 integers
        let _min = (del > ins)? (ins > sub? sub: ins): (del > sub? sub: del);

        if ((i > 1) && (j > 1) && (a[im2] === b[jm1]) && (a[im1] === b[j - 2]))
          _min = (_min < dMinus2[im2] + cost)? _min: dMinus2[im2] + cost;
        dCurrent[i] = _min;
        if (_min < minDistance)
          minDistance = _min;
        im1++;
        im2++;
      }
      jm1++;
      if (minDistance > threshold)
        return Number.MAX_VALUE;
    }

    const result = dCurrent[maxi];
    return (result > threshold)? Number.MAX_VALUE: result;
  };
}
