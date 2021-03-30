plantago.inputValueType = new plantago.Enum({
  values: {
    any: {
      displayName: "Произвольный ввод"
    },
    nonNegativeInteger: {
      displayName: "Натуральное число и 0",
      pattern: "\\d*",
      alias: "N0",
      isNumeric: true
    }, 
    integer: {
      displayName: "Целое число",
      pattern: "\\-?\\d*",
      alias: "Z",
      isNumeric: true
    },
    nonNegativeFloat: {
      displayName: "Рациональное число >= 0",
      pattern: "\\d*\\.?\\d*",
      isNumeric: true
    },
    "float": {
      displayName: "Рациональное число",
      pattern: "\\-?\\d*\\.?\\d*",
      alias: "Q",
      isNumeric: true
    },
    pattern: {
      displayName: "Паттерн пользователя"
    }
  },
  searchKeys: ["alias"],
  defaultValue: "any"
});
