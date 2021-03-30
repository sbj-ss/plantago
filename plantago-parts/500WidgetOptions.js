//--------------------------------------------------------------------------------
// визуальные компоненты jQuery-UI идут перпендикулярно Plantago, по необходимости
// сидя на тех же узлах DOM (мостика для передачи данных нет). plantago.basicInput
// автоматически создаёт эти компоненты для эл-тов ввода по их атрибуту uiWidget
// в соответствии с настройками по умолчанию ниже.
//--------------------------------------------------------------------------------
// Региональные настройки для jQuery-UI datepicker
$(function() {
  $.datepicker.regional["ru"] = {
    closeText: "Закрыть",
    prevText: "Пред.",
    nextText: "След.",
    currentText: "Сегодня",
    monthNames: ["январь", "февраль", "март", "апрель", "май", "июнь",
      "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"],
    monthNamesShort: ["янв", "фев", "мар", "апр", "май", "июн",
      "июл", "авг", "сен", "окт", "ноя", "дек"],
    dayNames: ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"],
    dayNamesShort: ["вс", "пн", "вт", "ср", "чт", "пт", "сб"],
    dayNamesMin: ["В","П","В","С","Ч","П","С"],
    weekHeader: "Нед.",
    dateFormat: "dd.mm.yy",
    firstDay: 1,
    isRTL: false,
    showMonthAfterYear: false,
    yearSuffix: ""
  };
  // TODO на лету
  //$.datepicker.setDefaults($.datepicker.regional["ru"]);

  const datePickerDefaultOpts = plantago.makeConstant({
    showButtonPanel: true,
    changeMonth: true,
    changeYear: true
  });

  plantago.widgetDefaultOpts = {
    "datepicker": datePickerDefaultOpts
  };
});
