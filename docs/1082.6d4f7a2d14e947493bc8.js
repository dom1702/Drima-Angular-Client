(window.webpackJsonp=window.webpackJsonp||[]).push([[1082],{"c5/5":function(e,t,r){"use strict";r.r(t),r.d(t,"plLocale",function(){return _});var a=r("AgnY"),i=r("HPA8"),s="stycze\u0144_luty_marzec_kwiecie\u0144_maj_czerwiec_lipiec_sierpie\u0144_wrzesie\u0144_pa\u017adziernik_listopad_grudzie\u0144".split("_"),n="stycznia_lutego_marca_kwietnia_maja_czerwca_lipca_sierpnia_wrze\u015bnia_pa\u017adziernika_listopada_grudnia".split("_");function o(e){return e%10<5&&e%10>1&&~~(e/10)%10!=1}function c(e,t,r){var a=e+" ";switch(r){case"ss":return a+(o(e)?"sekundy":"sekund");case"m":return t?"minuta":"minut\u0119";case"mm":return a+(o(e)?"minuty":"minut");case"h":return t?"godzina":"godzin\u0119";case"hh":return a+(o(e)?"godziny":"godzin");case"MM":return a+(o(e)?"miesi\u0105ce":"miesi\u0119cy");case"yy":return a+(o(e)?"lata":"lat")}}var _={abbr:"pl",months:function(e,t,r){return e?""===t?"("+n[Object(a.g)(e,r)]+"|"+s[Object(a.g)(e,r)]+")":/D MMMM/.test(t)?n[Object(a.g)(e,r)]:s[Object(a.g)(e,r)]:s},monthsShort:"sty_lut_mar_kwi_maj_cze_lip_sie_wrz_pa\u017a_lis_gru".split("_"),weekdays:"niedziela_poniedzia\u0142ek_wtorek_\u015broda_czwartek_pi\u0105tek_sobota".split("_"),weekdaysShort:"ndz_pon_wt_\u015br_czw_pt_sob".split("_"),weekdaysMin:"Nd_Pn_Wt_\u015ar_Cz_Pt_So".split("_"),longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD.MM.YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY HH:mm",LLLL:"dddd, D MMMM YYYY HH:mm"},calendar:{sameDay:"[Dzi\u015b o] LT",nextDay:"[Jutro o] LT",nextWeek:function(e){switch(Object(i.a)(e)){case 0:return"[W niedziel\u0119 o] LT";case 2:return"[We wtorek o] LT";case 3:return"[W \u015brod\u0119 o] LT";case 5:return"[W pi\u0105tek o] LT";case 6:return"[W sobot\u0119 o] LT";default:return"[W] dddd [o] LT"}},lastDay:"[Wczoraj o] LT",lastWeek:function(e){switch(Object(i.a)(e)){case 0:return"[W zesz\u0142\u0105 niedziel\u0119 o] LT";case 3:return"[W zesz\u0142\u0105 \u015brod\u0119 o] LT";case 4:return"[W zesz\u0142\u0105 czwartek o] LT";case 5:return"[W zesz\u0142\u0105 pi\u0105tek o] LT";case 6:return"[W zesz\u0142\u0105 sobot\u0119 o] LT";default:return"[W zesz\u0142y] dddd [o] LT"}},sameElse:"L"},relativeTime:{future:"za %s",past:"%s temu",s:"kilka sekund",ss:c,m:c,mm:c,h:c,hh:c,d:"1 dzie\u0144",dd:"%d dni",M:"miesi\u0105c",MM:c,y:"rok",yy:c},dayOfMonthOrdinalParse:/\d{1,2}\./,ordinal:"%d.",week:{dow:1,doy:4}}}}]);